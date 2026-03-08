import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Referencias ──
export interface ReferenciaCliente {
  id: string;
  cliente_id: string;
  tipo: string;
  nombre_completo: string;
  telefono: string;
  relacion: string;
  direccion: string;
  empresa: string;
  notas: string;
  created_at: string;
}

export function useReferencias(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['referencias-cliente', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referencias_cliente')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('created_at');
      if (error) throw error;
      return data as ReferenciaCliente[];
    },
  });
}

export function useAddReferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ref: Omit<ReferenciaCliente, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('referencias_cliente').insert(ref);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['referencias-cliente', v.cliente_id] });
      toast.success('Referencia agregada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useDeleteReferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cliente_id }: { id: string; cliente_id: string }) => {
      const { error } = await supabase.from('referencias_cliente').delete().eq('id', id);
      if (error) throw error;
      return cliente_id;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['referencias-cliente', v.cliente_id] });
      toast.success('Referencia eliminada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

// ── Dependientes ──
export interface DependienteCliente {
  id: string;
  cliente_id: string;
  nombre_completo: string;
  parentesco: string;
  edad: number | null;
  notas: string;
  created_at: string;
}

export function useDependientes(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['dependientes-cliente', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dependientes_cliente')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('created_at');
      if (error) throw error;
      return data as DependienteCliente[];
    },
  });
}

export function useAddDependiente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dep: Omit<DependienteCliente, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('dependientes_cliente').insert(dep);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['dependientes-cliente', v.cliente_id] });
      toast.success('Dependiente agregado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useDeleteDependiente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cliente_id }: { id: string; cliente_id: string }) => {
      const { error } = await supabase.from('dependientes_cliente').delete().eq('id', id);
      if (error) throw error;
      return cliente_id;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['dependientes-cliente', v.cliente_id] });
      toast.success('Dependiente eliminado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

// ── Cónyuge ──
export interface ConyugeCliente {
  id: string;
  cliente_id: string;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  lugar_trabajo: string;
  cargo: string;
  ingreso_mensual: number;
  notas: string;
  created_at: string;
}

export function useConyuge(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['conyuge-cliente', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conyuges_cliente')
        .select('*')
        .eq('cliente_id', clienteId!)
        .maybeSingle();
      if (error) throw error;
      return data as ConyugeCliente | null;
    },
  });
}

export function useUpsertConyuge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conyuge: Omit<ConyugeCliente, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('conyuges_cliente')
        .upsert(conyuge, { onConflict: 'cliente_id' });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['conyuge-cliente', v.cliente_id] });
      toast.success('Cónyuge actualizado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

// ── Perfil Crediticio ──
export function usePerfilCrediticio(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['perfil-crediticio', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data: solicitudes } = await supabase
        .from('solicitudes')
        .select('id, estado, comentarios_evaluacion')
        .eq('cliente_id', clienteId!);

      const { data: prestamos } = await supabase
        .from('prestamos')
        .select('id, estado, monto_aprobado')
        .eq('cliente_id', clienteId!);

      // Count overdue cuotas for active loans
      let cuotasVencidas = 0;
      if (prestamos && prestamos.length > 0) {
        const activeIds = prestamos.filter(p => p.estado === 'activo').map(p => p.id);
        if (activeIds.length > 0) {
          const { count } = await supabase
            .from('cuotas')
            .select('id', { count: 'exact', head: true })
            .in('prestamo_id', activeIds)
            .eq('estado', 'pendiente')
            .lt('fecha_vencimiento', new Date().toISOString().split('T')[0]);
          cuotasVencidas = count ?? 0;
        }
      }

      const sol = solicitudes ?? [];
      const pre = prestamos ?? [];

      return {
        total_solicitudes: sol.length,
        solicitudes_aprobadas: sol.filter(s => s.estado === 'aprobada').length,
        solicitudes_rechazadas: sol.filter(s => s.estado === 'rechazada').length,
        rechazos: sol.filter(s => s.estado === 'rechazada').map(s => ({
          id: s.id,
          motivo: s.comentarios_evaluacion || 'Sin motivo especificado',
        })),
        total_prestamos: pre.length,
        prestamos_activos: pre.filter(p => p.estado === 'activo').length,
        prestamos_saldados: pre.filter(p => p.estado === 'saldado').length,
        monto_total_prestado: pre.reduce((s, p) => s + (p.monto_aprobado || 0), 0),
        cuotas_vencidas: cuotasVencidas,
      };
    },
  });
}

// ── Upload document ──
export async function uploadClienteDocument(
  clienteId: string,
  file: File,
  tipo: 'foto' | 'cedula_frontal' | 'cedula_trasera'
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${clienteId}/${tipo}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('clientes')
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('clientes').getPublicUrl(path);
  return data.publicUrl;
}
