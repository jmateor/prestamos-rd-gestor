import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { calcAmortizacion, type CuotaCalc } from '@/lib/amortizacion';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Prestamo {
  id: string;
  numero_prestamo: string;
  solicitud_id: string | null;
  cliente_id: string;
  monto_aprobado: number;
  tasa_interes: number;
  plazo_meses: number;
  frecuencia_pago: string;
  metodo_amortizacion: string;
  tipo_amortizacion: string;
  estado: string;
  fecha_desembolso: string;
  fecha_vencimiento: string | null;
  fecha_inicio: string | null;
  oficial_credito_id: string;
  notas: string;
  cuota_estimada: number | null;
  total_cuotas: number | null;
  monto_pagado: number;
  saldo_pendiente: number | null;
  gastos_legales: number;
  gastos_cierre: number;
  proposito: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  clientes?: {
    primer_nombre: string;
    primer_apellido: string;
    cedula: string;
    telefono: string;
  };
}

export interface Cuota {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_cuota: number;
  capital: number;
  interes: number;
  saldo_pendiente: number;
  monto_pagado: number;
  mora: number | null;
  estado: string;
  fecha_pago: string | null;
}

export interface Pago {
  id: string;
  prestamo_id: string;
  cuota_id: string | null;
  monto_pagado: number;
  fecha_pago: string;
  metodo_pago: string;
  referencia: string;
  notas: string;
  numero_cheque: string | null;
  banco_cheque: string | null;
  numero_referencia: string | null;
  cobrador_id: string | null;
  recibo_numero: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PrestamoInsert {
  solicitud_id?: string;
  cliente_id: string;
  monto_aprobado: number;
  tasa_interes: number;
  plazo_meses: number;
  frecuencia_pago: string;
  metodo_amortizacion: string;
  tipo_amortizacion?: string;
  fecha_desembolso: string;
  fecha_inicio_pago?: string;
  notas?: string;
  gastos_legales?: number;
  gastos_cierre?: number;
  proposito?: string;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function usePrestamos(filters?: { estado?: string; search?: string }) {
  return useQuery({
    queryKey: ['prestamos', filters],
    queryFn: async () => {
      let query = supabase
        .from('prestamos')
        .select('*, clientes(primer_nombre, primer_apellido, cedula, telefono)')
        .order('created_at', { ascending: false });

      if (filters?.estado && filters.estado !== 'todos') {
        query = query.eq('estado', filters.estado);
      }
      if (filters?.search?.trim()) {
        query = query.ilike('numero_prestamo', `%${filters.search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as Prestamo[];
    },
  });
}

export function usePrestamo(id: string | undefined) {
  return useQuery({
    queryKey: ['prestamo', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestamos')
        .select('*, clientes(*)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as Prestamo | null;
    },
  });
}

export function useCuotas(prestamoId: string | undefined) {
  return useQuery({
    queryKey: ['cuotas', prestamoId],
    enabled: !!prestamoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuotas')
        .select('*')
        .eq('prestamo_id', prestamoId!)
        .order('numero_cuota');
      if (error) throw error;
      return data as Cuota[];
    },
  });
}

export function usePagos(prestamoId: string | undefined) {
  return useQuery({
    queryKey: ['pagos', prestamoId],
    enabled: !!prestamoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('prestamo_id', prestamoId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Pago[];
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreatePrestamo() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: PrestamoInsert) => {
      // 1. Insert loan
      const { data: prestamo, error: pe } = await supabase
        .from('prestamos')
        .insert({
          ...input,
          numero_prestamo: 'TEMP',
          oficial_credito_id: user!.id,
          fecha_inicio: input.fecha_inicio_pago || input.fecha_desembolso,
        })
        .select()
        .single();
      if (pe) throw pe;

      // 2. Generate amortization table using fecha_inicio_pago as base date
      const fechaBase = input.fecha_inicio_pago || input.fecha_desembolso;
      const cuotas: CuotaCalc[] = calcAmortizacion(
        input.monto_aprobado,
        input.tasa_interes / 100,
        input.plazo_meses,
        input.frecuencia_pago,
        input.metodo_amortizacion,
        new Date(fechaBase),
      );

      // 3. Insert cuotas
      const cuotasInsert = cuotas.map((c) => ({
        prestamo_id: prestamo.id,
        numero_cuota: c.numero_cuota,
        fecha_vencimiento: c.fecha_vencimiento.toISOString().split('T')[0],
        monto_cuota: c.monto_cuota,
        capital: c.capital,
        interes: c.interes,
        saldo_pendiente: c.saldo_pendiente,
      }));

      const { error: ce } = await supabase.from('cuotas').insert(cuotasInsert);
      if (ce) throw ce;

      // 4. Update fecha_vencimiento on prestamo
      const lastDate = cuotas[cuotas.length - 1].fecha_vencimiento.toISOString().split('T')[0];
      await supabase.from('prestamos').update({ fecha_vencimiento: lastDate }).eq('id', prestamo.id);

      return prestamo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
      toast.success('Préstamo desembolsado exitosamente');
    },
    onError: (e: any) => toast.error('Error al crear préstamo: ' + e.message),
  });
}

export function useRegistrarPago() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      prestamo_id,
      cuota_id,
      monto_pagado,
      fecha_pago,
      metodo_pago,
      referencia,
      notas,
    }: {
      prestamo_id: string;
      cuota_id: string;
      monto_pagado: number;
      fecha_pago: string;
      metodo_pago: string;
      referencia?: string;
      notas?: string;
    }) => {
      // Insert pago
      const { error: pe } = await supabase.from('pagos').insert({
        prestamo_id,
        cuota_id,
        monto_pagado,
        fecha_pago,
        metodo_pago,
        referencia: referencia ?? '',
        notas: notas ?? '',
        recibido_por: user!.id,
      });
      if (pe) throw pe;

      // Update cuota
      const { data: cuota } = await supabase
        .from('cuotas')
        .select('monto_cuota, monto_pagado')
        .eq('id', cuota_id)
        .maybeSingle();

      if (cuota) {
        const totalPagado = (cuota.monto_pagado ?? 0) + monto_pagado;
        const nuevoEstado =
          totalPagado >= cuota.monto_cuota ? 'pagada' : 'parcial';
        await supabase
          .from('cuotas')
          .update({
            monto_pagado: totalPagado,
            estado: nuevoEstado,
            fecha_pago: nuevoEstado === 'pagada' ? fecha_pago : null,
          })
          .eq('id', cuota_id);
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['cuotas', vars.prestamo_id] });
      queryClient.invalidateQueries({ queryKey: ['pagos', vars.prestamo_id] });
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
      queryClient.invalidateQueries({ queryKey: ['cobranza'] });
      queryClient.invalidateQueries({ queryKey: ['cobranza-resumen'] });
      toast.success('Pago registrado');
    },
    onError: (e: any) => toast.error('Error al registrar pago: ' + e.message),
  });
}
