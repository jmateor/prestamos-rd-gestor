
-- Fix: Add missing foreign key from prestamos to clientes
ALTER TABLE public.prestamos
  ADD CONSTRAINT prestamos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);

-- Fix: Add missing foreign key from pagos to cuotas (verify)
-- Already exists per schema: pagos_cuota_id_fkey, pagos_prestamo_id_fkey

-- ═══════════════════════════════════════════════════════════════════
-- New tables from user's required schema
-- ═══════════════════════════════════════════════════════════════════

-- 1. Zonas
CREATE TABLE public.zonas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage zonas" ON public.zonas FOR ALL USING (auth.uid() IS NOT NULL);

-- 2. Cobradores
CREATE TABLE public.cobradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  identificacion VARCHAR(50),
  comision_cobro DECIMAL(5,2) DEFAULT 0,
  comision_venta DECIMAL(5,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cobradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage cobradores" ON public.cobradores FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Bancos
CREATE TABLE public.bancos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  numero_cuenta VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage bancos" ON public.bancos FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Cajas
CREATE TABLE public.cajas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario_id UUID,
  abierta BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage cajas" ON public.cajas FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Financiamientos (Planes)
CREATE TABLE public.financiamientos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo_amortizacion VARCHAR(50),
  tasa_interes DECIMAL(5,2),
  interes_moratorio DECIMAL(5,2),
  plazo_min INT,
  plazo_max INT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financiamientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage financiamientos" ON public.financiamientos FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. Notas de Crédito
CREATE TABLE public.notas_credito (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID REFERENCES public.prestamos(id),
  monto DECIMAL(12,2),
  concepto TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  aplicada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notas_credito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage notas_credito" ON public.notas_credito FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. Gastos de Préstamo
CREATE TABLE public.gastos_prestamo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID NOT NULL REFERENCES public.prestamos(id),
  tipo VARCHAR(50),
  monto DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gastos_prestamo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage gastos_prestamo" ON public.gastos_prestamo FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Autorizaciones
CREATE TABLE public.autorizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prestamo_id UUID REFERENCES public.prestamos(id),
  tipo VARCHAR(50),
  monto DECIMAL(12,2),
  estado VARCHAR(20) DEFAULT 'Pendiente',
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_autorizacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.autorizaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage autorizaciones" ON public.autorizaciones FOR ALL USING (auth.uid() IS NOT NULL);

-- Add new optional FK columns to prestamos for zona, cobrador, banco, financiamiento, nota_credito
ALTER TABLE public.prestamos
  ADD COLUMN IF NOT EXISTS zona_id UUID REFERENCES public.zonas(id),
  ADD COLUMN IF NOT EXISTS cobrador_id UUID REFERENCES public.cobradores(id),
  ADD COLUMN IF NOT EXISTS banco_id UUID REFERENCES public.bancos(id),
  ADD COLUMN IF NOT EXISTS financiamiento_id UUID REFERENCES public.financiamientos(id),
  ADD COLUMN IF NOT EXISTS nota_credito_id UUID REFERENCES public.notas_credito(id),
  ADD COLUMN IF NOT EXISTS comentario TEXT DEFAULT '';

-- Add mora column to cuotas
ALTER TABLE public.cuotas
  ADD COLUMN IF NOT EXISTS mora DECIMAL(12,2) DEFAULT 0;

-- Add columns to pagos for capital/interes/mora breakdown and caja
ALTER TABLE public.pagos
  ADD COLUMN IF NOT EXISTS capital_pagado DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interes_pagado DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mora_pagada DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS caja_id UUID REFERENCES public.cajas(id);

-- Add foto column to clientes
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS foto TEXT DEFAULT '';

-- Add fecha_inicio to prestamos
ALTER TABLE public.prestamos
  ADD COLUMN IF NOT EXISTS fecha_inicio DATE;
