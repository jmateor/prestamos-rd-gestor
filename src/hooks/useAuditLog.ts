import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AuditEntry {
  id: string;
  user_id: string;
  accion: string;
  tabla: string;
  registro_id: string | null;
  datos_anteriores: any;
  datos_nuevos: any;
  notas: string | null;
  created_at: string;
}

export function useAuditLog(filters?: { tabla?: string; limit?: number }) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 100);

      if (filters?.tabla) query = query.eq('tabla', filters.tabla);

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditEntry[];
    },
  });
}

export function useRegistrarAudit() {
  const { user } = useAuth();

  return async (entry: {
    accion: string;
    tabla: string;
    registro_id?: string;
    datos_anteriores?: any;
    datos_nuevos?: any;
    notas?: string;
  }) => {
    if (!user) return;
    await supabase.from('audit_log').insert({
      user_id: user.id,
      ...entry,
    });
  };
}

export function useReversarPago() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ pago_id, motivo }: { pago_id: string; motivo: string }) => {
      // Get pago data
      const { data: pago, error: pe } = await supabase
        .from('pagos')
        .select('*')
        .eq('id', pago_id)
        .single();
      if (pe) throw pe;

      // Reverse the cuota
      if (pago.cuota_id) {
        const { data: cuota } = await supabase
          .from('cuotas')
          .select('monto_pagado, monto_cuota')
          .eq('id', pago.cuota_id)
          .single();

        if (cuota) {
          const newPagado = Math.max(0, (cuota.monto_pagado ?? 0) - pago.monto_pagado);
          const newEstado = newPagado <= 0 ? 'pendiente' : newPagado >= cuota.monto_cuota ? 'pagada' : 'parcial';
          await supabase.from('cuotas').update({
            monto_pagado: newPagado,
            estado: newEstado,
            fecha_pago: newEstado === 'pagada' ? undefined : null,
          }).eq('id', pago.cuota_id);
        }
      }

      // Delete the pago
      const { error: de } = await supabase.from('pagos').delete().eq('id', pago_id);
      if (de) throw de;

      // Audit log
      await supabase.from('audit_log').insert({
        user_id: user!.id,
        accion: 'reverso_pago',
        tabla: 'pagos',
        registro_id: pago_id,
        datos_anteriores: pago,
        notas: motivo,
      });

      return pago;
    },
    onSuccess: (_d) => {
      qc.invalidateQueries({ queryKey: ['cuotas'] });
      qc.invalidateQueries({ queryKey: ['pagos'] });
      qc.invalidateQueries({ queryKey: ['prestamos'] });
      qc.invalidateQueries({ queryKey: ['cobranza'] });
      qc.invalidateQueries({ queryKey: ['audit-log'] });
    },
  });
}
