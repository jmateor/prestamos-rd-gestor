import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContactoSocial {
  id: string;
  cliente_id: string;
  tipo: string;
  valor: string;
  created_at: string;
}

export function useContactosSociales(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['contactos_sociales', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contactos_sociales')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('created_at');
      if (error) throw error;
      return data as ContactoSocial[];
    },
  });
}

export function useUpsertContactoSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id?: string; cliente_id: string; tipo: string; valor: string }) => {
      if (data.id) {
        const { error } = await (supabase as any)
          .from('contactos_sociales')
          .update({ valor: data.valor })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('contactos_sociales')
          .insert({ cliente_id: data.cliente_id, tipo: data.tipo, valor: data.valor });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['contactos_sociales', vars.cliente_id] });
      toast.success('Contacto actualizado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useDeleteContactoSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cliente_id }: { id: string; cliente_id: string }) => {
      const { error } = await (supabase as any)
        .from('contactos_sociales')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return cliente_id;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['contactos_sociales', vars.cliente_id] });
    },
  });
}
