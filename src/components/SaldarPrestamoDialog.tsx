import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSaldarPrestamo, type LiquidacionCalc } from '@/hooks/useLiquidacion';
import { formatCurrency, formatDate } from '@/lib/format';

interface Props {
  prestamoId: string | null;
  numeroPrestamo?: string;
  clienteNombre?: string;
  onClose: () => void;
}

export function SaldarPrestamoDialog({ prestamoId, numeroPrestamo, clienteNombre, onClose }: Props) {
  const { calcular, saldar, isCalculando, isSaldando } = useSaldarPrestamo();
  const [liquidacion, setLiquidacion] = useState<LiquidacionCalc | null>(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'efectivo',
    referencia: '',
  });

  useEffect(() => {
    if (prestamoId) {
      calcular(prestamoId).then(setLiquidacion).catch(() => setLiquidacion(null));
    } else {
      setLiquidacion(null);
    }
  }, [prestamoId]);

  const handleSaldar = async () => {
    if (!prestamoId || !liquidacion) return;
    await saldar({
      prestamo_id: prestamoId,
      monto_total: liquidacion.total,
      fecha_pago: form.fecha,
      metodo_pago: form.metodo,
      referencia: form.referencia,
    });
    onClose();
  };

  return (
    <Dialog open={!!prestamoId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Saldar Préstamo Completo
          </DialogTitle>
        </DialogHeader>

        {isCalculando ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : liquidacion ? (
          <div className="space-y-4">
            {/* Info préstamo */}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Préstamo</span>
                <span className="font-mono font-medium">{numeroPrestamo ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{clienteNombre ?? '—'}</span>
              </div>
            </div>

            {/* Desglose */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-semibold">Desglose de Liquidación</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capital pendiente</span>
                  <span className="font-medium">{formatCurrency(liquidacion.capital_pendiente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interés pendiente</span>
                  <span className="font-medium">{formatCurrency(liquidacion.interes_pendiente)}</span>
                </div>
                {liquidacion.mora_total > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Mora acumulada ({liquidacion.cuotas_vencidas} cuota{liquidacion.cuotas_vencidas !== 1 ? 's' : ''} vencida{liquidacion.cuotas_vencidas !== 1 ? 's' : ''})
                    </span>
                    <span className="font-medium">{formatCurrency(liquidacion.mora_total)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total a Saldar</span>
                  <span className="text-primary">{formatCurrency(liquidacion.total)}</span>
                </div>
              </div>
            </div>

            {/* Cuotas pendientes info */}
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {liquidacion.cuotas_pendientes} cuota{liquidacion.cuotas_pendientes !== 1 ? 's' : ''} pendiente{liquidacion.cuotas_pendientes !== 1 ? 's' : ''}
              </Badge>
              {liquidacion.cuotas_vencidas > 0 && (
                <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                  {liquidacion.cuotas_vencidas} vencida{liquidacion.cuotas_vencidas !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Datos del pago */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Fecha</label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                />
              </div>
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
                  placeholder="Nro. ref"
                  value={form.referencia}
                  onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={isSaldando}
                onClick={handleSaldar}
              >
                {isSaldando
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                  : <><CheckCircle className="h-4 w-4" /> Confirmar Saldo</>}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No se pudo calcular la liquidación
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
