import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, UserCheck, UserX, Trash2, CreditCard, FileText, Users, Briefcase, DollarSign, AlertTriangle, Ban, MapPin, ShieldCheck } from 'lucide-react';
import type { Cliente } from '@/hooks/useClientes';
import { useUpdateCliente, useDeleteCliente } from '@/hooks/useClientes';
import { useHistorialCliente } from '@/hooks/useHistorialCliente';
import { usePerfilCrediticio, useReferencias, useDependientes, useConyuge } from '@/hooks/useClienteProfile';
import { useClienteGarantias } from '@/hooks/useSolicitudes';
import { formatCurrency, formatDate } from '@/lib/format';
import { ClienteEditFormDialog } from '@/components/ClienteEditFormDialog';
import { ClienteDocumentosTab } from '@/components/ClienteDocumentosTab';
import { ClienteReferenciasTab } from '@/components/ClienteReferenciasTab';
import { CreditScoreIndicator } from '@/components/CreditScoreIndicator';
import { ClienteRiskAlert } from '@/components/ClienteRiskAlert';

const estadoBadge: Record<string, string> = {
  activo: 'bg-success/10 text-success border-success/20',
  inactivo: 'bg-muted text-muted-foreground border-muted',
  bloqueado: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface Props {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteProfileSheet({ cliente, open, onOpenChange }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();
  const { prestamos } = useHistorialCliente(cliente?.id);
  const { data: perfil } = usePerfilCrediticio(cliente?.id);
  const { data: referencias } = useReferencias(cliente?.id);
  const { data: dependientes } = useDependientes(cliente?.id);
  const { data: conyuge } = useConyuge(cliente?.id);
  const { data: garantias } = useClienteGarantias(cliente?.id);

  if (!cliente) return null;

  const fullName = `${cliente.primer_nombre} ${cliente.segundo_nombre || ''} ${cliente.primer_apellido} ${cliente.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
  const initials = `${cliente.primer_nombre[0]}${cliente.primer_apellido[0]}`.toUpperCase();

  const handleEstado = async (estado: string) => {
    await updateCliente.mutateAsync({ id: cliente.id, data: { estado } });
  };

  const handleDelete = async () => {
    await deleteCliente.mutateAsync(cliente.id);
    onOpenChange(false);
  };

  const captureGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este navegador');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateCliente.mutateAsync({
          id: cliente.id,
          data: { latitud: pos.coords.latitude, longitud: pos.coords.longitude } as any,
        });
      },
      (err) => alert('Error al obtener ubicación: ' + err.message)
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={cliente.foto || undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-xl">{fullName}</SheetTitle>
                <p className="text-sm text-muted-foreground">{cliente.cedula} · {cliente.telefono}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={estadoBadge[cliente.estado] || ''}>
                    {cliente.estado}
                  </Badge>
                  {cliente.credit_score != null && (
                    <CreditScoreIndicator clienteId={cliente.id} compact />
                  )}
                </div>
              </div>
            </div>
            
            {/* Risk Alert */}
            <ClienteRiskAlert clienteId={cliente.id} />

            {/* Admin actions */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditOpen(true)}>
                <Edit className="h-3 w-3" /> Editar
              </Button>
              {cliente.estado !== 'activo' && (
                <Button size="sm" variant="outline" className="gap-1 text-success" onClick={() => handleEstado('activo')}>
                  <UserCheck className="h-3 w-3" /> Activar
                </Button>
              )}
              {cliente.estado === 'activo' && (
                <Button size="sm" variant="outline" className="gap-1 text-warning" onClick={() => handleEstado('inactivo')}>
                  <UserX className="h-3 w-3" /> Desactivar
                </Button>
              )}
              {cliente.estado !== 'bloqueado' && (
                <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleEstado('bloqueado')}>
                  <Ban className="h-3 w-3" /> Bloquear
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-1">
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el registro de {fullName}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </SheetHeader>

          <Tabs defaultValue="resumen" className="mt-4">
            <TabsList className="grid w-full grid-cols-6 text-xs">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="referencias">Familia</TabsTrigger>
              <TabsTrigger value="documentos">Docs</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="crediticio">Crédito</TabsTrigger>
            </TabsList>

            {/* ── Resumen ── */}
            <TabsContent value="resumen" className="space-y-4 mt-4">
              {/* Credit Score */}
              <CreditScoreIndicator clienteId={cliente.id} />

              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={<DollarSign className="h-4 w-4" />} label="Ingreso Mensual" value={formatCurrency(cliente.ingreso_mensual || 0)} />
                <InfoCard icon={<DollarSign className="h-4 w-4" />} label="Otros Ingresos" value={formatCurrency(cliente.otros_ingresos || 0)} />
                <InfoCard icon={<CreditCard className="h-4 w-4" />} label="Préstamos Activos" value={String(perfil?.prestamos_activos ?? 0)} />
                <InfoCard icon={<AlertTriangle className="h-4 w-4" />} label="Cuotas Vencidas" value={String(perfil?.cuotas_vencidas ?? 0)} />
              </div>
              
              {cliente.banco_nombre && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium">Información Bancaria</p>
                    <p className="text-sm text-muted-foreground">{cliente.banco_nombre} — {cliente.numero_cuenta || 'Sin cuenta'}</p>
                  </CardContent>
                </Card>
              )}

              {/* Geolocation */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium flex items-center gap-1"><MapPin className="h-4 w-4" /> Ubicación</p>
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={captureGeolocation}>
                      <MapPin className="h-3 w-3" /> Capturar GPS
                    </Button>
                  </div>
                  {cliente.latitud && cliente.longitud ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">Lat: {cliente.latitud}, Lng: {cliente.longitud}</p>
                      <iframe
                        className="w-full h-40 rounded-lg border"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${cliente.latitud},${cliente.longitud}&zoom=16`}
                        allowFullScreen
                        loading="lazy"
                      />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin ubicación registrada. Use "Capturar GPS" para obtener la ubicación.</p>
                  )}
                </CardContent>
              </Card>

              {cliente.notas && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium">Notas</p>
                    <p className="text-sm text-muted-foreground">{cliente.notas}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Personal ── */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Datos Personales</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Nombre" value={fullName} />
                  <Field label="Cédula" value={cliente.cedula} />
                  <Field label="Fecha Nacimiento" value={cliente.fecha_nacimiento ? formatDate(cliente.fecha_nacimiento) : '—'} />
                  <Field label="Sexo" value={cliente.sexo === 'M' ? 'Masculino' : cliente.sexo === 'F' ? 'Femenino' : '—'} />
                  <Field label="Estado Civil" value={cliente.estado_civil || '—'} />
                  <Field label="Nacionalidad" value={cliente.nacionalidad || '—'} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Contacto</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Teléfono" value={cliente.telefono} />
                  <Field label="Teléfono 2" value={cliente.telefono2 || '—'} />
                  <Field label="Email" value={cliente.email || '—'} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Dirección</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Dirección" value={cliente.direccion || '—'} />
                  <Field label="Sector" value={cliente.sector || '—'} />
                  <Field label="Ciudad" value={cliente.ciudad || '—'} />
                  <Field label="Provincia" value={cliente.provincia || '—'} />
                  <Field label="Tipo Vivienda" value={cliente.tipo_vivienda || '—'} />
                  <Field label="Referencia" value={cliente.referencia_direccion || '—'} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Información Laboral</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <Field label="Lugar de Trabajo" value={cliente.lugar_trabajo || '—'} />
                  <Field label="Cargo" value={cliente.cargo || '—'} />
                  <Field label="Dirección Trabajo" value={cliente.direccion_trabajo || '—'} />
                  <Field label="Teléfono Trabajo" value={cliente.telefono_trabajo || '—'} />
                  <Field label="Antigüedad" value={cliente.antiguedad_laboral || '—'} />
                  <Field label="Ingreso Mensual" value={formatCurrency(cliente.ingreso_mensual || 0)} />
                  <Field label="Otros Ingresos" value={formatCurrency(cliente.otros_ingresos || 0)} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Familia / Referencias ── */}
            <TabsContent value="referencias" className="mt-4">
              <ClienteReferenciasTab
                clienteId={cliente.id}
                conyuge={conyuge}
                dependientes={dependientes ?? []}
                referencias={referencias ?? []}
              />
            </TabsContent>

            {/* ── Documentos ── */}
            <TabsContent value="documentos" className="mt-4">
              <ClienteDocumentosTab cliente={cliente} />
            </TabsContent>

            {/* ── Historial ── */}
            <TabsContent value="historial" className="space-y-3 mt-4">
              {!prestamos.data?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin préstamos registrados</p>
              ) : (
                prestamos.data.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.numero_prestamo}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.fecha_desembolso)} · {formatCurrency(p.monto_aprobado)}</p>
                      </div>
                      <Badge variant="outline" className={p.estado === 'activo' ? 'text-success' : p.estado === 'saldado' ? 'text-primary' : 'text-destructive'}>
                        {p.estado}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* ── Perfil Crediticio ── */}
            <TabsContent value="crediticio" className="space-y-4 mt-4">
              <CreditScoreIndicator clienteId={cliente.id} />
              
              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={<FileText className="h-4 w-4" />} label="Solicitudes Totales" value={String(perfil?.total_solicitudes ?? 0)} />
                <InfoCard icon={<UserCheck className="h-4 w-4" />} label="Aprobadas" value={String(perfil?.solicitudes_aprobadas ?? 0)} />
                <InfoCard icon={<Ban className="h-4 w-4" />} label="Rechazadas" value={String(perfil?.solicitudes_rechazadas ?? 0)} />
                <InfoCard icon={<CreditCard className="h-4 w-4" />} label="Préstamos Totales" value={String(perfil?.total_prestamos ?? 0)} />
                <InfoCard icon={<DollarSign className="h-4 w-4" />} label="Monto Total Prestado" value={formatCurrency(perfil?.monto_total_prestado ?? 0)} />
                <InfoCard icon={<Briefcase className="h-4 w-4" />} label="Saldados" value={String(perfil?.prestamos_saldados ?? 0)} />
              </div>
              {perfil?.rechazos && perfil.rechazos.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">Solicitudes Rechazadas</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {perfil.rechazos.map((r) => (
                      <div key={r.id} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <p className="text-muted-foreground">{r.motivo}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {editOpen && (
        <ClienteEditFormDialog
          cliente={cliente}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3 flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
