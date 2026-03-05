import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Lock, Unlock, DollarSign } from 'lucide-react';
import { useCierresCaja, useCierreAbierto, useAbrirCaja, useCerrarCaja } from '@/hooks/useCierreCaja';
import { formatCurrency, formatDate } from '@/lib/format';

export default function CierreCaja() {
  const { data: cierres, isLoading } = useCierresCaja();
  const { data: abierto } = useCierreAbierto();
  const abrirCaja = useAbrirCaja();
  const cerrarCaja = useCerrarCaja();

  const [montoApertura, setMontoApertura] = useState('');
  const [cierreForm, setCierreForm] = useState({
    monto_cierre: '', total_efectivo: '', total_transferencias: '', total_cheques: '', notas: '',
  });

  const handleAbrir = () => {
    abrirCaja.mutate({ monto_apertura: parseFloat(montoApertura) || 0 });
    setMontoApertura('');
  };

  const handleCerrar = () => {
    if (!abierto) return;
    cerrarCaja.mutate({
      cierre_id: abierto.id,
      monto_cierre: parseFloat(cierreForm.monto_cierre) || 0,
      total_efectivo: parseFloat(cierreForm.total_efectivo) || 0,
      total_transferencias: parseFloat(cierreForm.total_transferencias) || 0,
      total_cheques: parseFloat(cierreForm.total_cheques) || 0,
      notas: cierreForm.notas,
    });
    setCierreForm({ monto_cierre: '', total_efectivo: '', total_transferencias: '', total_cheques: '', notas: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6" /> Cierre de Caja
        </h1>
        <p className="text-muted-foreground">Control diario de caja para cajeros</p>
      </div>

      {/* Current state */}
      {!abierto ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Abrir Caja</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-1 block">Monto de Apertura (RD$)</label>
                <Input type="number" value={montoApertura} onChange={(e) => setMontoApertura(e.target.value)} placeholder="0.00" />
              </div>
              <Button onClick={handleAbrir} disabled={abrirCaja.isPending} className="gap-2">
                <Unlock className="h-4 w-4" /> Abrir Caja
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge className="bg-success/10 text-success border-success/20">Caja Abierta</Badge>
              Apertura: {formatCurrency(abierto.monto_apertura)} — {formatDate(abierto.fecha)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Efectivo Recibido</label>
                <Input type="number" value={cierreForm.total_efectivo} onChange={(e) => setCierreForm((p) => ({ ...p, total_efectivo: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Transferencias</label>
                <Input type="number" value={cierreForm.total_transferencias} onChange={(e) => setCierreForm((p) => ({ ...p, total_transferencias: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cheques</label>
                <Input type="number" value={cierreForm.total_cheques} onChange={(e) => setCierreForm((p) => ({ ...p, total_cheques: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Monto en Caja al Cierre</label>
                <Input type="number" value={cierreForm.monto_cierre} onChange={(e) => setCierreForm((p) => ({ ...p, monto_cierre: e.target.value }))} />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Notas</label>
              <Textarea value={cierreForm.notas} onChange={(e) => setCierreForm((p) => ({ ...p, notas: e.target.value }))} rows={2} />
            </div>
            <Button onClick={handleCerrar} disabled={cerrarCaja.isPending} variant="destructive" className="gap-2">
              <Lock className="h-4 w-4" /> Cerrar Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Historial de Cierres</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Efectivo</TableHead>
                  <TableHead>Transf.</TableHead>
                  <TableHead>Cheques</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Diferencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierres?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{formatDate(c.fecha)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(c.monto_apertura)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(c.total_efectivo)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(c.total_transferencias)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(c.total_cheques)}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(c.monto_cierre)}</TableCell>
                    <TableCell className={`text-sm font-semibold ${c.diferencia < 0 ? 'text-destructive' : c.diferencia > 0 ? 'text-success' : ''}`}>
                      {formatCurrency(c.diferencia)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.estado === 'abierto' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                        {c.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
