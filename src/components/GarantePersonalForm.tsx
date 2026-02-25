import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateGarantePersonal } from '@/hooks/useGarantias';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GarantePersonalForm({ open, onClose }: Props) {
  const createGarante = useCreateGarantePersonal();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [lugarTrabajo, setLugarTrabajo] = useState('');
  const [cargo, setCargo] = useState('');
  const [ingresoMensual, setIngresoMensual] = useState('');
  const [relacion, setRelacion] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: clientes } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, primer_nombre, primer_apellido, cedula').eq('estado', 'activo').order('primer_nombre');
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !cedula.trim() || !telefono.trim()) return;
    setSaving(true);
    try {
      await createGarante.mutateAsync({
        nombre_completo: nombreCompleto,
        cedula, telefono, telefono2, email,
        direccion, lugar_trabajo: lugarTrabajo, cargo,
        ingreso_mensual: ingresoMensual ? parseFloat(ingresoMensual) : 0,
        relacion,
        cliente_id: clienteId || null,
        notas,
      } as any);
      onClose();
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNombreCompleto(''); setCedula(''); setTelefono(''); setTelefono2('');
    setEmail(''); setDireccion(''); setLugarTrabajo(''); setCargo('');
    setIngresoMensual(''); setRelacion(''); setClienteId(''); setNotas('');
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Garante Personal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre Completo *</Label>
            <Input value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cédula *</Label>
              <Input value={cedula} onChange={e => setCedula(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono *</Label>
              <Input value={telefono} onChange={e => setTelefono(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Teléfono 2</Label>
              <Input value={telefono2} onChange={e => setTelefono2(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input value={direccion} onChange={e => setDireccion(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Lugar de Trabajo</Label>
              <Input value={lugarTrabajo} onChange={e => setLugarTrabajo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input value={cargo} onChange={e => setCargo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ingreso Mensual (RD$)</Label>
              <Input type="number" step="0.01" value={ingresoMensual} onChange={e => setIngresoMensual(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Relación con el Cliente</Label>
              <Input value={relacion} onChange={e => setRelacion(e.target.value)} placeholder="Ej: Hermano, Amigo" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cliente Asociado (opcional)</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Sin cliente" /></SelectTrigger>
              <SelectContent>
                {clientes?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.primer_nombre} {c.primer_apellido} - {c.cedula}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { onClose(); resetForm(); }}>Cancelar</Button>
            <Button type="submit" disabled={saving || !nombreCompleto.trim() || !cedula.trim() || !telefono.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Guardar Garante
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
