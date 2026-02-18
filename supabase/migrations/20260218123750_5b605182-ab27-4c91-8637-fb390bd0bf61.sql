
-- ============================================================
-- PHASE 4: prestamos, cuotas, pagos
-- ============================================================

-- Sequence for loan numbers
CREATE SEQUENCE IF NOT EXISTS public.prestamo_seq START 1;

-- ── prestamos ──────────────────────────────────────────────
CREATE TABLE public.prestamos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_prestamo     TEXT NOT NULL UNIQUE,
  solicitud_id        UUID REFERENCES public.solicitudes(id) ON DELETE SET NULL,
  cliente_id          UUID NOT NULL,
  monto_aprobado      NUMERIC(14,2) NOT NULL,
  tasa_interes        NUMERIC(6,4) NOT NULL,          -- mensual en decimal ej. 0.05
  plazo_meses         INTEGER NOT NULL,
  frecuencia_pago     TEXT NOT NULL DEFAULT 'mensual', -- diaria|semanal|quincenal|mensual
  metodo_amortizacion TEXT NOT NULL DEFAULT 'cuota_fija', -- cuota_fija|interes_simple|saldo_insoluto
  estado              TEXT NOT NULL DEFAULT 'activo',  -- activo|al_dia|en_mora|cancelado|castigado
  fecha_desembolso    DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento   DATE,
  oficial_credito_id  UUID NOT NULL,
  notas               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view prestamos"   ON public.prestamos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users insert prestamos" ON public.prestamos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users update prestamos" ON public.prestamos FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── cuotas ─────────────────────────────────────────────────
CREATE TABLE public.cuotas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id      UUID NOT NULL REFERENCES public.prestamos(id) ON DELETE CASCADE,
  numero_cuota     INTEGER NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  monto_cuota      NUMERIC(14,2) NOT NULL,
  capital          NUMERIC(14,2) NOT NULL DEFAULT 0,
  interes          NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_pendiente  NUMERIC(14,2) NOT NULL DEFAULT 0,
  monto_pagado     NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado           TEXT NOT NULL DEFAULT 'pendiente',  -- pendiente|pagada|parcial|vencida
  fecha_pago       DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view cuotas"   ON public.cuotas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users insert cuotas" ON public.cuotas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users update cuotas" ON public.cuotas FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── pagos ──────────────────────────────────────────────────
CREATE TABLE public.pagos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id     UUID NOT NULL REFERENCES public.prestamos(id) ON DELETE CASCADE,
  cuota_id        UUID REFERENCES public.cuotas(id) ON DELETE SET NULL,
  monto_pagado    NUMERIC(14,2) NOT NULL,
  fecha_pago      DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago     TEXT NOT NULL DEFAULT 'efectivo',   -- efectivo|transferencia|cheque
  referencia      TEXT DEFAULT '',
  recibido_por    UUID,
  notas           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view pagos"   ON public.pagos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users insert pagos" ON public.pagos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users update pagos" ON public.pagos FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── auto-number trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_prestamo_numero()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.numero_prestamo := 'PRE-' || LPAD(nextval('public.prestamo_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prestamo_numero
  BEFORE INSERT ON public.prestamos
  FOR EACH ROW EXECUTE FUNCTION public.generate_prestamo_numero();

-- ── updated_at triggers ─────────────────────────────────────
CREATE TRIGGER update_prestamos_updated_at
  BEFORE UPDATE ON public.prestamos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
