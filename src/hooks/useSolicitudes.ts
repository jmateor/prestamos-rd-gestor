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
  // Guarantee fields
  tiene_garantia: boolean;
  tipo_garantia: string | null;
  garantia_marca: string;
  garantia_modelo: string;
  garantia_anio: number | null;
  garantia_color: string;
  garantia_numero_placa: string;
  garantia_numero_chasis: string;
  garantia_numero_matricula: string;
  garantia_estado_bien: string;
  garantia_direccion_propiedad: string;
  garantia_tipo_propiedad: string;
  garantia_tamano: string;
  garantia_documento_propiedad: string;
  garantia_nombre_articulo: string;
  garantia_valor_estimado: number;
  garantia_estado: string;
  garantia_notas: string;
  porcentaje_prestamo_garantia: number;
  // joined
  clientes?: {
    primer_nombre: string;
    primer_apellido: string;
    cedula: string;
    telefono: string;
  };
}

export interface GarantiaFoto {
  id: string;
  solicitud_id: string;
  tipo: string;
  nombre: string;
  url: string;
  created_at: string;
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

export function useGarantiaFotos(solicitudId: string | undefined) {
  return useQuery({
    queryKey: ['garantia_fotos', solicitudId],
    enabled: !!solicitudId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('solicitud_garantia_fotos')
        .select('*')
        .eq('solicitud_id', solicitudId!)
        .order('created_at');
      if (error) throw error;
      return data as GarantiaFoto[];
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
  tiene_garantia?: boolean;
  tipo_garantia?: string | null;
  garantia_marca?: string;
  garantia_modelo?: string;
  garantia_anio?: number | null;
  garantia_color?: string;
  garantia_numero_placa?: string;
  garantia_numero_chasis?: string;
  garantia_numero_matricula?: string;
  garantia_estado_bien?: string;
  garantia_direccion_propiedad?: string;
  garantia_tipo_propiedad?: string;
  garantia_tamano?: string;
  garantia_documento_propiedad?: string;
  garantia_nombre_articulo?: string;
  garantia_valor_estimado?: number;
  garantia_notas?: string;
  porcentaje_prestamo_garantia?: number;
}

export function useCreateSolicitud() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SolicitudInsert) => {
      const { data: result, error } = await (supabase as any)
        .from('solicitudes')
        .insert({
          ...data,
          oficial_credito_id: user!.id,
          numero_solicitud: 'TEMP',
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
      const updateData: any = {
        estado,
        comentarios_evaluacion: comentarios || '',
        fecha_evaluacion: new Date().toISOString(),
        evaluado_por: user!.id,
      };

      // When approved and has guarantee, set guarantee state to active
      if (estado === 'aprobada') {
        updateData.garantia_estado = 'activa';
      }

      const { error } = await (supabase as any)
        .from('solicitudes')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      queryClient.invalidateQueries({ queryKey: ['solicitud'] });
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

// Get all guarantees for a client (from their solicitudes)
export function useClienteGarantias(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['cliente_garantias', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('solicitudes')
        .select('id, numero_solicitud, tipo_garantia, garantia_marca, garantia_modelo, garantia_nombre_articulo, garantia_valor_estimado, garantia_estado, garantia_direccion_propiedad, tiene_garantia, prestamos(numero_prestamo, estado)')
        .eq('cliente_id', clienteId!)
        .eq('tiene_garantia', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}
