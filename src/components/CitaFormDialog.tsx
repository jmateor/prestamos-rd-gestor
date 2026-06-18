import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { useCrearCita, useAdministradores } from '@/hooks/useCitas';
import { useClientes } from '@/hooks/useClientes';
import { useHorariosEmpresa, validarHorarioCita } from '@/hooks/useConfiguracion';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface Props {
  trigger?: React.ReactNode;
  defaultClienteId?: string;
  defaultSolicitudId?: string;
  defaultClienteNombre?: string;
  defaultSolicitudNumero?: string;
  onCreated?: () => void;
}

export function CitaFormDialog({
  trigger,
  defaultClienteId,
  defaultSolicitudId,
  defaultClienteNombre,
  defaultSolicitudNumero,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const crear = useCrearCita();
  const { data: clientes } = useClientes('');
  const { data: admins } = useAdministradores();
  const { data: horarios } = useHorariosEmpresa();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    cliente_id: defaultClienteId ?? '',
    solicitud_id: defaultSolicitudId ?? '',
    asignada_a: '',
    fecha_cita: today,
    hora_cita: '09:00',
    motivo: 'Pre-aprobación de solicitud',
    notas_oficial: '',
  });

  useEffect(() => {
    if (open) {
      setForm((p) => ({
        ...p,
        cliente_id: defaultClienteId ?? p.cliente_id,
        solicitud_id: defaultSolicitudId ?? p.solicitud_id,
      }));
    }
  }, [open, defaultClienteId, defaultSolicitudId]);

  const horarioError = validarHorarioCita(form.fecha_cita, form.hora_cita, horarios);

  const handleSubmit = async () => {
    if (!form.cliente_id) return toast.error('Selecciona un cliente');
    if (!form.fecha_cita || !form.hora_cita) return toast.error('Fecha y hora requeridas');
    if (!form.motivo.trim()) return toast.error('Indica el motivo');
    if (horarioError) return toast.error(horarioError);

    await crear.mutateAsync({
      cliente_id: form.cliente_id,
      solicitud_id: form.solicitud_id || null,
      asignada_a: form.asignada_a || null,
      fecha_cita: form.fecha_cita,
      hora_cita: form.hora_cita,
      motivo: form.motivo,
      notas_oficial: form.notas_oficial,
    });
    setOpen(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-1.5"><CalendarPlus className="h-4 w-4" /> Nueva Cita</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Programar Cita con Administrador</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Cliente */}
          <div>
            <Label className="text-xs">Cliente *</Label>
            {defaultClienteId && defaultClienteNombre ? (
              <Input value={defaultClienteNombre} disabled />
            ) : (
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.primer_nombre} {c.primer_apellido} — {c.cedula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {defaultSolicitudNumero && (
            <div>
              <Label className="text-xs">Solicitud vinculada</Label>
              <Input value={defaultSolicitudNumero} disabled />
            </div>
          )}

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Fecha *</Label>
              <Input type="date" value={form.fecha_cita} min={today} onChange={(e) => setForm({ ...form, fecha_cita: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Hora *</Label>
              <Input type="time" value={form.hora_cita} onChange={(e) => setForm({ ...form, hora_cita: e.target.value })} />
            </div>
          </div>
          {horarioError && (
            <div className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{horarioError}</span>
            </div>
          )}



          {/* Administrador */}
          <div>
            <Label className="text-xs">Administrador asignado</Label>
            <Select value={form.asignada_a} onValueChange={(v) => setForm({ ...form, asignada_a: v })}>
              <SelectTrigger><SelectValue placeholder="Cualquier administrador" /></SelectTrigger>
              <SelectContent>
                {admins?.map((a) => (
                  <SelectItem key={a.user_id} value={a.user_id}>{a.full_name || a.user_id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo */}
          <div>
            <Label className="text-xs">Motivo *</Label>
            <Select value={form.motivo} onValueChange={(v) => setForm({ ...form, motivo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pre-aprobación de solicitud">Pre-aprobación de solicitud</SelectItem>
                <SelectItem value="Revisión de garantía">Revisión de garantía</SelectItem>
                <SelectItem value="Validación de ingresos">Validación de ingresos</SelectItem>
                <SelectItem value="Renegociación de pago">Renegociación de pago</SelectItem>
                <SelectItem value="Entrevista con cliente">Entrevista con cliente</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas del oficial */}
          <div>
            <Label className="text-xs">Notas para el administrador</Label>
            <Textarea
              rows={3}
              placeholder="Indica al admin qué necesitas que evalúe del cliente..."
              value={form.notas_oficial}
              onChange={(e) => setForm({ ...form, notas_oficial: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={crear.isPending || !!horarioError} className="gap-1.5">
              {crear.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Programar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
