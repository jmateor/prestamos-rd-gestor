import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreditScoreResult {
  credit_score: number;
  nivel_riesgo: 'bajo' | 'medio' | 'alto';
  detalles: {
    prestamos_activos: number;
    prestamos_saldados: number;
    prestamos_en_mora: number;
    cuotas_vencidas: number;
    total_cuotas: number;
    ratio_deuda_ingreso: number;
    meses_como_cliente: number;
    solicitudes_rechazadas: number;
    ingreso_total: number;
    deuda_activa: number;
  };
}

export function useCreditScore(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['credit-score', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calculate-credit-score', {
        body: { cliente_id: clienteId },
      });
      if (error) throw error;
      return data as CreditScoreResult;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });
}

export function useRecalculateCreditScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clienteId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-credit-score', {
        body: { cliente_id: clienteId },
      });
      if (error) throw error;
      return data as CreditScoreResult;
    },
    onSuccess: (_d, clienteId) => {
      qc.invalidateQueries({ queryKey: ['credit-score', clienteId] });
      qc.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Score crediticio recalculado');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });
}

export function useOcrCedula() {
  return useMutation({
    mutationFn: async (imageUrl: string) => {
      const { data, error } = await supabase.functions.invoke('ocr-cedula', {
        body: { image_url: imageUrl },
      });
      if (error) throw error;
      return data as { success: boolean; data: any };
    },
    onError: (e: any) => toast.error('Error OCR: ' + e.message),
  });
}

// Dashboard hooks
export function useDashboardRiskMetrics() {
  return useQuery({
    queryKey: ['dashboard-risk-metrics'],
    queryFn: async () => {
      // Get all clients with scores
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, credit_score, nivel_riesgo, primer_nombre, primer_apellido, cedula');

      const cls = clientes ?? [];
      const conScore = cls.filter(c => c.credit_score != null);

      const altoRiesgo = conScore.filter(c => c.nivel_riesgo === 'alto').length;
      const medioRiesgo = conScore.filter(c => c.nivel_riesgo === 'medio').length;
      const bajoRiesgo = conScore.filter(c => c.nivel_riesgo === 'bajo').length;
      const promedioScore = conScore.length > 0
        ? Math.round(conScore.reduce((s, c) => s + (c.credit_score ?? 0), 0) / conScore.length)
        : 0;

      // Get active loans in default
      const { data: prestamos } = await supabase
        .from('prestamos')
        .select('id, cliente_id, estado');
      const pres = prestamos ?? [];
      const enMora = pres.filter(p => p.estado === 'mora' || p.estado === 'vencido').length;
      const clientesMora = new Set(
        pres.filter(p => p.estado === 'mora' || p.estado === 'vencido').map(p => p.cliente_id)
      ).size;
      const clientesMultiples = new Map<string, number>();
      pres.filter(p => p.estado === 'activo').forEach(p => {
        clientesMultiples.set(p.cliente_id, (clientesMultiples.get(p.cliente_id) ?? 0) + 1);
      });
      const conMultiples = [...clientesMultiples.values()].filter(v => v > 1).length;

      // Overdue cuotas for alerts
      const activeIds = pres.filter(p => p.estado === 'activo').map(p => p.id);
      let cuotasVencidas = 0;
      if (activeIds.length > 0) {
        const { count } = await supabase
          .from('cuotas')
          .select('id', { count: 'exact', head: true })
          .in('prestamo_id', activeIds)
          .eq('estado', 'pendiente')
          .lt('fecha_vencimiento', new Date().toISOString().split('T')[0]);
        cuotasVencidas = count ?? 0;
      }

      return {
        altoRiesgo,
        medioRiesgo,
        bajoRiesgo,
        promedioScore,
        clientesMora,
        prestamosEnMora: enMora,
        clientesMultiples: conMultiples,
        cuotasVencidas,
        totalConScore: conScore.length,
        totalClientes: cls.length,
      };
    },
  });
}

export function useTopClientes() {
  return useQuery({
    queryKey: ['top-clientes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, primer_nombre, primer_apellido, cedula, credit_score, nivel_riesgo')
        .not('credit_score', 'is', null)
        .order('credit_score', { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });
}

export function useClientesAltoRiesgo() {
  return useQuery({
    queryKey: ['clientes-alto-riesgo'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, primer_nombre, primer_apellido, cedula, credit_score, nivel_riesgo')
        .eq('nivel_riesgo', 'alto')
        .order('credit_score', { ascending: true })
        .limit(20);
      return data ?? [];
    },
  });
}
