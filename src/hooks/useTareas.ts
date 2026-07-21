import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'] as const;
export const ESTADOS_TAREA = ['pendiente', 'en_progreso', 'completada', 'cancelada'] as const;

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: (typeof PRIORIDADES)[number];
  estado: (typeof ESTADOS_TAREA)[number];
  fecha_vencimiento: string | null;
  completada_at: string | null;
  asignado_a: string | null;
  cliente_id: string | null;
  lead_id: string | null;
  prestamo_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useTareas(filtro?: { asignadoA?: string; estado?: string; clienteId?: string; leadId?: string }) {
  return useQuery({
    queryKey: ['tareas', filtro],
    queryFn: async () => {
      let q = (supabase as any).from('tareas').select('*').order('fecha_vencimiento', { ascending: true, nullsFirst: false });
      if (filtro?.asignadoA) q = q.eq('asignado_a', filtro.asignadoA);
      if (filtro?.estado) q = q.eq('estado', filtro.estado);
      if (filtro?.clienteId) q = q.eq('cliente_id', filtro.clienteId);
      if (filtro?.leadId) q = q.eq('lead_id', filtro.leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Tarea[];
    },
  });
}

export function useTareasPendientesCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tareas-pendientes-count', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('tareas')
        .select('id', { count: 'exact', head: true })
        .eq('asignado_a', user!.id)
        .in('estado', ['pendiente', 'en_progreso']);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60000,
  });
}

export function useCreateTarea() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<Tarea>) => {
      const { error } = await (supabase as any)
        .from('tareas')
        .insert({ ...data, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] });
      qc.invalidateQueries({ queryKey: ['tareas-pendientes-count'] });
      toast.success('Tarea creada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useUpdateTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tarea> }) => {
      const payload: any = { ...data };
      if (data.estado === 'completada' && !data.completada_at) payload.completada_at = new Date().toISOString();
      const { error } = await (supabase as any).from('tareas').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] });
      qc.invalidateQueries({ queryKey: ['tareas-pendientes-count'] });
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useDeleteTarea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('tareas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tareas'] });
      qc.invalidateQueries({ queryKey: ['tareas-pendientes-count'] });
      toast.success('Tarea eliminada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
