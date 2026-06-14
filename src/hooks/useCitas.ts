import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Cita {
  id: string;
  numero_cita: string;
  cliente_id: string;
  solicitud_id: string | null;
  solicitado_por: string | null;
  asignada_a: string | null;
  fecha_cita: string;       // YYYY-MM-DD
  hora_cita: string;        // HH:MM:SS
  motivo: string;
  notas_oficial: string | null;
  estado: 'programada' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';
  resultado: 'aprobar' | 'rechazar' | 'posponer' | null;
  notas_administrador: string | null;
  fecha_atencion: string | null;
  created_at: string;
  updated_at: string;
  clientes?: { primer_nombre: string; primer_apellido: string; cedula: string; telefono: string };
  solicitudes?: { numero_solicitud: string; monto_solicitado: number; estado: string };
}

export interface CitasFiltros {
  estado?: string;
  desde?: string;
  hasta?: string;
  cliente_id?: string;
  solo_mias?: boolean;
}

export function useCitas(filtros: CitasFiltros = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['citas', filtros, user?.id],
    queryFn: async () => {
      let q = (supabase as any)
        .from('citas_clientes')
        .select('*, clientes(primer_nombre, primer_apellido, cedula, telefono), solicitudes(numero_solicitud, monto_solicitado, estado)')
        .order('fecha_cita', { ascending: true })
        .order('hora_cita', { ascending: true });

      if (filtros.estado && filtros.estado !== 'todos') q = q.eq('estado', filtros.estado);
      if (filtros.desde) q = q.gte('fecha_cita', filtros.desde);
      if (filtros.hasta) q = q.lte('fecha_cita', filtros.hasta);
      if (filtros.cliente_id) q = q.eq('cliente_id', filtros.cliente_id);
      if (filtros.solo_mias && user?.id) q = q.or(`solicitado_por.eq.${user.id},asignada_a.eq.${user.id}`);

      const { data, error } = await q;
      if (error) throw error;
      return data as Cita[];
    },
  });
}

export function useCitasPorSolicitud(solicitud_id?: string) {
  return useQuery({
    queryKey: ['citas-solicitud', solicitud_id],
    enabled: !!solicitud_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('citas_clientes')
        .select('*')
        .eq('solicitud_id', solicitud_id)
        .order('fecha_cita', { ascending: false });
      if (error) throw error;
      return data as Cita[];
    },
  });
}

export function useCitasPendientesCount() {
  return useQuery({
    queryKey: ['citas-pendientes-count'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { count, error } = await (supabase as any)
        .from('citas_clientes')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['programada', 'confirmada'])
        .gte('fecha_cita', today);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60 * 1000,
  });
}

export function useCrearCita() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<Cita>) => {
      const payload = {
        cliente_id: data.cliente_id,
        solicitud_id: data.solicitud_id ?? null,
        asignada_a: data.asignada_a ?? null,
        fecha_cita: data.fecha_cita,
        hora_cita: data.hora_cita,
        motivo: data.motivo,
        notas_oficial: data.notas_oficial ?? null,
        estado: 'programada',
        solicitado_por: user?.id ?? null,
      };
      const { data: row, error } = await (supabase as any).from('citas_clientes').insert(payload).select('*').single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] });
      qc.invalidateQueries({ queryKey: ['citas-solicitud'] });
      qc.invalidateQueries({ queryKey: ['citas-pendientes-count'] });
      toast.success('Cita programada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useActualizarCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Cita> & { id: string }) => {
      const { error } = await (supabase as any).from('citas_clientes').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] });
      qc.invalidateQueries({ queryKey: ['citas-solicitud'] });
      qc.invalidateQueries({ queryKey: ['citas-pendientes-count'] });
      toast.success('Cita actualizada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useAtenderCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      resultado,
      notas_administrador,
      solicitud_id,
    }: {
      id: string;
      resultado: 'aprobar' | 'rechazar' | 'posponer';
      notas_administrador: string;
      solicitud_id?: string | null;
    }) => {
      const { error } = await (supabase as any)
        .from('citas_clientes')
        .update({
          estado: 'atendida',
          resultado,
          notas_administrador,
          fecha_atencion: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      // Aplicar decisión a la solicitud vinculada
      if (solicitud_id && resultado === 'rechazar') {
        await (supabase as any)
          .from('solicitudes')
          .update({
            estado: 'rechazada',
            comentarios_evaluacion: 'Rechazada en cita con administrador: ' + notas_administrador,
            fecha_evaluacion: new Date().toISOString(),
          })
          .eq('id', solicitud_id);
      }
      if (solicitud_id && resultado === 'aprobar') {
        // Marca evaluación favorable, pero NO aprueba automáticamente — el oficial cierra el flujo
        await (supabase as any)
          .from('solicitudes')
          .update({
            comentarios_evaluacion: 'Cita aprobada por administrador: ' + notas_administrador,
          })
          .eq('id', solicitud_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['citas'] });
      qc.invalidateQueries({ queryKey: ['citas-solicitud'] });
      qc.invalidateQueries({ queryKey: ['citas-pendientes-count'] });
      qc.invalidateQueries({ queryKey: ['solicitudes'] });
      qc.invalidateQueries({ queryKey: ['solicitud'] });
      toast.success('Cita atendida y decisión registrada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

// Lista de administradores para asignar
export function useAdministradores() {
  return useQuery({
    queryKey: ['administradores-list'],
    queryFn: async () => {
      const { data: roles, error: e1 } = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      if (e1) throw e1;
      const ids = (roles ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [];
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', ids);
      if (error) throw error;
      return data as { user_id: string; full_name: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
