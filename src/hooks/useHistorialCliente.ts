import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistorialPrestamo {
  id: string;
  numero_prestamo: string;
  monto_aprobado: number;
  tasa_interes: number;
  estado: string;
  fecha_desembolso: string;
  fecha_vencimiento: string | null;
}

export interface HistorialPago {
  id: string;
  monto_pagado: number;
  fecha_pago: string;
  metodo_pago: string;
  referencia: string | null;
  prestamo_id: string;
  prestamos?: { numero_prestamo: string };
}

export function useHistorialCliente(clienteId: string | undefined) {
  const prestamosQuery = useQuery({
    queryKey: ['historial-prestamos', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestamos')
        .select('id, numero_prestamo, monto_aprobado, tasa_interes, estado, fecha_desembolso, fecha_vencimiento')
        .eq('cliente_id', clienteId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as HistorialPrestamo[];
    },
  });

  const pagosQuery = useQuery({
    queryKey: ['historial-pagos', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      // Get all prestamo ids for this client
      const { data: pres } = await supabase
        .from('prestamos')
        .select('id, numero_prestamo')
        .eq('cliente_id', clienteId!);

      if (!pres || pres.length === 0) return [];

      const ids = pres.map((p) => p.id);
      const { data, error } = await supabase
        .from('pagos')
        .select('id, monto_pagado, fecha_pago, metodo_pago, referencia, prestamo_id')
        .in('prestamo_id', ids)
        .order('fecha_pago', { ascending: false })
        .limit(100);
      if (error) throw error;

      const preMap = new Map(pres.map((p) => [p.id, p.numero_prestamo]));
      return (data ?? []).map((p) => ({
        ...p,
        prestamos: { numero_prestamo: preMap.get(p.prestamo_id) ?? '' },
      })) as HistorialPago[];
    },
  });

  return { prestamos: prestamosQuery, pagos: pagosQuery };
}
