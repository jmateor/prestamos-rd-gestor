import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign } from 'lucide-react';
import { useRegistrarPago } from '@/hooks/usePrestamos';
import { formatCurrency, formatDate } from '@/lib/format';
import type { CuotaCobranza } from '@/hooks/useCobranza';

interface Props {
  cuota: CuotaCobranza | null;
  onClose: () => void;
}

export function PagoRapidoDialog({ cuota, onClose }: Props) {
  const registrar = useRegistrarPago();

  const pendiente = cuota ? cuota.monto_cuota - cuota.monto_pagado : 0;

  const [form, setForm] = useState({
    monto: pendiente > 0 ? pendiente.toFixed(2) : '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'efectivo',
    referencia: '',
  });

  // Auto-fill monto when cuota changes
  const prevCuotaId = useState<string | null>(null);
  if (cuota && cuota.id !== prevCuotaId[0]) {
    prevCuotaId[1](cuota.id);
    setForm((p) => ({ ...p, monto: (cuota.monto_cuota - cuota.monto_pagado).toFixed(2) }));
  }
  if (!cuota && prevCuotaId[0]) {
    prevCuotaId[1](null);
  }

  const handleSubmit = async () => {
    if (!cuota || !form.monto) return;
    await registrar.mutateAsync({
      prestamo_id: cuota.prestamo_id,
      cuota_id: cuota.id,
      monto_pagado: parseFloat(form.monto),
      fecha_pago: form.fecha,
      metodo_pago: form.metodo,
      referencia: form.referencia,
    });
    onClose();
  };

  const pre = cuota?.prestamos;
  const cliente = pre?.clientes;

  return (
    <Dialog open={!!cuota} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago Rápido</DialogTitle>
        </DialogHeader>

        {cuota && (
          <div className="space-y-4">
            {/* Info cuota */}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Préstamo</span>
                <span className="font-mono font-medium">{pre?.numero_prestamo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">
                  {cliente ? `${cliente.primer_nombre} ${cliente.primer_apellido}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cuota #{cuota.numero_cuota}</span>
                <span>{formatDate(cuota.fecha_vencimiento)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-muted-foreground">Pendiente</span>
                <span className="text-destructive">{formatCurrency(pendiente)}</span>
              </div>
            </div>

            {/* Form */}
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Monto (RD$) *</label>
                  <Input
                    type="number"
                    min={0}
                    max={pendiente}
                    placeholder={pendiente.toFixed(2)}
                    value={form.monto}
                    onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fecha</label>
                  <Input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Método</label>
                  <Select value={form.metodo} onValueChange={(v) => setForm((p) => ({ ...p, metodo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="deposito">Depósito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Referencia</label>
                  <Input
                    placeholder="Nro. referencia"
                    value={form.referencia}
                    onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!form.monto || registrar.isPending}
                onClick={handleSubmit}
              >
                {registrar.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
                  : <><DollarSign className="h-4 w-4" /> Registrar</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
