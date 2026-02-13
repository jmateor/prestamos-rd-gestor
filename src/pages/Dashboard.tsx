import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, AlertTriangle, Landmark } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const metrics = [
  { label: 'Total Prestado (Mes)', value: 2450000, icon: DollarSign, color: 'text-primary' },
  { label: 'Cartera Activa', value: 8750000, icon: Landmark, color: 'text-secondary' },
  { label: 'Cartera en Mora', value: 320000, icon: AlertTriangle, color: 'text-destructive' },
  { label: 'Ingresos por Intereses', value: 185000, icon: TrendingUp, color: 'text-secondary' },
  { label: 'Clientes Activos', value: 142, icon: Users, color: 'text-primary', isCurrency: false },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen financiero del sistema</p>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Últimos Préstamos Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Los datos se mostrarán cuando haya préstamos registrados.</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Próximos Vencimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Los datos se mostrarán cuando haya cuotas registradas.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
