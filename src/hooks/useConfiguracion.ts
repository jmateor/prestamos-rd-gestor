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
    mutationFn: async ({ id, contenido_html }: { id: string; contenido_html: string }) => {
      const { data: current } = await (supabase as any).from('plantillas_documentos').select('version').eq('id', id).maybeSingle();
      const { error } = await (supabase as any).from('plantillas_documentos').update({
        contenido_html,
        version: (current?.version ?? 1) + 1,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plantillas_documentos'] }); toast.success('Plantilla guardada'); },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
