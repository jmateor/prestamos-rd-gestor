import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl, fetchAsDataUrl } from '@/lib/signedUrl';

/**
 * Fetches the empresa logo and returns it as a data URL suitable for
 * `jsPDF.addImage`. Uses a signed URL against the private `empresa-assets`
 * bucket. Falls back to `null` when the bucket has no logo, the signed URL
 * fails, or the fetched blob isn't a valid image — callers should then use
 * the text-based header fallback in `drawPdfLogo`.
 */
let logoCache: { key: string; dataUrl: string | null } | null = null;
let logoInflight: Promise<string | null> | null = null;
let empresaNombreCache: string | null = null;

const isValidImageDataUrl = (s: string | null): s is string =>
  !!s && s.startsWith('data:image/') && s.includes('base64,') && s.length > 64;

export async function getEmpresaLogoDataUrl(): Promise<string | null> {
  if (logoInflight) return logoInflight;
  logoInflight = (async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('empresa_info')
        .select('logo_url, nombre')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[getEmpresaLogoDataUrl] empresa_info error, using fallback', error);
        return null;
      }
      if (data?.nombre) empresaNombreCache = data.nombre;
      if (!data?.logo_url) return null;

      const key = data.logo_url as string;
      if (logoCache && logoCache.key === key) return logoCache.dataUrl;

      const signed = await getSignedUrl('empresa-assets', key, 3600);
      if (!signed) {
        console.warn('[getEmpresaLogoDataUrl] signed URL failed, using fallback');
        logoCache = { key, dataUrl: null };
        return null;
      }
      let dataUrl: string | null = null;
      try {
        dataUrl = await fetchAsDataUrl(signed);
      } catch (e) {
        console.warn('[getEmpresaLogoDataUrl] fetchAsDataUrl failed, using fallback', e);
      }
      if (!isValidImageDataUrl(dataUrl)) {
        logoCache = { key, dataUrl: null };
        return null;
      }
      logoCache = { key, dataUrl };
      return dataUrl;
    } catch (e) {
      console.error('[getEmpresaLogoDataUrl] unexpected error, using fallback', e);
      return null;
    } finally {
      logoInflight = null;
    }
  })();
  return logoInflight;
}

/** Returns the cached empresa name (populated after `getEmpresaLogoDataUrl`). */
export function getEmpresaNombreCached(): string | null {
  return empresaNombreCache;
}

/** Detects PNG vs JPEG from a data URL for jsPDF.addImage. */
export function detectImageFormat(dataUrl: string): 'PNG' | 'JPEG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

/**
 * Draws the logo at (x,y). When no logo is available or the image fails to
 * embed, draws a lightweight text placeholder (empresa initials in a bordered
 * box) so the document header still reads as branded. Returns the height used.
 */
export function drawPdfLogo(
  doc: any,
  logoDataUrl: string | null | undefined,
  x: number,
  y: number,
  maxW = 28,
  maxH = 16,
): number {
  if (isValidImageDataUrl(logoDataUrl ?? null)) {
    try {
      doc.addImage(logoDataUrl as string, detectImageFormat(logoDataUrl as string), x, y, maxW, maxH, undefined, 'FAST');
      return maxH;
    } catch (e) {
      console.warn('[drawPdfLogo] addImage failed, using text fallback', e);
    }
  }
  return drawPlaceholderHeader(doc, x, y, maxW, maxH);
}

function drawPlaceholderHeader(doc: any, x: number, y: number, w: number, h: number): number {
  const nombre = empresaNombreCache?.trim();
  const initials = nombre
    ? nombre
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'EMP'
    : 'EMP';
  try {
    const prevDraw = (doc as any).getDrawColor?.();
    const prevText = (doc as any).getTextColor?.();
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S');
    doc.setFont('helvetica', 'bold');
    const size = Math.min(h * 2.2, 14);
    doc.setFontSize(size);
    doc.setTextColor(80);
    doc.text(initials, x + w / 2, y + h / 2 + size / 8, { align: 'center', baseline: 'middle' as any });
    if (prevDraw) doc.setDrawColor(prevDraw);
    if (prevText) doc.setTextColor(prevText);
  } catch (e) {
    console.warn('[drawPdfLogo] placeholder render failed', e);
    return 0;
  }
  return h;
}
