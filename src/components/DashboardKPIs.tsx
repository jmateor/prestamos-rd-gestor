import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Percent, DollarSign, PiggyBank, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

      // Last 6 months for trends
      const months: { label: string; desde: string; hasta: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        months.push({
          label: d.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' }),
          desde: d.toISOString().split('T')[0],
          hasta: end.toISOString().split('T')[0],
        });
      }

      const [
        { data: prestamos },
        { data: pagos },
        { data: cuotasVencidas },
        { data: allCuotas },
        { data: pagosMensuales },
      ] = await Promise.all([
        supabase.from('prestamos').select('id, monto_aprobado, tasa_interes, estado, fecha_desembolso, plazo_meses'),
        supabase.from('pagos').select('id, monto_pagado, capital_pagado, interes_pagado, mora_pagada, fecha_pago'),
        supabase.from('cuotas').select('id, monto_cuota, monto_pagado').lt('fecha_vencimiento', todayStr).neq('estado', 'pagada'),
        supabase.from('cuotas').select('id, monto_cuota, monto_pagado, estado, fecha_vencimiento'),
        supabase.from('pagos').select('monto_pagado, interes_pagado, mora_pagada, fecha_pago').gte('fecha_pago', months[0].desde),
      ]);

      const pres = prestamos ?? [];
      const pay = pagos ?? [];
      const venc = cuotasVencidas ?? [];
      const allC = allCuotas ?? [];

      // Cartera total (all active loans)
      const carteraTotal = pres.filter(p => p.estado === 'activo' || p.estado === 'en_mora').reduce((s, p) => s + (p.monto_aprobado ?? 0), 0);

      // Cartera vencida
      const carteraVencida = venc.reduce((s, c) => s + ((c.monto_cuota ?? 0) - (c.monto_pagado ?? 0)), 0);

      // Tasa de mora = cartera vencida / cartera total
      const tasaMora = carteraTotal > 0 ? (carteraVencida / carteraTotal) * 100 : 0;

      // Ingresos por intereses (este mes)
      const pagosMes = pay.filter(p => p.fecha_pago >= firstOfMonth);
      const ingresoInteresMes = pagosMes.reduce((s, p) => s + ((p.interes_pagado ?? 0) + (p.mora_pagada ?? 0)), 0);
      const ingresoTotalMes = pagosMes.reduce((s, p) => s + (p.monto_pagado ?? 0), 0);

      // Rentabilidad = ingresos intereses / cartera total
      const rentabilidad = carteraTotal > 0 ? (ingresoInteresMes / carteraTotal) * 100 : 0;

      // Cuotas totales vs pagadas
      const cuotasPagadas = allC.filter(c => c.estado === 'pagada').length;
      const cuotasTotales = allC.length;
      const tasaRecuperacion = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0;

      // Monthly trends
      const tendencia = months.map(m => {
        const monthPagos = (pagosMensuales ?? []).filter((p: any) => p.fecha_pago >= m.desde && p.fecha_pago <= m.hasta);
        return {
          mes: m.label,
          ingresos: monthPagos.reduce((s: number, p: any) => s + (p.monto_pagado ?? 0), 0),
          intereses: monthPagos.reduce((s: number, p: any) => s + ((p.interes_pagado ?? 0) + (p.mora_pagada ?? 0)), 0),
        };
      });

      // Distribution by status
      const distribucionEstado = [
        { name: 'Activo', value: pres.filter(p => p.estado === 'activo').length, color: 'hsl(152, 48%, 44%)' },
        { name: 'En Mora', value: pres.filter(p => p.estado === 'en_mora').length, color: 'hsl(0, 72%, 51%)' },
        { name: 'Cancelado', value: pres.filter(p => p.estado === 'cancelado').length, color: 'hsl(215, 16%, 47%)' },
      ].filter(d => d.value > 0);

      return {
        carteraTotal,
        carteraVencida,
        tasaMora,
        ingresoInteresMes,
        ingresoTotalMes,
        rentabilidad,
        tasaRecuperacion,
        tendencia,
        distribucionEstado,
        totalPrestamos: pres.length,
        prestamosActivos: pres.filter(p => p.estado === 'activo').length,
      };
    },
  });
}

export function DashboardKPIs() {
  const { data: kpis, isLoading } = useDashboardKPIs();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!kpis) return null;

  const kpiCards = [
    { label: 'Tasa de Mora', value: `${kpis.tasaMora.toFixed(1)}%`, icon: Percent, color: kpis.tasaMora > 10 ? 'text-destructive' : 'text-warning' },
    { label: 'Cartera Vencida', value: formatCurrency(kpis.carteraVencida), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Ingresos Intereses (Mes)', value: formatCurrency(kpis.ingresoInteresMes), icon: PiggyBank, color: 'text-success' },
    { label: 'Rentabilidad Mensual', value: `${kpis.rentabilidad.toFixed(2)}%`, icon: TrendingUp, color: 'text-success' },
    { label: 'Tasa Recuperación', value: `${kpis.tasaRecuperacion.toFixed(1)}%`, icon: BarChart3, color: 'text-primary' },
    { label: 'Total Recaudado (Mes)', value: formatCurrency(kpis.ingresoTotalMes), icon: DollarSign, color: 'text-secondary' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map(k => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`h-4 w-4 ${k.color}`} />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Income Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendencia de Ingresos (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.tendencia}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="ingresos" name="Total Recaudado" fill="hsl(215, 60%, 24%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="intereses" name="Intereses + Mora" fill="hsl(152, 48%, 44%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Loan Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución de Préstamos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpis.distribucionEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {kpis.distribucionEstado.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
