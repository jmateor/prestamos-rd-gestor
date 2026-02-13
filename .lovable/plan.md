

# Sistema Integral de Gestión de Préstamos JBM RD

## Visión General
Sistema financiero completo para gestionar préstamos personales en República Dominicana, con soporte para cuotas diarias, semanales, quincenales y mensuales. Diseño moderno estilo fintech con colores azules y verdes.

---

## Fase 1 — Autenticación, Roles y Layout Base

- **Login/registro** con email y contraseña usando Lovable Cloud (Supabase Auth)
- **Tabla de perfiles** (nombre, teléfono, cargo) y **tabla de roles** (admin, oficial_credito, cajero, supervisor) con seguridad RLS
- **Layout principal**: sidebar izquierdo con navegación (Dashboard, Clientes, Solicitudes, Préstamos, Cobranza, Garantías, Reportes), header con usuario y logout
- **Diseño fintech**: paleta azul/verde, tipografía limpia, tarjetas con sombras suaves

## Fase 2 — Módulo de Clientes (CRM)

- **Formulario completo por pestañas**: datos personales, identificación, dirección, contacto, vivienda, información laboral, ingresos, dependientes/hijos, cónyuge, referencias personales y comerciales
- **Listado de clientes** con búsqueda, filtros y badges de estado
- **Perfil del cliente** con resumen, historial de préstamos y documentos
- **Subida de archivos** (foto, cédula, croquis) usando Lovable Cloud Storage

## Fase 3 — Módulo de Solicitudes

- **Flujo paso a paso**: crear solicitud → datos del cliente → información laboral → registrar garantes/codeudores → adjuntar garantías → evaluación → aprobar/rechazar
- **Estados de solicitud**: pendiente, en evaluación, aprobada, rechazada
- **Listado de solicitudes** con filtros por estado, fecha y oficial asignado
- **Vista detalle** con toda la información consolidada para evaluación

## Fase 4 — Módulo de Préstamos y Lógica Financiera

- **Creación de préstamo** desde solicitud aprobada: monto, tasa de interés, número de cuotas, frecuencia (diaria/semanal/quincenal/mensual)
- **Métodos de amortización**: saldo insoluto, cuota fija, interés simple
- **Cálculo automático** de cuota y generación del calendario de pagos
- **Estados**: solicitado, aprobado, activo, en mora, cancelado
- **Listado de préstamos** con filtros y detalle completo con tabla de amortización

## Fase 5 — Módulo de Cobranza y Pagos

- **Calendario de cuotas** con vista diaria/semanal/mensual
- **Registro de pagos**: monto, método (efectivo, transferencia, depósito), fecha
- **Control automático de mora**: cálculo de días de atraso e intereses moratorios
- **Historial de pagos** por préstamo y por cliente
- **Alertas de cuotas vencidas** y próximos vencimientos

## Fase 6 — Módulo de Garantías

- **Registro de garantías prendarias**: descripción, valor tasado, estado
- **Artículos asociados**: serie, modelo, marca, fotos
- **Vinculación** a solicitudes y préstamos
- **Galería de fotos** de artículos en garantía

## Fase 7 — Dashboard Financiero

- **Tarjetas métricas**: total prestado del mes, cartera activa, cartera en mora, ingresos por intereses, clientes activos
- **Gráficos**: préstamos por frecuencia (pie chart), tendencia de cobranza (line chart), distribución de mora (bar chart)
- **Tablas**: últimos préstamos aprobados, próximos vencimientos del día
- **Filtros** por periodo y sucursal

## Fase 8 — Reportes

- **Cartera activa y vencida** con totales y detalle
- **Clientes nuevos** por periodo
- **Préstamos por tipo de frecuencia**
- **Ingresos por interés**
- **Pagos del día**
- **Reporte de morosidad** con antigüedad de saldos
- **Exportación** a formato tabular

## Diseño y UX

- Estilo **fintech moderno** con paleta azul marino (#1a365d) y verde (#38a169)
- Sidebar colapsable con iconos y labels
- Formularios organizados en pestañas/pasos
- Tablas con paginación, búsqueda y ordenamiento
- Badges de colores para estados (activo=verde, mora=rojo, pendiente=amarillo)
- Responsive para uso en escritorio y tablet
- Moneda formateada como RD$ con separadores dominicanos

