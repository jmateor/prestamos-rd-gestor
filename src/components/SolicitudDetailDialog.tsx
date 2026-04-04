import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, UserPlus, Loader2, ShieldCheck, Car, Home, Package, Image, Pencil } from 'lucide-react';
import { useSolicitud, useGarantes, useGarantiaFotos, useUpdateSolicitudEstado, useUpdateSolicitud, useAddGarante, type Solicitud } from '@/hooks/useSolicitudes';
import { formatCurrency } from '@/lib/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ClienteRiskAlert } from '@/components/ClienteRiskAlert';
import { CreditScoreIndicator } from '@/components/CreditScoreIndicator';
import { generarCotizacionPDF } from '@/lib/cotizacionPDF';
import { toast } from 'sonner';

const estadoBadge: Record<string, { class: string; label: string }> = {
  pendiente: { class: 'bg-warning/10 text-warning border-warning/20', label: 'Pendiente' },
  en_evaluacion: { class: 'bg-primary/10 text-primary border-primary/20', label: 'En Evaluación' },
  aprobada: { class: 'bg-success/10 text-success border-success/20', label: 'Aprobada' },
  rechazada: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Rechazada' },
};

const frecuenciaLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

const garantiaEstadoBadge: Record<string, { class: string; label: string }> = {
  en_evaluacion: { class: 'bg-warning/10 text-warning border-warning/20', label: 'En Evaluación' },
  activa: { class: 'bg-success/10 text-success border-success/20', label: 'Activa' },
  liberada: { class: 'bg-primary/10 text-primary border-primary/20', label: 'Liberada' },
  proceso_legal: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Proceso Legal' },
};

const tipoGarantiaLabel: Record<string, string> = {
  vehiculo: 'Vehículo', motocicleta: 'Motocicleta', vivienda: 'Vivienda',
  terreno: 'Terreno', electrodomestico: 'Electrodoméstico', equipo: 'Equipo', otro: 'Otro Bien',
};

const metodoLabel: Record<string, string> = {
  cuota_fija: 'Cuota Fija', interes_simple: 'Interés Simple', saldo_insoluto: 'Saldo Insoluto',
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
  const { data: garantiaFotos } = useGarantiaFotos(solicitudId ?? undefined);
  const updateEstado = useUpdateSolicitudEstado();
  const updateSolicitud = useUpdateSolicitud();
  const addGarante = useAddGarante();
  const [comentarios, setComentarios] = useState('');
  const [showGaranteForm, setShowGaranteForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const garanteForm = useForm({
    resolver: zodResolver(garanteSchema),
    defaultValues: { nombre_completo: '', cedula: '', telefono: '', relacion: '', direccion: '', lugar_trabajo: '', ingreso_mensual: 0 },
  });

  const handleEstado = async (estado: string) => {
    if (!solicitudId) return;
    if (estado === 'aprobada' && solicitud?.tiene_garantia) {
      if (!solicitud.tipo_garantia || (solicitud.garantia_valor_estimado ?? 0) <= 0) {
        return;
      }
    }
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

  const startEdit = () => {
    if (!solicitud) return;
    setEditData({
      monto_solicitado: solicitud.monto_solicitado,
      plazo_meses: solicitud.plazo_meses,
      frecuencia_pago: solicitud.frecuencia_pago,
      tasa_interes_sugerida: solicitud.tasa_interes_sugerida,
      proposito: solicitud.proposito,
      tipo_amortizacion: (solicitud as any).tipo_amortizacion || 'cuota_fija',
      gastos_legales: (solicitud as any).gastos_legales || 0,
      gastos_cierre: (solicitud as any).gastos_cierre || 0,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!solicitudId) return;
    await updateSolicitud.mutateAsync({ id: solicitudId, data: editData });
    setEditing(false);
    toast.success('Solicitud actualizada');
  };

  const handleCotizacion = () => {
    if (!solicitud) return;
    const cl = solicitud.clientes as any;
    const doc = generarCotizacionPDF({
      cliente_nombre: cl ? `${cl.primer_nombre} ${cl.primer_apellido}` : 'N/A',
      cliente_cedula: cl?.cedula ?? '',
      monto: solicitud.monto_solicitado,
      tasa_mensual: solicitud.tasa_interes_sugerida,
      plazo_meses: solicitud.plazo_meses,
      frecuencia: solicitud.frecuencia_pago,
      metodo: (solicitud as any).tipo_amortizacion || 'cuota_fija',
      gastos_legales: (solicitud as any).gastos_legales,
      gastos_cierre: (solicitud as any).gastos_cierre,
    });
    doc.save(`cotizacion-${solicitud.numero_solicitud}.pdf`);
  };

  const cliente = solicitud?.clientes as any;
  const sol = solicitud as any;

  const isVehiculo = sol?.tipo_garantia === 'vehiculo' || sol?.tipo_garantia === 'motocicleta';
  const isPropiedad = sol?.tipo_garantia === 'vivienda' || sol?.tipo_garantia === 'terreno';
  const canEdit = solicitud?.estado === 'pendiente' || solicitud?.estado === 'en_evaluacion';

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
              <div>
                <span className="text-lg font-semibold">{solicitud.numero_solicitud}</span>
                {sol.tiene_garantia && (
                  <Badge variant="outline" className="ml-2 text-xs bg-primary/5 text-primary border-primary/20">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Con Garantía
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={estadoBadge[solicitud.estado]?.class}>
                  {estadoBadge[solicitud.estado]?.label}
                </Badge>
                {canEdit && !editing && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={startEdit}>
                    <Pencil className="h-3 w-3" /> Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Risk Alert */}
            {cliente && <ClienteRiskAlert clienteId={solicitud.cliente_id} />}
            {cliente && <CreditScoreIndicator clienteId={solicitud.cliente_id} compact />}

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

            {/* Préstamo info - editable if canEdit */}
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Datos del Préstamo</CardTitle></CardHeader>
              <CardContent className="pb-3">
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">Monto (RD$)</label>
                        <Input type="number" value={editData.monto_solicitado} onChange={e => setEditData({ ...editData, monto_solicitado: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Cuotas</label>
                        <Input type="number" value={editData.plazo_meses} onChange={e => setEditData({ ...editData, plazo_meses: parseInt(e.target.value) || 1 })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Plazo</label>
                        <Select value={editData.frecuencia_pago} onValueChange={v => setEditData({ ...editData, frecuencia_pago: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diaria">Diaria</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quincenal">Quincenal</SelectItem>
                            <SelectItem value="mensual">Mensual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Tasa (%)</label>
                        <Input type="number" step={0.5} value={editData.tasa_interes_sugerida} onChange={e => setEditData({ ...editData, tasa_interes_sugerida: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Gastos Legales (RD$)</label>
                        <Input type="number" value={editData.gastos_legales} onChange={e => setEditData({ ...editData, gastos_legales: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Gastos Cierre (RD$)</label>
                        <Input type="number" value={editData.gastos_cierre} onChange={e => setEditData({ ...editData, gastos_cierre: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Propósito</label>
                      <Textarea value={editData.proposito} onChange={e => setEditData({ ...editData, proposito: e.target.value })} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                      <Button size="sm" onClick={saveEdit} disabled={updateSolicitud.isPending}>Guardar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Monto:</span> {formatCurrency(solicitud.monto_solicitado)}</div>
                    <div><span className="text-muted-foreground">Cuotas:</span> {solicitud.plazo_meses}</div>
                    <div><span className="text-muted-foreground">Plazo:</span> {frecuenciaLabel[solicitud.frecuencia_pago]}</div>
                    <div><span className="text-muted-foreground">Tasa:</span> {solicitud.tasa_interes_sugerida}%</div>
                    <div><span className="text-muted-foreground">Método:</span> {metodoLabel[sol.tipo_amortizacion] || 'Cuota Fija'}</div>
                    <div><span className="text-muted-foreground">Tipo:</span> {sol.tiene_garantia ? 'Con Garantía' : 'Personal'}</div>
                    {(sol.gastos_legales > 0 || sol.gastos_cierre > 0) && (
                      <>
                        <div><span className="text-muted-foreground">G. Legales:</span> {formatCurrency(sol.gastos_legales || 0)}</div>
                        <div><span className="text-muted-foreground">G. Cierre:</span> {formatCurrency(sol.gastos_cierre || 0)}</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Monto Neto:</span> <span className="font-semibold">{formatCurrency(solicitud.monto_solicitado - (sol.gastos_legales || 0) - (sol.gastos_cierre || 0))}</span></div>
                      </>
                    )}
                    <div className="col-span-2"><span className="text-muted-foreground">Propósito:</span> {solicitud.proposito}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Garantía ── */}
            {sol.tiene_garantia && sol.tipo_garantia && (
              <Card className="border-primary/20">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Garantía del Préstamo
                    </CardTitle>
                    <Badge variant="outline" className={garantiaEstadoBadge[sol.garantia_estado]?.class || ''}>
                      {garantiaEstadoBadge[sol.garantia_estado]?.label || sol.garantia_estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Tipo:</span> {tipoGarantiaLabel[sol.tipo_garantia] || sol.tipo_garantia}</div>
                    <div><span className="text-muted-foreground">Valor Estimado:</span> {formatCurrency(sol.garantia_valor_estimado || 0)}</div>

                    {isVehiculo && (
                      <>
                        {sol.garantia_marca && <div><span className="text-muted-foreground">Marca:</span> {sol.garantia_marca}</div>}
                        {sol.garantia_modelo && <div><span className="text-muted-foreground">Modelo:</span> {sol.garantia_modelo}</div>}
                        {sol.garantia_anio && <div><span className="text-muted-foreground">Año:</span> {sol.garantia_anio}</div>}
                        {sol.garantia_color && <div><span className="text-muted-foreground">Color:</span> {sol.garantia_color}</div>}
                        {sol.garantia_numero_placa && <div><span className="text-muted-foreground">Placa:</span> {sol.garantia_numero_placa}</div>}
                        {sol.garantia_numero_chasis && <div><span className="text-muted-foreground">Chasis:</span> {sol.garantia_numero_chasis}</div>}
                        {sol.garantia_numero_matricula && <div><span className="text-muted-foreground">Matrícula:</span> {sol.garantia_numero_matricula}</div>}
                        {sol.garantia_estado_bien && <div><span className="text-muted-foreground">Estado:</span> {sol.garantia_estado_bien}</div>}
                      </>
                    )}

                    {isPropiedad && (
                      <>
                        {sol.garantia_direccion_propiedad && <div className="col-span-2"><span className="text-muted-foreground">Dirección:</span> {sol.garantia_direccion_propiedad}</div>}
                        {sol.garantia_tipo_propiedad && <div><span className="text-muted-foreground">Tipo:</span> {sol.garantia_tipo_propiedad}</div>}
                        {sol.garantia_tamano && <div><span className="text-muted-foreground">Tamaño:</span> {sol.garantia_tamano}</div>}
                        {sol.garantia_documento_propiedad && <div className="col-span-2"><span className="text-muted-foreground">Documento:</span> {sol.garantia_documento_propiedad}</div>}
                      </>
                    )}

                    {!isVehiculo && !isPropiedad && (
                      <>
                        {sol.garantia_nombre_articulo && <div className="col-span-2"><span className="text-muted-foreground">Artículo:</span> {sol.garantia_nombre_articulo}</div>}
                        {sol.garantia_marca && <div><span className="text-muted-foreground">Marca:</span> {sol.garantia_marca}</div>}
                        {sol.garantia_modelo && <div><span className="text-muted-foreground">Modelo:</span> {sol.garantia_modelo}</div>}
                        {sol.garantia_estado_bien && <div><span className="text-muted-foreground">Estado:</span> {sol.garantia_estado_bien}</div>}
                      </>
                    )}

                    <div><span className="text-muted-foreground">% Máx. Préstamo:</span> {sol.porcentaje_prestamo_garantia}%</div>
                    <div><span className="text-muted-foreground">Monto Máx.:</span> {formatCurrency((sol.garantia_valor_estimado || 0) * (sol.porcentaje_prestamo_garantia || 70) / 100)}</div>
                  </div>

                  {sol.garantia_notas && (
                    <p className="text-xs text-muted-foreground border-t pt-2">{sol.garantia_notas}</p>
                  )}

                  {garantiaFotos && garantiaFotos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1"><Image className="h-3 w-3" /> Fotos del Bien</p>
                      <div className="grid grid-cols-3 gap-2">
                        {garantiaFotos.map((f) => (
                          <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer">
                            <img src={f.url} alt={f.nombre} className="rounded-md border h-24 w-full object-cover hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Garantes */}
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Garantes / Codeudores</CardTitle>
                {canEdit && (
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

            {/* Cotización PDF */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={handleCotizacion}>
                📄 Cotización PDF
              </Button>
            </div>

            {/* Actions */}
            {canEdit && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Textarea placeholder="Comentarios de evaluación..." value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
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
