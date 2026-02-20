import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Cartera activa y vencida ──────────────────────────────────────────────────
export function useReporteCartera() {
  return useQuery({
    queryKey: ['reporte-cartera'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestamos')
        .select(`
          id, numero_prestamo, monto_aprobado, estado,
          fecha_desembolso, fecha_vencimiento,
          clientes(primer_nombre, primer_apellido, cedula)
        `)
        .in('estado', ['activo', 'en_mora'])
        .order('estado')
        .order('fecha_vencimiento');
      if (error) throw error;
      return data as any[];
    },
  });
}

// ── Clientes nuevos por periodo ───────────────────────────────────────────────
export function useReporteClientesNuevos(desde: string, hasta: string) {
  return useQuery({
    queryKey: ['reporte-clientes-nuevos', desde, hasta],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, primer_nombre, primer_apellido, cedula, telefono, created_at, estado')
        .gte('created_at', desde)
        .lte('created_at', hasta + 'T23:59:59')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

// ── Ingresos por interés (pagos registrados en periodo) ───────────────────────
export function useReporteIngresos(desde: string, hasta: string) {
  return useQuery({
    queryKey: ['reporte-ingresos', desde, hasta],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          id, monto_pagado, fecha_pago, metodo_pago,
          prestamos(numero_prestamo, tasa_interes,
            clientes(primer_nombre, primer_apellido))
        `)
        .gte('fecha_pago', desde)
        .lte('fecha_pago', hasta)
        .order('fecha_pago', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

// ── Pagos del día ─────────────────────────────────────────────────────────────
export function useReportePagosDia(fecha: string) {
  return useQuery({
    queryKey: ['reporte-pagos-dia', fecha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          id, monto_pagado, fecha_pago, metodo_pago, referencia,
          prestamos(numero_prestamo, clientes(primer_nombre, primer_apellido))
        `)
        .eq('fecha_pago', fecha)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

// ── Morosidad por antigüedad de saldo ─────────────────────────────────────────
export function useReporteMorosidad() {
  return useQuery({
    queryKey: ['reporte-morosidad'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('cuotas')
        .select(`
          id, numero_cuota, fecha_vencimiento, monto_cuota, monto_pagado, estado,
          prestamos(numero_prestamo, monto_aprobado,
            clientes(primer_nombre, primer_apellido, cedula, telefono))
        `)
        .lt('fecha_vencimiento', today)
        .neq('estado', 'pagada')
        .order('fecha_vencimiento');
      if (error) throw error;

      const rows = (data as any[]).map((c) => {
        const dias = Math.floor(
          (new Date().getTime() - new Date(c.fecha_vencimiento).getTime()) / 86_400_000
        );
        const tramo =
          dias <= 30 ? '1-30 días' :
          dias <= 60 ? '31-60 días' :
          dias <= 90 ? '61-90 días' : 'Más de 90 días';
        return { ...c, dias, tramo };
      });
      return rows;
    },
  });
}

// ── Préstamos por frecuencia ──────────────────────────────────────────────────
export function useReporteFrecuencia() {
  return useQuery({
    queryKey: ['reporte-frecuencia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestamos')
        .select('frecuencia_pago, monto_aprobado, estado')
        .neq('estado', 'cancelado');
      if (error) throw error;

      const grupos: Record<string, { count: number; monto: number }> = {};
      for (const p of data as any[]) {
        const k = p.frecuencia_pago as string;
        if (!grupos[k]) grupos[k] = { count: 0, monto: 0 };
        grupos[k].count++;
        grupos[k].monto += Number(p.monto_aprobado);
      }
      return Object.entries(grupos).map(([frecuencia, v]) => ({ frecuencia, ...v }));
    },
  });
}
