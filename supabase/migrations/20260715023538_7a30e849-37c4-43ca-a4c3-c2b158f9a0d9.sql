
-- ── Extender plantillas_documentos ─────────────────────────────
ALTER TABLE public.plantillas_documentos
  ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'otros',
  ADD COLUMN IF NOT EXISTS tipo_documento TEXT,
  ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Política para que admins puedan eliminar/insertar plantillas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plantillas_documentos' AND policyname='Admins can manage plantillas'
  ) THEN
    CREATE POLICY "Admins can manage plantillas" ON public.plantillas_documentos
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- ── Tabla testigos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testigos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cedula TEXT,
  direccion TEXT,
  telefono TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.testigos TO authenticated;
GRANT ALL ON public.testigos TO service_role;

ALTER TABLE public.testigos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view testigos" ON public.testigos
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated can insert testigos" ON public.testigos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update testigos" ON public.testigos
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete testigos" ON public.testigos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_testigos_updated_at
  BEFORE UPDATE ON public.testigos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Secuencia y tabla documentos_generados ─────────────────────
CREATE SEQUENCE IF NOT EXISTS public.documento_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_documento_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_documento IS NULL OR NEW.numero_documento = '' THEN
    NEW.numero_documento := 'DOC-' || LPAD(nextval('public.documento_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.documentos_generados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_documento TEXT UNIQUE,
  tipo_documento TEXT NOT NULL,
  categoria TEXT,
  plantilla_id UUID REFERENCES public.plantillas_documentos(id) ON DELETE SET NULL,
  prestamo_id UUID REFERENCES public.prestamos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  papel TEXT NOT NULL DEFAULT 'letter',
  fecha_vencimiento DATE,
  contenido_html TEXT NOT NULL,
  variables_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  testigos_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  estado TEXT NOT NULL DEFAULT 'generado',
  version INTEGER NOT NULL DEFAULT 1,
  ip TEXT,
  generado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_generados TO authenticated;
GRANT ALL ON public.documentos_generados TO service_role;

ALTER TABLE public.documentos_generados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view documentos" ON public.documentos_generados
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated can insert documentos" ON public.documentos_generados
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update documentos" ON public.documentos_generados
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete documentos" ON public.documentos_generados
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_documentos_generar_numero
  BEFORE INSERT ON public.documentos_generados
  FOR EACH ROW EXECUTE FUNCTION public.generate_documento_numero();

CREATE TRIGGER update_documentos_generados_updated_at
  BEFORE UPDATE ON public.documentos_generados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_documentos_prestamo ON public.documentos_generados(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente ON public.documentos_generados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_created ON public.documentos_generados(created_at DESC);

-- ── Plantillas base (semilla) ──────────────────────────────────
INSERT INTO public.plantillas_documentos (tipo, nombre, categoria, tipo_documento, descripcion, contenido_html, version, activo)
SELECT * FROM (VALUES
  ('pagare_notarial', 'Pagaré Notarial', 'pagare', 'pagare_notarial', 'Pagaré notarial a la orden estándar',
    E'PAGARÉ NOTARIAL\n\nEn la ciudad de {{lugar}}, a los {{fecha_larga}}, yo {{cliente_nombre}}, {{cliente_nacionalidad}}, mayor de edad, {{cliente_estado_civil}}, portador(a) de la cédula {{cliente_cedula}}, domiciliado(a) en {{cliente_direccion}}, teléfono {{cliente_telefono}}, por medio del presente PAGARÉ NOTARIAL A LA ORDEN me obligo a pagar a {{prestamista_nombre}}, o a su orden, la suma de {{monto}} ({{monto_letras}}), correspondiente al préstamo No. {{numero_prestamo}}, en {{cuotas}} cuotas de {{valor_cuota}} cada una, con vencimiento final el {{fecha_vencimiento}}.\n\nTasa de interés: {{interes}}% mensual.\n\nEn caso de mora se aplicarán los intereses moratorios pactados, gastos de cobranza y honorarios de abogado, renunciando expresamente al beneficio de domicilio.\n\n_________________________\n{{cliente_nombre}}\nCédula: {{cliente_cedula}}',
    1, TRUE),
  ('pagare_con_garantia', 'Pagaré Notarial con Garantía', 'pagare', 'pagare_con_garantia', 'Pagaré con garantía prendaria/vehicular',
    E'PAGARÉ NOTARIAL CON GARANTÍA\n\nYo {{cliente_nombre}}, cédula {{cliente_cedula}}, me obligo a pagar a {{prestamista_nombre}} la suma de {{monto}} ({{monto_letras}}) por préstamo No. {{numero_prestamo}}.\n\nEn garantía del cumplimiento de esta obligación, afecto el vehículo marca {{marca}}, modelo {{modelo}}, chasis {{chasis}}, motor {{motor}}, placa {{placa}}, conforme la Ley 483 sobre Venta Condicional de Muebles y la Ley 6186 de Fomento Agrícola.\n\n_________________________\n{{cliente_nombre}}',
    1, TRUE),
  ('pagare_sin_garante', 'Pagaré Notarial sin Garante', 'pagare', 'pagare_sin_garante', 'Pagaré personal sin garante ni garantía',
    E'PAGARÉ NOTARIAL\n\nYo {{cliente_nombre}}, cédula {{cliente_cedula}}, prometo pagar a {{prestamista_nombre}} la suma de {{monto}} ({{monto_letras}}) el {{fecha_vencimiento}}, correspondiente al préstamo {{numero_prestamo}}, con interés del {{interes}}% mensual.\n\n_________________________\n{{cliente_nombre}}',
    1, TRUE),
  ('contrato_prestamo', 'Contrato de Préstamo', 'contrato', 'contrato_prestamo', 'Contrato de préstamo tripartito',
    E'CONTRATO DE PRÉSTAMO\n\nEntre {{prestamista_nombre}} (EL ACREEDOR) y {{cliente_nombre}}, cédula {{cliente_cedula}} (EL DEUDOR), se conviene el préstamo por {{monto}} ({{monto_letras}}), pagadero en {{cuotas}} cuotas de {{valor_cuota}}, tasa {{interes}}% mensual, con vencimiento el {{fecha_vencimiento}}.\n\nFirmado en {{lugar}} el {{fecha_larga}}.\n\n_______________________          _______________________\n   EL ACREEDOR                          EL DEUDOR',
    1, TRUE),
  ('contrato_venta_reserva', 'Contrato de Venta con Reserva de Dominio', 'contrato', 'contrato_venta_reserva', 'Venta con reserva de dominio (Ley 483)',
    E'CONTRATO DE VENTA CON RESERVA DE DOMINIO\n\n{{prestamista_nombre}} vende a {{cliente_nombre}} (cédula {{cliente_cedula}}) el vehículo marca {{marca}}, modelo {{modelo}}, chasis {{chasis}}, motor {{motor}}, placa {{placa}}, por {{monto}} ({{monto_letras}}), reservándose el dominio hasta el pago total conforme la Ley 483 sobre Venta Condicional de Muebles.',
    1, TRUE),
  ('acta_entrega_voluntaria', 'Acta de Entrega Voluntaria', 'acta', 'acta_entrega_voluntaria', 'Entrega voluntaria del bien en garantía',
    E'ACTA DE ENTREGA VOLUNTARIA\n\nEn {{lugar}}, a los {{fecha_larga}}, {{cliente_nombre}}, cédula {{cliente_cedula}}, hace entrega voluntaria a {{prestamista_nombre}} del vehículo marca {{marca}}, modelo {{modelo}}, chasis {{chasis}}, placa {{placa}}, en cumplimiento del préstamo {{numero_prestamo}}.',
    1, TRUE),
  ('carta_instruccion', 'Carta de Instrucción', 'carta', 'carta_instruccion', 'Instrucciones especiales al deudor',
    E'{{lugar}}, {{fecha_larga}}\n\nSeñor(a) {{cliente_nombre}}\nCédula {{cliente_cedula}}\n\nPor este medio le instruimos formalmente respecto al préstamo No. {{numero_prestamo}} por {{monto}}, para que proceda conforme a las condiciones pactadas.\n\nAtentamente,\n\n{{prestamista_nombre}}',
    1, TRUE),
  ('carta_saldo', 'Carta de Saldo', 'carta', 'carta_saldo', 'Certificación de saldo pendiente',
    E'{{empresa.nombre}}\nRNC: {{empresa.rnc}}\n\n{{lugar}}, {{fecha_larga}}\n\nA QUIEN PUEDA INTERESAR:\n\nCertificamos que el señor(a) {{cliente_nombre}}, cédula {{cliente_cedula}}, mantiene el préstamo No. {{numero_prestamo}} por un saldo pendiente de {{saldo}} al día de la fecha.\n\nAtentamente,\n\n{{prestamista_nombre}}',
    1, TRUE),
  ('carta_cancelacion', 'Carta de Cancelación', 'carta', 'carta_cancelacion', 'Cancelación / saldado del préstamo',
    E'{{empresa.nombre}}\n\n{{lugar}}, {{fecha_larga}}\n\nA QUIEN PUEDA INTERESAR:\n\nHacemos constar que el préstamo No. {{numero_prestamo}} otorgado al señor(a) {{cliente_nombre}}, cédula {{cliente_cedula}}, por un monto original de {{monto}}, ha sido totalmente saldado y cancelado a la fecha, quedando libre de toda obligación con esta institución.\n\nAtentamente,\n\n{{prestamista_nombre}}',
    1, TRUE),
  ('recibo_pago', 'Recibo de Pago', 'recibo', 'recibo_pago', 'Recibo simple de pago',
    E'RECIBO DE PAGO\n\nRecibí de {{cliente_nombre}}, cédula {{cliente_cedula}}, la suma de {{monto}} ({{monto_letras}}) por concepto de abono al préstamo No. {{numero_prestamo}}.\n\n{{lugar}}, {{fecha_larga}}\n\n_________________________\n{{prestamista_nombre}}',
    1, TRUE),
  ('poder_especial', 'Poder Especial', 'poder', 'poder_especial', 'Poder especial para trámites',
    E'PODER ESPECIAL\n\nYo, {{cliente_nombre}}, {{cliente_nacionalidad}}, mayor de edad, {{cliente_estado_civil}}, {{cliente_ocupacion}}, cédula {{cliente_cedula}}, domiciliado en {{cliente_direccion}}, por el presente confiero PODER ESPECIAL a {{prestamista_nombre}}, para que en mi nombre y representación realice cuantas gestiones sean necesarias en relación al préstamo No. {{numero_prestamo}}.\n\n{{lugar}}, {{fecha_larga}}\n\n_________________________\n{{cliente_nombre}}',
    1, TRUE)
) AS t(tipo, nombre, categoria, tipo_documento, descripcion, contenido_html, version, activo)
WHERE NOT EXISTS (SELECT 1 FROM public.plantillas_documentos p WHERE p.tipo = t.tipo);
