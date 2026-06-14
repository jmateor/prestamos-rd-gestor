# Plan: Redes Sociales + Módulo de Citas

## 1. Redes sociales en Información de Empresa

**Base de datos** — agregar a `empresa_info`:
- `facebook_url`, `instagram_url`, `twitter_url`, `linkedin_url`, `youtube_url`, `tiktok_url`, `whatsapp_numero` (todos TEXT nullable).

**UI** — `src/components/ajustes/EmpresaForm.tsx`:
- Nueva sección "Redes Sociales" con icono por red (Facebook, Instagram, X, LinkedIn, YouTube, TikTok, WhatsApp).
- Inputs con prefijo del icono y validación opcional de URL.
- Los enlaces se podrán usar después en recibos/contratos vía plantillas.

## 2. Módulo de Citas con Administrador

### Concepto
El oficial de crédito, al evaluar una solicitud, puede **programar una cita** entre el cliente y el administrador antes de aprobar el préstamo. El administrador ve sus citas pendientes, atiende al cliente, y desde la misma cita decide: **Aprobar**, **Rechazar** o **Posponer** la solicitud.

### Base de datos — nueva tabla `citas_clientes`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `numero_cita` | text | Secuencial `CITA-000000` |
| `cliente_id` | uuid → clientes | |
| `solicitud_id` | uuid → solicitudes (nullable) | Si la cita está ligada a una solicitud |
| `solicitado_por` | uuid → auth.users | Oficial que solicita |
| `asignada_a` | uuid → auth.users | Administrador asignado |
| `fecha_cita` | date | |
| `hora_cita` | time | |
| `motivo` | text | Pre-aprobación, revisión garantía, etc. |
| `notas_oficial` | text | Lo que el oficial quiere que revise el admin |
| `estado` | text | `programada`, `confirmada`, `atendida`, `cancelada`, `no_asistio` |
| `resultado` | text | `aprobar`, `rechazar`, `posponer`, null |
| `notas_administrador` | text | Decisión razonada |
| `fecha_atencion` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

RLS: oficial_credito ve las que él solicitó o donde es cliente asignado; admin ve todas. Auth-only.

### Lógica en flujo de solicitudes
- Nuevo estado opcional en `solicitudes`: `requiere_cita` (boolean) y `cita_id` (uuid).
- Si una solicitud tiene cita programada **no atendida**, el botón **Aprobar** queda bloqueado con mensaje: "Esta solicitud requiere cita con administrador pendiente".
- Cuando el admin marca la cita como `atendida` con resultado `aprobar`, se desbloquea la aprobación y se notifica al oficial.
- Si `rechazar` → la solicitud pasa a `rechazada` automáticamente con motivo desde la cita.

### Frontend

**Nuevo módulo `/citas`** (`src/pages/Citas.tsx`):
- Vista de tarjetas con tabs: **Hoy**, **Próximas**, **Pendientes mías**, **Historial**.
- Filtros por estado, administrador, cliente.
- Acción **Nueva Cita** (dialog con cliente, solicitud opcional, fecha/hora, motivo, admin asignado, notas).
- Click en cita abre **CitaDetailSheet** con datos del cliente, solicitud vinculada (monto, plazo, garantías), notas del oficial, y panel de decisión para el administrador.

**Integración en solicitudes**:
- En `SolicitudDetailDialog` agregar sección "Citas con administrador" con botón **Programar cita** y lista de citas existentes.
- Badge "Cita pendiente" en la tabla de Solicitudes.

**Sidebar**: agregar entrada **Citas** con icono `CalendarClock` entre Cobranza y Reportes.

**Notificaciones**: en `NotificacionesPanel`, alertas para citas del día y citas atendidas con resultado.

### Hook `useCitas.ts`
- `useCitas(filtros)` — listado con joins a cliente, solicitud, admin.
- `useCrearCita`, `useActualizarCita`, `useAtenderCita` (registra resultado y aplica decisión a solicitud si corresponde).
- `useCitasPendientes()` — para badge en sidebar y notificaciones.

## Archivos a crear/editar

**Crear**
- `supabase/migrations/...` (campos redes sociales + tabla citas_clientes + secuencia + grants + RLS)
- `src/hooks/useCitas.ts`
- `src/pages/Citas.tsx`
- `src/components/CitaFormDialog.tsx`
- `src/components/CitaDetailSheet.tsx`

**Editar**
- `src/components/ajustes/EmpresaForm.tsx` (sección redes sociales)
- `src/hooks/useConfiguracion.ts` (extender `EmpresaInfo`)
- `src/App.tsx` (ruta `/citas`)
- `src/components/AppSidebar.tsx` (link Citas)
- `src/components/SolicitudDetailDialog.tsx` (sección citas + bloqueo de aprobación)
- `src/hooks/useSolicitudes.ts` (validar cita pendiente antes de aprobar)

¿Procedo a implementar todo, o quieres ajustar algo (por ejemplo estados de cita, roles que pueden atender, o ligar las citas también a préstamos ya activos para gestiones de cobranza)?
