import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, DollarSign, FileDown, FileText, RotateCcw, CreditCard, PenTool } from 'lucide-react';
import { usePrestamo, useCuotas, usePagos, useRegistrarPago, type Cuota } from '@/hooks/usePrestamos';
import { useHistorialCliente } from '@/hooks/useHistorialCliente';
import { useReversarPago } from '@/hooks/useAuditLog';
import { formatCurrency, formatDate } from '@/lib/format';
import { generarContratoPDF } from '@/lib/contratoPDF';
import { generarCronogramaPDF } from '@/lib/cronogramaPDF';
import { generarEstadoCuentaPDF } from '@/lib/estadoCuentaPDF';
import { calcAmortizacion, totalCuotas } from '@/lib/amortizacion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SignaturePad } from '@/components/SignaturePad';

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
  const reversarPago = useReversarPago();

  const [pagoForm, setPagoForm] = useState<PagoForm>({
    cuota_id: '', monto: '', fecha: new Date().toISOString().split('T')[0], metodo: 'efectivo', referencia: '',
  });
  const [reversoMotivo, setReversoMotivo] = useState('');
  const [reversoId, setReversoId] = useState<string | null>(null);
  const [abonoForm, setAbonoForm] = useState({ monto: '', fecha: new Date().toISOString().split('T')[0], metodo: 'efectivo', referencia: '' });
  const [firmaCliente, setFirmaCliente] = useState<string | null>(null);
  const [showFirma, setShowFirma] = useState(false);

  const cliente = prestamo?.clientes as any;

  // Fetch garante & garantia for contract
  const { data: garante } = useQuery({
    queryKey: ['garante-prestamo', prestamoId],
    enabled: !!prestamoId,
    queryFn: async () => {
      const { data } = await supabase.from('garantes_personales').select('*').eq('prestamo_id', prestamoId!).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: garantia } = useQuery({
    queryKey: ['garantia-prestamo', prestamoId],
    enabled: !!prestamoId,
    queryFn: async () => {
      const { data } = await supabase.from('garantias_prendarias').select('*').eq('prestamo_id', prestamoId!).limit(1).maybeSingle();
      return data;
    },
  });

  // Client history
  const { prestamos: histPrestamos, pagos: histPagos } = useHistorialCliente(cliente?.id ?? prestamo?.cliente_id);

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

  const handleReverso = async () => {
    if (!reversoId || !reversoMotivo.trim()) return;
    try {
      await reversarPago.mutateAsync({ pago_id: reversoId, motivo: reversoMotivo });
      toast.success('Pago reversado exitosamente');
      setReversoId(null);
      setReversoMotivo('');
    } catch (e: any) {
      toast.error('Error al reversar: ' + e.message);
    }
  };

  const handleAbono = async () => {
    if (!prestamoId || !abonoForm.monto) return;
    // Find first pending cuota
    const cuota = cuotasPendientes[0];
    if (!cuota) { toast.error('No hay cuotas pendientes'); return; }
    await registrarPago.mutateAsync({
      prestamo_id: prestamoId,
      cuota_id: cuota.id,
      monto_pagado: parseFloat(abonoForm.monto),
      fecha_pago: abonoForm.fecha,
      metodo_pago: abonoForm.metodo,
      referencia: abonoForm.referencia || 'Abono extraordinario',
      notas: 'Abono extraordinario al capital',
    });
    setAbonoForm({ monto: '', fecha: new Date().toISOString().split('T')[0], metodo: 'efectivo', referencia: '' });
    toast.success('Abono extraordinario registrado');
  };

  const buildContractData = () => {
    if (!prestamo) return null;
    const cuotaCalc = calcAmortizacion(
      prestamo.monto_aprobado, prestamo.tasa_interes / 100, prestamo.plazo_meses,
      prestamo.frecuencia_pago, prestamo.metodo_amortizacion, new Date(prestamo.fecha_desembolso),
    );
    return {
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
      garante: garante ? {
        nombre_completo: garante.nombre_completo,
        cedula: garante.cedula,
        telefono: garante.telefono,
        direccion: garante.direccion ?? '',
        relacion: garante.relacion ?? '',
      } : null,
      garantia: garantia ? {
        tipo: garantia.tipo,
        descripcion: garantia.descripcion,
        marca: garantia.marca ?? undefined,
        modelo: garantia.modelo ?? undefined,
        valor_estimado: garantia.valor_estimado ?? undefined,
        numero_placa: garantia.numero_placa ?? undefined,
        numero_chasis: garantia.numero_chasis ?? undefined,
      } : null,
      cuotas: cuotaCalc.map((c) => ({
        numero_cuota: c.numero_cuota,
        fecha_vencimiento: c.fecha_vencimiento.toISOString().split('T')[0],
        capital: c.capital,
        interes: c.interes,
        monto_cuota: c.monto_cuota,
        saldo_pendiente: c.saldo_pendiente,
      })),
    };
  };

  const handleCronogramaPDF = () => {
    if (!prestamo || !cuotas) return;
    generarCronogramaPDF({
      numero_prestamo: prestamo.numero_prestamo,
      cliente_nombre: cliente ? `${cliente.primer_nombre} ${cliente.primer_apellido}` : 'Cliente',
      cliente_cedula: cliente?.cedula ?? '',
      monto_aprobado: prestamo.monto_aprobado,
      tasa_interes: prestamo.tasa_interes,
      plazo_meses: prestamo.plazo_meses,
      frecuencia_pago: prestamo.frecuencia_pago,
      metodo_amortizacion: prestamo.metodo_amortizacion,
      fecha_desembolso: prestamo.fecha_desembolso,
      cuotas: cuotas.map((c) => ({
        numero_cuota: c.numero_cuota,
        fecha_vencimiento: c.fecha_vencimiento,
        capital: c.capital,
        interes: c.interes,
        mora: c.mora ?? 0,
        monto_cuota: c.monto_cuota,
        saldo_pendiente: c.saldo_pendiente,
      })),
    });
  };

  const handleEstadoCuenta = () => {
    if (!cliente || !histPrestamos.data || !histPagos.data) return;
    const today = new Date().toISOString().split('T')[0];
    generarEstadoCuentaPDF({
      cliente_nombre: `${cliente.primer_nombre} ${cliente.primer_apellido}`,
      cliente_cedula: cliente.cedula,
      cliente_telefono: cliente.telefono,
      cliente_direccion: cliente.direccion ?? '',
      prestamos: histPrestamos.data.map((p) => ({
        numero_prestamo: p.numero_prestamo,
        monto_aprobado: p.monto_aprobado,
        tasa_interes: p.tasa_interes,
        estado: p.estado,
        fecha_desembolso: p.fecha_desembolso,
        total_pagado: 0, saldo_pendiente: 0, cuotas_pagadas: 0, cuotas_total: 0, cuotas_vencidas: 0,
      })),
      pagos: histPagos.data.map((p) => ({
        fecha: p.fecha_pago,
        monto: p.monto_pagado,
        metodo: p.metodo_pago,
        prestamo: p.prestamos?.numero_prestamo ?? '',
        referencia: p.referencia ?? '',
      })),
    });
  };

  return (
    <Sheet open={!!prestamoId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
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
                  <Badge variant="outline" className={estadoPreBadge[prestamo.estado] ?? ''}>
                    {prestamo.estado.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Download buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => {
                    const d = buildContractData();
                    if (d) generarContratoPDF({ ...d, firma_cliente: firmaCliente ?? undefined });
                  }}>
                    <FileDown className="h-3.5 w-3.5" /> Contrato PDF
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleCronogramaPDF}>
                    <FileText className="h-3.5 w-3.5" /> Cronograma PDF
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleEstadoCuenta}>
                    <FileText className="h-3.5 w-3.5" /> Estado de Cuenta
                  </Button>
                  <Button
                    size="sm"
                    variant={firmaCliente ? 'default' : 'outline'}
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => setShowFirma(!showFirma)}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    {firmaCliente ? 'Firma ✓' : 'Firmar Contrato'}
                  </Button>
                </div>

                {showFirma && (
                  <div className="mb-3">
                    <SignaturePad onSave={(dataUrl) => {
                      setFirmaCliente(dataUrl);
                      setShowFirma(false);
                      toast.success('Firma capturada correctamente');
                    }} />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-muted-foreground">Monto</p><p className="font-semibold">{formatCurrency(prestamo.monto_aprobado)}</p></div>
                  <div><p className="text-muted-foreground">Tasa</p><p className="font-semibold">{prestamo.tasa_interes}% / mes</p></div>
                  <div><p className="text-muted-foreground">Plazo</p><p className="font-semibold">{prestamo.plazo_meses} meses</p></div>
                  <div><p className="text-muted-foreground">Frecuencia</p><p className="font-semibold">{frecuenciaLabel[prestamo.frecuencia_pago]}</p></div>
                  <div><p className="text-muted-foreground">Método</p><p className="font-semibold">{metodoLabel[prestamo.metodo_amortizacion]}</p></div>
                  <div><p className="text-muted-foreground">Desembolso</p><p className="font-semibold">{formatDate(prestamo.fecha_desembolso)}</p></div>
                  <div><p className="text-muted-foreground">Vencimiento</p><p className="font-semibold">{prestamo.fecha_vencimiento ? formatDate(prestamo.fecha_vencimiento) : '—'}</p></div>
                  <div><p className="text-muted-foreground">Saldo</p><p className="font-semibold text-destructive">{formatCurrency(Math.max(0, totalDeuda - totalPagado))}</p></div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="cuotas">
              <TabsList className="w-full flex-wrap h-auto gap-1">
                <TabsTrigger value="cuotas" className="flex-1 text-xs">Cuotas</TabsTrigger>
                <TabsTrigger value="pago" className="flex-1 text-xs">Pago</TabsTrigger>
                <TabsTrigger value="abono" className="flex-1 text-xs">Abono Extra</TabsTrigger>
                <TabsTrigger value="historial" className="flex-1 text-xs">Pagos</TabsTrigger>
                <TabsTrigger value="cliente" className="flex-1 text-xs">Historial</TabsTrigger>
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
                        <TableHead>Mora</TableHead>
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
                          <TableCell className="text-sm text-destructive">{formatCurrency(c.mora ?? 0)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(c.saldo_pendiente)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${estadoBadge[c.estado] ?? ''}`}>{c.estado}</Badge>
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
                        <SelectTrigger><SelectValue placeholder="Seleccionar cuota pendiente" /></SelectTrigger>
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
                        <Input type="number" min={0} value={pagoForm.monto} onChange={(e) => setPagoForm((p) => ({ ...p, monto: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Fecha de pago</label>
                        <Input type="date" value={pagoForm.fecha} onChange={(e) => setPagoForm((p) => ({ ...p, fecha: e.target.value }))} />
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
                        <Input placeholder="Nro. de referencia" value={pagoForm.referencia} onChange={(e) => setPagoForm((p) => ({ ...p, referencia: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <Button className="w-full gap-2" disabled={!pagoForm.cuota_id || !pagoForm.monto || registrarPago.isPending} onClick={handlePago}>
                    {registrarPago.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</> : <><DollarSign className="h-4 w-4" /> Registrar Pago</>}
                  </Button>
                </div>
              </TabsContent>

              {/* Abono extraordinario tab */}
              <TabsContent value="abono">
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">Registra un abono extraordinario al capital. Se aplicará a la primera cuota pendiente.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Monto del Abono (RD$) *</label>
                      <Input type="number" min={0} value={abonoForm.monto} onChange={(e) => setAbonoForm((p) => ({ ...p, monto: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fecha</label>
                      <Input type="date" value={abonoForm.fecha} onChange={(e) => setAbonoForm((p) => ({ ...p, fecha: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Método</label>
                      <Select value={abonoForm.metodo} onValueChange={(v) => setAbonoForm((p) => ({ ...p, metodo: v }))}>
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
                      <Input value={abonoForm.referencia} onChange={(e) => setAbonoForm((p) => ({ ...p, referencia: e.target.value }))} />
                    </div>
                  </div>
                  <Button className="w-full gap-2" disabled={!abonoForm.monto || registrarPago.isPending} onClick={handleAbono}>
                    <CreditCard className="h-4 w-4" /> Registrar Abono Extraordinario
                  </Button>
                </div>
              </TabsContent>

              {/* Historial pagos tab */}
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
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagos.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{formatDate(p.fecha_pago)}</TableCell>
                            <TableCell className="text-sm font-medium">{formatCurrency(p.monto_pagado)}</TableCell>
                            <TableCell className="text-sm capitalize">{p.metodo_pago}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.referencia || '—'}</TableCell>
                            <TableCell className="text-right">
                              <Dialog open={reversoId === p.id} onOpenChange={(o) => { if (!o) { setReversoId(null); setReversoMotivo(''); } }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => setReversoId(p.id)}>
                                    <RotateCcw className="h-3 w-3" /> Reversar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Reversar Pago</DialogTitle></DialogHeader>
                                  <p className="text-sm text-muted-foreground">
                                    Se reversará el pago de {formatCurrency(p.monto_pagado)} del {formatDate(p.fecha_pago)}.
                                    Esta acción quedará registrada en la bitácora.
                                  </p>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Motivo del reverso *</label>
                                    <Textarea value={reversoMotivo} onChange={(e) => setReversoMotivo(e.target.value)} rows={2} placeholder="Ej: Error en monto, duplicado..." />
                                  </div>
                                  <Button variant="destructive" className="w-full gap-2" disabled={!reversoMotivo.trim() || reversarPago.isPending} onClick={handleReverso}>
                                    {reversarPago.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                    Confirmar Reverso
                                  </Button>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Historial del cliente tab */}
              <TabsContent value="cliente">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Préstamos del cliente</h3>
                  {histPrestamos.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nro.</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Desembolso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {histPrestamos.data?.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm font-mono">{p.numero_prestamo}</TableCell>
                              <TableCell className="text-sm">{formatCurrency(p.monto_aprobado)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs ${estadoPreBadge[p.estado] ?? ''}`}>{p.estado}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">{formatDate(p.fecha_desembolso)}</TableCell>
                            </TableRow>
                          ))}
                          {(!histPrestamos.data || histPrestamos.data.length === 0) && (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Sin historial</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <h3 className="font-semibold text-sm">Últimos pagos</h3>
                  {histPagos.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Préstamo</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Método</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {histPagos.data?.slice(0, 20).map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm">{formatDate(p.fecha_pago)}</TableCell>
                              <TableCell className="text-sm font-mono">{p.prestamos?.numero_prestamo}</TableCell>
                              <TableCell className="text-sm">{formatCurrency(p.monto_pagado)}</TableCell>
                              <TableCell className="text-sm capitalize">{p.metodo_pago}</TableCell>
                            </TableRow>
                          ))}
                          {(!histPagos.data || histPagos.data.length === 0) && (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Sin pagos</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
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
