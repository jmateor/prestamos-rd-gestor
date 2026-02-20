import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, AlertTriangle, Clock, CalendarCheck, Receipt,
  DollarSign, Loader2, Phone,
} from 'lucide-react';
import { useCobranza, useResumenCobranza, type VistaCobranza, type CuotaCobranza } from '@/hooks/useCobranza';
import { PagoRapidoDialog } from '@/components/PagoRapidoDialog';
import { formatCurrency, formatDate } from '@/lib/format';

// ── Helpers ──────────────────────────────────────────────────────────────────

function diasVencida(fechaVencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento);
  vence.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((hoy.getTime() - vence.getTime()) / 86_400_000));
}

const estadoBadgeClass: Record<string, string> = {
  pendiente: 'bg-warning/10 text-warning border-warning/20',
  parcial:   'bg-primary/10 text-primary border-primary/20',
  vencida:   'bg-destructive/10 text-destructive border-destructive/20',
};

// ── Summary card ─────────────────────────────────────────────────────────────

function ResumenCard({
  icon: Icon,
  label,
  count,
  monto,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  monto: number;
  colorClass: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(monto)}</p>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Cobranza() {
  const [vista, setVista]           = useState<VistaCobranza>('vencidas');
  const [search, setSearch]         = useState('');
  const [cuotaPago, setCuotaPago]   = useState<CuotaCobranza | null>(null);

  const { data: cuotas, isLoading } = useCobranza(vista, search);
  const { data: resumen }           = useResumenCobranza();

  const tabItems: { value: VistaCobranza; label: string; icon: React.ElementType }[] = [
    { value: 'vencidas',  label: 'Vencidas',        icon: AlertTriangle },
    { value: 'hoy',       label: 'Vencen Hoy',      icon: Clock },
    { value: 'proximas',  label: 'Próximos 7 días',  icon: CalendarCheck },
    { value: 'todas',     label: 'Todas Pendientes', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cobranza</h1>
        <p className="text-muted-foreground">Control de pagos y cuotas pendientes</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResumenCard
          icon={AlertTriangle}
          label="Cuotas Vencidas"
          count={resumen?.vencidas.count ?? 0}
          monto={resumen?.vencidas.monto ?? 0}
          colorClass="bg-destructive/10 text-destructive"
        />
        <ResumenCard
          icon={Clock}
          label="Vencen Hoy"
          count={resumen?.hoy.count ?? 0}
          monto={resumen?.hoy.monto ?? 0}
          colorClass="bg-warning/10 text-warning"
        />
        <ResumenCard
          icon={CalendarCheck}
          label="Próximos 7 Días"
          count={resumen?.proximas.count ?? 0}
          monto={resumen?.proximas.monto ?? 0}
          colorClass="bg-primary/10 text-primary"
        />
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={vista} onValueChange={(v) => setVista(v as VistaCobranza)}>
          <TabsList>
            {tabItems.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 text-xs sm:text-sm">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar préstamo, cliente, cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !cuotas || cuotas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Receipt className="h-12 w-12 opacity-30" />
              <p>No hay cuotas en esta vista</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Días Mora</TableHead>
                  <TableHead>Total Cuota</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.map((c) => {
                  const pre     = c.prestamos;
                  const cliente = pre?.clientes;
                  const dias    = diasVencida(c.fecha_vencimiento);
                  const pend    = c.monto_cuota - c.monto_pagado;
                  const esVencida = dias > 0;

                  return (
                    <TableRow key={c.id} className={esVencida ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'}>
                      <TableCell className="font-mono text-sm font-medium">
                        {pre?.numero_prestamo ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {cliente
                              ? `${cliente.primer_nombre} ${cliente.primer_apellido}`
                              : <span className="text-muted-foreground italic">—</span>}
                          </p>
                          {cliente?.telefono && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {cliente.telefono}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">#{c.numero_cuota}</TableCell>
                      <TableCell className="text-sm">{formatDate(c.fecha_vencimiento)}</TableCell>
                      <TableCell>
                        {esVencida ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                            {dias} {dias === 1 ? 'día' : 'días'}
                          </Badge>
                        ) : dias === 0 ? (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                            Hoy
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatCurrency(c.monto_cuota)}</TableCell>
                      <TableCell className="text-sm font-semibold text-destructive">
                        {formatCurrency(pend)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${estadoBadgeClass[c.estado] ?? ''}`}>
                          {c.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => setCuotaPago(c)}
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Cobrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pago rápido modal */}
      <PagoRapidoDialog cuota={cuotaPago} onClose={() => setCuotaPago(null)} />
    </div>
  );
}
