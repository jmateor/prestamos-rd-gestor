import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl, fetchAsDataUrl } from '@/lib/signedUrl';

/**
 * Fetches the empresa logo and returns it as a data URL suitable for
 * `jsPDF.addImage`. Uses a signed URL against the private `empresa-assets`
 * bucket instead of depending on `getPublicUrl`. Result is cached per session.
 *
 * Handles both new (stored path) and legacy (full public URL) values in
 * `empresa_info.logo_url` via `extractStoragePath`.
 */
let cache: { key: string; dataUrl: string | null } | null = null;
let inflight: Promise<string | null> | null = null;

export async function getEmpresaLogoDataUrl(): Promise<string | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('empresa_info')
        .select('logo_url')
        .limit(1)
        .maybeSingle();
      if (error || !data?.logo_url) return null;
      const key = data.logo_url as string;
      if (cache && cache.key === key) return cache.dataUrl;

      const signed = await getSignedUrl('empresa-assets', key, 3600);
      if (!signed) {
        cache = { key, dataUrl: null };
        return null;
      }
      const dataUrl = await fetchAsDataUrl(signed);
      cache = { key, dataUrl };
      return dataUrl;
    } catch (e) {
      console.error('[getEmpresaLogoDataUrl]', e);
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Detects PNG vs JPEG from a data URL for jsPDF.addImage. */
export function detectImageFormat(dataUrl: string): 'PNG' | 'JPEG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

/**
 * Draws the logo top-left of the current page if provided.
 * Returns the height consumed (0 if nothing drawn) so callers can offset `y`.
 */
export function drawPdfLogo(
  doc: any,
  logoDataUrl: string | null | undefined,
  x: number,
  y: number,
  maxW = 28,
  maxH = 16,
): number {
  if (!logoDataUrl) return 0;
  try {
    doc.addImage(logoDataUrl, detectImageFormat(logoDataUrl), x, y, maxW, maxH, undefined, 'FAST');
    return maxH;
  } catch (e) {
    console.warn('[drawPdfLogo] addImage failed', e);
    return 0;
  }
}
