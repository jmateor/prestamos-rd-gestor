import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, UserPlus, Loader2 } from 'lucide-react';
import { useSolicitud, useGarantes, useUpdateSolicitudEstado, useAddGarante, type Solicitud } from '@/hooks/useSolicitudes';
import { formatCurrency } from '@/lib/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ClienteRiskAlert } from '@/components/ClienteRiskAlert';
import { CreditScoreIndicator } from '@/components/CreditScoreIndicator';
import { formatCurrency } from '@/lib/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const estadoBadge: Record<string, { class: string; label: string }> = {
  pendiente: { class: 'bg-warning/10 text-warning border-warning/20', label: 'Pendiente' },
  en_evaluacion: { class: 'bg-primary/10 text-primary border-primary/20', label: 'En Evaluación' },
  aprobada: { class: 'bg-success/10 text-success border-success/20', label: 'Aprobada' },
  rechazada: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Rechazada' },
};

const frecuenciaLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

const garanteSchema = z.object({
  nombre_completo: z.string().trim().min(3, 'Mínimo 3 caracteres').max(100),
  cedula: z.string().min(11, 'Cédula inválida').max(13),
  telefono: z.string().min(10, 'Teléfono inválido'),
  relacion: z.string().trim().min(1, 'Requerido').max(100),
  direccion: z.string().max(200).default(''),
  lugar_trabajo: z.string().max(200).default(''),
  ingreso_mensual: z.coerce.number().min(0).default(0),
});

interface Props {
  solicitudId: string | null;
  onClose: () => void;
}

export function SolicitudDetailDialog({ solicitudId, onClose }: Props) {
  const { data: solicitud, isLoading } = useSolicitud(solicitudId ?? undefined);
  const { data: garantes } = useGarantes(solicitudId ?? undefined);
  const updateEstado = useUpdateSolicitudEstado();
  const addGarante = useAddGarante();
  const [comentarios, setComentarios] = useState('');
  const [showGaranteForm, setShowGaranteForm] = useState(false);

  const garanteForm = useForm({
    resolver: zodResolver(garanteSchema),
    defaultValues: { nombre_completo: '', cedula: '', telefono: '', relacion: '', direccion: '', lugar_trabajo: '', ingreso_mensual: 0 },
  });

  const handleEstado = async (estado: string) => {
    if (!solicitudId) return;
    await updateEstado.mutateAsync({ id: solicitudId, estado, comentarios });
    setComentarios('');
  };

  const onAddGarante = async (values: z.infer<typeof garanteSchema>) => {
    if (!solicitudId) return;
    await addGarante.mutateAsync({
      nombre_completo: values.nombre_completo,
      cedula: values.cedula,
      telefono: values.telefono,
      relacion: values.relacion,
      direccion: values.direccion,
      lugar_trabajo: values.lugar_trabajo,
      ingreso_mensual: values.ingreso_mensual,
      solicitud_id: solicitudId,
    });
    garanteForm.reset();
    setShowGaranteForm(false);
  };

  const cliente = solicitud?.clientes as any;

  return (
    <Dialog open={!!solicitudId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Solicitud</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : solicitud ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{solicitud.numero_solicitud}</span>
              <Badge variant="outline" className={estadoBadge[solicitud.estado]?.class}>
                {estadoBadge[solicitud.estado]?.label}
              </Badge>
            </div>

            {/* Cliente info */}
            {cliente && (
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">Datos del Cliente</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm pb-3">
                  <div><span className="text-muted-foreground">Nombre:</span> {cliente.primer_nombre} {cliente.primer_apellido}</div>
                  <div><span className="text-muted-foreground">Cédula:</span> {cliente.cedula}</div>
                  <div><span className="text-muted-foreground">Teléfono:</span> {cliente.telefono}</div>
                  <div><span className="text-muted-foreground">Ingreso:</span> {formatCurrency(cliente.ingreso_mensual)}</div>
                </CardContent>
              </Card>
            )}

            {/* Préstamo info */}
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Datos del Préstamo</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-sm pb-3">
                <div><span className="text-muted-foreground">Monto:</span> {formatCurrency(solicitud.monto_solicitado)}</div>
                <div><span className="text-muted-foreground">Plazo:</span> {solicitud.plazo_meses} meses</div>
                <div><span className="text-muted-foreground">Frecuencia:</span> {frecuenciaLabel[solicitud.frecuencia_pago]}</div>
                <div><span className="text-muted-foreground">Tasa:</span> {solicitud.tasa_interes_sugerida}%</div>
                <div className="col-span-2"><span className="text-muted-foreground">Propósito:</span> {solicitud.proposito}</div>
              </CardContent>
            </Card>

            {/* Garantes */}
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Garantes / Codeudores</CardTitle>
                {(solicitud.estado === 'pendiente' || solicitud.estado === 'en_evaluacion') && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowGaranteForm(!showGaranteForm)}>
                    <UserPlus className="h-3 w-3" /> Agregar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pb-3">
                {showGaranteForm && (
                  <Form {...garanteForm}>
                    <form onSubmit={garanteForm.handleSubmit(onAddGarante)} className="space-y-3 mb-4 p-3 rounded-md border bg-muted/30">
                      <div className="grid grid-cols-2 gap-2">
                        <FormField control={garanteForm.control} name="nombre_completo" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Nombre Completo *</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={garanteForm.control} name="cedula" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Cédula *</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={garanteForm.control} name="telefono" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Teléfono *</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={garanteForm.control} name="relacion" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Relación *</FormLabel><FormControl><Input className="h-8 text-sm" placeholder="Ej: Hermano" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowGaranteForm(false)}>Cancelar</Button>
                        <Button type="submit" size="sm" disabled={addGarante.isPending}>Guardar</Button>
                      </div>
                    </form>
                  </Form>
                )}
                {garantes && garantes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Relación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {garantes.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="text-sm">{g.nombre_completo}</TableCell>
                          <TableCell className="text-sm">{g.cedula}</TableCell>
                          <TableCell className="text-sm">{g.telefono}</TableCell>
                          <TableCell className="text-sm">{g.relacion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Sin garantes registrados</p>
                )}
              </CardContent>
            </Card>

            {/* Evaluación */}
            {solicitud.comentarios_evaluacion && (
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">Evaluación</CardTitle></CardHeader>
                <CardContent className="text-sm pb-3">
                  <p>{solicitud.comentarios_evaluacion}</p>
                  {solicitud.fecha_evaluacion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Evaluado el {new Date(solicitud.fecha_evaluacion).toLocaleDateString('es-DO')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {(solicitud.estado === 'pendiente' || solicitud.estado === 'en_evaluacion') && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Textarea
                    placeholder="Comentarios de evaluación..."
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    {solicitud.estado === 'pendiente' && (
                      <Button variant="outline" className="gap-1" onClick={() => handleEstado('en_evaluacion')} disabled={updateEstado.isPending}>
                        <Clock className="h-4 w-4" /> Evaluar
                      </Button>
                    )}
                    <Button variant="destructive" className="gap-1" onClick={() => handleEstado('rechazada')} disabled={updateEstado.isPending}>
                      <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                    <Button className="gap-1 bg-success hover:bg-success/90" onClick={() => handleEstado('aprobada')} disabled={updateEstado.isPending}>
                      <CheckCircle className="h-4 w-4" /> Aprobar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
