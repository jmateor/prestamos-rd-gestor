import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LiquidacionCalc {
  capital_pendiente: number;
  interes_pendiente: number;
  mora_total: number;
  total: number;
  cuotas_pendientes: number;
  cuotas_vencidas: number;
}

/**
 * Calcula mora: 5% del monto de la cuota por cada período vencido
 * Solo aplica a cuotas con fecha_vencimiento < hoy
 */
function calcularMoraCuota(montoCuota: number, fechaVencimiento: string, frecuencia: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento);
  vence.setHours(0, 0, 0, 0);

  if (vence >= hoy) return 0;

  const diasAtraso = Math.floor((hoy.getTime() - vence.getTime()) / 86_400_000);
  if (diasAtraso <= 0) return 0;

  // Período según frecuencia
  const diasPorPeriodo: Record<string, number> = {
    diaria: 1,
    semanal: 7,
    quincenal: 15,
    mensual: 30,
  };
  const periodo = diasPorPeriodo[frecuencia] ?? 30;
  const periodosAtraso = Math.ceil(diasAtraso / periodo);

  // 5% del monto de cuota por período de atraso
  return Math.round(montoCuota * 0.05 * periodosAtraso * 100) / 100;
}

export function useSaldarPrestamo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCalculando, setIsCalculando] = useState(false);

  const calcular = async (prestamoId: string): Promise<LiquidacionCalc> => {
    setIsCalculando(true);
    try {
      // Get prestamo info for frecuencia
      const { data: prestamo } = await supabase
        .from('prestamos')
        .select('frecuencia_pago')
        .eq('id', prestamoId)
        .single();

      const frecuencia = prestamo?.frecuencia_pago ?? 'mensual';

      // Get all pending cuotas
      const { data: cuotas, error } = await supabase
        .from('cuotas')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .neq('estado', 'pagada')
        .order('numero_cuota');

      if (error) throw error;
      if (!cuotas || cuotas.length === 0) {
        return { capital_pendiente: 0, interes_pendiente: 0, mora_total: 0, total: 0, cuotas_pendientes: 0, cuotas_vencidas: 0 };
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      let capital_pendiente = 0;
      let interes_pendiente = 0;
      let mora_total = 0;
      let cuotas_vencidas = 0;

      for (const c of cuotas) {
        const pagado = c.monto_pagado ?? 0;
        const restante = c.monto_cuota - pagado;
        if (restante <= 0) continue;

        // Proportional split of remaining into capital/interes
        const ratio = restante / c.monto_cuota;
        capital_pendiente += c.capital * ratio;
        interes_pendiente += c.interes * ratio;

        // Mora only on overdue cuotas
        const vence = new Date(c.fecha_vencimiento);
        vence.setHours(0, 0, 0, 0);
        if (vence < hoy) {
          cuotas_vencidas++;
          mora_total += calcularMoraCuota(c.monto_cuota, c.fecha_vencimiento, frecuencia);
        }
      }

      capital_pendiente = Math.round(capital_pendiente * 100) / 100;
      interes_pendiente = Math.round(interes_pendiente * 100) / 100;

      return {
        capital_pendiente,
        interes_pendiente,
        mora_total,
        total: capital_pendiente + interes_pendiente + mora_total,
        cuotas_pendientes: cuotas.length,
        cuotas_vencidas,
      };
    } finally {
      setIsCalculando(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async ({
      prestamo_id,
      monto_total,
      fecha_pago,
      metodo_pago,
      referencia,
    }: {
      prestamo_id: string;
      monto_total: number;
      fecha_pago: string;
      metodo_pago: string;
      referencia?: string;
    }) => {
      // 1. Get all pending cuotas
      const { data: cuotas, error: ce } = await supabase
        .from('cuotas')
        .select('*')
        .eq('prestamo_id', prestamo_id)
        .neq('estado', 'pagada')
        .order('numero_cuota');

      if (ce) throw ce;

      // 2. Insert one pago per cuota
      for (const c of cuotas ?? []) {
        const pendiente = c.monto_cuota - (c.monto_pagado ?? 0);
        if (pendiente <= 0) continue;

        await supabase.from('pagos').insert({
          prestamo_id,
          cuota_id: c.id,
          monto_pagado: pendiente,
          fecha_pago,
          metodo_pago,
          referencia: referencia ?? '',
          notas: 'Saldo total de préstamo',
          recibido_por: user!.id,
        });

        await supabase
          .from('cuotas')
          .update({
            monto_pagado: c.monto_cuota,
            estado: 'pagada',
            fecha_pago,
          })
          .eq('id', c.id);
      }

      // 3. Mark prestamo as cancelado
      await supabase
        .from('prestamos')
        .update({ estado: 'cancelado' })
        .eq('id', prestamo_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
      queryClient.invalidateQueries({ queryKey: ['cobranza'] });
      queryClient.invalidateQueries({ queryKey: ['cobranza-resumen'] });
      queryClient.invalidateQueries({ queryKey: ['cuotas'] });
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      toast.success('Préstamo saldado exitosamente');
    },
    onError: (e: any) => toast.error('Error al saldar: ' + e.message),
  });

  return {
    calcular,
    saldar: mutation.mutateAsync,
    isCalculando,
    isSaldando: mutation.isPending,
  };
}
