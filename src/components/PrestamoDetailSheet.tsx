import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, DollarSign, FileDown } from 'lucide-react';
import { usePrestamo, useCuotas, usePagos, useRegistrarPago, type Cuota } from '@/hooks/usePrestamos';
import { formatCurrency, formatDate } from '@/lib/format';
import { generarContratoPDF } from '@/lib/contratoPDF';
import { calcAmortizacion, totalCuotas } from '@/lib/amortizacion';

const estadoBadge: Record<string, string> = {
  pendiente: 'bg-warning/10 text-warning border-warning/20',
  pagada:    'bg-success/10 text-success border-success/20',
  parcial:   'bg-primary/10 text-primary border-primary/20',
  vencida:   'bg-destructive/10 text-destructive border-destructive/20',
};

const estadoPreBadge: Record<string, string> = {
  activo:    'bg-success/10 text-success border-success/20',
  en_mora:   'bg-destructive/10 text-destructive border-destructive/20',
  cancelado: 'bg-muted text-muted-foreground border-border',
};

const metodoLabel: Record<string, string> = {
  cuota_fija:     'Cuota Fija',
  interes_simple: 'Interés Simple',
  saldo_insoluto: 'Saldo Insoluto',
};

const frecuenciaLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

interface PagoForm {
  cuota_id: string;
  monto: string;
  fecha: string;
  metodo: string;
  referencia: string;
}

interface Props {
  prestamoId: string | null;
  onClose: () => void;
}

export function PrestamoDetailSheet({ prestamoId, onClose }: Props) {
  const { data: prestamo, isLoading } = usePrestamo(prestamoId ?? undefined);
  const { data: cuotas } = useCuotas(prestamoId ?? undefined);
  const { data: pagos } = usePagos(prestamoId ?? undefined);
  const registrarPago = useRegistrarPago();

  const [pagoForm, setPagoForm] = useState<PagoForm>({
    cuota_id: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'efectivo',
    referencia: '',
  });

  const cuotasPendientes = cuotas?.filter((c) => c.estado !== 'pagada') ?? [];
  const totalPagado = pagos?.reduce((s, p) => s + p.monto_pagado, 0) ?? 0;
  const totalDeuda = cuotas?.reduce((s, c) => s + c.monto_cuota, 0) ?? 0;

  const handlePago = async () => {
    if (!prestamoId || !pagoForm.cuota_id || !pagoForm.monto) return;
    await registrarPago.mutateAsync({
      prestamo_id: prestamoId,
      cuota_id: pagoForm.cuota_id,
      monto_pagado: parseFloat(pagoForm.monto),
      fecha_pago: pagoForm.fecha,
      metodo_pago: pagoForm.metodo,
      referencia: pagoForm.referencia,
    });
    setPagoForm((prev) => ({ ...prev, cuota_id: '', monto: '', referencia: '' }));
  };

  const cliente = prestamo?.clientes as any;

  return (
    <Sheet open={!!prestamoId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Detalle de Préstamo</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : prestamo ? (
          <div className="space-y-4">
            {/* Summary card */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-lg font-bold">{prestamo.numero_prestamo}</p>
                    {cliente && (
                      <p className="text-sm text-muted-foreground">
                        {cliente.primer_nombre} {cliente.primer_apellido} · {cliente.cedula}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs"
                      onClick={() => {
                        const cuotaCalc = calcAmortizacion(
                          prestamo.monto_aprobado,
                          prestamo.tasa_interes / 100,
                          prestamo.plazo_meses,
                          prestamo.frecuencia_pago,
                          prestamo.metodo_amortizacion,
                          new Date(prestamo.fecha_desembolso),
                        );
                        generarContratoPDF({
                          numero_prestamo: prestamo.numero_prestamo,
                          cliente_nombre: cliente ? `${cliente.primer_nombre} ${cliente.primer_apellido}` : 'Cliente',
                          cliente_cedula: cliente?.cedula ?? '',
                          cliente_direccion: cliente?.direccion ?? '',
                          cliente_telefono: cliente?.telefono ?? '',
                          monto_aprobado: prestamo.monto_aprobado,
                          tasa_interes: prestamo.tasa_interes,
                          plazo_meses: prestamo.plazo_meses,
                          frecuencia_pago: prestamo.frecuencia_pago,
                          metodo_amortizacion: prestamo.metodo_amortizacion,
                          fecha_desembolso: prestamo.fecha_desembolso,
                          fecha_vencimiento: prestamo.fecha_vencimiento ?? '',
                          cuota_estimada: cuotaCalc[0]?.monto_cuota ?? 0,
                          total_cuotas: totalCuotas(prestamo.plazo_meses, prestamo.frecuencia_pago),
                        });
                      }}
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Contrato PDF
                    </Button>
                    <Badge variant="outline" className={estadoPreBadge[prestamo.estado] ?? ''}>
                      {prestamo.estado.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monto</p>
                    <p className="font-semibold">{formatCurrency(prestamo.monto_aprobado)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tasa</p>
                    <p className="font-semibold">{prestamo.tasa_interes}% / mes</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plazo</p>
                    <p className="font-semibold">{prestamo.plazo_meses} meses</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frecuencia</p>
                    <p className="font-semibold">{frecuenciaLabel[prestamo.frecuencia_pago]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Método</p>
                    <p className="font-semibold">{metodoLabel[prestamo.metodo_amortizacion]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Desembolso</p>
                    <p className="font-semibold">{formatDate(prestamo.fecha_desembolso)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vencimiento</p>
                    <p className="font-semibold">{prestamo.fecha_vencimiento ? formatDate(prestamo.fecha_vencimiento) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo</p>
                    <p className="font-semibold text-destructive">{formatCurrency(Math.max(0, totalDeuda - totalPagado))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="cuotas">
              <TabsList className="w-full">
                <TabsTrigger value="cuotas" className="flex-1">Tabla de Cuotas</TabsTrigger>
                <TabsTrigger value="pago" className="flex-1">Registrar Pago</TabsTrigger>
                <TabsTrigger value="historial" className="flex-1">Historial Pagos</TabsTrigger>
              </TabsList>

              {/* Cuotas tab */}
              <TabsContent value="cuotas">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Cuota</TableHead>
                        <TableHead>Capital</TableHead>
                        <TableHead>Interés</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuotas?.map((c) => (
                        <TableRow key={c.id} className={c.estado === 'pagada' ? 'opacity-50' : ''}>
                          <TableCell className="text-muted-foreground text-xs">{c.numero_cuota}</TableCell>
                          <TableCell className="text-sm">{formatDate(c.fecha_vencimiento)}</TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrency(c.monto_cuota)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(c.capital)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(c.interes)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(c.saldo_pendiente)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${estadoBadge[c.estado] ?? ''}`}>
                              {c.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Registrar pago tab */}
              <TabsContent value="pago">
                <div className="space-y-4 pt-2">
                  <div className="grid gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cuota a pagar *</label>
                      <Select value={pagoForm.cuota_id} onValueChange={(v) => setPagoForm((p) => ({ ...p, cuota_id: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cuota pendiente" />
                        </SelectTrigger>
                        <SelectContent>
                          {cuotasPendientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              Cuota #{c.numero_cuota} — {formatDate(c.fecha_vencimiento)} — {formatCurrency(c.monto_cuota - c.monto_pagado)} pendiente
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Monto pagado (RD$) *</label>
                        <Input
                          type="number"
                          min={0}
                          value={pagoForm.monto}
                          onChange={(e) => setPagoForm((p) => ({ ...p, monto: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Fecha de pago</label>
                        <Input
                          type="date"
                          value={pagoForm.fecha}
                          onChange={(e) => setPagoForm((p) => ({ ...p, fecha: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Método de pago</label>
                        <Select value={pagoForm.metodo} onValueChange={(v) => setPagoForm((p) => ({ ...p, metodo: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Referencia</label>
                        <Input
                          placeholder="Nro. de referencia"
                          value={pagoForm.referencia}
                          onChange={(e) => setPagoForm((p) => ({ ...p, referencia: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={!pagoForm.cuota_id || !pagoForm.monto || registrarPago.isPending}
                    onClick={handlePago}
                  >
                    {registrarPago.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
                      : <><DollarSign className="h-4 w-4" /> Registrar Pago</>}
                  </Button>
                </div>
              </TabsContent>

              {/* Historial tab */}
              <TabsContent value="historial">
                {!pagos || pagos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Sin pagos registrados</p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Referencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagos.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{formatDate(p.fecha_pago)}</TableCell>
                            <TableCell className="text-sm font-medium">{formatCurrency(p.monto_pagado)}</TableCell>
                            <TableCell className="text-sm capitalize">{p.metodo_pago}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.referencia || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Préstamo no encontrado</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
