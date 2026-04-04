import { useState, useMemo, useCallback } from 'react';
import { Search, CreditCard, Printer, X, Check, AlertTriangle, DollarSign, Receipt, Banknote, ArrowRightLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRegistrarPago } from '@/hooks/usePrestamos';
import { useRegistrarAudit } from '@/hooks/useAuditLog';
import { formatCurrency, formatDate } from '@/lib/format';
import { generarReciboPago } from '@/lib/reciboPagoPDF';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ClienteResult {
  id: string;
  primer_nombre: string;
  primer_apellido: string;
  segundo_nombre: string | null;
  segundo_apellido: string | null;
  cedula: string;
  telefono: string;
}

interface PrestamoResult {
  id: string;
  numero_prestamo: string;
  monto_aprobado: number;
  estado: string;
  frecuencia_pago: string;
  cliente_id: string;
  clientes: ClienteResult;
}

interface CuotaPOS {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_cuota: number;
  capital: number;
  interes: number;
  mora: number | null;
  monto_pagado: number;
  estado: string;
  saldo_pendiente: number;
}

type POSStep = 'search' | 'cuotas' | 'confirm' | 'done';

export default function CobroPOS() {
  const { user } = useAuth();
  const registrarPago = useRegistrarPago();
  const registrarAudit = useRegistrarAudit();
  const qc = useQueryClient();

  const [step, setStep] = useState<POSStep>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PrestamoResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedPrestamo, setSelectedPrestamo] = useState<PrestamoResult | null>(null);
  const [cuotas, setCuotas] = useState<CuotaPOS[]>([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);

  // Payment form
  const [montoPagar, setMontoPagar] = useState('');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [referencia, setReferencia] = useState('');

  // Receipt data after payment
  const [pagoResult, setPagoResult] = useState<{
    cuotasPagadas: { numero: number; capital: number; interes: number; mora: number; total: number }[];
    totalPagado: number;
    montoRecibido: number;
    devuelta: number;
    metodoPago: string;
    referencia: string;
  } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // ── Live Search ──────────────────────────────────────────────
  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const q = term.trim();
      const { data: byPrestamo } = await supabase
        .from('prestamos')
        .select('id, numero_prestamo, monto_aprobado, estado, frecuencia_pago, cliente_id, clientes(id, primer_nombre, primer_apellido, segundo_nombre, segundo_apellido, cedula, telefono)')
        .eq('estado', 'activo')
        .ilike('numero_prestamo', `%${q}%`)
        .limit(10);

      const { data: clientes } = await supabase
        .from('clientes')
        .select('id')
        .or(`primer_nombre.ilike.%${q}%,primer_apellido.ilike.%${q}%,cedula.ilike.%${q}%,telefono.ilike.%${q}%`)
        .limit(20);

      let byCliente: any[] = [];
      if (clientes && clientes.length > 0) {
        const ids = clientes.map(c => c.id);
        const { data } = await supabase
          .from('prestamos')
          .select('id, numero_prestamo, monto_aprobado, estado, frecuencia_pago, cliente_id, clientes(id, primer_nombre, primer_apellido, segundo_nombre, segundo_apellido, cedula, telefono)')
          .eq('estado', 'activo')
          .in('cliente_id', ids)
          .limit(10);
        byCliente = data ?? [];
      }

      const map = new Map<string, any>();
      for (const p of [...(byPrestamo ?? []), ...byCliente]) {
        if (p.clientes) map.set(p.id, p);
      }
      setSearchResults(Array.from(map.values()) as PrestamoResult[]);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // ── Select Loan ──────────────────────────────────────────────
  const selectPrestamo = async (p: PrestamoResult) => {
    setSelectedPrestamo(p);
    setLoadingCuotas(true);
    const { data } = await supabase
      .from('cuotas')
      .select('*')
      .eq('prestamo_id', p.id)
      .neq('estado', 'pagada')
      .order('numero_cuota');
    setCuotas((data as CuotaPOS[]) ?? []);
    setLoadingCuotas(false);
    setStep('cuotas');
    const primera = (data ?? [])[0];
    if (primera) {
      const val = (primera.monto_cuota - primera.monto_pagado).toFixed(2);
      setMontoPagar(val);
      setMontoRecibido('');
    }
  };

  // ── Compute payment distribution ────────────────────────────
  const cuotasPendientes = useMemo(() => cuotas.filter(c => c.estado !== 'pagada'), [cuotas]);
  const saldoTotal = useMemo(() => cuotasPendientes.reduce((a, c) => a + (c.monto_cuota - c.monto_pagado), 0), [cuotasPendientes]);

  const montoPagarNum = parseFloat(montoPagar) || 0;
  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const devuelta = metodoPago === 'efectivo' ? Math.max(0, montoRecibidoNum - montoPagarNum) : 0;

  // Payment distribution: mora → interés → capital (per installment)
  const distribucion = useMemo(() => {
    let restante = montoPagarNum;
    const result: { cuota: CuotaPOS; capital: number; interes: number; mora: number; total: number }[] = [];

    for (const c of cuotasPendientes) {
      if (restante <= 0) break;
      const pendiente = c.monto_cuota - c.monto_pagado + (c.mora ?? 0);
      const pago = Math.min(restante, pendiente);
      let remainder = pago;

      // 1. Mora first (per cuota, not global)
      const moraAplicada = Math.min(remainder, c.mora ?? 0);
      remainder -= moraAplicada;

      // 2. Interés
      const interesAplicado = Math.min(remainder, c.interes);
      remainder -= interesAplicado;

      // 3. Capital
      const capitalAplicado = Math.max(0, remainder);

      result.push({
        cuota: c,
        capital: capitalAplicado,
        interes: interesAplicado,
        mora: moraAplicada,
        total: pago,
      });
      restante -= pago;
    }
    return result;
  }, [montoPagarNum, cuotasPendientes]);

  const totalDistribuido = distribucion.reduce((a, d) => a + d.total, 0);

  // ── Validations ─────────────────────────────────────────────
  const validarPago = (): string | null => {
    if (!metodoPago) return 'Debe seleccionar un método de pago.';
    if (montoPagarNum <= 0) return 'El monto a pagar debe ser mayor a cero.';
    if (metodoPago === 'efectivo') {
      if (!montoRecibido || montoRecibidoNum <= 0) return 'Debe ingresar el monto recibido del cliente.';
      if (montoRecibidoNum < montoPagarNum) return 'El monto recibido no puede ser menor al monto a pagar.';
    }
    if (metodoPago === 'transferencia' || metodoPago === 'cheque') {
      if (!referencia.trim()) return metodoPago === 'transferencia' ? 'Debe ingresar el número de transferencia.' : 'Debe ingresar el número de cheque.';
    }
    return null;
  };

  const handleCobrar = () => {
    const error = validarPago();
    if (error) {
      toast.error(error);
      return;
    }
    setStep('confirm');
  };

  // ── Process Payment ─────────────────────────────────────────
  const procesarPago = async () => {
    if (!selectedPrestamo || distribucion.length === 0) return;

    for (const d of distribucion) {
      await registrarPago.mutateAsync({
        prestamo_id: selectedPrestamo.id,
        cuota_id: d.cuota.id,
        monto_pagado: d.total,
        fecha_pago: today,
        metodo_pago: metodoPago,
        referencia: metodoPago === 'transferencia' ? referencia : '',
      });
    }

    await registrarAudit({
      accion: 'cobro_pos',
      tabla: 'pagos',
      registro_id: selectedPrestamo.id,
      datos_nuevos: {
        prestamo: selectedPrestamo.numero_prestamo,
        monto_pagado: totalDistribuido,
        metodo_pago: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? montoRecibidoNum : totalDistribuido,
        devuelta: metodoPago === 'efectivo' ? devuelta : 0,
        referencia_transferencia: metodoPago === 'transferencia' ? referencia : null,
        cuotas: distribucion.map(d => d.cuota.numero_cuota),
        usuario: user?.email,
      },
    });

    setPagoResult({
      cuotasPagadas: distribucion.map(d => ({
        numero: d.cuota.numero_cuota,
        capital: d.capital,
        interes: d.interes,
        mora: d.mora,
        total: d.total,
      })),
      totalPagado: totalDistribuido,
      montoRecibido: metodoPago === 'efectivo' ? montoRecibidoNum : totalDistribuido,
      devuelta: metodoPago === 'efectivo' ? devuelta : 0,
      metodoPago,
      referencia: metodoPago === 'transferencia' ? referencia : '',
    });

    setStep('done');
    toast.success('Pago registrado exitosamente');
  };

  // ── Print Receipt ───────────────────────────────────────────
  const imprimirRecibo = async () => {
    if (!selectedPrestamo || !pagoResult) return;
    const cliente = selectedPrestamo.clientes;

    const { data: cuotasAct } = await supabase
      .from('cuotas')
      .select('monto_cuota, monto_pagado, estado')
      .eq('prestamo_id', selectedPrestamo.id)
      .order('numero_cuota');

    const pendientes = cuotasAct?.filter(c => c.estado !== 'pagada') ?? [];
    const saldo = cuotasAct?.reduce((a, c) => a + (c.monto_cuota - c.monto_pagado), 0) ?? 0;
    const primeraCuota = pagoResult.cuotasPagadas[0];

    const doc = generarReciboPago({
      monto_pagado: pagoResult.totalPagado,
      fecha_pago: today,
      metodo_pago: pagoResult.metodoPago,
      referencia: pagoResult.referencia,
      numero_cuota: primeraCuota.numero,
      monto_cuota: primeraCuota.total,
      monto_pagado_acumulado: primeraCuota.total,
      numero_prestamo: selectedPrestamo.numero_prestamo,
      monto_aprobado: selectedPrestamo.monto_aprobado,
      cliente_nombre: `${cliente.primer_nombre} ${cliente.primer_apellido}`,
      cliente_cedula: cliente.cedula,
      cuotas_restantes: pendientes.length,
      saldo_total_pendiente: Math.max(0, saldo),
      monto_recibido: pagoResult.montoRecibido,
      devuelta: pagoResult.devuelta,
      usuario: user?.email ?? '',
    });

    doc.save(`recibo-POS-${selectedPrestamo.numero_prestamo}.pdf`);
  };

  // ── Reset ───────────────────────────────────────────────────
  const nuevoCobro = () => {
    setStep('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedPrestamo(null);
    setCuotas([]);
    setMontoPagar('');
    setMontoRecibido('');
    setMetodoPago('');
    setReferencia('');
    setPagoResult(null);
    qc.invalidateQueries({ queryKey: ['cobranza'] });
    qc.invalidateQueries({ queryKey: ['prestamos'] });
  };

  const cliente = selectedPrestamo?.clientes;
  const metodoLabel: Record<string, string> = {
    efectivo: '💵 Efectivo',
    transferencia: '🏦 Transferencia',
    cheque: '📝 Cheque',
  };

  return (
    <div className="flex flex-col h-full min-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cobro POS</h1>
            <p className="text-xs text-muted-foreground">Registro rápido de pagos</p>
          </div>
        </div>
        {step !== 'search' && (
          <Button variant="outline" size="sm" onClick={nuevoCobro}>
            <X className="h-4 w-4 mr-1" /> Nuevo Cobro
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* STEP 1: Search */}
        {step === 'search' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-primary" /> Buscar Cliente o Préstamo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  autoFocus
                  placeholder="Nombre, cédula, teléfono o número de préstamo..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="text-lg h-12"
                />
              </CardContent>
            </Card>

            {searching && <p className="text-center text-muted-foreground animate-pulse">Buscando...</p>}

            {searchResults.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectPrestamo(p)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div>
                          <p className="font-semibold">{p.clientes.primer_nombre} {p.clientes.primer_apellido}</p>
                          <p className="text-sm text-muted-foreground">Cédula: {p.clientes.cedula} · Tel: {p.clientes.telefono}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="font-mono">{p.numero_prestamo}</Badge>
                          <p className="text-sm mt-1 font-medium">{formatCurrency(p.monto_aprobado)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No se encontraron préstamos activos.</p>
            )}
          </div>
        )}

        {/* STEP 2: Cuotas + Payment */}
        {step === 'cuotas' && selectedPrestamo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {/* Left: Client + Cuotas */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Cliente</span>
                      <span className="font-semibold">{cliente?.primer_nombre} {cliente?.primer_apellido}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Cédula</span>
                      <span className="font-mono">{cliente?.cedula}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Préstamo</span>
                      <Badge variant="outline" className="font-mono">{selectedPrestamo.numero_prestamo}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Saldo Pendiente</span>
                      <span className="font-bold text-destructive">{formatCurrency(saldoTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Cuotas Pendientes ({cuotasPendientes.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingCuotas ? (
                    <p className="p-4 text-muted-foreground animate-pulse">Cargando cuotas...</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead className="text-right">Capital</TableHead>
                          <TableHead className="text-right">Interés</TableHead>
                          <TableHead className="text-right">Mora</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Pendiente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cuotasPendientes.map(c => {
                          const vencida = c.fecha_vencimiento < today;
                          const pendiente = c.monto_cuota - c.monto_pagado;
                          return (
                            <TableRow key={c.id} className={vencida ? 'bg-destructive/5' : ''}>
                              <TableCell className="font-mono">
                                {c.numero_cuota}
                                {vencida && <AlertTriangle className="h-3 w-3 text-destructive inline ml-1" />}
                              </TableCell>
                              <TableCell className={vencida ? 'text-destructive font-medium' : ''}>
                                {formatDate(c.fecha_vencimiento)}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(c.capital)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(c.interes)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(c.mora ?? 0)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(c.monto_cuota)}</TableCell>
                              <TableCell className="text-right font-bold">{formatCurrency(pendiente)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Payment form */}
            <div className="space-y-4">
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-primary" /> Registrar Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Monto a pagar */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Monto a Pagar (RD$) *</label>
                    <Input
                      autoFocus
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={montoPagar}
                      onChange={e => {
                        setMontoPagar(e.target.value);
                        setMontoRecibido('');
                      }}
                      className="text-2xl h-14 font-bold text-center"
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="flex flex-wrap gap-2">
                    {cuotasPendientes.length > 0 && (
                      <Button variant="outline" size="sm" onClick={() => {
                        setMontoPagar((cuotasPendientes[0].monto_cuota - cuotasPendientes[0].monto_pagado).toFixed(2));
                        setMontoRecibido('');
                      }}>
                        1 cuota
                      </Button>
                    )}
                    {cuotasPendientes.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => {
                        const dos = cuotasPendientes.slice(0, 2).reduce((a, c) => a + (c.monto_cuota - c.monto_pagado), 0);
                        setMontoPagar(dos.toFixed(2));
                        setMontoRecibido('');
                      }}>
                        2 cuotas
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => {
                      setMontoPagar(saldoTotal.toFixed(2));
                      setMontoRecibido('');
                    }}>
                      Total
                    </Button>
                  </div>

                  {/* Método de pago - OBLIGATORIO */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Método de Pago *</label>
                    <Select value={metodoPago} onValueChange={(v) => { setMetodoPago(v); setReferencia(''); setMontoRecibido(''); }}>
                      <SelectTrigger className={!metodoPago ? 'border-destructive/50' : ''}>
                        <SelectValue placeholder="Seleccione método de pago..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                        <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                        <SelectItem value="cheque">📝 Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* EFECTIVO: Monto recibido + devuelta */}
                  {metodoPago === 'efectivo' && (
                    <div className="space-y-3 rounded-lg border border-dashed border-primary/30 p-3 bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Banknote className="h-4 w-4" /> Pago en Efectivo
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Monto Recibido del Cliente (RD$) *</label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={montoRecibido}
                          onChange={e => setMontoRecibido(e.target.value)}
                          className="text-xl h-12 font-bold text-center"
                        />
                      </div>
                      {montoRecibidoNum > 0 && montoPagarNum > 0 && (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Monto a pagar:</span>
                            <span className="font-medium">{formatCurrency(montoPagarNum)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Monto recibido:</span>
                            <span className="font-medium">{formatCurrency(montoRecibidoNum)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Devuelta:</span>
                            <span className={devuelta > 0 ? 'text-primary' : montoRecibidoNum < montoPagarNum ? 'text-destructive' : ''}>
                              {montoRecibidoNum < montoPagarNum ? `Faltan ${formatCurrency(montoPagarNum - montoRecibidoNum)}` : formatCurrency(devuelta)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TRANSFERENCIA: Número de referencia */}
                  {metodoPago === 'transferencia' && (
                    <div className="space-y-3 rounded-lg border border-dashed border-primary/30 p-3 bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <ArrowRightLeft className="h-4 w-4" /> Pago por Transferencia
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Número de Transferencia *</label>
                        <Input
                          placeholder="Ej: TRX45892177"
                          value={referencia}
                          onChange={e => setReferencia(e.target.value)}
                          className={!referencia.trim() ? 'border-destructive/50' : ''}
                        />
                      </div>
                    </div>
                  )}

                  {/* CHEQUE */}
                  {metodoPago === 'cheque' && (
                    <div className="space-y-3 rounded-lg border border-dashed border-primary/30 p-3 bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        📝 Pago con Cheque
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Número de Cheque *</label>
                        <Input
                          placeholder="Ej: 000123456"
                          value={referencia}
                          onChange={e => setReferencia(e.target.value)}
                          className={!referencia.trim() ? 'border-destructive/50' : ''}
                        />
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Distribution preview */}
                  {distribucion.length > 0 && (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-muted-foreground">Distribución del pago:</p>
                      {distribucion.map(d => (
                        <div key={d.cuota.id} className="flex justify-between">
                          <span>Cuota #{d.cuota.numero_cuota}</span>
                          <span className="font-medium">{formatCurrency(d.total)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total a aplicar</span>
                        <span>{formatCurrency(totalDistribuido)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 text-lg gap-2"
                    disabled={!montoPagar || montoPagarNum <= 0 || !metodoPago || registrarPago.isPending}
                    onClick={handleCobrar}
                  >
                    <Receipt className="h-5 w-5" /> Cobrar {formatCurrency(totalDistribuido)}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 'confirm' && selectedPrestamo && (
          <div className="max-w-md mx-auto">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-center">Confirmar Cobro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-medium">{cliente?.primer_nombre} {cliente?.primer_apellido}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cédula</span>
                    <span className="font-mono">{cliente?.cedula}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Préstamo</span>
                    <span className="font-mono">{selectedPrestamo.numero_prestamo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuotas a pagar</span>
                    <span>{distribucion.length}</span>
                  </div>
                  <Separator />
                  {distribucion.map(d => (
                    <div key={d.cuota.id} className="space-y-1">
                      <div className="font-medium">Cuota #{d.cuota.numero_cuota}</div>
                      <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                        <span>Capital: {formatCurrency(d.capital)}</span>
                        <span>Interés: {formatCurrency(d.interes)}</span>
                        <span>Mora: {formatCurrency(d.mora)}</span>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de pago</span>
                    <span>{metodoLabel[metodoPago] ?? metodoPago}</span>
                  </div>
                  {metodoPago === 'transferencia' && referencia && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nro. Transferencia</span>
                      <span className="font-mono text-xs">{referencia}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Monto a Pagar</span>
                    <span className="text-primary">{formatCurrency(totalDistribuido)}</span>
                  </div>
                  {metodoPago === 'efectivo' && (
                    <>
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Monto Recibido</span>
                        <span>{formatCurrency(montoRecibidoNum)}</span>
                      </div>
                      {devuelta > 0.01 && (
                        <div className="flex justify-between font-bold text-primary text-lg">
                          <span>Devuelta</span>
                          <span>{formatCurrency(devuelta)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('cuotas')}>
                    Volver
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    disabled={registrarPago.isPending}
                    onClick={procesarPago}
                  >
                    {registrarPago.isPending ? 'Procesando...' : <><Check className="h-4 w-4" /> Confirmar</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === 'done' && pagoResult && (
          <div className="max-w-md mx-auto">
            <Card className="border-green-500/30">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">¡Pago Registrado!</h2>
                <p className="text-muted-foreground">
                  Se aplicaron {pagoResult.cuotasPagadas.length} cuota(s) por un total de{' '}
                  <span className="font-bold text-foreground">{formatCurrency(pagoResult.totalPagado)}</span>
                </p>

                {pagoResult.metodoPago === 'efectivo' && pagoResult.devuelta > 0.01 && (
                  <div className="rounded-lg bg-primary/10 p-3 text-center">
                    <p className="text-sm text-muted-foreground">Devuelta al cliente</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(pagoResult.devuelta)}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={imprimirRecibo}>
                    <Printer className="h-4 w-4" /> Imprimir Recibo
                  </Button>
                  <Button className="flex-1 gap-2" onClick={nuevoCobro}>
                    <CreditCard className="h-4 w-4" /> Nuevo Cobro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
