import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateSolicitud } from '@/hooks/useSolicitudes';
import { useClientes } from '@/hooks/useClientes';

const schema = z.object({
  cliente_id: z.string().min(1, 'Seleccione un cliente'),
  monto_solicitado: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
  plazo_meses: z.coerce.number().min(1, 'El plazo debe ser al menos 1'),
  frecuencia_pago: z.string().min(1, 'Seleccione frecuencia'),
  proposito: z.string().trim().min(3, 'Ingrese el propósito').max(500),
  tasa_interes_sugerida: z.coerce.number().min(0).max(100).default(0),
});

type FormValues = z.infer<typeof schema>;

export function SolicitudFormDialog() {
  const [open, setOpen] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
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
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createSolicitud.mutateAsync({
      cliente_id: values.cliente_id,
      monto_solicitado: values.monto_solicitado,
      plazo_meses: values.plazo_meses,
      frecuencia_pago: values.frecuencia_pago,
      proposito: values.proposito,
      tasa_interes_sugerida: values.tasa_interes_sugerida,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
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
                  <Input
                    placeholder="Buscar cliente por nombre o cédula..."
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                  />
                  {loadingClientes ? (
                    <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : clientes && clientes.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.primer_nombre} {c.primer_apellido} — {c.cedula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se encontraron clientes. Registre uno primero.</p>
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
                <FormItem><FormLabel>Plazo (meses) *</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
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

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createSolicitud.isPending}>
                {createSolicitud.isPending ? 'Creando...' : 'Crear Solicitud'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
