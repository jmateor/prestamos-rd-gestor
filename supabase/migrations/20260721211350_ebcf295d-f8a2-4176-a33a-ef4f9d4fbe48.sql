
-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL,
  cedula TEXT,
  telefono TEXT,
  email TEXT,
  ciudad TEXT,
  origen TEXT NOT NULL DEFAULT 'otro',
  etapa TEXT NOT NULL DEFAULT 'nuevo',
  monto_estimado NUMERIC(14,2),
  proposito TEXT,
  notas TEXT,
  asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  convertido_at TIMESTAMPTZ,
  perdido_motivo TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_leads_etapa ON public.leads(etapa);
CREATE INDEX idx_leads_asignado ON public.leads(asignado_a);

-- INTERACCIONES (timeline)
CREATE TABLE public.interacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  direccion TEXT DEFAULT 'saliente',
  asunto TEXT,
  contenido TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interacciones TO authenticated;
GRANT ALL ON public.interacciones TO service_role;
ALTER TABLE public.interacciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage interacciones" ON public.interacciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_interacciones_cliente ON public.interacciones(cliente_id);
CREATE INDEX idx_interacciones_lead ON public.interacciones(lead_id);
CREATE INDEX idx_interacciones_fecha ON public.interacciones(fecha DESC);

-- TAREAS
CREATE TABLE public.tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad TEXT NOT NULL DEFAULT 'media',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_vencimiento TIMESTAMPTZ,
  completada_at TIMESTAMPTZ,
  asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  prestamo_id UUID REFERENCES public.prestamos(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tareas TO authenticated;
GRANT ALL ON public.tareas TO service_role;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage tareas" ON public.tareas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_tareas_asignado ON public.tareas(asignado_a);
CREATE INDEX idx_tareas_estado ON public.tareas(estado);
CREATE INDEX idx_tareas_vencimiento ON public.tareas(fecha_vencimiento);
