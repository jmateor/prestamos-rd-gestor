import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Phone, MapPin, Briefcase } from 'lucide-react';
import { useUpdateCliente, type Cliente } from '@/hooks/useClientes';

const schema = z.object({
  primer_nombre: z.string().min(2),
  segundo_nombre: z.string().default(''),
  primer_apellido: z.string().min(2),
  segundo_apellido: z.string().default(''),
  cedula: z.string().min(11).max(13),
  fecha_nacimiento: z.string().optional().nullable(),
  sexo: z.string().optional().nullable(),
  estado_civil: z.string().optional().nullable(),
  nacionalidad: z.string().default('Dominicana'),
  telefono: z.string().min(10),
  telefono2: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  direccion: z.string().default(''),
  sector: z.string().default(''),
  ciudad: z.string().default(''),
  provincia: z.string().default(''),
  referencia_direccion: z.string().default(''),
  tipo_vivienda: z.string().default('alquilada'),
  tiempo_residencia: z.string().default(''),
  lugar_trabajo: z.string().default(''),
  cargo: z.string().default(''),
  direccion_trabajo: z.string().default(''),
  telefono_trabajo: z.string().default(''),
  ingreso_mensual: z.coerce.number().min(0).default(0),
  otros_ingresos: z.coerce.number().min(0).default(0),
  antiguedad_laboral: z.string().default(''),
  banco_nombre: z.string().default(''),
  numero_cuenta: z.string().default(''),
  notas: z.string().default(''),
  nota_bloqueo: z.string().default(''),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteEditFormDialog({ cliente, open, onOpenChange }: Props) {
  const updateCliente = useUpdateCliente();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primer_nombre: cliente.primer_nombre,
      segundo_nombre: cliente.segundo_nombre || '',
      primer_apellido: cliente.primer_apellido,
      segundo_apellido: cliente.segundo_apellido || '',
      cedula: cliente.cedula,
      fecha_nacimiento: cliente.fecha_nacimiento,
      sexo: cliente.sexo,
      estado_civil: cliente.estado_civil,
      nacionalidad: cliente.nacionalidad || 'Dominicana',
      telefono: cliente.telefono,
      telefono2: cliente.telefono2 || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      sector: cliente.sector || '',
      ciudad: cliente.ciudad || '',
      provincia: cliente.provincia || '',
      referencia_direccion: cliente.referencia_direccion || '',
      tipo_vivienda: cliente.tipo_vivienda || 'alquilada',
      tiempo_residencia: cliente.tiempo_residencia || '',
      lugar_trabajo: cliente.lugar_trabajo || '',
      cargo: cliente.cargo || '',
      direccion_trabajo: cliente.direccion_trabajo || '',
      telefono_trabajo: cliente.telefono_trabajo || '',
      ingreso_mensual: cliente.ingreso_mensual || 0,
      otros_ingresos: cliente.otros_ingresos || 0,
      antiguedad_laboral: cliente.antiguedad_laboral || '',
      banco_nombre: cliente.banco_nombre || '',
      numero_cuenta: cliente.numero_cuenta || '',
      notas: cliente.notas || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    await updateCliente.mutateAsync({ id: cliente.id, data: values });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal" className="gap-1 text-xs"><User className="h-3 w-3" /> Personal</TabsTrigger>
                <TabsTrigger value="contacto" className="gap-1 text-xs"><Phone className="h-3 w-3" /> Contacto</TabsTrigger>
                <TabsTrigger value="direccion" className="gap-1 text-xs"><MapPin className="h-3 w-3" /> Dirección</TabsTrigger>
                <TabsTrigger value="laboral" className="gap-1 text-xs"><Briefcase className="h-3 w-3" /> Laboral</TabsTrigger>
                <TabsTrigger value="banco" className="gap-1 text-xs">Banco</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="primer_nombre" render={({ field }) => (
                    <FormItem><FormLabel>Primer Nombre *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="segundo_nombre" render={({ field }) => (
                    <FormItem><FormLabel>Segundo Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="primer_apellido" render={({ field }) => (
                    <FormItem><FormLabel>Primer Apellido *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="segundo_apellido" render={({ field }) => (
                    <FormItem><FormLabel>Segundo Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="cedula" render={({ field }) => (
                    <FormItem><FormLabel>Cédula *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fecha_nacimiento" render={({ field }) => (
                    <FormItem><FormLabel>Fecha Nacimiento</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="sexo" render={({ field }) => (
                    <FormItem><FormLabel>Sexo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Femenino</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="estado_civil" render={({ field }) => (
                    <FormItem><FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="soltero">Soltero/a</SelectItem>
                          <SelectItem value="casado">Casado/a</SelectItem>
                          <SelectItem value="union_libre">Unión Libre</SelectItem>
                          <SelectItem value="divorciado">Divorciado/a</SelectItem>
                          <SelectItem value="viudo">Viudo/a</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="nacionalidad" render={({ field }) => (
                    <FormItem><FormLabel>Nacionalidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </TabsContent>

              <TabsContent value="contacto" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="telefono" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="telefono2" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>

              <TabsContent value="direccion" className="space-y-3 mt-4">
                <FormField control={form.control} name="direccion" render={({ field }) => (
                  <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="sector" render={({ field }) => (
                    <FormItem><FormLabel>Sector</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ciudad" render={({ field }) => (
                    <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="provincia" render={({ field }) => (
                    <FormItem><FormLabel>Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="tipo_vivienda" render={({ field }) => (
                    <FormItem><FormLabel>Tipo Vivienda</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="propia">Propia</SelectItem>
                          <SelectItem value="alquilada">Alquilada</SelectItem>
                          <SelectItem value="familiar">Familiar</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="referencia_direccion" render={({ field }) => (
                  <FormItem><FormLabel>Referencia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>

              <TabsContent value="laboral" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="lugar_trabajo" render={({ field }) => (
                    <FormItem><FormLabel>Lugar de Trabajo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cargo" render={({ field }) => (
                    <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="direccion_trabajo" render={({ field }) => (
                  <FormItem><FormLabel>Dirección Trabajo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="telefono_trabajo" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono Trabajo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="antiguedad_laboral" render={({ field }) => (
                    <FormItem><FormLabel>Antigüedad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="ingreso_mensual" render={({ field }) => (
                    <FormItem><FormLabel>Ingreso Mensual (RD$)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="otros_ingresos" render={({ field }) => (
                    <FormItem><FormLabel>Otros Ingresos (RD$)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notas" render={({ field }) => (
                  <FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>

              <TabsContent value="banco" className="space-y-3 mt-4">
                <FormField control={form.control} name="banco_nombre" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del Banco</FormLabel><FormControl><Input placeholder="Ej: Banco Popular" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="numero_cuenta" render={({ field }) => (
                  <FormItem><FormLabel>Número de Cuenta</FormLabel><FormControl><Input placeholder="Ej: 000-000000-0" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateCliente.isPending}>
                {updateCliente.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
