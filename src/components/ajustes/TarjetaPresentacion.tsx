import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard, Download, Loader2, Phone, Mail, Globe, MapPin,
  Facebook, Instagram, Linkedin, Youtube, Twitter, Music2, MessageCircle, Building2, QrCode,
} from 'lucide-react';
import { useEmpresaInfo, type EmpresaInfo } from '@/hooks/useConfiguracion';
import { toPng, toJpeg } from 'html-to-image';
import QRCode from 'qrcode';
import { toast } from 'sonner';

type Variant = 'azul' | 'oscuro' | 'claro' | 'verde';

const VARIANTS: Record<Variant, { bg: string; fg: string; accent: string; sub: string; border: string }> = {
  azul:   { bg: 'linear-gradient(135deg,#0b3d91 0%,#1565c0 60%,#1e88e5 100%)', fg: '#ffffff', accent: '#7dd3fc', sub: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,0.15)' },
  oscuro: { bg: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#334155 100%)', fg: '#ffffff', accent: '#34d399', sub: 'rgba(255,255,255,0.8)',  border: 'rgba(255,255,255,0.12)' },
  claro:  { bg: 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)',             fg: '#0f172a', accent: '#1565c0', sub: '#475569',               border: 'rgba(15,23,42,0.08)' },
  verde:  { bg: 'linear-gradient(135deg,#064e3b 0%,#047857 60%,#10b981 100%)', fg: '#ffffff', accent: '#fde68a', sub: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,0.15)' },
};

export function TarjetaPresentacion() {
  const { data: empresa, isLoading } = useEmpresaInfo();
  const cardRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<Variant>('azul');
  const [downloading, setDownloading] = useState<'png' | 'jpg' | null>(null);
  const [showQR, setShowQR] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!empresa || !showQR) { setQrDataUrl(''); return; }
    const vcard = buildVCard(empresa);
    QRCode.toDataURL(vcard, { errorCorrectionLevel: 'M', margin: 1, width: 320, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [empresa, showQR]);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!empresa) return null;

  const v = VARIANTS[variant];

  const handleDownload = async (format: 'png' | 'jpg') => {
    if (!cardRef.current) return;
    setDownloading(format);
    try {
      const opts = { cacheBust: true, pixelRatio: 3, backgroundColor: format === 'jpg' ? '#ffffff' : undefined };
      const dataUrl = format === 'png' ? await toPng(cardRef.current, opts) : await toJpeg(cardRef.current, { ...opts, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `tarjeta-${(empresa.nombre || 'empresa').replace(/\s+/g, '-').toLowerCase()}.${format}`;
      link.href = dataUrl;
      link.click();
      toast.success(`Tarjeta descargada (${format.toUpperCase()})`);
    } catch (e: any) {
      toast.error('Error al generar la imagen: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const socials: Array<{ icon: any; value?: string; label: string }> = [
    { icon: Phone,          value: empresa.telefono,        label: empresa.telefono ?? '' },
    { icon: MessageCircle,  value: empresa.whatsapp_numero, label: empresa.whatsapp_numero ?? '' },
    { icon: Mail,           value: empresa.email,           label: empresa.email ?? '' },
    { icon: Globe,          value: empresa.sitio_web,       label: empresa.sitio_web ?? '' },
  ].filter((s) => !!s.value);

  const redes: Array<{ icon: any; value?: string; label: string }> = [
    { icon: Facebook,  value: empresa.facebook_url,  label: cleanHandle(empresa.facebook_url) },
    { icon: Instagram, value: empresa.instagram_url, label: cleanHandle(empresa.instagram_url) },
    { icon: Twitter,   value: empresa.twitter_url,   label: cleanHandle(empresa.twitter_url) },
    { icon: Linkedin,  value: empresa.linkedin_url,  label: cleanHandle(empresa.linkedin_url) },
    { icon: Youtube,   value: empresa.youtube_url,   label: cleanHandle(empresa.youtube_url) },
    { icon: Music2,    value: empresa.tiktok_url,    label: cleanHandle(empresa.tiktok_url) },
  ].filter((s) => !!s.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Tarjeta de Presentación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estilo:</span>
            <Select value={variant} onValueChange={(val) => setVariant(val as Variant)}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="azul">Azul corporativo</SelectItem>
                <SelectItem value="verde">Verde fintech</SelectItem>
                <SelectItem value="oscuro">Oscuro elegante</SelectItem>
                <SelectItem value="claro">Claro minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="qr-toggle" checked={showQR} onCheckedChange={setShowQR} />
            <Label htmlFor="qr-toggle" className="text-xs flex items-center gap-1 cursor-pointer">
              <QrCode className="h-3.5 w-3.5" /> QR vCard
            </Label>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleDownload('png')} disabled={!!downloading} className="gap-1.5">
              {downloading === 'png' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              PNG
            </Button>
            <Button size="sm" onClick={() => handleDownload('jpg')} disabled={!!downloading} className="gap-1.5">
              {downloading === 'jpg' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              JPG
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Vista previa estándar (1050 × 600 px, proporción tarjeta 3.5″ × 2″). Se descarga en alta resolución.
        </p>

        <div className="overflow-auto rounded-lg bg-muted/30 p-6 flex justify-center">
          <div
            ref={cardRef}
            style={{
              width: 1050,
              height: 600,
              background: v.bg,
              color: v.fg,
              borderRadius: 24,
              padding: 56,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              position: 'relative',
              overflow: 'hidden',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              transform: 'scale(0.6)',
              transformOrigin: 'top center',
            }}
          >
            {/* Decorative accent */}
            <div style={{
              position: 'absolute', top: -120, right: -120, width: 380, height: 380,
              borderRadius: '50%', background: v.accent, opacity: 0.15,
            }} />
            <div style={{
              position: 'absolute', bottom: -100, left: -80, width: 280, height: 280,
              borderRadius: '50%', background: v.accent, opacity: 0.1,
            }} />

            {/* Top: logo + name + (QR) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 110, height: 110, borderRadius: 18, background: 'rgba(255,255,255,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                boxShadow: '0 6px 18px rgba(0,0,0,0.18)', flexShrink: 0,
              }}>
                {empresa.logo_url ? (
                  <img src={empresa.logo_url} alt="logo" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Building2 size={56} color="#1565c0" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 42, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
                  {empresa.nombre || 'Nombre de la empresa'}
                </h1>
                {empresa.razon_social && empresa.razon_social !== empresa.nombre && (
                  <p style={{ margin: '6px 0 0', fontSize: 16, color: v.sub, fontWeight: 500 }}>
                    {empresa.razon_social}
                  </p>
                )}
                {empresa.rnc && (
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: v.sub, letterSpacing: 0.5 }}>
                    RNC: {empresa.rnc}
                  </p>
                )}
              </div>
              {showQR && qrDataUrl && (
                <div style={{
                  width: 150, height: 150, padding: 10, borderRadius: 14, background: '#ffffff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.18)', flexShrink: 0,
                }}>
                  <img src={qrDataUrl} alt="QR vCard" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: v.border, margin: '28px 0 22px', position: 'relative', zIndex: 1 }} />

            {/* Info grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px',
              position: 'relative', zIndex: 1,
            }}>
              {(empresa.direccion || empresa.ciudad) && (
                <InfoRow icon={<MapPin size={18} />} text={[empresa.direccion, empresa.ciudad, empresa.provincia].filter(Boolean).join(', ')} fg={v.fg} sub={v.sub} full />
              )}
              {socials.map((s, i) => (
                <InfoRow key={i} icon={<s.icon size={18} />} text={s.label} fg={v.fg} sub={v.sub} />
              ))}
            </div>

            {/* Redes sociales footer */}
            {redes.length > 0 && (
              <div style={{
                position: 'absolute', bottom: 40, left: 56, right: 56,
                display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center',
                paddingTop: 18, borderTop: `1px solid ${v.border}`,
              }}>
                <span style={{ fontSize: 12, color: v.sub, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                  Síguenos
                </span>
                {redes.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: v.fg, fontSize: 14 }}>
                    <r.icon size={16} color={v.accent} />
                    <span style={{ color: v.sub }}>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, text, fg, sub, full }: { icon: React.ReactNode; text: string; fg: string; sub: string; full?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: full ? '1 / -1' : 'auto' }}>
      <span style={{ color: fg, opacity: 0.9, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 16, color: sub, fontWeight: 500 }}>{text}</span>
    </div>
  );
}

function cleanHandle(url?: string): string {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const path = u.pathname.replace(/^\/+|\/+$/g, '');
    return path ? `@${path.split('/')[0].replace(/^@/, '')}` : u.hostname;
  } catch {
    return url;
  }
}

function buildVCard(e: EmpresaInfo): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (e.nombre) lines.push(`FN:${e.nombre}`);
  if (e.razon_social) lines.push(`ORG:${e.razon_social || e.nombre}`);
  if (e.telefono) lines.push(`TEL;TYPE=WORK,VOICE:${e.telefono}`);
  if (e.whatsapp_numero) lines.push(`TEL;TYPE=CELL:${e.whatsapp_numero}`);
  if (e.email) lines.push(`EMAIL;TYPE=WORK:${e.email}`);
  if (e.sitio_web) lines.push(`URL:${e.sitio_web}`);
  const addr = [e.direccion, e.ciudad, e.provincia].filter(Boolean).join(', ');
  if (addr) lines.push(`ADR;TYPE=WORK:;;${addr};;;;`);
  if (e.rnc) lines.push(`NOTE:RNC ${e.rnc}`);
  for (const url of [e.facebook_url, e.instagram_url, e.twitter_url, e.linkedin_url, e.youtube_url, e.tiktok_url]) {
    if (url) lines.push(`URL:${url}`);
  }
  lines.push('END:VCARD');
  return lines.join('\n');
}
