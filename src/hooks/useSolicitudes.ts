import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Solicitud {
  id: string;
  numero_solicitud: string;
  cliente_id: string;
  monto_solicitado: number;
  plazo_meses: number;
  frecuencia_pago: string;
  proposito: string;
  tasa_interes_sugerida: number;
  estado: string;
  comentarios_evaluacion: string;
  fecha_evaluacion: string | null;
  evaluado_por: string | null;
  oficial_credito_id: string;
  created_at: string;
  updated_at: string;
  // joined
  clientes?: {
    primer_nombre: string;
    primer_apellido: string;
    cedula: string;
    telefono: string;
  };
}

export interface Garante {
  id: string;
  solicitud_id: string;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  relacion: string;
  direccion: string;
  lugar_trabajo: string;
  ingreso_mensual: number;
  created_at: string;
}

export function useSolicitudes(filters?: { estado?: string; search?: string }) {
  return useQuery({
    queryKey: ['solicitudes', filters],
    queryFn: async () => {
      let query = supabase
        .from('solicitudes')
        .select('*, clientes(primer_nombre, primer_apellido, cedula, telefono)')
        .order('created_at', { ascending: false });

      if (filters?.estado && filters.estado !== 'todos') {
        query = query.eq('estado', filters.estado);
      }
      if (filters?.search?.trim()) {
        query = query.ilike('numero_solicitud', `%${filters.search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Solicitud[];
    },
  });
}

export function useSolicitud(id: string | undefined) {
  return useQuery({
    queryKey: ['solicitud', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*, clientes(*)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useGarantes(solicitudId: string | undefined) {
  return useQuery({
    queryKey: ['garantes', solicitudId],
    enabled: !!solicitudId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('garantes')
        .select('*')
        .eq('solicitud_id', solicitudId!)
        .order('created_at');
      if (error) throw error;
      return data as Garante[];
    },
  });
}

export interface SolicitudInsert {
  cliente_id: string;
  monto_solicitado: number;
  plazo_meses: number;
  frecuencia_pago: string;
  proposito: string;
  tasa_interes_sugerida: number;
}

export function useCreateSolicitud() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SolicitudInsert) => {
      const { data: result, error } = await supabase
        .from('solicitudes')
        .insert({
          ...data,
          oficial_credito_id: user!.id,
          numero_solicitud: 'TEMP', // trigger will overwrite
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast.success('Solicitud creada exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al crear solicitud: ' + error.message);
    },
  });
}

export function useUpdateSolicitudEstado() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, estado, comentarios }: { id: string; estado: string; comentarios?: string }) => {
      const { error } = await supabase
        .from('solicitudes')
        .update({
          estado,
          comentarios_evaluacion: comentarios || '',
          fecha_evaluacion: new Date().toISOString(),
          evaluado_por: user!.id,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast.success('Estado actualizado');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useAddGarante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Garante, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('garantes').insert(data);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({ queryKey: ['garantes', variables.solicitud_id] });
      toast.success('Garante agregado');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });
}
