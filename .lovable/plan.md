## Objetivo

Ampliar el módulo de **Ajustes** para que el administrador pueda parametrizar todo el sistema sin tocar código: información de la empresa, configuración de impresión de recibos/contratos, carga de plantillas legales (acuerdos de pago, pagarés, contratos) y más parámetros operativos. Inspirado en los paneles tipo Alegra POS que enviaste.

## Alcance funcional

Reorganizar la página `Ajustes` con una vista tipo "centro de configuración" con tarjetas agrupadas por área, y dentro de cada tarjeta abrir un panel de edición. Sólo el rol **admin** puede modificar; **cajero/oficial** ven en modo lectura.

### 1. Empresa / Negocio
- Nombre comercial, razón social, RNC, dirección, ciudad, provincia, teléfono, email, sitio web.
- Logo (subida a Cloud Storage, se usará en todos los PDFs).
- Sucursal principal (nombre, dirección, teléfono) y posibilidad de agregar más sucursales.
- Régimen fiscal / NCF base para futuras facturas.

### 2. Impresión y recibos
- Tamaño de tirilla: 57 mm / 80 mm / Carta.
- Márgenes izquierdo/derecho en mm.
- Alineación de encabezado (izquierda / centro / derecha).
- Toggles: mostrar logo, mostrar RNC, mostrar dirección, mostrar firma del cajero, mostrar QR de verificación.
- Frase personalizada al pie del recibo (máx. 200 caracteres).
- Pie legal personalizado para contratos (máx. 500 caracteres).
- Vista previa en vivo del recibo POS al lado del formulario (como en la captura de Alegra).

### 3. Plantillas legales (documentos)
Nueva sección donde el admin sube/edita las plantillas que el sistema usa al generar PDFs:
- Contrato Tripartito (Ley 6186).
- Pagaré Notarial (Ley 845).
- Acuerdo de Pago / Reestructuración.
- Carta de Cobro Extrajudicial.
- Autorización de descuento de nómina.
- Aviso de inicio de cobro judicial.

Cada plantilla soporta:
- Subir archivo `.docx`, `.html` o `.txt` con **variables tipo `{{cliente_nombre}}`, `{{monto}}`, `{{fecha}}`, `{{cuotas}}`** etc.
- Editor de texto enriquecido en línea (alternativa a subir archivo).
- Botón "Restaurar plantilla por defecto".
- Indicador de versión y fecha de última edición.
- Vista previa con datos de ejemplo.

### 4. Parámetros financieros (ya existe, se amplía)
Se mantienen los parámetros de `parametros_sistema` y se agregan:
- Días de gracia antes de aplicar mora.
- Porcentaje máximo de descuento permitido en saldado.
- Monto máximo que un cajero puede cobrar sin aprobación.
- Activar/desactivar firma digital obligatoria al desembolsar.
- Activar/desactivar OCR de cédula al crear cliente.
- Activar/desactivar requerimiento de garante.

### 5. Catálogos (ya existe)
- Zonas, cobradores, bancos (sin cambios).
- Se agrega: métodos de pago habilitados (toggle por método).

## Implementación técnica

### Base de datos
Nueva migración con:

- `empresa_info` (singleton): `nombre`, `razon_social`, `rnc`, `direccion`, `ciudad`, `provincia`, `telefono`, `email`, `sitio_web`, `logo_url`, `regimen_fiscal`.
- `sucursales`: `nombre`, `direccion`, `telefono`, `es_principal`, `activo`.
- `configuracion_impresion` (singleton): `tamano_tirilla`, `margen_izq`, `margen_der`, `alineacion_encabezado`, `mostrar_logo`, `mostrar_rnc`, `mostrar_direccion`, `mostrar_firma_cajero`, `mostrar_qr`, `frase_pie_recibo`, `pie_legal_contrato`.
- `plantillas_documentos`: `tipo` (enum: contrato_tripartito, pagare_notarial, acuerdo_pago, carta_cobro, autorizacion_descuento, aviso_judicial), `contenido_html`, `archivo_url`, `version`, `activo`, `actualizado_por`.
- Bucket `empresa-assets` (público) para logos.
- Bucket `plantillas-legales` (privado, sólo admin) para `.docx`.
- RLS: lectura para autenticados, escritura sólo para `has_role(uid, 'admin')`.
- Se agregan filas adicionales a `parametros_sistema` para los nuevos toggles.

### Frontend
- Refactor de `src/pages/Ajustes.tsx`: pasa de tabs planos a vista tipo "grid de tarjetas" + tabs internos cuando se entra a un área.
- Nuevos componentes en `src/components/ajustes/`:
  - `EmpresaForm.tsx`
  - `SucursalesManager.tsx`
  - `ImpresionConfig.tsx` con preview en vivo del recibo.
  - `PlantillasDocumentosManager.tsx` con editor (usa `textarea` + sintaxis `{{var}}`; subida `.docx` opcional).
  - `ParametrosOperativos.tsx` (toggles).
- Nuevos hooks: `useEmpresaInfo`, `useSucursales`, `useConfiguracionImpresion`, `usePlantillasDocumentos`.
- Los generadores PDF existentes (`reciboPagoPDF`, `contratoPDF`, `pagarePDF`, etc.) leen estos parámetros antes de renderizar — se hace en un segundo paso para no romper nada.

### Renderizado de plantillas
- Función `renderTemplate(html, vars)` en `src/lib/plantillas.ts` que reemplaza `{{variable}}` con valores y soporta loops simples `{{#cuotas}}...{{/cuotas}}`.
- Cuando no hay plantilla cargada en BD, el sistema cae al PDF hardcodeado actual (no se rompe nada).

### Permisos
- Todos los formularios usan `useUserRole().isAdmin` para deshabilitar inputs si no es admin.
- Cajeros pueden **ver** la configuración (transparencia) pero no editarla — consistente con la regla del proyecto.

## Plan de entrega por fases

1. **Migración + hooks + página rediseñada con tarjetas** (sin contenido nuevo aún, sólo estructura).
2. **Empresa + Logo + Sucursales** (lectura/escritura completa).
3. **Configuración de impresión + preview en vivo**.
4. **Plantillas legales** (editor de texto con variables, sin DOCX aún).
5. **Conectar plantillas a generadores PDF existentes** (uno por uno: recibo → contrato → pagaré).
6. **Parámetros operativos extra** (toggles) y métodos de pago habilitados.
7. *(Opcional)* Subida de `.docx` con conversión a HTML.

Se entregan en commits separados para que puedas probar cada fase.

## Confirmaciones que necesito antes de empezar

1. ¿Quieres que arranque por **toda la fase 1+2+3** (estructura + empresa + impresión) en este turno, o prefieres ir fase por fase?
2. Para las plantillas legales: ¿prefieres **editor de texto enriquecido con variables `{{...}}`** (recomendado, funciona ya) o **subida de `.docx`** (más complejo, requiere librería de conversión)?
3. ¿Quieres mantener los **PDFs actuales hardcodeados como fallback** cuando no haya plantilla cargada? (recomiendo sí).
