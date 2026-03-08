import { AlertTriangle } from 'lucide-react';
import { useCreditScore } from '@/hooks/useCreditScore';

interface Props {
  clienteId: string;
}

export function ClienteRiskAlert({ clienteId }: Props) {
  const { data } = useCreditScore(clienteId);

  if (!data || data.nivel_riesgo !== 'alto') return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
      <span className="text-destructive font-medium">
        ⚠ Cliente con alto riesgo crediticio (Score: {data.credit_score})
        {data.detalles.prestamos_en_mora > 0 && ` · ${data.detalles.prestamos_en_mora} préstamo(s) en mora`}
        {data.detalles.cuotas_vencidas > 0 && ` · ${data.detalles.cuotas_vencidas} cuota(s) vencida(s)`}
      </span>
    </div>
  );
}
