
-- Add nota_bloqueo to clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nota_bloqueo text DEFAULT '';

-- Create contactos_sociales table
CREATE TABLE IF NOT EXISTS public.contactos_sociales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'otro',
  valor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contactos_sociales_cliente ON public.contactos_sociales(cliente_id);

ALTER TABLE public.contactos_sociales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage contactos_sociales"
  ON public.contactos_sociales
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add cobro_calle_habilitado parameter
INSERT INTO public.parametros_sistema (id, clave, valor, descripcion, categoria, tipo)
VALUES (gen_random_uuid(), 'cobro_calle_habilitado', 'true', 'Habilitar módulo de cobranza en campo (true/false)', 'operaciones', 'texto')
ON CONFLICT (clave) DO NOTHING;
