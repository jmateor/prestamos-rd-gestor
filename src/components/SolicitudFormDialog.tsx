import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Loader2, Upload, ShieldCheck, Car, Home, Package, X } from 'lucide-react';
import { useCreateSolicitud } from '@/hooks/useSolicitudes';
import { useClientes } from '@/hooks/useClientes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const TIPOS_GARANTIA = [
  { value: 'vehiculo', label: 'Vehículo', icon: Car },
  { value: 'motocicleta', label: 'Motocicleta', icon: Car },
  { value: 'vivienda', label: 'Vivienda', icon: Home },
  { value: 'terreno', label: 'Terreno', icon: Home },
  { value: 'electrodomestico', label: 'Electrodoméstico', icon: Package },
  { value: 'equipo', label: 'Equipo', icon: Package },
  { value: 'otro', label: 'Otro bien', icon: Package },
];

const schema = z.object({
  cliente_id: z.string().min(1, 'Seleccione un cliente'),
  monto_solicitado: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
  plazo_meses: z.coerce.number().min(1, 'El plazo debe ser al menos 1'),
  frecuencia_pago: z.string().min(1, 'Seleccione frecuencia'),
  proposito: z.string().trim().min(3, 'Ingrese el propósito').max(500),
  tasa_interes_sugerida: z.coerce.number().min(0).max(100).default(0),
  // Guarantee fields
  tiene_garantia: z.boolean().default(false),
  tipo_garantia: z.string().optional(),
  garantia_marca: z.string().max(100).optional(),
  garantia_modelo: z.string().max(100).optional(),
  garantia_anio: z.coerce.number().optional(),
  garantia_color: z.string().max(50).optional(),
  garantia_numero_placa: z.string().max(20).optional(),
  garantia_numero_chasis: z.string().max(50).optional(),
  garantia_numero_matricula: z.string().max(50).optional(),
  garantia_estado_bien: z.string().max(50).optional(),
  garantia_direccion_propiedad: z.string().max(300).optional(),
  garantia_tipo_propiedad: z.string().max(100).optional(),
  garantia_tamano: z.string().max(100).optional(),
  garantia_documento_propiedad: z.string().max(200).optional(),
  garantia_nombre_articulo: z.string().max(200).optional(),
  garantia_valor_estimado: z.coerce.number().min(0).optional(),
  garantia_notas: z.string().max(500).optional(),
  porcentaje_prestamo_garantia: z.coerce.number().min(1).max(100).default(70),
});

type FormValues = z.infer<typeof schema>;

export function SolicitudFormDialog() {
  const [open, setOpen] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const createSolicitud = useCreateSolicitud();
  const { data: clientes, isLoading: loadingClientes } = useClientes(clienteSearch);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: '',
      monto_solicitado: 0,
      plazo_meses: 1,
      frecuencia_pago: 'mensual',
      proposito: '',
      tasa_interes_sugerida: 5,
      tiene_garantia: false,
      tipo_garantia: '',
      garantia_marca: '',
      garantia_modelo: '',
      garantia_color: '',
      garantia_numero_placa: '',
      garantia_numero_chasis: '',
      garantia_numero_matricula: '',
      garantia_estado_bien: '',
      garantia_direccion_propiedad: '',
      garantia_tipo_propiedad: '',
      garantia_tamano: '',
      garantia_documento_propiedad: '',
      garantia_nombre_articulo: '',
      garantia_valor_estimado: 0,
      garantia_notas: '',
      porcentaje_prestamo_garantia: 70,
    },
  });

  const tieneGarantia = useWatch({ control: form.control, name: 'tiene_garantia' });
  const tipoGarantia = useWatch({ control: form.control, name: 'tipo_garantia' });
  const valorEstimado = useWatch({ control: form.control, name: 'garantia_valor_estimado' });
  const porcentaje = useWatch({ control: form.control, name: 'porcentaje_prestamo_garantia' });

  const montoMaxGarantia = (valorEstimado || 0) * ((porcentaje || 70) / 100);

  const isVehiculo = tipoGarantia === 'vehiculo' || tipoGarantia === 'motocicleta';
  const isPropiedad = tipoGarantia === 'vivienda' || tipoGarantia === 'terreno';
  const isArticulo = tipoGarantia === 'electrodomestico' || tipoGarantia === 'equipo' || tipoGarantia === 'otro';

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFotos((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  };

  const uploadFotos = async (solicitudId: string) => {
    if (fotos.length === 0) return;
    setUploading(true);
    try {
      for (const file of fotos) {
        const ext = file.name.split('.').pop();
        const path = `${solicitudId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('solicitud_garantias').upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('solicitud_garantias').getPublicUrl(path);
        await (supabase as any).from('solicitud_garantia_fotos').insert({
          solicitud_id: solicitudId,
          tipo: 'foto',
          nombre: file.name,
          url: publicUrl,
        });
      }
    } catch (e: any) {
      toast.error('Error subiendo fotos: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const result = await createSolicitud.mutateAsync({
      cliente_id: values.cliente_id,
      monto_solicitado: values.monto_solicitado,
      plazo_meses: values.plazo_meses,
      frecuencia_pago: values.frecuencia_pago,
      proposito: values.proposito,
      tasa_interes_sugerida: values.tasa_interes_sugerida,
      tiene_garantia: values.tiene_garantia,
      tipo_garantia: values.tiene_garantia ? values.tipo_garantia : null,
      garantia_marca: values.garantia_marca || '',
      garantia_modelo: values.garantia_modelo || '',
      garantia_anio: values.garantia_anio || null,
      garantia_color: values.garantia_color || '',
      garantia_numero_placa: values.garantia_numero_placa || '',
      garantia_numero_chasis: values.garantia_numero_chasis || '',
      garantia_numero_matricula: values.garantia_numero_matricula || '',
      garantia_estado_bien: values.garantia_estado_bien || '',
      garantia_direccion_propiedad: values.garantia_direccion_propiedad || '',
      garantia_tipo_propiedad: values.garantia_tipo_propiedad || '',
      garantia_tamano: values.garantia_tamano || '',
      garantia_documento_propiedad: values.garantia_documento_propiedad || '',
      garantia_nombre_articulo: values.garantia_nombre_articulo || '',
      garantia_valor_estimado: values.garantia_valor_estimado || 0,
      garantia_notas: values.garantia_notas || '',
      porcentaje_prestamo_garantia: values.porcentaje_prestamo_garantia || 70,
    });

    if (result?.id && fotos.length > 0) {
      await uploadFotos(result.id);
    }

    form.reset();
    setFotos([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Solicitud de Préstamo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Cliente selector */}
            <FormField control={form.control} name="cliente_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <div className="space-y-2">
                  <Input placeholder="Buscar cliente por nombre o cédula..." value={clienteSearch} onChange={(e) => setClienteSearch(e.target.value)} />
                  {loadingClientes ? (
                    <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : clientes && clientes.length > 0 ? (
                    <Select onValueChange={(val) => {
                      const sel = clientes.find(c => c.id === val);
                      if (sel && sel.estado !== 'activo') return;
                      field.onChange(val);
                    }} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id} disabled={c.estado !== 'activo'}>
                            {c.primer_nombre} {c.primer_apellido} — {c.cedula}
                            {c.estado !== 'activo' && ` (${c.estado})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se encontraron clientes.</p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="monto_solicitado" render={({ field }) => (
                <FormItem><FormLabel>Monto (RD$) *</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="plazo_meses" render={({ field }) => (
                <FormItem><FormLabel>Cuotas *</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="frecuencia_pago" render={({ field }) => (
                <FormItem><FormLabel>Frecuencia *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="diaria">Diaria</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tasa_interes_sugerida" render={({ field }) => (
                <FormItem><FormLabel>Tasa Interés (%)</FormLabel><FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="proposito" render={({ field }) => (
              <FormItem><FormLabel>Propósito *</FormLabel><FormControl><Textarea placeholder="¿Para qué será utilizado el préstamo?" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            {/* ── Sección Garantía (Opcional) ── */}
            <Separator />
            <Card className="border-dashed">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Garantía del Préstamo (Opcional)
                  </CardTitle>
                  <FormField control={form.control} name="tiene_garantia" render={({ field }) => (
                    <Select
                      value={field.value ? 'si' : 'no'}
                      onValueChange={(v) => field.onChange(v === 'si')}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No (Personal)</SelectItem>
                        <SelectItem value="si">Sí</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </CardHeader>

              {tieneGarantia && (
                <CardContent className="space-y-4 pt-0">
                  {/* Tipo de garantía */}
                  <FormField control={form.control} name="tipo_garantia" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Garantía *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {TIPOS_GARANTIA.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* ── Campos de Vehículo ── */}
                  {isVehiculo && (
                    <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Datos del Vehículo</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="garantia_marca" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Marca</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Toyota" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_modelo" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Modelo</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Corolla" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_anio" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Año</FormLabel><FormControl><Input className="h-8 text-sm" type="number" min={1990} max={2030} {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_color" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Color</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_numero_placa" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Número de Placa</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_numero_chasis" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Número de Chasis</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_numero_matricula" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Número de Matrícula</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_estado_bien" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Estado del Vehículo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="excelente">Excelente</SelectItem>
                                <SelectItem value="bueno">Bueno</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="malo">Malo</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  {/* ── Campos de Propiedad ── */}
                  {isPropiedad && (
                    <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Datos de la Propiedad</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="garantia_direccion_propiedad" render={({ field }) => (
                          <FormItem className="col-span-2"><FormLabel className="text-xs">Dirección de la Propiedad</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_tipo_propiedad" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Tipo de Propiedad</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="casa">Casa</SelectItem>
                                <SelectItem value="apartamento">Apartamento</SelectItem>
                                <SelectItem value="solar">Solar</SelectItem>
                                <SelectItem value="finca">Finca</SelectItem>
                                <SelectItem value="local_comercial">Local Comercial</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_tamano" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Tamaño Aprox.</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: 200 m²" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_documento_propiedad" render={({ field }) => (
                          <FormItem className="col-span-2"><FormLabel className="text-xs">Documento de Propiedad</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Certificado de Título No. ..." {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  {/* ── Campos de Artículo/Equipo ── */}
                  {isArticulo && (
                    <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Datos del Artículo</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="garantia_nombre_articulo" render={({ field }) => (
                          <FormItem className="col-span-2"><FormLabel className="text-xs">Nombre del Artículo</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Refrigerador Samsung" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_marca" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Marca</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_modelo" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Modelo</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_estado_bien" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Estado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="nuevo">Nuevo</SelectItem>
                                <SelectItem value="excelente">Excelente</SelectItem>
                                <SelectItem value="bueno">Bueno</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  {/* Valor y porcentaje */}
                  {tipoGarantia && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="garantia_valor_estimado" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Valor Estimado (RD$)</FormLabel><FormControl><Input className="h-8 text-sm" type="number" min={0} {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="porcentaje_prestamo_garantia" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">% Máx. a Prestar</FormLabel><FormControl><Input className="h-8 text-sm" type="number" min={1} max={100} {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                      {valorEstimado > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="text-xs text-primary font-medium">
                            Monto máximo por garantía: {formatCurrency(montoMaxGarantia)}
                          </span>
                        </div>
                      )}

                      {/* Fotos */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium">Fotos del bien</p>
                        <div className="flex flex-wrap gap-2">
                          {fotos.map((f, i) => (
                            <Badge key={i} variant="secondary" className="gap-1 text-xs">
                              {f.name.slice(0, 20)}
                              <button type="button" onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-primary hover:underline">
                          <Upload className="h-3.5 w-3.5" />
                          Subir fotos (máx. 10)
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileAdd} />
                        </label>
                      </div>

                      <FormField control={form.control} name="garantia_notas" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Notas sobre la garantía</FormLabel><FormControl><Textarea className="text-sm" placeholder="Observaciones adicionales..." {...field} /></FormControl></FormItem>
                      )} />
                    </>
                  )}
                </CardContent>
              )}
            </Card>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); setFotos([]); }}>Cancelar</Button>
              <Button type="submit" disabled={createSolicitud.isPending || uploading}>
                {createSolicitud.isPending || uploading ? 'Creando...' : 'Crear Solicitud'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
