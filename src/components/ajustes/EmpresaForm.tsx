import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Building2, Save, Facebook, Instagram, Linkedin, Youtube, Twitter, Music2, MessageCircle } from 'lucide-react';
import { useEmpresaInfo, useActualizarEmpresa, subirLogoEmpresa, type EmpresaInfo } from '@/hooks/useConfiguracion';
import { toast } from 'sonner';

const FIELDS: Array<{ key: keyof EmpresaInfo; label: string; type?: string; full?: boolean }> = [
  { key: 'nombre', label: 'Nombre comercial' },
  { key: 'razon_social', label: 'Razón social' },
  { key: 'rnc', label: 'RNC' },
  { key: 'regimen_fiscal', label: 'Régimen fiscal' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'sitio_web', label: 'Sitio web' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'provincia', label: 'Provincia' },
  { key: 'direccion', label: 'Dirección', full: true },
];

export function EmpresaForm({ isAdmin }: { isAdmin: boolean }) {
  const { data: empresa, isLoading } = useEmpresaInfo();
  const actualizar = useActualizarEmpresa();
  const [form, setForm] = useState<Partial<EmpresaInfo>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (empresa) setForm(empresa); }, [empresa]);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!empresa) return <p className="text-sm text-muted-foreground">No se pudo cargar la información de empresa.</p>;

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const url = await subirLogoEmpresa(file);
      setForm((p) => ({ ...p, logo_url: url }));
      await actualizar.mutateAsync({ id: empresa.id, logo_url: url });
    } catch (e: any) {
      toast.error('Error al subir logo: ' + e.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = () => {
    const { id, ...rest } = form as EmpresaInfo;
    actualizar.mutate({ id: empresa.id, ...rest });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Información de la Empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo */}
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="w-24 h-24 rounded-md border bg-muted/30 flex items-center justify-center overflow-hidden">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Logo</p>
            <p className="text-xs text-muted-foreground mb-2">Se usará en recibos, contratos y documentos PDF.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!isAdmin || uploadingLogo}
              onClick={() => fileRef.current?.click()}
              className="gap-1.5"
            >
              {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {form.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </Button>
          </div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.full ? 'md:col-span-2' : ''}>
              <Label className="text-xs">{f.label}</Label>
              <Input
                type={f.type ?? 'text'}
                value={(form[f.key] as string) ?? ''}
                disabled={!isAdmin}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {/* Redes sociales */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Redes Sociales</p>
          <p className="text-xs text-muted-foreground -mt-2">Aparecerán en recibos, contratos y documentos generados.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'whatsapp_numero', label: 'WhatsApp', icon: MessageCircle, placeholder: '+1 809 000 0000' },
              { key: 'facebook_url',    label: 'Facebook',  icon: Facebook,  placeholder: 'https://facebook.com/...' },
              { key: 'instagram_url',   label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
              { key: 'twitter_url',     label: 'X / Twitter', icon: Twitter, placeholder: 'https://x.com/...' },
              { key: 'linkedin_url',    label: 'LinkedIn',  icon: Linkedin,  placeholder: 'https://linkedin.com/...' },
              { key: 'youtube_url',     label: 'YouTube',   icon: Youtube,   placeholder: 'https://youtube.com/@...' },
              { key: 'tiktok_url',      label: 'TikTok',    icon: Music2,    placeholder: 'https://tiktok.com/@...' },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.key}>
                  <Label className="text-xs flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {r.label}</Label>
                  <Input
                    type="text"
                    placeholder={r.placeholder}
                    value={(form as any)[r.key] ?? ''}
                    disabled={!isAdmin}
                    onChange={(e) => setForm((p) => ({ ...p, [r.key]: e.target.value }))}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={actualizar.isPending} className="gap-1.5">
              {actualizar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar cambios
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
