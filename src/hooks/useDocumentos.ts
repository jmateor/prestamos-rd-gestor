import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DocumentoGenerado {
  id: string;
  numero_documento: string;
  tipo_documento: string;
  categoria: string | null;
  plantilla_id: string | null;
  prestamo_id: string | null;
  cliente_id: string | null;
  papel: string;
  fecha_vencimiento: string | null;
  contenido_html: string;
  variables_snapshot: any;
  testigos_snapshot: any[];
  estado: string;
  version: number;
  ip: string | null;
  generado_por: string | null;
  created_at: string;
  updated_at: string;
  clientes?: { primer_nombre?: string; primer_apellido?: string; cedula?: string } | null;
  prestamos?: { numero_prestamo?: string } | null;
  profiles?: { full_name?: string } | null;
}

export function useDocumentos(filters?: { search?: string; tipo?: string }) {
  return useQuery({
    queryKey: ['documentos_generados', filters],
    queryFn: async () => {
      let q = (supabase as any).from('documentos_generados')
        .select('*, clientes(primer_nombre, primer_apellido, cedula), prestamos(numero_prestamo)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (filters?.tipo && filters.tipo !== 'todos') q = q.eq('tipo_documento', filters.tipo);
      if (filters?.search?.trim()) q = q.ilike('numero_documento', `%${filters.search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DocumentoGenerado[];
    },
  });
}

export function useCrearDocumento() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      tipo_documento: string;
      categoria?: string | null;
      plantilla_id?: string | null;
      prestamo_id?: string | null;
      cliente_id?: string | null;
      papel: string;
      fecha_vencimiento?: string | null;
      contenido_html: string;
      variables_snapshot: any;
      testigos_snapshot: any[];
    }) => {
      const { data, error } = await (supabase as any).from('documentos_generados').insert({
        ...input,
        generado_por: user?.id,
        estado: 'generado',
        version: 1,
      }).select('*').single();
      if (error) throw error;
      return data as DocumentoGenerado;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documentos_generados'] }); toast.success('Documento guardado'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useEliminarDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('documentos_generados').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documentos_generados'] }); toast.success('Documento eliminado'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
