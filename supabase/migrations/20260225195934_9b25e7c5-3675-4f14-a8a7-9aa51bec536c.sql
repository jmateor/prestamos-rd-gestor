
-- Garantías Prendarias (collateral items: vehicles, houses, articles)
CREATE TABLE public.garantias_prendarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL DEFAULT 'otro', -- vehiculo, inmueble, electrodomestico, otro
  descripcion TEXT NOT NULL DEFAULT '',
  marca TEXT DEFAULT '',
  modelo TEXT DEFAULT '',
  anio INTEGER,
  color TEXT DEFAULT '',
  numero_serie TEXT DEFAULT '',
  numero_placa TEXT DEFAULT '',
  numero_chasis TEXT DEFAULT '',
  numero_matricula TEXT DEFAULT '',
  numero_titulo TEXT DEFAULT '',
  valor_estimado NUMERIC DEFAULT 0,
  ubicacion TEXT DEFAULT '',
  estado VARCHAR(30) DEFAULT 'activo', -- activo, liberado, ejecutado
  cliente_id UUID REFERENCES public.clientes(id),
  prestamo_id UUID REFERENCES public.prestamos(id),
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garantias_prendarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage garantias_prendarias"
  ON public.garantias_prendarias FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fotos/documentos de garantías
CREATE TABLE public.garantia_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  garantia_id UUID NOT NULL REFERENCES public.garantias_prendarias(id) ON DELETE CASCADE,
  tipo VARCHAR(50) DEFAULT 'foto', -- foto, matricula, titulo, otro
  nombre TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garantia_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage garantia_documentos"
  ON public.garantia_documentos FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Storage bucket for guarantee photos/documents
INSERT INTO storage.buckets (id, name, public) VALUES ('garantias', 'garantias', true);

CREATE POLICY "Auth users upload garantias files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'garantias' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read garantias files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'garantias');

CREATE POLICY "Auth users delete garantias files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'garantias' AND auth.uid() IS NOT NULL);

-- Garantes personales independientes (not tied to solicitudes)
CREATE TABLE public.garantes_personales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  cedula TEXT NOT NULL,
  telefono TEXT NOT NULL,
  telefono2 TEXT DEFAULT '',
  email TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  lugar_trabajo TEXT DEFAULT '',
  cargo TEXT DEFAULT '',
  ingreso_mensual NUMERIC DEFAULT 0,
  relacion TEXT DEFAULT '',
  cliente_id UUID REFERENCES public.clientes(id),
  prestamo_id UUID REFERENCES public.prestamos(id),
  estado VARCHAR(30) DEFAULT 'activo',
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.garantes_personales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage garantes_personales"
  ON public.garantes_personales FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_garantias_prendarias_updated_at
  BEFORE UPDATE ON public.garantias_prendarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_garantes_personales_updated_at
  BEFORE UPDATE ON public.garantes_personales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
