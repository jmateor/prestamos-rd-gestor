import { useMemo } from 'react';
import {
  calcAmortizacion,
  fechaBaseDesde,
  parseLocalDate,
  totalCuotas,
  type CuotaCalc,
} from '@/lib/amortizacion';

export interface AmortizacionPreviewInput {
  monto?: number | null;
  tasa_mensual?: number | null; // en %
  plazo_meses?: number | null;
  frecuencia?: string | null;
  metodo?: string | null;
  fecha_primer_pago?: string | null; // 'YYYY-MM-DD'
}

export interface AmortizacionPreview {
  cuotas: CuotaCalc[];
  cuota: number;
  totalCuotas: number;
  totalInteres: number;
  totalPagar: number;
  primerPago: Date | null;
  ultimoPago: Date | null;
}

/**
 * Hook único de preview de amortización usado en Desembolsos, Solicitudes,
 * PréstamoForm y cotizaciones. Devuelve null si faltan datos mínimos.
 */
export function useAmortizacionPreview(
  input: AmortizacionPreviewInput,
): AmortizacionPreview | null {
  return useMemo(() => {
    try {
      const monto = Number(input.monto ?? 0);
      const plazo = Number(input.plazo_meses ?? 0);
      const tasa = Number(input.tasa_mensual ?? 0);
      const frecuencia = input.frecuencia || 'mensual';
      const metodo = input.metodo || 'cuota_fija';
      if (!monto || !plazo) return null;

      const hoy = new Date().toISOString().slice(0, 10);
      const fpp = input.fecha_primer_pago || hoy;
      const fechaBase = fechaBaseDesde(parseLocalDate(fpp), frecuencia);
      const cuotas = calcAmortizacion(monto, tasa / 100, plazo, frecuencia, metodo, fechaBase);
      const totalInteres = cuotas.reduce((a, c) => a + c.interes, 0);
      const totalPagar = cuotas.reduce((a, c) => a + c.monto_cuota, 0);
      return {
        cuotas,
        cuota: cuotas[0]?.monto_cuota ?? 0,
        totalCuotas: totalCuotas(plazo, frecuencia),
        totalInteres: Math.round(totalInteres * 100) / 100,
        totalPagar: Math.round(totalPagar * 100) / 100,
        primerPago: cuotas[0]?.fecha_vencimiento ?? null,
        ultimoPago: cuotas[cuotas.length - 1]?.fecha_vencimiento ?? null,
      };
    } catch {
      return null;
    }
  }, [
    input.monto,
    input.tasa_mensual,
    input.plazo_meses,
    input.frecuencia,
    input.metodo,
    input.fecha_primer_pago,
  ]);
}
