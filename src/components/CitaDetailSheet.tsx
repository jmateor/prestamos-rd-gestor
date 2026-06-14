import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, CalendarClock, Loader2, User, FileText, Phone, AlertCircle } from 'lucide-react';
import { useActualizarCita, useAtenderCita, type Cita } from '@/hooks/useCitas';
import { useUserRole } from '@/hooks/useUserRole';
import { formatCurrency } from '@/lib/format';

const estadoBadge: Record<string, { class: string; label: string }> = {
  programada: { class: 'bg-warning/10 text-warning border-warning/20', label: 'Programada' },
  confirmada: { class: 'bg-primary/10 text-primary border-primary/20', label: 'Confirmada' },
  atendida: { class: 'bg-success/10 text-success border-success/20', label: 'Atendida' },
  cancelada: { class: 'bg-muted text-muted-foreground', label: 'Cancelada' },
  no_asistio: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'No asistió' },
};

const resultadoBadge: Record<string, { class: string; label: string }> = {
  aprobar: { class: 'bg-success/10 text-success border-success/20', label: 'Aprobar' },
  rechazar: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Rechazar' },
  posponer: { class: 'bg-warning/10 text-warning border-warning/20', label: 'Posponer' },
};

export function CitaDetailSheet({ cita, onClose }: { cita: Cita | null; onClose: () => void }) {
  const { isAdmin } = useUserRole();
  const actualizar = useActualizarCita();
  const atender = useAtenderCita();
  const [notas, setNotas] = useState('');

  useEffect(() => {
    setNotas(cita?.notas_administrador ?? '');
  }, [cita?.id]);

  if (!cita) return null;
  const cl = cita.clientes;
  const sol = cita.solicitudes;
  const puedeAtender = isAdmin && (cita.estado === 'programada' || cita.estado === 'confirmada');

  const handleAtender = (resultado: 'aprobar' | 'rechazar' | 'posponer') => {
    if (!notas.trim()) return;
    atender.mutate({ id: cita.id, resultado, notas_administrador: notas, solicitud_id: cita.solicitud_id });
    onClose();
  };

  const handleEstado = (estado: Cita['estado']) => {
    actualizar.mutate({ id: cita.id, estado });
  };

  return (
    <Sheet open={!!cita} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" /> {cita.numero_cita}
            </span>
            <Badge variant="outline" className={estadoBadge[cita.estado]?.class}>{estadoBadge[cita.estado]?.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Fecha y motivo */}
          <Card>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {new Date(cita.fecha_cita + 'T12:00:00').toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-muted-foreground">a las {cita.hora_cita.slice(0, 5)}</span>
              </div>
              <p><span className="text-muted-foreground">Motivo:</span> <span className="font-medium">{cita.motivo}</span></p>
            </CardContent>
          </Card>

          {/* Cliente */}
          {cl && (
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Cliente</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1 pb-3">
                <p className="font-medium">{cl.primer_nombre} {cl.primer_apellido}</p>
                <p className="text-muted-foreground">Cédula: {cl.cedula}</p>
                <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {cl.telefono}</p>
              </CardContent>
            </Card>
          )}

          {/* Solicitud vinculada */}
          {sol && (
            <Card className="border-primary/20">
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Solicitud vinculada</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1 pb-3">
                <p><span className="text-muted-foreground">Número:</span> <span className="font-mono">{sol.numero_solicitud}</span></p>
                <p><span className="text-muted-foreground">Monto:</span> <span className="font-semibold">{formatCurrency(sol.monto_solicitado)}</span></p>
                <p><span className="text-muted-foreground">Estado:</span> {sol.estado}</p>
              </CardContent>
            </Card>
          )}

          {/* Notas del oficial */}
          {cita.notas_oficial && (
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Notas del Oficial</CardTitle></CardHeader>
              <CardContent className="text-sm pb-3 whitespace-pre-wrap">{cita.notas_oficial}</CardContent>
            </Card>
          )}

          {/* Resultado si ya fue atendida */}
          {cita.estado === 'atendida' && cita.resultado && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  Resultado
                  <Badge variant="outline" className={resultadoBadge[cita.resultado].class}>{resultadoBadge[cita.resultado].label}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm pb-3 whitespace-pre-wrap">
                {cita.notas_administrador}
                {cita.fecha_atencion && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Atendida el {new Date(cita.fecha_atencion).toLocaleString('es-DO')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acciones administrador */}
          {puedeAtender && (
            <>
              <Separator />
              <Card className="border-primary/30">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Decisión del Administrador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                  <Textarea
                    rows={4}
                    placeholder="Notas y justificación de la decisión..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground flex gap-1"><AlertCircle className="h-3 w-3 mt-0.5" /> Si rechazas, la solicitud vinculada pasará a rechazada automáticamente.</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="destructive" className="gap-1" disabled={atender.isPending || !notas.trim()} onClick={() => handleAtender('rechazar')}>
                      <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                    <Button variant="outline" className="gap-1" disabled={atender.isPending || !notas.trim()} onClick={() => handleAtender('posponer')}>
                      <CalendarClock className="h-4 w-4" /> Posponer
                    </Button>
                    <Button className="gap-1 bg-success hover:bg-success/90" disabled={atender.isPending || !notas.trim()} onClick={() => handleAtender('aprobar')}>
                      <CheckCircle className="h-4 w-4" /> Aprobar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Acciones generales sobre estado */}
          {(cita.estado === 'programada' || cita.estado === 'confirmada') && (
            <div className="flex flex-wrap gap-2 justify-end">
              {cita.estado === 'programada' && (
                <Button size="sm" variant="outline" onClick={() => handleEstado('confirmada')}>Marcar como confirmada</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => handleEstado('no_asistio')}>No asistió</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleEstado('cancelada')}>Cancelar cita</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
