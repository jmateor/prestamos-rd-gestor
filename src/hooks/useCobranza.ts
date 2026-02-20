import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CuotaCobranza {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_cuota: number;
  capital: number;
  interes: number;
  saldo_pendiente: number;
  monto_pagado: number;
  estado: string;
  fecha_pago: string | null;
  // joined from prestamos + clientes
  prestamos?: {
    numero_prestamo: string;
    frecuencia_pago: string;
    cliente_id: string;
    clientes?: {
      primer_nombre: string;
      primer_apellido: string;
      cedula: string;
      telefono: string;
    };
  };
}

export type VistaCobranza = 'vencidas' | 'hoy' | 'proximas' | 'todas';

export function useCobranza(vista: VistaCobranza = 'vencidas', search = '') {
  const today = new Date().toISOString().split('T')[0];

  // Next 7 days window
  const en7dias = new Date();
  en7dias.setDate(en7dias.getDate() + 7);
  const en7diasStr = en7dias.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['cobranza', vista, search],
    queryFn: async () => {
      let query = supabase
        .from('cuotas')
        .select(`
          *,
          prestamos (
            numero_prestamo,
            frecuencia_pago,
            cliente_id,
            clientes (
              primer_nombre,
              primer_apellido,
              cedula,
              telefono
            )
          )
        `)
        .neq('estado', 'pagada')
        .order('fecha_vencimiento', { ascending: true });

      if (vista === 'vencidas') {
        query = query.lt('fecha_vencimiento', today);
      } else if (vista === 'hoy') {
        query = query.eq('fecha_vencimiento', today);
      } else if (vista === 'proximas') {
        query = query.gte('fecha_vencimiento', today).lte('fecha_vencimiento', en7diasStr);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data as unknown) as CuotaCobranza[];

      // Client-side search on numero_prestamo or client name
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        result = result.filter((c) => {
          const pre = c.prestamos;
          if (!pre) return false;
          const nombre = `${pre.clientes?.primer_nombre ?? ''} ${pre.clientes?.primer_apellido ?? ''}`.toLowerCase();
          return (
            pre.numero_prestamo.toLowerCase().includes(q) ||
            nombre.includes(q) ||
            (pre.clientes?.cedula ?? '').includes(q)
          );
        });
      }

      return result;
    },
  });
}

export function useResumenCobranza() {
  const today = new Date().toISOString().split('T')[0];
  const en7dias = new Date();
  en7dias.setDate(en7dias.getDate() + 7);
  const en7diasStr = en7dias.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['cobranza-resumen'],
    queryFn: async () => {
      const [vencidas, hoy, proximas] = await Promise.all([
        supabase
          .from('cuotas')
          .select('id, monto_cuota, monto_pagado', { count: 'exact' })
          .lt('fecha_vencimiento', today)
          .neq('estado', 'pagada'),
        supabase
          .from('cuotas')
          .select('id, monto_cuota, monto_pagado', { count: 'exact' })
          .eq('fecha_vencimiento', today)
          .neq('estado', 'pagada'),
        supabase
          .from('cuotas')
          .select('id, monto_cuota, monto_pagado', { count: 'exact' })
          .gt('fecha_vencimiento', today)
          .lte('fecha_vencimiento', en7diasStr)
          .neq('estado', 'pagada'),
      ]);

      const sumPendiente = (rows: any[]) =>
        rows.reduce((acc, r) => acc + (r.monto_cuota - r.monto_pagado), 0);

      return {
        vencidas: { count: vencidas.count ?? 0, monto: sumPendiente(vencidas.data ?? []) },
        hoy:      { count: hoy.count ?? 0,      monto: sumPendiente(hoy.data ?? []) },
        proximas: { count: proximas.count ?? 0,  monto: sumPendiente(proximas.data ?? []) },
      };
    },
  });
}
