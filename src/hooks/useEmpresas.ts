import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmpresaData {
  lugar_trabajo: string;
  direccion_trabajo: string;
  telefono_trabajo: string;
}

/** Fetch distinct empresas from clientes for autocomplete */
export function useEmpresas(search?: string) {
  return useQuery({
    queryKey: ['empresas', search],
    enabled: (search?.trim().length ?? 0) >= 2,
    queryFn: async () => {
      const q = search?.trim() ?? '';
      const { data, error } = await supabase
        .from('clientes')
        .select('lugar_trabajo, direccion_trabajo, telefono_trabajo')
        .ilike('lugar_trabajo', `%${q}%`)
        .not('lugar_trabajo', 'eq', '')
        .limit(20);
      if (error) throw error;

      // Deduplicate by lugar_trabajo (case-insensitive)
      const map = new Map<string, EmpresaData>();
      for (const row of data ?? []) {
        const key = (row.lugar_trabajo ?? '').toLowerCase().trim();
        if (key && !map.has(key)) {
          map.set(key, {
            lugar_trabajo: row.lugar_trabajo ?? '',
            direccion_trabajo: row.direccion_trabajo ?? '',
            telefono_trabajo: row.telefono_trabajo ?? '',
          });
        }
      }
      return Array.from(map.values());
    },
    staleTime: 30_000,
  });
}
