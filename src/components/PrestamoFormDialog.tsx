import { useState } from 'react';
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
import { useClientes } from '@/hooks/useClientes';
import { calcAmortizacion, totalCuotas } from '@/lib/amortizacion';
import { formatCurrency } from '@/lib/format';

const schema = z.object({
  cliente_id:          z.string().min(1, 'Seleccione un cliente'),
  monto_aprobado:      z.coerce.number().min(1, 'Monto requerido'),
  tasa_interes:        z.coerce.number().min(0).max(100),
  plazo_meses:         z.coerce.number().int().min(1),
  frecuencia_pago:     z.string().min(1),
  metodo_amortizacion: z.string().min(1),
  fecha_desembolso:    z.string().min(1, 'Fecha requerida'),
  notas:               z.string().max(500).default(''),
});

type FormValues = z.infer<typeof schema>;

export function PrestamoFormDialog() {
  const [open, setOpen] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const createPrestamo = useCreatePrestamo();
  const { data: clientes, isLoading: loadingClientes } = useClientes(clienteSearch);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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

            {/* Cliente */}
            <FormField control={form.control} name="cliente_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar cliente..."
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                  />
                  {loadingClientes
                    ? <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                    : clientes && clientes.length > 0
                      ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {clientes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.primer_nombre} {c.primer_apellido} — {c.cedula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                      : <p className="text-sm text-muted-foreground">Sin clientes. Registre uno primero.</p>}
                </div>
                <FormMessage />
              </FormItem>
            )} />

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
              <Button type="submit" disabled={createPrestamo.isPending}>
                {createPrestamo.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : 'Desembolsar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
