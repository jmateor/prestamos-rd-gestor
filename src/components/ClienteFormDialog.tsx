import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, User, Phone, MapPin, Briefcase } from 'lucide-react';
import { useCreateCliente, type ClienteInsert } from '@/hooks/useClientes';

const schema = z.object({
  primer_nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  segundo_nombre: z.string().default(''),
  primer_apellido: z.string().min(2, 'Mínimo 2 caracteres'),
  segundo_apellido: z.string().default(''),
  cedula: z.string().min(11, 'Cédula inválida').max(13, 'Cédula inválida'),
  fecha_nacimiento: z.string().optional().nullable(),
  sexo: z.string().optional().nullable(),
  estado_civil: z.string().optional().nullable(),
  nacionalidad: z.string().default('Dominicana'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  telefono2: z.string().default(''),
  email: z.string().email('Email inválido').or(z.literal('')).default(''),
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
  estado: z.string().default('activo'),
  banco_nombre: z.string().default(''),
  numero_cuenta: z.string().default(''),
  notas: z.string().default(''),
});

type FormValues = z.infer<typeof schema>;

export function ClienteFormDialog() {
  const [open, setOpen] = useState(false);
  const createCliente = useCreateCliente();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
      cedula: '', telefono: '', telefono2: '', email: '', nacionalidad: 'Dominicana',
      direccion: '', sector: '', ciudad: '', provincia: '', referencia_direccion: '',
      tipo_vivienda: 'alquilada', tiempo_residencia: '',
      lugar_trabajo: '', cargo: '', direccion_trabajo: '', telefono_trabajo: '',
      ingreso_mensual: 0, otros_ingresos: 0, antiguedad_laboral: '',
      estado: 'activo', banco_nombre: '', numero_cuenta: '', notas: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createCliente.mutateAsync(values as ClienteInsert);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" className="gap-1 text-xs"><User className="h-3 w-3" /> Personal</TabsTrigger>
                <TabsTrigger value="contacto" className="gap-1 text-xs"><Phone className="h-3 w-3" /> Contacto</TabsTrigger>
                <TabsTrigger value="direccion" className="gap-1 text-xs"><MapPin className="h-3 w-3" /> Dirección</TabsTrigger>
                <TabsTrigger value="laboral" className="gap-1 text-xs"><Briefcase className="h-3 w-3" /> Laboral</TabsTrigger>
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
                    <FormItem><FormLabel>Cédula *</FormLabel><FormControl><Input placeholder="000-0000000-0" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <FormItem><FormLabel>Teléfono Principal *</FormLabel><FormControl><Input placeholder="809-000-0000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="telefono2" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono Secundario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormItem><FormLabel>Referencia</FormLabel><FormControl><Input placeholder="Cerca de..." {...field} /></FormControl><FormMessage /></FormItem>
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
                    <FormItem><FormLabel>Antigüedad</FormLabel><FormControl><Input placeholder="Ej: 2 años" {...field} /></FormControl><FormMessage /></FormItem>
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
                  <FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea placeholder="Observaciones..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="banco_nombre" render={({ field }) => (
                    <FormItem><FormLabel>Banco</FormLabel><FormControl><Input placeholder="Ej: Banco Popular" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="numero_cuenta" render={({ field }) => (
                    <FormItem><FormLabel>No. Cuenta</FormLabel><FormControl><Input placeholder="000-000000-0" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createCliente.isPending}>
                {createCliente.isPending ? 'Guardando...' : 'Registrar Cliente'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
