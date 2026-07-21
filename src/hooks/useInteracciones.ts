import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const TIPOS_INTERACCION = ['llamada', 'whatsapp', 'email', 'sms', 'visita', 'nota', 'reunion'] as const;
export type TipoInteraccion = (typeof TIPOS_INTERACCION)[number];

export interface Interaccion {
  id: string;
  cliente_id: string | null;
  lead_id: string | null;
  tipo: TipoInteraccion;
  direccion: 'entrante' | 'saliente' | null;
  asunto: string | null;
  contenido: string | null;
  fecha: string;
  created_by: string | null;
  created_at: string;
}

export function useInteracciones(params: { clienteId?: string; leadId?: string }) {
  const { clienteId, leadId } = params;
  return useQuery({
    queryKey: ['interacciones', clienteId ?? null, leadId ?? null],
    enabled: !!(clienteId || leadId),
    queryFn: async () => {
      let q = (supabase as any).from('interacciones').select('*').order('fecha', { ascending: false });
      if (clienteId) q = q.eq('cliente_id', clienteId);
      if (leadId) q = q.eq('lead_id', leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Interaccion[];
    },
  });
}

export function useCreateInteraccion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<Interaccion>) => {
      const { error } = await (supabase as any)
        .from('interacciones')
        .insert({ ...data, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['interacciones', vars.cliente_id ?? null, vars.lead_id ?? null] });
      toast.success('Interacción registrada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useDeleteInteraccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('interacciones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interacciones'] });
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
