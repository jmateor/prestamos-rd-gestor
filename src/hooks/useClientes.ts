import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Cliente {
  id: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  cedula: string;
  fecha_nacimiento: string | null;
  sexo: string | null;
  estado_civil: string | null;
  nacionalidad: string;
  telefono: string;
  telefono2: string;
  email: string;
  direccion: string;
  sector: string;
  ciudad: string;
  provincia: string;
  referencia_direccion: string;
  tipo_vivienda: string;
  tiempo_residencia: string;
  lugar_trabajo: string;
  cargo: string;
  direccion_trabajo: string;
  telefono_trabajo: string;
  ingreso_mensual: number;
  otros_ingresos: number;
  antiguedad_laboral: string;
  estado: string;
  notas: string;
  foto: string;
  cedula_frontal_url: string;
  cedula_trasera_url: string;
  banco_nombre: string;
  numero_cuenta: string;
  created_at: string;
  updated_at: string;
}

export type ClienteInsert = Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'foto' | 'cedula_frontal_url' | 'cedula_trasera_url'>;

export function useClientes(search?: string) {
  return useQuery({
    queryKey: ['clientes', search],
    queryFn: async () => {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(
          `primer_nombre.ilike.%${s}%,primer_apellido.ilike.%${s}%,cedula.ilike.%${s}%,telefono.ilike.%${s}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (cliente: ClienteInsert) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente registrado exitosamente');
    },
    onError: (error: any) => {
      if (error.message?.includes('clientes_cedula_key')) {
        toast.error('Ya existe un cliente con esa cédula');
      } else {
        toast.error('Error al registrar cliente: ' + error.message);
      }
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cliente> }) => {
      const { error } = await supabase
        .from('clientes')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente actualizado');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });
}
