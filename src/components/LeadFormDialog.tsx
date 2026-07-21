import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateLead, useUpdateLead, ETAPAS_LEAD, ORIGENES_LEAD, type Lead } from '@/hooks/useLeads';

interface Props {
  trigger?: React.ReactNode;
  lead?: Lead | null;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

const empty = {
  nombre_completo: '', cedula: '', telefono: '', email: '', ciudad: '',
  origen: 'referido', etapa: 'nuevo' as const, monto_estimado: '', proposito: '', notas: '',
};

export function LeadFormDialog({ trigger, lead, open: openProp, onOpenChange }: Props) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const crear = useCreateLead();
  const actualizar = useUpdateLead();
  const [form, setForm] = useState<any>(empty);

  useEffect(() => {
    if (lead) {
      setForm({
        nombre_completo: lead.nombre_completo, cedula: lead.cedula ?? '', telefono: lead.telefono ?? '',
        email: lead.email ?? '', ciudad: lead.ciudad ?? '', origen: lead.origen, etapa: lead.etapa,
        monto_estimado: lead.monto_estimado?.toString() ?? '', proposito: lead.proposito ?? '', notas: lead.notas ?? '',
      });
    } else if (open) setForm(empty);
  }, [lead, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, monto_estimado: form.monto_estimado ? parseFloat(form.monto_estimado) : null };
    if (lead) await actualizar.mutateAsync({ id: lead.id, data: payload });
    else await crear.mutateAsync(payload);
    setOpen(false);
  };

  const loading = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{lead ? 'Editar Lead' : 'Nuevo Lead'}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Nombre completo *</Label>
            <Input required value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cédula</Label><Input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Ciudad</Label><Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></div>
            <div>
              <Label>Origen</Label>
              <Select value={form.origen} onValueChange={(v) => setForm({ ...form, origen: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENES_LEAD.map((o) => <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Etapa</Label>
              <Select value={form.etapa} onValueChange={(v) => setForm({ ...form, etapa: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ETAPAS_LEAD.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Monto estimado (RD$)</Label><Input type="number" step="0.01" value={form.monto_estimado} onChange={(e) => setForm({ ...form, monto_estimado: e.target.value })} /></div>
            <div><Label>Propósito</Label><Input value={form.proposito} onChange={(e) => setForm({ ...form, proposito: e.target.value })} placeholder="Capital, vehículo, etc." /></div>
          </div>
          <div><Label>Notas</Label><Textarea rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {lead ? 'Guardar' : 'Crear Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
