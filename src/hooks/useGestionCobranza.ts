import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GestionCobranza {
  id: string;
  prestamo_id: string;
  cliente_id: string;
  cobrador_id: string | null;
  fecha_visita: string;
  resultado: string | null;
  tipo_gestion: string | null;
  notas: string | null;
  created_at: string;
  // joined
  clientes?: { primer_nombre: string; primer_apellido: string; cedula: string };
  prestamos?: { numero_prestamo: string };
  cobradores?: { nombre: string };
}

export function useGestionesCobranza(filters?: { prestamo_id?: string; cliente_id?: string; limit?: number }) {
  return useQuery({
    queryKey: ['gestion_cobranza', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('gestion_cobranza')
        .select('*, clientes(primer_nombre, primer_apellido, cedula), prestamos(numero_prestamo), cobradores(nombre)')
        .order('fecha_visita', { ascending: false })
        .limit(filters?.limit ?? 100);

      if (filters?.prestamo_id) query = query.eq('prestamo_id', filters.prestamo_id);
      if (filters?.cliente_id) query = query.eq('cliente_id', filters.cliente_id);

      const { data, error } = await query;
      if (error) throw error;
      return data as GestionCobranza[];
    },
  });
}

export function useCrearGestionCobranza() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      prestamo_id: string;
      cliente_id: string;
      cobrador_id?: string;
      fecha_visita: string;
      resultado?: string;
      tipo_gestion?: string;
      notas?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('gestion_cobranza')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gestion_cobranza'] });
      toast.success('Gestión de cobranza registrada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
