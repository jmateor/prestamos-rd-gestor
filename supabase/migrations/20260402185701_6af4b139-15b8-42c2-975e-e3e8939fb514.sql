
-- ═══════════════════════════════════════════════════════════════
-- 1. Add missing columns to existing tables
-- ═══════════════════════════════════════════════════════════════

-- Clientes: add alias for mobile sync
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS alias text;

-- Solicitudes: add missing columns from mobile schema
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS monto_aprobado numeric;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS tipo_amortizacion text DEFAULT 'frances';
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS gastos_legales numeric DEFAULT 0;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS gastos_cierre numeric DEFAULT 0;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS foto_cedula text;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS foto_adjunto text;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS fecha_solicitud timestamptz DEFAULT now();
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS fecha_aprobacion timestamptz;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS aprobado_por uuid;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS notas text DEFAULT '';

-- Prestamos: add missing columns
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS cuota_estimada numeric;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS total_cuotas integer;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS monto_pagado numeric DEFAULT 0;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS saldo_pendiente numeric;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS gastos_legales numeric DEFAULT 0;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS gastos_cierre numeric DEFAULT 0;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS proposito text;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.prestamos ADD COLUMN IF NOT EXISTS tipo_amortizacion text DEFAULT 'frances';

-- Pagos: add missing columns
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS numero_cheque text;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS banco_cheque text;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS numero_referencia text;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cobrador_id uuid;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS recibo_numero text;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS created_by uuid;

-- Cobradores: add user_id for linking to auth users
ALTER TABLE public.cobradores ADD COLUMN IF NOT EXISTS user_id uuid;

-- ═══════════════════════════════════════════════════════════════
-- 2. Create new tables
-- ═══════════════════════════════════════════════════════════════

-- Gestión de cobranza (field collection management)
CREATE TABLE IF NOT EXISTS public.gestion_cobranza (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id uuid NOT NULL REFERENCES public.prestamos(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  cobrador_id uuid REFERENCES public.cobradores(id),
  fecha_visita timestamptz NOT NULL DEFAULT now(),
  resultado text,
  tipo_gestion text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gestion_cobranza ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage gestion_cobranza"
  ON public.gestion_cobranza FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Parámetros del sistema
CREATE TABLE IF NOT EXISTS public.parametros_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave text UNIQUE NOT NULL,
  valor text NOT NULL,
  descripcion text,
  categoria text,
  tipo text DEFAULT 'texto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parametros_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read parametros_sistema"
  ON public.parametros_sistema FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage parametros_sistema"
  ON public.parametros_sistema FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cola de sincronización
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  attempts integer DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz
);

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage sync_queue"
  ON public.sync_queue FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════
-- 3. Insert default parameters
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.parametros_sistema (clave, valor, descripcion, categoria, tipo) VALUES
  ('tasa_interes_default', '5', 'Tasa de interés mensual por defecto (%)', 'tasas', 'numero'),
  ('porcentaje_mora', '3', 'Porcentaje de mora mensual (%)', 'moras', 'numero'),
  ('dias_gracia', '3', 'Días de gracia antes de aplicar mora', 'moras', 'numero'),
  ('gastos_legales_default', '1000', 'Gastos legales por defecto (RD$)', 'gastos', 'numero'),
  ('gastos_cierre_default', '500', 'Gastos de cierre por defecto (RD$)', 'gastos', 'numero'),
  ('monto_minimo', '1000', 'Monto mínimo de préstamo (RD$)', 'prestamos', 'numero'),
  ('monto_maximo', '500000', 'Monto máximo de préstamo (RD$)', 'prestamos', 'numero'),
  ('plazo_min', '1', 'Plazo mínimo en meses', 'prestamos', 'numero'),
  ('plazo_max', '60', 'Plazo máximo en meses', 'prestamos', 'numero'),
  ('nombre_empresa', 'JBM RD Gestión', 'Nombre de la empresa', 'empresa', 'texto'),
  ('telefono_empresa', '', 'Teléfono de la empresa', 'empresa', 'texto'),
  ('direccion_empresa', '', 'Dirección de la empresa', 'empresa', 'texto'),
  ('rnc_empresa', '', 'RNC - DGII Número de identificación fiscal', 'empresa', 'texto'),
  ('requerir_caja_abierta', 'true', 'Obligar a tener la caja abierta para cobrar', 'operaciones', 'texto')
ON CONFLICT (clave) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 4. Create indexes for performance
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_gestion_cobranza_prestamo ON public.gestion_cobranza(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_gestion_cobranza_cliente ON public.gestion_cobranza(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_parametros_clave ON public.parametros_sistema(clave);
