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
import { calcAmortizacion, totalCuotas } from '@/lib/amortizacion';
import { generarCotizacionPDF } from '@/lib/cotizacionPDF';

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
  tipo_amortizacion: z.string().default('cuota_fija'),
  gastos_legales: z.coerce.number().min(0).default(0),
  gastos_cierre: z.coerce.number().min(0).default(0),
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
      tipo_amortizacion: 'cuota_fija',
      gastos_legales: 0,
      gastos_cierre: 0,
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
  const watched = form.watch();

  const montoMaxGarantia = (valorEstimado || 0) * ((porcentaje || 70) / 100);

  const isVehiculo = tipoGarantia === 'vehiculo' || tipoGarantia === 'motocicleta';
  const isPropiedad = tipoGarantia === 'vivienda' || tipoGarantia === 'terreno';
  const isArticulo = tipoGarantia === 'electrodomestico' || tipoGarantia === 'equipo' || tipoGarantia === 'otro';

  // Preview cuota
  const preview = (() => {
    try {
      if (!watched.monto_solicitado || !watched.plazo_meses) return null;
      const cuotas = calcAmortizacion(
        watched.monto_solicitado,
        (watched.tasa_interes_sugerida || 5) / 100,
        watched.plazo_meses,
        watched.frecuencia_pago,
        watched.tipo_amortizacion || 'cuota_fija',
        new Date(),
      );
      const n = totalCuotas(watched.plazo_meses, watched.frecuencia_pago);
      const totalInt = cuotas.reduce((a, c) => a + c.interes, 0);
      return { cuota: cuotas[0]?.monto_cuota ?? 0, total: n, totalInteres: totalInt, totalPagar: cuotas.reduce((a, c) => a + c.monto_cuota, 0) };
    } catch { return null; }
  })();

  const montoNeto = (watched.monto_solicitado || 0) - (watched.gastos_legales || 0) - (watched.gastos_cierre || 0);

  const handleCotizacionPDF = () => {
    const sel = clientes?.find(c => c.id === watched.cliente_id);
    if (!sel) { toast.error('Seleccione un cliente primero'); return; }
    const doc = generarCotizacionPDF({
      cliente_nombre: `${sel.primer_nombre} ${sel.primer_apellido}`,
      cliente_cedula: sel.cedula,
      monto: watched.monto_solicitado || 0,
      tasa_mensual: watched.tasa_interes_sugerida || 5,
      plazo_meses: watched.plazo_meses || 1,
      frecuencia: watched.frecuencia_pago || 'mensual',
      metodo: watched.tipo_amortizacion || 'cuota_fija',
      gastos_legales: watched.gastos_legales,
      gastos_cierre: watched.gastos_cierre,
    });
    doc.save(`cotizacion-${sel.cedula}.pdf`);
    toast.success('Cotización PDF generada');
  };

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
      tipo_amortizacion: values.tipo_amortizacion,
      gastos_legales: values.gastos_legales,
      gastos_cierre: values.gastos_cierre,
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

            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="frecuencia_pago" render={({ field }) => (
                <FormItem><FormLabel>Plazo *</FormLabel>
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
              <FormField control={form.control} name="tipo_amortizacion" render={({ field }) => (
                <FormItem><FormLabel>Método</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="cuota_fija">Cuota Fija</SelectItem>
                      <SelectItem value="interes_simple">Interés Simple</SelectItem>
                      <SelectItem value="saldo_insoluto">Saldo Insoluto</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>

            {/* Gastos */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="gastos_legales" render={({ field }) => (
                <FormItem><FormLabel>Gastos Legales (RD$)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gastos_cierre" render={({ field }) => (
                <FormItem><FormLabel>Gastos de Cierre (RD$)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {/* Monto neto preview */}
            {((watched.gastos_legales || 0) + (watched.gastos_cierre || 0)) > 0 && (
              <div className="rounded-md bg-muted/50 border p-2 text-sm">
                <span className="text-muted-foreground">Monto neto a desembolsar: </span>
                <span className="font-semibold">{formatCurrency(montoNeto)}</span>
              </div>
            )}

            <FormField control={form.control} name="proposito" render={({ field }) => (
              <FormItem><FormLabel>Propósito *</FormLabel><FormControl><Textarea placeholder="¿Para qué será utilizado el préstamo?" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            {/* Cuota Preview */}
            {preview && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                <p className="font-medium text-primary mb-1">Vista previa</p>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Cuota estimada:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(preview.cuota)}</span>
                  <span>Total cuotas:</span>
                  <span className="font-semibold text-foreground">{preview.total}</span>
                  <span>Total a pagar:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(preview.totalPagar)}</span>
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2 text-xs" onClick={handleCotizacionPDF}>
                  📄 Generar Cotización PDF
                </Button>
              </div>
            )}

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
                          <FormItem className="col-span-2"><FormLabel className="text-xs">Dirección</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_tipo_propiedad" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Tipo de Propiedad</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Casa, Apartamento" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_tamano" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Tamaño (m²)</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="garantia_documento_propiedad" render={({ field }) => (
                          <FormItem className="col-span-2"><FormLabel className="text-xs">Documento de Propiedad</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Título, Certificado" {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>
                  )}

                  {/* ── Campos de Artículo ── */}
                  {isArticulo && (
                    <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Datos del Artículo</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="garantia_nombre_articulo" render={({ field }) => (
                          <FormItem className="col-span-2"><FormLabel className="text-xs">Nombre del Artículo</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Televisor Samsung 65\"" {...field} /></FormControl></FormItem>
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
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="garantia_valor_estimado" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Valor Estimado (RD$)</FormLabel><FormControl><Input className="h-8 text-sm" type="number" min={0} {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="porcentaje_prestamo_garantia" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">% Máx. Préstamo</FormLabel><FormControl><Input className="h-8 text-sm" type="number" min={1} max={100} {...field} /></FormControl></FormItem>
                    )} />
                  </div>

                  {valorEstimado > 0 && (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      Monto máximo a prestar: {formatCurrency(montoMaxGarantia)}
                    </Badge>
                  )}

                  <FormField control={form.control} name="garantia_notas" render={({ field }) => (
                    <FormItem><FormLabel className="text-xs">Notas sobre la Garantía</FormLabel><FormControl><Textarea className="text-sm" rows={2} {...field} /></FormControl></FormItem>
                  )} />

                  {/* Fotos */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Fotos del Bien (máx 10)</p>
                    <div className="flex flex-wrap gap-2">
                      {fotos.map((f, i) => (
                        <div key={i} className="relative group">
                          <img src={URL.createObjectURL(f)} alt={f.name} className="h-16 w-16 rounded-md object-cover border" />
                          <button type="button" className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}>
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                      {fotos.length < 10 && (
                        <label className="h-16 w-16 rounded-md border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileAdd} />
                        </label>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createSolicitud.isPending || uploading}>
                {createSolicitud.isPending || uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : 'Crear Solicitud'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
