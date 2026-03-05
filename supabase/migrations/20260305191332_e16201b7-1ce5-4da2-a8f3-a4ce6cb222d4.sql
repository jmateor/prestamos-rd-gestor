
-- Audit log / Bitácora del sistema
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  accion text NOT NULL,
  tabla text NOT NULL,
  registro_id text,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  notas text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Cierre de caja
CREATE TABLE public.cierres_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id uuid REFERENCES public.cajas(id),
  usuario_id uuid NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  monto_apertura numeric NOT NULL DEFAULT 0,
  monto_cierre numeric NOT NULL DEFAULT 0,
  total_efectivo numeric NOT NULL DEFAULT 0,
  total_transferencias numeric NOT NULL DEFAULT 0,
  total_cheques numeric NOT NULL DEFAULT 0,
  diferencia numeric NOT NULL DEFAULT 0,
  notas text DEFAULT '',
  estado text NOT NULL DEFAULT 'abierto',
  created_at timestamptz NOT NULL DEFAULT now(),
  cerrado_at timestamptz
);

ALTER TABLE public.cierres_caja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage cierres_caja"
  ON public.cierres_caja FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
