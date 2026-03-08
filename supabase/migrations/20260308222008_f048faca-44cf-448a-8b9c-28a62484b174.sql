
-- Add new columns to clientes table
ALTER TABLE public.clientes 
  ADD COLUMN IF NOT EXISTS cedula_frontal_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cedula_trasera_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS banco_nombre text DEFAULT '',
  ADD COLUMN IF NOT EXISTS numero_cuenta text DEFAULT '';

-- Create referencias table (personal and commercial references)
CREATE TABLE IF NOT EXISTS public.referencias_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'personal', -- personal, comercial
  nombre_completo text NOT NULL,
  telefono text NOT NULL DEFAULT '',
  relacion text DEFAULT '',
  direccion text DEFAULT '',
  empresa text DEFAULT '',
  notas text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referencias_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage referencias_cliente" ON public.referencias_cliente
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create dependientes table
CREATE TABLE IF NOT EXISTS public.dependientes_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  parentesco text NOT NULL DEFAULT '',
  edad integer,
  notas text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dependientes_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage dependientes_cliente" ON public.dependientes_cliente
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create conyuge table
CREATE TABLE IF NOT EXISTS public.conyuges_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  cedula text DEFAULT '',
  telefono text DEFAULT '',
  lugar_trabajo text DEFAULT '',
  cargo text DEFAULT '',
  ingreso_mensual numeric DEFAULT 0,
  notas text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cliente_id)
);

ALTER TABLE public.conyuges_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage conyuges_cliente" ON public.conyuges_cliente
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('clientes', 'clientes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for clientes bucket
CREATE POLICY "Auth users can upload client docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clientes');

CREATE POLICY "Auth users can view client docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'clientes');

CREATE POLICY "Auth users can update client docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'clientes');

CREATE POLICY "Auth users can delete client docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'clientes');

CREATE POLICY "Public can view client docs" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'clientes');
