import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Loader2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useCreditScore, useRecalculateCreditScore, type CreditScoreResult } from '@/hooks/useCreditScore';
import { formatCurrency } from '@/lib/format';

const riesgoConfig: Record<string, { color: string; bg: string; icon: typeof Shield; label: string }> = {
  bajo: { color: 'text-success', bg: 'bg-success/10 border-success/20', icon: ShieldCheck, label: 'Bajo Riesgo' },
  medio: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', icon: Shield, label: 'Riesgo Medio' },
  alto: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: ShieldAlert, label: 'Alto Riesgo' },
};

interface Props {
  clienteId: string;
  compact?: boolean;
}

export function CreditScoreIndicator({ clienteId, compact = false }: Props) {
  const { data: scoreData, isLoading } = useCreditScore(clienteId);
  const recalculate = useRecalculateCreditScore();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!scoreData) {
    return (
      <Card>
        <CardContent className="pt-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Sin score calculado</p>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => recalculate.mutate(clienteId)} disabled={recalculate.isPending}>
            {recalculate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Calcular Score
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = riesgoConfig[scoreData.nivel_riesgo] ?? riesgoConfig.medio;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 ${config.bg}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-bold ${config.color}`}>{scoreData.credit_score}</span>
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <Card className={`border ${config.bg}`}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <span className="font-semibold text-sm">Credit Score</span>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => recalculate.mutate(clienteId)} disabled={recalculate.isPending}>
            {recalculate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>

        <div className="flex items-end gap-3">
          <span className={`text-4xl font-bold ${config.color}`}>{scoreData.credit_score}</span>
          <Badge variant="outline" className={config.bg + ' ' + config.color}>{config.label}</Badge>
        </div>

        <Progress value={scoreData.credit_score} className="h-2" />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Metric label="Préstamos Activos" value={String(scoreData.detalles.prestamos_activos)} />
          <Metric label="Saldados" value={String(scoreData.detalles.prestamos_saldados)} />
          <Metric label="En Mora" value={String(scoreData.detalles.prestamos_en_mora)} warn={scoreData.detalles.prestamos_en_mora > 0} />
          <Metric label="Cuotas Vencidas" value={String(scoreData.detalles.cuotas_vencidas)} warn={scoreData.detalles.cuotas_vencidas > 0} />
          <Metric label="Ratio Deuda/Ingreso" value={`${scoreData.detalles.ratio_deuda_ingreso}%`} warn={scoreData.detalles.ratio_deuda_ingreso > 70} />
          <Metric label="Antigüedad" value={`${scoreData.detalles.meses_como_cliente} meses`} />
          <Metric label="Ingreso Total" value={formatCurrency(scoreData.detalles.ingreso_total)} />
          <Metric label="Deuda Activa" value={formatCurrency(scoreData.detalles.deuda_activa)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={`font-semibold ${warn ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}
