
-- Add credit score and geo fields to clientes
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS credit_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nivel_riesgo text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS latitud numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitud numeric DEFAULT NULL;

-- Add auto-evaluation fields to solicitudes
ALTER TABLE public.solicitudes
  ADD COLUMN IF NOT EXISTS evaluacion_automatica text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_al_solicitar integer DEFAULT NULL;
