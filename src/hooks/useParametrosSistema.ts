import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ParametroSistema {
  id: string;
  clave: string;
  valor: string;
  descripcion: string | null;
  categoria: string | null;
  tipo: string | null;
  created_at: string;
  updated_at: string;
}

export function useParametrosSistema(categoria?: string) {
  return useQuery({
    queryKey: ['parametros_sistema', categoria],
    queryFn: async () => {
      let query = (supabase as any)
        .from('parametros_sistema')
        .select('*')
        .order('categoria')
        .order('clave');

      if (categoria) {
        query = query.eq('categoria', categoria);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ParametroSistema[];
    },
  });
}

export function useParametro(clave: string) {
  return useQuery({
    queryKey: ['parametro', clave],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('parametros_sistema')
        .select('*')
        .eq('clave', clave)
        .maybeSingle();
      if (error) throw error;
      return data as ParametroSistema | null;
    },
  });
}

export function useActualizarParametro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: string }) => {
      const { error } = await (supabase as any)
        .from('parametros_sistema')
        .update({ valor, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parametros_sistema'] });
      qc.invalidateQueries({ queryKey: ['parametro'] });
      toast.success('Parámetro actualizado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useCrearParametro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ParametroSistema, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await (supabase as any)
        .from('parametros_sistema')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parametros_sistema'] });
      toast.success('Parámetro creado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
