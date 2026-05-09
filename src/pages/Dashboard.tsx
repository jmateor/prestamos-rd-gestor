import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, AlertTriangle, Landmark, Shield, Trophy, CalendarClock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { useDashboardRiskMetrics, useTopClientes } from '@/hooks/useCreditScore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PrestamoDetailSheet } from '@/components/PrestamoDetailSheet';
import { ClienteProfileSheet } from '@/components/ClienteProfileSheet';
import type { Cliente } from '@/hooks/useClientes';
import { toast } from 'sonner';

export default function Dashboard() {
  const { data: risk } = useDashboardRiskMetrics();
  const { data: topClientes } = useTopClientes();
  const [selectedPrestamoId, setSelectedPrestamoId] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteOpen, setClienteOpen] = useState(false);

  const handleClienteClick = async (id: string) => {
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle();
    if (error || !data) {
      toast.error('No se pudo cargar el cliente');
      return;
    }
    setSelectedCliente(data as Cliente);
    setClienteOpen(true);
  };

  const { data: prestamosAVencer } = useQuery({
    queryKey: ['prestamos-a-vencer'],
    queryFn: async () => {
      const today = new Date();
      const in7days = new Date(today);
      in7days.setDate(in7days.getDate() + 7);
      const todayStr = today.toISOString().split('T')[0];
      const futureStr = in7days.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('cuotas')
        .select('id, prestamo_id, numero_cuota, fecha_vencimiento, monto_cuota, prestamos(numero_prestamo, clientes(primer_nombre, primer_apellido))')
        .eq('estado', 'pendiente')
        .gte('fecha_vencimiento', todayStr)
        .lte('fecha_vencimiento', futureStr)
        .order('fecha_vencimiento')
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: realMetrics } = useQuery({
    queryKey: ['dashboard-real-metrics'],
    queryFn: async () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const [{ count: clientesActivos }, { data: prestamosData }, { data: cuotasVencidas }] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('prestamos').select('id, monto_aprobado, estado, fecha_desembolso'),
        supabase.from('cuotas').select('id, monto_cuota').eq('estado', 'pendiente').lt('fecha_vencimiento', today.toISOString().split('T')[0]),
      ]);
      const pres = prestamosData ?? [];
      return {
        clientesActivos: clientesActivos ?? 0,
        carteraActiva: pres.filter(p => p.estado === 'activo').reduce((s, p) => s + (p.monto_aprobado ?? 0), 0),
        prestadoMes: pres.filter(p => p.fecha_desembolso >= firstDay).reduce((s, p) => s + (p.monto_aprobado ?? 0), 0),
        carteraMora: (cuotasVencidas ?? []).reduce((s, c) => s + (c.monto_cuota ?? 0), 0),
      };
    },
  });

  const stats = [
    { label: 'Prestado este mes', value: formatCurrency(realMetrics?.prestadoMes ?? 0), icon: DollarSign },
    { label: 'Cartera activa', value: formatCurrency(realMetrics?.carteraActiva ?? 0), icon: Landmark },
    { label: 'Cartera en mora', value: formatCurrency(realMetrics?.carteraMora ?? 0), icon: AlertTriangle, accent: 'text-destructive' },
    { label: 'Clientes activos', value: (realMetrics?.clientesActivos ?? 0).toLocaleString('es-DO'), icon: Users },
    { label: 'Score promedio', value: (risk?.promedioScore ?? 0).toString(), icon: Shield },
  ];

  const riskColor = (nivel: string | null) => {
    if (nivel === 'bajo') return 'text-success';
    if (nivel === 'medio') return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de la cartera</p>
      </header>

      {/* Stat grid */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wide">{s.label}</span>
              <s.icon className="h-4 w-4" />
            </div>
            <div className={`mt-3 text-2xl font-semibold tracking-tight ${s.accent ?? 'text-foreground'}`}>
              {s.value}
            </div>
          </div>
        ))}
      </section>

      {/* Two-column content */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Próximos vencimientos */}
        <Card className="border-none shadow-none ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Próximos vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!prestamosAVencer?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin cuotas próximas a vencer.</p>
            ) : (
              <div className="divide-y">
                {prestamosAVencer.map((c: any) => {
                  const cl = c.prestamos?.clientes;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {cl ? `${cl.primer_nombre} ${cl.primer_apellido}` : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.prestamos?.numero_prestamo} · Cuota {c.numero_cuota} · {formatDate(c.fecha_vencimiento)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums">{formatCurrency(c.monto_cuota)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Riesgo */}
        <Card className="border-none shadow-none ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Distribución de riesgo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <RiskRow label="Bajo riesgo" count={risk?.bajoRiesgo ?? 0} total={risk?.totalConScore ?? 1} color="bg-success" />
            <RiskRow label="Riesgo medio" count={risk?.medioRiesgo ?? 0} total={risk?.totalConScore ?? 1} color="bg-warning" />
            <RiskRow label="Alto riesgo" count={risk?.altoRiesgo ?? 0} total={risk?.totalConScore ?? 1} color="bg-destructive" />
            <p className="pt-2 text-xs text-muted-foreground">
              {risk?.totalConScore ?? 0} de {risk?.totalClientes ?? 0} clientes con score
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Top clientes */}
      <section>
        <Card className="border-none shadow-none ring-1 ring-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              Mejores clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!topClientes?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Calcule el score de sus clientes para ver el ranking.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="w-10 text-xs uppercase tracking-wide text-muted-foreground">#</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Cédula</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">Score</TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">Nivel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClientes.slice(0, 10).map((c, i) => (
                    <TableRow key={c.id} className="border-0">
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{c.primer_nombre} {c.primer_apellido}</TableCell>
                      <TableCell className="text-muted-foreground">{c.cedula}</TableCell>
                      <TableCell className={`text-right font-semibold tabular-nums ${riskColor(c.nivel_riesgo)}`}>{c.credit_score}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`${riskColor(c.nivel_riesgo)} font-normal`}>
                          {c.nivel_riesgo === 'bajo' ? 'Bajo' : c.nivel_riesgo === 'medio' ? 'Medio' : 'Alto'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function RiskRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{count} · {pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
