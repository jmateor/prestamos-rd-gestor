import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, Banknote, Search } from 'lucide-react';
import { useCreatePrestamo, usePrestamos } from '@/hooks/usePrestamos';
import { calcAmortizacion, totalCuotas, fechaBaseDesde, parseLocalDate } from '@/lib/amortizacion';
import { formatCurrency, formatDate } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { generarDesembolsoPDF } from '@/lib/desembolsoPDF';

const schema = z.object({
  solicitud_id:        z.string().optional(),
  cliente_id:          z.string().min(1, 'Seleccione un cliente o solicitud'),
  monto_aprobado:      z.coerce.number().min(1, 'Monto requerido'),
  tasa_interes:        z.coerce.number().min(0).max(100),
  plazo_meses:         z.coerce.number().int().min(1),
  frecuencia_pago:     z.string().min(1),
  metodo_amortizacion: z.string().min(1),
  fecha_desembolso:    z.string().min(1, 'Fecha de desembolso requerida'),
  fecha_inicio_pago:   z.string().min(1, 'Fecha de primer pago requerida'),
  notas:               z.string().max(500).default(''),
  gastos_legales:      z.coerce.number().min(0).default(0),
  gastos_cierre:       z.coerce.number().min(0).default(0),
  proposito:           z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/** Fetch approved solicitudes not yet disbursed */
function useSolicitudesAprobadas() {
  return useQuery({
    queryKey: ['solicitudes-aprobadas-pendientes'],
    queryFn: async () => {
      const { data: solicitudes, error: se } = await supabase
        .from('solicitudes')
        .select('*, clientes(primer_nombre, primer_apellido, cedula, telefono, estado)')
        .eq('estado', 'aprobada')
        .order('created_at', { ascending: false });
      if (se) throw se;

      const { data: prestamos, error: pe } = await supabase
        .from('prestamos')
        .select('solicitud_id')
        .not('solicitud_id', 'is', null);
      if (pe) throw pe;

      const disbursedIds = new Set((prestamos ?? []).map((p) => p.solicitud_id));
      return (solicitudes ?? []).filter((s) => !disbursedIds.has(s.id));
    },
  });
}

/** Fetch all clients for direct disbursement */
function useClientesActivos() {
  return useQuery({
    queryKey: ['clientes-activos-desembolso'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, primer_nombre, primer_apellido, cedula, telefono, estado')
        .eq('estado', 'activo')
        .order('primer_nombre');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function Desembolsos() {
  const [mode, setMode] = useState<'solicitud' | 'directo'>('solicitud');
  const [searchRecent, setSearchRecent] = useState('');
  const createPrestamo = useCreatePrestamo();
  const { data: solicitudes, isLoading: loadingSolicitudes } = useSolicitudesAprobadas();
  const { data: clientes, isLoading: loadingClientes } = useClientesActivos();
  const { data: recentPrestamos } = usePrestamos({ search: searchRecent });
  const { isAdmin } = useUserRole();

  const today = new Date().toISOString().split('T')[0];

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
      fecha_desembolso: today,
      fecha_inicio_pago: today,
      notas: '',
      gastos_legales: 0,
      gastos_cierre: 0,
      proposito: '',
    },
  });

  const watched = form.watch();
  const selectedSolicitudId = form.watch('solicitud_id');

  // Auto-fill from solicitud
  useEffect(() => {
    if (mode !== 'solicitud' || !selectedSolicitudId || !solicitudes) return;
    const sol = solicitudes.find((s) => s.id === selectedSolicitudId);
    if (!sol) return;
    form.setValue('cliente_id', sol.cliente_id);
    form.setValue('monto_aprobado', sol.monto_aprobado ?? sol.monto_solicitado);
    form.setValue('plazo_meses', sol.plazo_meses);
    form.setValue('frecuencia_pago', sol.frecuencia_pago);
    form.setValue('tasa_interes', sol.tasa_interes_sugerida ?? 5);
    form.setValue('gastos_legales', sol.gastos_legales ?? 0);
    form.setValue('gastos_cierre', sol.gastos_cierre ?? 0);
    form.setValue('proposito', sol.proposito ?? '');
  }, [selectedSolicitudId, solicitudes, mode]);

  // Preview
  const preview = (() => {
    try {
      if (!watched.monto_aprobado || !watched.plazo_meses) return null;
      const fechaPrimerPago = watched.fecha_inicio_pago || watched.fecha_desembolso || today;
      const fechaBase = fechaBaseDesde(parseLocalDate(fechaPrimerPago), watched.frecuencia_pago);
      const cuotas = calcAmortizacion(
        watched.monto_aprobado,
        watched.tasa_interes / 100,
        watched.plazo_meses,
        watched.frecuencia_pago,
        watched.metodo_amortizacion,
        fechaBase,
      );
      const n = totalCuotas(watched.plazo_meses, watched.frecuencia_pago);
      return { cuota: cuotas[0]?.monto_cuota ?? 0, total: n, primerPago: cuotas[0]?.fecha_vencimiento };
    } catch { return null; }
  })();

  const selectedSol = solicitudes?.find((s) => s.id === selectedSolicitudId);
  const clienteFromSol = selectedSol?.clientes as any;
  const clienteFromDirect = mode === 'directo' ? clientes?.find(c => c.id === watched.cliente_id) : null;
  const cliente = clienteFromSol || clienteFromDirect;

  const montoNeto = watched.monto_aprobado - (watched.gastos_legales || 0) - (watched.gastos_cierre || 0);

  const onSubmit = async (values: FormValues) => {
    const prestamo = await createPrestamo.mutateAsync({
      solicitud_id:        values.solicitud_id || undefined,
      cliente_id:          values.cliente_id,
      monto_aprobado:      values.monto_aprobado,
      tasa_interes:        values.tasa_interes,
      plazo_meses:         values.plazo_meses,
      frecuencia_pago:     values.frecuencia_pago,
      metodo_amortizacion: values.metodo_amortizacion,
      fecha_desembolso:    values.fecha_desembolso,
      fecha_inicio_pago:   values.fecha_inicio_pago,
      notas:               values.notas,
      gastos_legales:      values.gastos_legales,
      gastos_cierre:       values.gastos_cierre,
      proposito:           values.proposito,
    });

    if (prestamo && cliente) {
      const cuotaEst = preview?.cuota ?? 0;
      const doc = generarDesembolsoPDF({
        numero_prestamo: prestamo.numero_prestamo || 'N/A',
        cliente_nombre: `${cliente.primer_nombre} ${cliente.primer_apellido}`,
        cliente_cedula: cliente.cedula,
        monto_aprobado: values.monto_aprobado,
        gastos_legales: values.gastos_legales,
        gastos_cierre: values.gastos_cierre,
        monto_neto: montoNeto,
        fecha_desembolso: values.fecha_desembolso,
        tasa_interes: values.tasa_interes,
        plazo_meses: values.plazo_meses,
        frecuencia: values.frecuencia_pago,
        cuota_estimada: cuotaEst,
        metodo: values.metodo_amortizacion,
      });
      doc.save(`desembolso-${prestamo.numero_prestamo || 'nuevo'}.pdf`);
    }

    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Desembolsos</h1>
        <p className="text-muted-foreground">Procesar desembolsos de préstamos con fecha de pago flexible</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Nuevo Desembolso
            </CardTitle>
            {/* Mode toggle */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant={mode === 'solicitud' ? 'default' : 'outline'}
                onClick={() => { setMode('solicitud'); form.reset(); }}
              >
                Desde Solicitud
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === 'directo' ? 'default' : 'outline'}
                onClick={() => { setMode('directo'); form.reset(); }}
              >
                Desembolso Directo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Solicitud mode */}
                {mode === 'solicitud' && (
                  <FormField control={form.control} name="solicitud_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solicitud Aprobada</FormLabel>
                      {loadingSolicitudes ? (
                        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : solicitudes && solicitudes.length > 0 ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleccionar solicitud" /></SelectTrigger>
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
                        <p className="text-sm text-muted-foreground">No hay solicitudes aprobadas pendientes.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {/* Direct mode - client selector */}
                {mode === 'directo' && (
                  <FormField control={form.control} name="cliente_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      {loadingClientes ? (
                        <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(clientes ?? []).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.primer_nombre} {c.primer_apellido} — {c.cedula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {/* Hidden cliente_id for solicitud mode */}
                {mode === 'solicitud' && <input type="hidden" {...form.register('cliente_id')} />}

                {/* Client info */}
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

                {/* Blocked alert */}
                {cliente?.estado === 'bloqueado' && !isAdmin && (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription>
                      Este cliente está bloqueado. Solo un administrador puede procesar este desembolso.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Financial fields */}
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
                    <FormItem><FormLabel>Cuotas *</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="proposito" render={({ field }) => (
                    <FormItem><FormLabel>Propósito</FormLabel>
                      <FormControl><Input placeholder="Ej: Capital de trabajo" {...field} /></FormControl>
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

                {/* DATES - Key feature: separate disbursement date from payment start */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="fecha_desembolso" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Desembolso *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormDescription>Fecha en que se entrega el dinero</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="fecha_inicio_pago" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Primer Pago *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormDescription>Fecha que el cliente elige para pagar</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Expenses */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="gastos_legales" render={({ field }) => (
                    <FormItem><FormLabel>Gastos Legales (RD$)</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gastos_cierre" render={({ field }) => (
                    <FormItem><FormLabel>Gastos de Cierre (RD$)</FormLabel>
                      <FormControl><Input type="number" min={0} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Net amount */}
                {watched.monto_aprobado > 0 && (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto bruto:</span>
                      <span>{formatCurrency(watched.monto_aprobado)}</span>
                    </div>
                    {(watched.gastos_legales > 0 || watched.gastos_cierre > 0) && (
                      <>
                        <div className="flex justify-between text-destructive">
                          <span>- Gastos legales:</span>
                          <span>{formatCurrency(watched.gastos_legales)}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span>- Gastos cierre:</span>
                          <span>{formatCurrency(watched.gastos_cierre)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                      <span>Monto neto a entregar:</span>
                      <span className="text-primary">{formatCurrency(montoNeto)}</span>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {preview && (
                  <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                    <p className="font-medium text-primary mb-1">Vista previa</p>
                    <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <span>Cuota estimada:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(preview.cuota)}</span>
                      <span>Número de cuotas:</span>
                      <span className="font-semibold text-foreground">{preview.total}</span>
                      <span>Primer pago:</span>
                      <span className="font-semibold text-foreground">
                        {preview.primerPago ? formatDate(preview.primerPago.toISOString().split('T')[0]) : '—'}
                      </span>
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
                  <Button type="button" variant="outline" onClick={() => form.reset()}>Limpiar</Button>
                  <Button
                    type="submit"
                    disabled={createPrestamo.isPending || !watched.cliente_id || (cliente?.estado === 'bloqueado' && !isAdmin)}
                  >
                    {createPrestamo.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</> : 'Desembolsar'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Recent disbursements */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Desembolsos Recientes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchRecent}
                onChange={(e) => setSearchRecent(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {(recentPrestamos ?? []).slice(0, 10).map((p) => {
                const cl = p.clientes;
                return (
                  <div key={p.id} className="px-4 py-3 border-b last:border-b-0 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-medium">{p.numero_prestamo}</p>
                        <p className="text-muted-foreground">
                          {cl ? `${cl.primer_nombre} ${cl.primer_apellido}` : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(p.monto_aprobado)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.fecha_desembolso)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!recentPrestamos || recentPrestamos.length === 0) && (
                <p className="text-center text-muted-foreground text-sm py-8">Sin desembolsos</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
