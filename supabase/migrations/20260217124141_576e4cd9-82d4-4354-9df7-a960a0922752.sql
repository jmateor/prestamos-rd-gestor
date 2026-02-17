
-- Tabla de clientes completa
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Datos personales
  primer_nombre TEXT NOT NULL,
  segundo_nombre TEXT DEFAULT '',
  primer_apellido TEXT NOT NULL,
  segundo_apellido TEXT DEFAULT '',
  cedula TEXT NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  sexo TEXT CHECK (sexo IN ('M', 'F')),
  estado_civil TEXT CHECK (estado_civil IN ('soltero', 'casado', 'union_libre', 'divorciado', 'viudo')),
  nacionalidad TEXT DEFAULT 'Dominicana',
  
  -- Contacto
  telefono TEXT NOT NULL,
  telefono2 TEXT DEFAULT '',
  email TEXT DEFAULT '',
  
  -- Dirección
  direccion TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  ciudad TEXT DEFAULT '',
  provincia TEXT DEFAULT '',
  referencia_direccion TEXT DEFAULT '',
  
  -- Vivienda
  tipo_vivienda TEXT CHECK (tipo_vivienda IN ('propia', 'alquilada', 'familiar', 'otro')) DEFAULT 'alquilada',
  tiempo_residencia TEXT DEFAULT '',
  
  -- Información laboral
  lugar_trabajo TEXT DEFAULT '',
  cargo TEXT DEFAULT '',
  direccion_trabajo TEXT DEFAULT '',
  telefono_trabajo TEXT DEFAULT '',
  ingreso_mensual NUMERIC(12,2) DEFAULT 0,
  otros_ingresos NUMERIC(12,2) DEFAULT 0,
  antiguedad_laboral TEXT DEFAULT '',
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
  notas TEXT DEFAULT '',
  
  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_clientes_cedula ON public.clientes(cedula);
CREATE INDEX idx_clientes_nombre ON public.clientes(primer_nombre, primer_apellido);
CREATE INDEX idx_clientes_estado ON public.clientes(estado);
CREATE INDEX idx_clientes_created_by ON public.clientes(created_by);

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
ON public.clientes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert clients"
ON public.clientes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clients"
ON public.clientes FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Trigger updated_at
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
