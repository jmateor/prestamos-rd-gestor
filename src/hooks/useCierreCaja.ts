import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CierreCaja {
  id: string;
  caja_id: string | null;
  usuario_id: string;
  fecha: string;
  monto_apertura: number;
  monto_cierre: number;
  total_efectivo: number;
  total_transferencias: number;
  total_cheques: number;
  diferencia: number;
  notas: string | null;
  estado: string;
  created_at: string;
  cerrado_at: string | null;
}

export function useCierresCaja() {
  return useQuery({
    queryKey: ['cierres-caja'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CierreCaja[];
    },
  });
}

export function useCierreAbierto() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cierre-abierto', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cierres_caja')
        .select('*')
        .eq('usuario_id', user!.id)
        .eq('estado', 'abierto')
        .maybeSingle();
      if (error) throw error;
      return data as CierreCaja | null;
    },
  });
}

export function useAbrirCaja() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ monto_apertura }: { monto_apertura: number }) => {
      const { error } = await supabase.from('cierres_caja').insert({
        usuario_id: user!.id,
        monto_apertura,
        fecha: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cierres-caja'] });
      qc.invalidateQueries({ queryKey: ['cierre-abierto'] });
      toast.success('Caja abierta exitosamente');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCerrarCaja() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      cierre_id, monto_cierre, total_efectivo, total_transferencias, total_cheques, notas,
    }: {
      cierre_id: string;
      monto_cierre: number;
      total_efectivo: number;
      total_transferencias: number;
      total_cheques: number;
      notas?: string;
    }) => {
      const totalIngresos = total_efectivo + total_transferencias + total_cheques;
      const { data: cierre } = await supabase.from('cierres_caja').select('monto_apertura').eq('id', cierre_id).single();
      const diferencia = monto_cierre - ((cierre?.monto_apertura ?? 0) + totalIngresos);

      const { error } = await supabase.from('cierres_caja').update({
        monto_cierre,
        total_efectivo,
        total_transferencias,
        total_cheques,
        diferencia,
        notas: notas ?? '',
        estado: 'cerrado',
        cerrado_at: new Date().toISOString(),
      }).eq('id', cierre_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cierres-caja'] });
      qc.invalidateQueries({ queryKey: ['cierre-abierto'] });
      toast.success('Caja cerrada exitosamente');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
