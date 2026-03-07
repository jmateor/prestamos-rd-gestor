import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Loader2 } from 'lucide-react';
import { useCreatePrestamo } from '@/hooks/usePrestamos';
import { calcAmortizacion, totalCuotas } from '@/lib/amortizacion';
import { formatCurrency } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const schema = z.object({
  solicitud_id:        z.string().optional(),
  cliente_id:          z.string().min(1, 'Seleccione una solicitud'),
  monto_aprobado:      z.coerce.number().min(1, 'Monto requerido'),
  tasa_interes:        z.coerce.number().min(0).max(100),
  plazo_meses:         z.coerce.number().int().min(1),
  frecuencia_pago:     z.string().min(1),
  metodo_amortizacion: z.string().min(1),
  fecha_desembolso:    z.string().min(1, 'Fecha requerida'),
  notas:               z.string().max(500).default(''),
});

type FormValues = z.infer<typeof schema>;

/** Fetch approved solicitudes that have NOT been disbursed yet */
function useSolicitudesAprobadas() {
  return useQuery({
    queryKey: ['solicitudes-aprobadas-pendientes'],
    queryFn: async () => {
      // Get approved solicitudes
      const { data: solicitudes, error: se } = await supabase
        .from('solicitudes')
        .select('*, clientes(primer_nombre, primer_apellido, cedula, telefono)')
        .eq('estado', 'aprobada')
        .order('created_at', { ascending: false });
      if (se) throw se;

      // Get solicitud_ids that already have a prestamo
      const { data: prestamos, error: pe } = await supabase
        .from('prestamos')
        .select('solicitud_id')
        .not('solicitud_id', 'is', null);
      if (pe) throw pe;

      const disbursedIds = new Set((prestamos ?? []).map((p) => p.solicitud_id));

      // Filter out already disbursed
      return (solicitudes ?? []).filter((s) => !disbursedIds.has(s.id));
    },
  });
}

export function PrestamoFormDialog() {
  const [open, setOpen] = useState(false);
  const createPrestamo = useCreatePrestamo();
  const { data: solicitudes, isLoading: loadingSolicitudes } = useSolicitudesAprobadas();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      solicitud_id: '',
      cliente_id: '',
      monto_aprobado: 0,
      tasa_interes: 5,
      plazo_meses: 12,
      frecuencia_pago: 'mensual',
      metodo_amortizacion: 'cuota_fija',
      fecha_desembolso: new Date().toISOString().split('T')[0],
      notas: '',
    },
  });

  const watched = form.watch();
  const selectedSolicitudId = form.watch('solicitud_id');

  // Auto-fill fields when a solicitud is selected
  useEffect(() => {
    if (!selectedSolicitudId || !solicitudes) return;
    const sol = solicitudes.find((s) => s.id === selectedSolicitudId);
    if (!sol) return;

    form.setValue('cliente_id', sol.cliente_id);
    form.setValue('monto_aprobado', sol.monto_solicitado);
    form.setValue('plazo_meses', sol.plazo_meses);
    form.setValue('frecuencia_pago', sol.frecuencia_pago);
    form.setValue('tasa_interes', sol.tasa_interes_sugerida ?? 5);
  }, [selectedSolicitudId, solicitudes]);

  // Preview first cuota
  const preview = (() => {
    try {
      if (!watched.monto_aprobado || !watched.plazo_meses) return null;
      const cuotas = calcAmortizacion(
        watched.monto_aprobado,
        watched.tasa_interes / 100,
        watched.plazo_meses,
        watched.frecuencia_pago,
        watched.metodo_amortizacion,
        new Date(watched.fecha_desembolso || Date.now()),
      );
      const n = totalCuotas(watched.plazo_meses, watched.frecuencia_pago);
      return { cuota: cuotas[0]?.monto_cuota ?? 0, total: n };
    } catch { return null; }
  })();

  const onSubmit = async (values: FormValues) => {
    await createPrestamo.mutateAsync({
      solicitud_id:        values.solicitud_id || undefined,
      cliente_id:          values.cliente_id,
      monto_aprobado:      values.monto_aprobado,
      tasa_interes:        values.tasa_interes,
      plazo_meses:         values.plazo_meses,
      frecuencia_pago:     values.frecuencia_pago,
      metodo_amortizacion: values.metodo_amortizacion,
      fecha_desembolso:    values.fecha_desembolso,
      notas:               values.notas,
    });
    form.reset();
    setOpen(false);
  };

  const selectedSol = solicitudes?.find((s) => s.id === selectedSolicitudId);
  const cliente = selectedSol?.clientes as any;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Préstamo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Desembolsar Préstamo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Solicitud Selector */}
            <FormField control={form.control} name="solicitud_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Solicitud Aprobada *</FormLabel>
                {loadingSolicitudes ? (
                  <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : solicitudes && solicitudes.length > 0 ? (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccionar solicitud aprobada" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {solicitudes.map((s) => {
                        const cl = s.clientes as any;
                        return (
                          <SelectItem key={s.id} value={s.id}>
                            {s.numero_solicitud} — {cl ? `${cl.primer_nombre} ${cl.primer_apellido}` : 'Sin cliente'} — {formatCurrency(s.monto_solicitado)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay solicitudes aprobadas pendientes de desembolso.</p>
                )}
                <FormMessage />
              </FormItem>
            )} />

            {/* Cliente info card */}
            {cliente && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                <p className="font-medium text-foreground">
                  {cliente.primer_nombre} {cliente.primer_apellido}
                </p>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Cédula: {cliente.cedula}</span>
                  <span>Tel: {cliente.telefono}</span>
                </div>
              </div>
            )}

            {/* Hidden cliente_id */}
            <input type="hidden" {...form.register('cliente_id')} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="monto_aprobado" render={({ field }) => (
                <FormItem><FormLabel>Monto (RD$) *</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tasa_interes" render={({ field }) => (
                <FormItem><FormLabel>Tasa Mensual (%) *</FormLabel>
                  <FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="plazo_meses" render={({ field }) => (
                <FormItem><FormLabel>Plazo (meses) *</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fecha_desembolso" render={({ field }) => (
                <FormItem><FormLabel>Fecha Desembolso *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="frecuencia_pago" render={({ field }) => (
                <FormItem><FormLabel>Frecuencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="diaria">Diaria</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="metodo_amortizacion" render={({ field }) => (
                <FormItem><FormLabel>Método</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="cuota_fija">Cuota Fija (Francés)</SelectItem>
                      <SelectItem value="interes_simple">Interés Simple</SelectItem>
                      <SelectItem value="saldo_insoluto">Saldo Insoluto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Preview */}
            {preview && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                <p className="font-medium text-primary mb-1">Vista previa de cuotas</p>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Cuota estimada:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(preview.cuota)}</span>
                  <span>Número de cuotas:</span>
                  <span className="font-semibold text-foreground">{preview.total}</span>
                </div>
              </div>
            )}

            <FormField control={form.control} name="notas" render={({ field }) => (
              <FormItem><FormLabel>Notas</FormLabel>
                <FormControl><Textarea placeholder="Observaciones opcionales..." rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createPrestamo.isPending || !selectedSolicitudId}>
                {createPrestamo.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : 'Desembolsar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
