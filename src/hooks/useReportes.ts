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
          fecha_desembolso, fecha_vencimiento, frecuencia_pago,
          tasa_interes, plazo_meses, oficial_credito_id,
          zona_id, cobrador_id,
          clientes(primer_nombre, primer_apellido, cedula, telefono),
          zonas(nombre),
          cobradores(nombre)
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
        .select('id, primer_nombre, primer_apellido, cedula, telefono, created_at, estado, provincia, ciudad')
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
          id, monto_pagado, fecha_pago, metodo_pago, capital_pagado, interes_pagado, mora_pagada,
          prestamos(numero_prestamo, tasa_interes, oficial_credito_id, zona_id, cobrador_id,
            clientes(primer_nombre, primer_apellido, cedula),
            zonas(nombre),
            cobradores(nombre))
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
          prestamos(numero_prestamo, oficial_credito_id, zona_id, cobrador_id,
            clientes(primer_nombre, primer_apellido, cedula),
            zonas(nombre),
            cobradores(nombre))
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
          prestamos(numero_prestamo, monto_aprobado, oficial_credito_id, zona_id, cobrador_id,
            clientes(primer_nombre, primer_apellido, cedula, telefono),
            zonas(nombre),
            cobradores(nombre))
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

// ── Zonas list ────────────────────────────────────────────────────────────────
export function useZonas() {
  return useQuery({
    queryKey: ['zonas-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('zonas').select('id, nombre').order('nombre');
      if (error) throw error;
      return data as { id: string; nombre: string }[];
    },
  });
}

// ── Cobradores list ───────────────────────────────────────────────────────────
export function useCobradores() {
  return useQuery({
    queryKey: ['cobradores-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cobradores').select('id, nombre').eq('activo', true).order('nombre');
      if (error) throw error;
      return data as { id: string; nombre: string }[];
    },
  });
}

// ── Profiles (oficiales) list ─────────────────────────────────────────────────
export function useOficiales() {
  return useQuery({
    queryKey: ['oficiales-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, full_name').order('full_name');
      if (error) throw error;
      return data as { user_id: string; full_name: string }[];
    },
  });
}
