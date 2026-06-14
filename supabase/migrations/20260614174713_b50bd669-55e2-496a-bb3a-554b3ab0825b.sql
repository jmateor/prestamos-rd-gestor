
-- 1) Redes sociales en empresa_info
ALTER TABLE public.empresa_info
  ADD COLUMN IF NOT EXISTS facebook_url   TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url  TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url    TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url   TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url    TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url     TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_numero TEXT;

-- 2) Secuencia para número de cita
CREATE SEQUENCE IF NOT EXISTS public.cita_seq START 1;

-- 3) Tabla citas_clientes
CREATE TABLE IF NOT EXISTS public.citas_clientes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cita          TEXT UNIQUE,
  cliente_id           UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  solicitud_id         UUID REFERENCES public.solicitudes(id) ON DELETE SET NULL,
  solicitado_por       UUID REFERENCES auth.users(id),
  asignada_a           UUID REFERENCES auth.users(id),
  fecha_cita           DATE NOT NULL,
  hora_cita            TIME NOT NULL,
  motivo               TEXT NOT NULL,
  notas_oficial        TEXT,
  estado               TEXT NOT NULL DEFAULT 'programada',
  resultado            TEXT,
  notas_administrador  TEXT,
  fecha_atencion       TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.citas_clientes TO authenticated;
GRANT ALL ON public.citas_clientes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.cita_seq TO authenticated, service_role;

ALTER TABLE public.citas_clientes ENABLE ROW LEVEL SECURITY;

-- Trigger numero_cita
CREATE OR REPLACE FUNCTION public.generate_cita_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.numero_cita IS NULL THEN
    NEW.numero_cita := 'CITA-' || LPAD(nextval('public.cita_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cita_numero ON public.citas_clientes;
CREATE TRIGGER trg_cita_numero
BEFORE INSERT ON public.citas_clientes
FOR EACH ROW EXECUTE FUNCTION public.generate_cita_numero();

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_cita_updated ON public.citas_clientes;
CREATE TRIGGER trg_cita_updated
BEFORE UPDATE ON public.citas_clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies
CREATE POLICY "Usuarios autenticados ven citas"
  ON public.citas_clientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados crean citas"
  ON public.citas_clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Solicitante o admin actualiza cita"
  ON public.citas_clientes FOR UPDATE TO authenticated
  USING (
    solicitado_por = auth.uid()
    OR asignada_a = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    solicitado_por = auth.uid()
    OR asignada_a = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Solo admin elimina cita"
  ON public.citas_clientes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_citas_cliente   ON public.citas_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_solicitud ON public.citas_clientes(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha     ON public.citas_clientes(fecha_cita);
CREATE INDEX IF NOT EXISTS idx_citas_estado    ON public.citas_clientes(estado);
