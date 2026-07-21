import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const ETAPAS_LEAD = ['nuevo', 'contactado', 'calificado', 'cotizado', 'ganado', 'perdido'] as const;
export type EtapaLead = (typeof ETAPAS_LEAD)[number];

export const ORIGENES_LEAD = ['referido', 'redes_sociales', 'web', 'walk_in', 'whatsapp', 'telefono', 'otro'] as const;

export interface Lead {
  id: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  ciudad: string | null;
  origen: string;
  etapa: EtapaLead;
  monto_estimado: number | null;
  proposito: string | null;
  notas: string | null;
  asignado_a: string | null;
  cliente_id: string | null;
  convertido_at: string | null;
  perdido_motivo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await (supabase as any)
        .from('leads')
        .insert({ ...lead, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead creado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { error } = await (supabase as any).from('leads').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead eliminado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
