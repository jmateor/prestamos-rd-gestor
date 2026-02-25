import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GarantiaPrendaria {
  id: string;
  tipo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  anio: number | null;
  color: string;
  numero_serie: string;
  numero_placa: string;
  numero_chasis: string;
  numero_matricula: string;
  numero_titulo: string;
  valor_estimado: number;
  ubicacion: string;
  estado: string;
  cliente_id: string | null;
  prestamo_id: string | null;
  notas: string;
  created_at: string;
  updated_at: string;
  // joined
  clientes?: { primer_nombre: string; primer_apellido: string; cedula: string } | null;
  documentos?: GarantiaDocumento[];
}

export interface GarantiaDocumento {
  id: string;
  garantia_id: string;
  tipo: string;
  nombre: string;
  url: string;
  created_at: string;
}

export interface GarantePersonal {
  id: string;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  telefono2: string;
  email: string;
  direccion: string;
  lugar_trabajo: string;
  cargo: string;
  ingreso_mensual: number;
  relacion: string;
  cliente_id: string | null;
  prestamo_id: string | null;
  estado: string;
  notas: string;
  created_at: string;
  updated_at: string;
  clientes?: { primer_nombre: string; primer_apellido: string; cedula: string } | null;
}

// ── Garantías Prendarias ──

export function useGarantiasPrendarias(filters?: { tipo?: string; search?: string }) {
  return useQuery({
    queryKey: ['garantias_prendarias', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('garantias_prendarias')
        .select('*, clientes(primer_nombre, primer_apellido, cedula)')
        .order('created_at', { ascending: false });

      if (filters?.tipo && filters.tipo !== 'todos') {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.search?.trim()) {
        query = query.or(
          `descripcion.ilike.%${filters.search.trim()}%,numero_placa.ilike.%${filters.search.trim()}%,numero_matricula.ilike.%${filters.search.trim()}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GarantiaPrendaria[];
    },
  });
}

export function useGarantiaDocumentos(garantiaId: string | undefined) {
  return useQuery({
    queryKey: ['garantia_documentos', garantiaId],
    enabled: !!garantiaId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('garantia_documentos')
        .select('*')
        .eq('garantia_id', garantiaId!)
        .order('created_at');
      if (error) throw error;
      return data as GarantiaDocumento[];
    },
  });
}

export function useCreateGarantiaPrendaria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<GarantiaPrendaria>) => {
      const { data: result, error } = await (supabase as any)
        .from('garantias_prendarias')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garantias_prendarias'] });
      toast.success('Garantía prendaria registrada');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useUploadGarantiaDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ garantiaId, file, tipo }: { garantiaId: string; file: File; tipo: string }) => {
      const ext = file.name.split('.').pop();
      const path = `${garantiaId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('garantias').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('garantias').getPublicUrl(path);

      const { error } = await (supabase as any)
        .from('garantia_documentos')
        .insert({ garantia_id: garantiaId, tipo, nombre: file.name, url: publicUrl });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['garantia_documentos', vars.garantiaId] });
      toast.success('Documento subido');
    },
    onError: (e: any) => toast.error('Error al subir: ' + e.message),
  });
}

export function useDeleteGarantiaDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, garantiaId }: { id: string; garantiaId: string }) => {
      const { error } = await (supabase as any).from('garantia_documentos').delete().eq('id', id);
      if (error) throw error;
      return garantiaId;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['garantia_documentos', vars.garantiaId] });
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

// ── Garantes Personales ──

export function useGarantesPersonales(filters?: { search?: string }) {
  return useQuery({
    queryKey: ['garantes_personales', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('garantes_personales')
        .select('*, clientes(primer_nombre, primer_apellido, cedula)')
        .order('created_at', { ascending: false });

      if (filters?.search?.trim()) {
        query = query.or(
          `nombre_completo.ilike.%${filters.search.trim()}%,cedula.ilike.%${filters.search.trim()}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GarantePersonal[];
    },
  });
}

export function useCreateGarantePersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<GarantePersonal>) => {
      const { data: result, error } = await (supabase as any)
        .from('garantes_personales')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garantes_personales'] });
      toast.success('Garante personal registrado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}
