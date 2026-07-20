import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Empresa ──────────────────────────────────────────────────────────────────
export interface EmpresaInfo {
  id: string;
  nombre: string;
  razon_social: string;
  rnc: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  telefono: string;
  email: string;
  sitio_web: string;
  logo_url: string;
  regimen_fiscal: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  whatsapp_numero?: string;
}

export function useEmpresaInfo() {
  return useQuery({
    queryKey: ['empresa_info'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('empresa_info').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data as EmpresaInfo | null;
    },
  });
}

export function useActualizarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<EmpresaInfo> & { id: string }) => {
      const { error } = await (supabase as any).from('empresa_info').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['empresa_info'] }); toast.success('Empresa actualizada'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export async function subirLogoEmpresa(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('empresa-assets').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('empresa-assets').getPublicUrl(path);
  return data.publicUrl;
}

// ── Sucursales ───────────────────────────────────────────────────────────────
export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  es_principal: boolean;
  activo: boolean;
}

export function useSucursales() {
  return useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('sucursales').select('*').order('es_principal', { ascending: false }).order('nombre');
      if (error) throw error;
      return data as Sucursal[];
    },
  });
}

export function useCrearSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Omit<Sucursal, 'id'>) => {
      const { error } = await (supabase as any).from('sucursales').insert(s);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sucursales'] }); toast.success('Sucursal creada'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useActualizarSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Sucursal> & { id: string }) => {
      const { error } = await (supabase as any).from('sucursales').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sucursales'] }); toast.success('Sucursal actualizada'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useEliminarSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('sucursales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sucursales'] }); toast.success('Sucursal eliminada'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

// ── Configuración de impresión ──────────────────────────────────────────────
export interface ConfiguracionImpresion {
  id: string;
  tamano_tirilla: string;
  margen_izq: number;
  margen_der: number;
  alineacion_encabezado: 'left' | 'center' | 'right';
  mostrar_logo: boolean;
  mostrar_rnc: boolean;
  mostrar_direccion: boolean;
  mostrar_firma_cajero: boolean;
  mostrar_qr: boolean;
  frase_pie_recibo: string;
  pie_legal_contrato: string;
}

export function useConfigImpresion() {
  return useQuery({
    queryKey: ['config_impresion'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('configuracion_impresion').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data as ConfiguracionImpresion | null;
    },
  });
}

export function useActualizarConfigImpresion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<ConfiguracionImpresion> & { id: string }) => {
      const { error } = await (supabase as any).from('configuracion_impresion').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['config_impresion'] }); toast.success('Configuración de impresión guardada'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

// ── Plantillas de documentos ────────────────────────────────────────────────
export interface PlantillaDocumento {
  id: string;
  tipo: string;
  nombre: string;
  contenido_html: string;
  archivo_url: string;
  version: number;
  activo: boolean;
  updated_at: string;
}

export function usePlantillas() {
  return useQuery({
    queryKey: ['plantillas_documentos'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('plantillas_documentos').select('*').order('nombre');
      if (error) throw error;
      return data as PlantillaDocumento[];
    },
  });
}

export function useActualizarPlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; contenido_html?: string; archivo_url?: string | null }) => {
      const { data: current } = await (supabase as any).from('plantillas_documentos').select('version').eq('id', input.id).maybeSingle();
      const patch: Record<string, any> = { version: (current?.version ?? 1) + 1 };
      if (input.contenido_html !== undefined) patch.contenido_html = input.contenido_html;
      if (input.archivo_url !== undefined) patch.archivo_url = input.archivo_url;
      const { error } = await (supabase as any).from('plantillas_documentos').update(patch).eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plantillas_documentos'] }); toast.success('Plantilla guardada'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}


// ── Horarios Empresa (lectura para validación) ──────────────────────────────
export interface HorarioEmpresa {
  id: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

export function useHorariosEmpresa() {
  return useQuery({
    queryKey: ['empresa_horarios'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('empresa_horarios').select('*').order('dia_semana');
      if (error) throw error;
      return (data ?? []) as HorarioEmpresa[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Devuelve null si la fecha/hora cae dentro del horario; o mensaje de error. */
export function validarHorarioCita(
  fecha: string,
  hora: string,
  horarios: HorarioEmpresa[] | undefined,
): string | null {
  if (!horarios || horarios.length === 0) return null; // sin horarios = sin validación
  const dia = new Date(fecha + 'T12:00:00').getDay(); // 0=Domingo
  const h = horarios.find((r) => r.dia_semana === dia);
  if (!h || !h.activo) {
    const nombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `La empresa no labora los ${nombres[dia]}.`;
  }
  const hm = hora.slice(0, 5);
  const ap = h.hora_apertura.slice(0, 5);
  const ci = h.hora_cierre.slice(0, 5);
  if (hm < ap || hm > ci) {
    return `Hora fuera del horario laboral (${ap} - ${ci}).`;
  }
  return null;
}
