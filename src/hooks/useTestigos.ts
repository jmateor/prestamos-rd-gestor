import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Testigo {
  id: string;
  nombre: string;
  cedula: string | null;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
}

export function useTestigos() {
  return useQuery({
    queryKey: ['testigos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('testigos').select('*').eq('activo', true).order('nombre');
      if (error) throw error;
      return (data ?? []) as Testigo[];
    },
  });
}

export function useCrearTestigo() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (t: Omit<Testigo, 'id' | 'created_at' | 'activo'>) => {
      const { data, error } = await (supabase as any).from('testigos').insert({
        ...t, activo: true, created_by: user?.id,
      }).select('*').single();
      if (error) throw error;
      return data as Testigo;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['testigos'] }); toast.success('Testigo agregado'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
