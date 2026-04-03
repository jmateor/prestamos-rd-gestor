import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, TrendingUp, AlertTriangle, Landmark, Shield, ShieldAlert, ShieldCheck, Trophy, Loader2, CalendarClock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { useDashboardRiskMetrics, useTopClientes, useClientesAltoRiesgo } from '@/hooks/useCreditScore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardKPIs } from '@/components/DashboardKPIs';

export default function Dashboard() {
  const { data: risk, isLoading: loadingRisk } = useDashboardRiskMetrics();
  const { data: topClientes } = useTopClientes();
  const { data: clientesRiesgo } = useClientesAltoRiesgo();

  // Préstamos a vencer (próximos 7 días)
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
        .select('id, numero_cuota, fecha_vencimiento, monto_cuota, prestamo_id, prestamos(numero_prestamo, clientes(primer_nombre, primer_apellido))')
        .eq('estado', 'pendiente')
        .gte('fecha_vencimiento', todayStr)
        .lte('fecha_vencimiento', futureStr)
        .order('fecha_vencimiento')
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  // Real metrics from DB
  const { data: realMetrics } = useQuery({
    queryKey: ['dashboard-real-metrics'],
    queryFn: async () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

      const [{ count: clientesActivos }, { data: prestamosData }, { data: cuotasVencidas }] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
        supabase.from('prestamos').select('id, monto_aprobado, estado, fecha_desembolso'),
        supabase.from('cuotas').select('id, monto_cuota, prestamo_id').eq('estado', 'pendiente').lt('fecha_vencimiento', today.toISOString().split('T')[0]),
      ]);

      const pres = prestamosData ?? [];
      const carteraActiva = pres.filter(p => p.estado === 'activo').reduce((s, p) => s + (p.monto_aprobado ?? 0), 0);
      const prestadoMes = pres.filter(p => p.fecha_desembolso >= firstDay).reduce((s, p) => s + (p.monto_aprobado ?? 0), 0);
      const carteraMora = (cuotasVencidas ?? []).reduce((s, c) => s + (c.monto_cuota ?? 0), 0);

      return {
        clientesActivos: clientesActivos ?? 0,
        carteraActiva,
        prestadoMes,
        carteraMora,
      };
    },
  });

  const metrics = [
    { label: 'Total Prestado (Mes)', value: realMetrics?.prestadoMes ?? 0, icon: DollarSign, color: 'text-primary' },
    { label: 'Cartera Activa', value: realMetrics?.carteraActiva ?? 0, icon: Landmark, color: 'text-secondary' },
    { label: 'Cartera en Mora', value: realMetrics?.carteraMora ?? 0, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Clientes Activos', value: realMetrics?.clientesActivos ?? 0, icon: Users, color: 'text-primary', isCurrency: false },
    { label: 'Score Promedio', value: risk?.promedioScore ?? 0, icon: Shield, color: 'text-secondary', isCurrency: false },
  ];

  const riskColor = (nivel: string | null) => {
    if (nivel === 'bajo') return 'text-success';
    if (nivel === 'medio') return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen financiero y análisis de riesgo</p>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => (
          <Card key={m.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {m.isCurrency === false ? m.value.toLocaleString('es-DO') : formatCurrency(m.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5" /> Distribución de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRisk ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                <RiskBar label="Bajo Riesgo" count={risk?.bajoRiesgo ?? 0} total={risk?.totalConScore ?? 1} color="bg-success" icon={<ShieldCheck className="h-4 w-4 text-success" />} />
                <RiskBar label="Riesgo Medio" count={risk?.medioRiesgo ?? 0} total={risk?.totalConScore ?? 1} color="bg-warning" icon={<Shield className="h-4 w-4 text-warning" />} />
                <RiskBar label="Alto Riesgo" count={risk?.altoRiesgo ?? 0} total={risk?.totalConScore ?? 1} color="bg-destructive" icon={<ShieldAlert className="h-4 w-4 text-destructive" />} />
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  {risk?.totalConScore ?? 0} de {risk?.totalClientes ?? 0} clientes con score calculado
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mora Alerts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Alertas de Mora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Clientes con mora activa</span>
                <Badge variant="destructive">{risk?.clientesMora ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Préstamos por cobrar</span>
                <Badge variant="destructive">{risk?.prestamosEnMora ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cuotas vencidas</span>
                <Badge variant="outline" className="text-destructive">{risk?.cuotasVencidas ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Clientes con múltiples préstamos</span>
                <Badge variant="outline">{risk?.clientesMultiples ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Clientes alto riesgo</span>
                <Badge variant="destructive">{risk?.altoRiesgo ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alto Riesgo Clients */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" /> Clientes Alto Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!clientesRiesgo?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin clientes de alto riesgo</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {clientesRiesgo.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.primer_nombre} {c.primer_apellido}</span>
                    <Badge variant="destructive" className="text-xs">{c.credit_score}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" /> Top 10 Mejores Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!topClientes?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Calcule el score de sus clientes desde el perfil para ver el ranking.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClientes.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-medium">{c.primer_nombre} {c.primer_apellido}</TableCell>
                    <TableCell>{c.cedula}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${riskColor(c.nivel_riesgo)}`}>{c.credit_score}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={riskColor(c.nivel_riesgo)}>
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
      {/* Préstamos a Vencer */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-warning" /> Préstamos a Vencer (Próximos 7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!prestamosAVencer?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay cuotas próximas a vencer.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cuota #</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamosAVencer.map((c: any) => {
                  const p = c.prestamos;
                  const cl = p?.clientes;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{p?.numero_prestamo || '—'}</TableCell>
                      <TableCell>{cl ? `${cl.primer_nombre} ${cl.primer_apellido}` : '—'}</TableCell>
                      <TableCell>{c.numero_cuota}</TableCell>
                      <TableCell>{formatDate(c.fecha_vencimiento)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(c.monto_cuota)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Préstamos por Cobrar (Advanced KPIs) */}
      <DashboardKPIs />
    </div>
  );
}

function RiskBar({ label, count, total, color, icon }: { label: string; count: number; total: number; color: string; icon: React.ReactNode }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-semibold">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
