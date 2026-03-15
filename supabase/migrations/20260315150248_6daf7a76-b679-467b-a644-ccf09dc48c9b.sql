
-- Add guarantee fields to solicitudes table
ALTER TABLE public.solicitudes
  ADD COLUMN IF NOT EXISTS tiene_garantia boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_garantia text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS garantia_marca text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_modelo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_anio integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS garantia_color text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_numero_placa text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_numero_chasis text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_numero_matricula text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_estado_bien text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_direccion_propiedad text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_tipo_propiedad text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_tamano text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_documento_propiedad text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_nombre_articulo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS garantia_valor_estimado numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS garantia_estado text DEFAULT 'en_evaluacion',
  ADD COLUMN IF NOT EXISTS garantia_notas text DEFAULT '',
  ADD COLUMN IF NOT EXISTS porcentaje_prestamo_garantia numeric DEFAULT 70;

-- Create table for guarantee photos
CREATE TABLE IF NOT EXISTS public.solicitud_garantia_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'foto',
  nombre text NOT NULL DEFAULT '',
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitud_garantia_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage solicitud_garantia_fotos"
  ON public.solicitud_garantia_fotos
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create storage bucket for solicitud guarantee photos
INSERT INTO storage.buckets (id, name, public) VALUES ('solicitud_garantias', 'solicitud_garantias', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for solicitud_garantias bucket
CREATE POLICY "Auth users upload solicitud_garantias"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'solicitud_garantias');

CREATE POLICY "Public read solicitud_garantias"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'solicitud_garantias');

CREATE POLICY "Auth users delete solicitud_garantias"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'solicitud_garantias');
