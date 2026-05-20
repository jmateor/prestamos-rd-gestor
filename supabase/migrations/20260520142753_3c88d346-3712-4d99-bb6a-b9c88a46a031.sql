
-- Empresa info (singleton)
CREATE TABLE IF NOT EXISTS public.empresa_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT '',
  razon_social text DEFAULT '',
  rnc text DEFAULT '',
  direccion text DEFAULT '',
  ciudad text DEFAULT '',
  provincia text DEFAULT '',
  telefono text DEFAULT '',
  email text DEFAULT '',
  sitio_web text DEFAULT '',
  logo_url text DEFAULT '',
  regimen_fiscal text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.empresa_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read empresa_info" ON public.empresa_info FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage empresa_info" ON public.empresa_info FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_empresa_info_updated BEFORE UPDATE ON public.empresa_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sucursales
CREATE TABLE IF NOT EXISTS public.sucursales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  direccion text DEFAULT '',
  telefono text DEFAULT '',
  es_principal boolean DEFAULT false,
  activo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read sucursales" ON public.sucursales FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage sucursales" ON public.sucursales FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_sucursales_updated BEFORE UPDATE ON public.sucursales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Configuracion impresion (singleton)
CREATE TABLE IF NOT EXISTS public.configuracion_impresion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tamano_tirilla text NOT NULL DEFAULT '80mm',
  margen_izq integer NOT NULL DEFAULT 0,
  margen_der integer NOT NULL DEFAULT 0,
  alineacion_encabezado text NOT NULL DEFAULT 'center',
  mostrar_logo boolean NOT NULL DEFAULT true,
  mostrar_rnc boolean NOT NULL DEFAULT true,
  mostrar_direccion boolean NOT NULL DEFAULT true,
  mostrar_firma_cajero boolean NOT NULL DEFAULT false,
  mostrar_qr boolean NOT NULL DEFAULT false,
  frase_pie_recibo text DEFAULT '',
  pie_legal_contrato text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.configuracion_impresion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read config_impresion" ON public.configuracion_impresion FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage config_impresion" ON public.configuracion_impresion FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_config_impresion_updated BEFORE UPDATE ON public.configuracion_impresion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Plantillas de documentos legales
CREATE TABLE IF NOT EXISTS public.plantillas_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  contenido_html text DEFAULT '',
  archivo_url text DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  activo boolean NOT NULL DEFAULT true,
  actualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plantillas_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read plantillas" ON public.plantillas_documentos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage plantillas" ON public.plantillas_documentos FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_plantillas_updated BEFORE UPDATE ON public.plantillas_documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed singletons
INSERT INTO public.empresa_info (nombre) VALUES ('Mi Empresa') ON CONFLICT DO NOTHING;
INSERT INTO public.configuracion_impresion (tamano_tirilla) VALUES ('80mm') ON CONFLICT DO NOTHING;

-- Seed plantillas vacías por tipo
INSERT INTO public.plantillas_documentos (tipo, nombre, contenido_html) VALUES
  ('contrato_tripartito', 'Contrato Tripartito (Ley 6186)', ''),
  ('pagare_notarial', 'Pagaré Notarial (Ley 845)', ''),
  ('acuerdo_pago', 'Acuerdo de Pago / Reestructuración', ''),
  ('carta_cobro', 'Carta de Cobro Extrajudicial', ''),
  ('autorizacion_descuento', 'Autorización de Descuento de Nómina', ''),
  ('aviso_judicial', 'Aviso de Inicio de Cobro Judicial', '')
ON CONFLICT (tipo) DO NOTHING;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('empresa-assets', 'empresa-assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('plantillas-legales', 'plantillas-legales', false) ON CONFLICT DO NOTHING;

-- Storage policies: empresa-assets (public read, admin write)
CREATE POLICY "Public read empresa-assets" ON storage.objects FOR SELECT USING (bucket_id = 'empresa-assets');
CREATE POLICY "Admin write empresa-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'empresa-assets' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update empresa-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'empresa-assets' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete empresa-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'empresa-assets' AND has_role(auth.uid(),'admin'));

-- Storage policies: plantillas-legales (admin only)
CREATE POLICY "Admin read plantillas-legales" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'plantillas-legales' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admin write plantillas-legales" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'plantillas-legales' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update plantillas-legales" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'plantillas-legales' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete plantillas-legales" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'plantillas-legales' AND has_role(auth.uid(),'admin'));

-- Parámetros operativos extra
INSERT INTO public.parametros_sistema (clave, valor, descripcion, categoria, tipo) VALUES
  ('dias_gracia_mora', '3', 'Días de gracia antes de aplicar mora', 'moras', 'numero'),
  ('descuento_max_saldado', '0', 'Porcentaje máximo de descuento permitido al saldar préstamo', 'prestamos', 'numero'),
  ('monto_max_cajero_sin_aprobacion', '50000', 'Monto máximo (RD$) que un cajero puede cobrar sin aprobación', 'operaciones', 'numero'),
  ('firma_digital_obligatoria', 'false', 'Requerir firma digital al desembolsar', 'operaciones', 'booleano'),
  ('ocr_cedula_obligatorio', 'false', 'Requerir OCR de cédula al crear cliente', 'operaciones', 'booleano'),
  ('garante_obligatorio', 'false', 'Requerir garante en todas las solicitudes', 'prestamos', 'booleano')
ON CONFLICT (clave) DO NOTHING;
