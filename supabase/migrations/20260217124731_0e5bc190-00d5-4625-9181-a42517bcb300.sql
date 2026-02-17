
-- Tabla de solicitudes de préstamo
CREATE TABLE public.solicitudes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_solicitud TEXT NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  
  -- Datos del préstamo solicitado
  monto_solicitado NUMERIC(12,2) NOT NULL CHECK (monto_solicitado > 0),
  plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),
  frecuencia_pago TEXT NOT NULL CHECK (frecuencia_pago IN ('diaria', 'semanal', 'quincenal', 'mensual')),
  proposito TEXT NOT NULL DEFAULT '',
  tasa_interes_sugerida NUMERIC(5,2) DEFAULT 0,
  
  -- Estado y flujo
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_evaluacion', 'aprobada', 'rechazada')),
  comentarios_evaluacion TEXT DEFAULT '',
  fecha_evaluacion TIMESTAMPTZ,
  evaluado_por UUID REFERENCES auth.users(id),
  
  -- Auditoría
  oficial_credito_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Secuencia para número de solicitud
CREATE SEQUENCE public.solicitud_seq START 1;

-- Función para generar número de solicitud automático
CREATE OR REPLACE FUNCTION public.generate_solicitud_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.numero_solicitud := 'SOL-' || LPAD(nextval('public.solicitud_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_solicitud_numero
BEFORE INSERT ON public.solicitudes
FOR EACH ROW
EXECUTE FUNCTION public.generate_solicitud_numero();

CREATE TRIGGER update_solicitudes_updated_at
BEFORE UPDATE ON public.solicitudes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_solicitudes_cliente ON public.solicitudes(cliente_id);
CREATE INDEX idx_solicitudes_estado ON public.solicitudes(estado);
CREATE INDEX idx_solicitudes_oficial ON public.solicitudes(oficial_credito_id);

-- RLS
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view solicitudes"
ON public.solicitudes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert solicitudes"
ON public.solicitudes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update solicitudes"
ON public.solicitudes FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Tabla de garantes/codeudores
CREATE TABLE public.garantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  cedula TEXT NOT NULL,
  telefono TEXT NOT NULL,
  relacion TEXT NOT NULL DEFAULT '',
  direccion TEXT DEFAULT '',
  lugar_trabajo TEXT DEFAULT '',
  ingreso_mensual NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage garantes"
ON public.garantes FOR ALL
USING (auth.uid() IS NOT NULL);
