import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Usuarios & Roles ─────────────────────────────────────────────────────────

export interface UsuarioConRol {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  position: string | null;
  avatar_url: string | null;
  roles: string[];
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;

      const { data: roles, error: re } = await supabase
        .from('user_roles')
        .select('*');
      if (re) throw re;

      const roleMap = new Map<string, string[]>();
      for (const r of roles ?? []) {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      }

      return (profiles ?? []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        phone: p.phone,
        position: p.position,
        avatar_url: p.avatar_url,
        roles: roleMap.get(p.user_id) ?? [],
      })) as UsuarioConRol[];
    },
  });
}

export function useAsignarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      const { error } = await supabase.from('user_roles').insert({
        user_id,
        role: role as 'admin' | 'oficial_credito' | 'cajero' | 'supervisor',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Rol asignado');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useRemoverRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user_id)
        .eq('role', role as 'admin' | 'oficial_credito' | 'cajero' | 'supervisor');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Rol removido');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Financiamientos ──────────────────────────────────────────────────────────

export interface Financiamiento {
  id: string;
  nombre: string;
  tasa_interes: number | null;
  interes_moratorio: number | null;
  plazo_min: number | null;
  plazo_max: number | null;
  tipo_amortizacion: string | null;
  activo: boolean | null;
}

export function useFinanciamientos() {
  return useQuery({
    queryKey: ['financiamientos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financiamientos')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data as Financiamiento[];
    },
  });
}

export function useCrearFinanciamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Financiamiento, 'id'>) => {
      const { error } = await supabase.from('financiamientos').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financiamientos'] });
      toast.success('Tipo de financiamiento creado');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useActualizarFinanciamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Financiamiento> & { id: string }) => {
      const { error } = await supabase.from('financiamientos').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financiamientos'] });
      toast.success('Financiamiento actualizado');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Zonas ────────────────────────────────────────────────────────────────────

export function useZonas() {
  return useQuery({
    queryKey: ['zonas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('zonas').select('*').order('nombre');
      if (error) throw error;
      return data;
    },
  });
}

export function useCrearZona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { error } = await supabase.from('zonas').insert({ nombre });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zonas'] });
      toast.success('Zona creada');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Cobradores ───────────────────────────────────────────────────────────────

export function useCobradores() {
  return useQuery({
    queryKey: ['cobradores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cobradores').select('*').order('nombre');
      if (error) throw error;
      return data;
    },
  });
}

export function useCrearCobrador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nombre: string; identificacion?: string; comision_cobro?: number; comision_venta?: number }) => {
      const { error } = await supabase.from('cobradores').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cobradores'] });
      toast.success('Cobrador creado');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Bancos ───────────────────────────────────────────────────────────────────

export function useBancos() {
  return useQuery({
    queryKey: ['bancos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bancos').select('*').order('nombre');
      if (error) throw error;
      return data;
    },
  });
}

export function useCrearBanco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nombre: string; numero_cuenta?: string }) => {
      const { error } = await supabase.from('bancos').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bancos'] });
      toast.success('Banco creado');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
