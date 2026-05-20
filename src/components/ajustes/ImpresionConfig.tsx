import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Printer, Save } from 'lucide-react';
import { useConfigImpresion, useActualizarConfigImpresion, useEmpresaInfo, type ConfiguracionImpresion } from '@/hooks/useConfiguracion';

const TIRILLA_W: Record<string, string> = { '57mm': '215px', '80mm': '302px', 'carta': '480px' };

export function ImpresionConfig({ isAdmin }: { isAdmin: boolean }) {
  const { data: cfg, isLoading } = useConfigImpresion();
  const { data: empresa } = useEmpresaInfo();
  const actualizar = useActualizarConfigImpresion();
  const [form, setForm] = useState<Partial<ConfiguracionImpresion>>({});

  useEffect(() => { if (cfg) setForm(cfg); }, [cfg]);

  if (isLoading || !cfg) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const update = (key: keyof ConfiguracionImpresion, v: any) => setForm((p) => ({ ...p, [key]: v }));
  const handleSave = () => {
    const { id, ...rest } = form as ConfiguracionImpresion;
    actualizar.mutate({ id: cfg.id, ...rest });
  };

  const alignClass = form.alineacion_encabezado === 'left' ? 'text-left' : form.alineacion_encabezado === 'right' ? 'text-right' : 'text-center';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Printer className="h-4 w-4" /> Configuración de Impresión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Tamaño de tirilla</Label>
              <Select value={form.tamano_tirilla} disabled={!isAdmin} onValueChange={(v) => update('tamano_tirilla', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="57mm">57 mm</SelectItem>
                  <SelectItem value="80mm">80 mm</SelectItem>
                  <SelectItem value="carta">Carta (A4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Margen izq. (mm)</Label>
              <Input type="number" min={0} value={form.margen_izq ?? 0} disabled={!isAdmin} onChange={(e) => update('margen_izq', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Margen der. (mm)</Label>
              <Input type="number" min={0} value={form.margen_der ?? 0} disabled={!isAdmin} onChange={(e) => update('margen_der', parseInt(e.target.value) || 0)} />
            </div>
            <div className="col-span-2 md:col-span-3">
              <Label className="text-xs">Alineación de encabezado</Label>
              <Select value={form.alineacion_encabezado} disabled={!isAdmin} onValueChange={(v) => update('alineacion_encabezado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centrado</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            {[
              { k: 'mostrar_logo', l: 'Mostrar logo' },
              { k: 'mostrar_rnc', l: 'Mostrar RNC' },
              { k: 'mostrar_direccion', l: 'Mostrar dirección' },
              { k: 'mostrar_firma_cajero', l: 'Línea para firma del cajero' },
              { k: 'mostrar_qr', l: 'Mostrar QR de verificación' },
            ].map(({ k, l }) => (
              <div key={k} className="flex items-center justify-between">
                <Label htmlFor={k} className="text-sm cursor-pointer">{l}</Label>
                <Switch id={k} checked={!!(form as any)[k]} disabled={!isAdmin} onCheckedChange={(v) => update(k as any, v)} />
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t pt-3">
            <div>
              <Label className="text-xs">Frase al pie del recibo (máx. 200)</Label>
              <Textarea
                value={form.frase_pie_recibo ?? ''}
                disabled={!isAdmin}
                maxLength={200}
                rows={2}
                placeholder="Gracias por su preferencia."
                onChange={(e) => update('frase_pie_recibo', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">{(form.frase_pie_recibo ?? '').length}/200</p>
            </div>
            <div>
              <Label className="text-xs">Pie legal de contratos (máx. 500)</Label>
              <Textarea
                value={form.pie_legal_contrato ?? ''}
                disabled={!isAdmin}
                maxLength={500}
                rows={3}
                placeholder="Las partes aceptan los términos y se someten a la jurisdicción..."
                onChange={(e) => update('pie_legal_contrato', e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">{(form.pie_legal_contrato ?? '').length}/500</p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={actualizar.isPending} className="gap-1.5">
                {actualizar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-muted/30 lg:w-[360px]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Vista previa</CardTitle></CardHeader>
        <CardContent>
          <div
            className="mx-auto bg-white text-black shadow-sm border rounded-sm py-3 px-2 font-mono text-[11px] leading-snug"
            style={{ width: TIRILLA_W[form.tamano_tirilla ?? '80mm'], paddingLeft: (form.margen_izq ?? 0) + 8, paddingRight: (form.margen_der ?? 0) + 8 }}
          >
            <div className={alignClass}>
              {form.mostrar_logo && empresa?.logo_url && (
                <img src={empresa.logo_url} alt="logo" className="max-h-10 mx-auto mb-1 object-contain" />
              )}
              <p className="font-bold text-[12px]">{empresa?.nombre || 'Mi Empresa'}</p>
              {form.mostrar_rnc && empresa?.rnc && <p>RNC {empresa.rnc}</p>}
              {form.mostrar_direccion && empresa?.direccion && <p className="text-[10px]">{empresa.direccion}</p>}
              {empresa?.telefono && <p className="text-[10px]">Tel. {empresa.telefono}</p>}
            </div>
            <hr className="my-1.5 border-dashed" />
            <p>Recibo #00012345</p>
            <p>Fecha: 20/05/2026</p>
            <p>Cliente: Juan Pérez</p>
            <hr className="my-1.5 border-dashed" />
            <div className="flex justify-between"><span>Capital</span><span>RD$ 5,000.00</span></div>
            <div className="flex justify-between"><span>Interés</span><span>RD$ 250.00</span></div>
            <div className="flex justify-between"><span>Mora</span><span>RD$ 0.00</span></div>
            <hr className="my-1.5 border-dashed" />
            <div className="flex justify-between font-bold"><span>TOTAL</span><span>RD$ 5,250.00</span></div>
            {form.mostrar_firma_cajero && (
              <div className="mt-4">
                <hr className="border-black mx-4" />
                <p className="text-center text-[10px]">Firma del cajero</p>
              </div>
            )}
            {form.mostrar_qr && <div className="mx-auto mt-2 w-12 h-12 bg-black/80" />}
            {form.frase_pie_recibo && (
              <p className="text-center mt-2 italic text-[10px]">{form.frase_pie_recibo}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
