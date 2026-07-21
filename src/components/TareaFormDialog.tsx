import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateTarea, useUpdateTarea, PRIORIDADES, ESTADOS_TAREA, type Tarea } from '@/hooks/useTareas';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  trigger?: React.ReactNode;
  tarea?: Tarea | null;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  defaults?: Partial<Tarea>;
}

export function TareaFormDialog({ trigger, tarea, open: openProp, onOpenChange, defaults }: Props) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const { user } = useAuth();
  const crear = useCreateTarea();
  const actualizar = useUpdateTarea();

  const [form, setForm] = useState<any>({
    titulo: '', descripcion: '', prioridad: 'media', estado: 'pendiente',
    fecha_vencimiento: '', asignado_a: user?.id ?? '',
  });

  useEffect(() => {
    if (tarea) {
      setForm({
        titulo: tarea.titulo, descripcion: tarea.descripcion ?? '',
        prioridad: tarea.prioridad, estado: tarea.estado,
        fecha_vencimiento: tarea.fecha_vencimiento ? tarea.fecha_vencimiento.slice(0, 16) : '',
        asignado_a: tarea.asignado_a ?? user?.id ?? '',
      });
    } else if (open) {
      setForm({
        titulo: '', descripcion: '', prioridad: 'media', estado: 'pendiente',
        fecha_vencimiento: '', asignado_a: user?.id ?? '',
      });
    }
  }, [tarea, open, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      ...form,
      fecha_vencimiento: form.fecha_vencimiento ? new Date(form.fecha_vencimiento).toISOString() : null,
      ...(defaults ?? {}),
    };
    if (tarea) await actualizar.mutateAsync({ id: tarea.id, data: payload });
    else await crear.mutateAsync(payload);
    setOpen(false);
  };

  const loading = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{tarea ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Título *</Label><Input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
          <div><Label>Descripción</Label><Textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridad</Label>
              <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORIDADES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS_TAREA.map((p) => <SelectItem key={p} value={p}>{p.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Fecha de vencimiento</Label>
            <Input type="datetime-local" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {tarea ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
