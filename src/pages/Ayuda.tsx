import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, Users, FileText, Landmark, Banknote, Receipt, CreditCard,
  BarChart3, Wallet, History, Settings, ShieldCheck, Search, HelpCircle,
  CheckCircle2, ArrowRight, Lightbulb, AlertTriangle,
  CalendarCheck, IdCard, Clock, Share2, Bell,
} from 'lucide-react';

type Guia = {
  id: string;
  modulo: string;
  titulo: string;
  descripcion: string;
  icon: any;
  color: string;
  ruta: string;
  nivel: 'Básico' | 'Intermedio' | 'Avanzado';
  pasos: { titulo: string; detalle: string }[];
  tips?: string[];
  alertas?: string[];
};

const GUIAS: Guia[] = [
  {
    id: 'dashboard',
    modulo: 'Dashboard',
    titulo: 'Dashboard e Indicadores',
    descripcion: 'Interpretar KPIs financieros, cartera, mora y préstamos por vencer.',
    icon: LayoutDashboard,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    ruta: '/',
    nivel: 'Básico',
    pasos: [
      { titulo: 'Revisar KPIs principales', detalle: 'Las tarjetas superiores muestran capital colocado, intereses ganados, mora y cartera vencida. Haz clic para voltear y ver el detalle.' },
      { titulo: 'Top 10 Mejores Clientes', detalle: 'Ranking de clientes que pagan puntual. Útil para campañas de fidelización o préstamos preferentes.' },
      { titulo: 'Préstamos a Vencer (7 días)', detalle: 'Lista de cuotas con fecha de vencimiento en los próximos 7 días. Permite anticipar gestión de cobro.' },
      { titulo: 'Alertas de Riesgo', detalle: 'Notificaciones automáticas de clientes en mora avanzada o con score crediticio bajo.' },
    ],
    tips: ['Las tarjetas con efecto flip muestran detalles adicionales al hacer clic.', 'Los montos siempre están en RD$ (pesos dominicanos).'],
  },
  {
    id: 'clientes',
    modulo: 'Clientes',
    titulo: 'Gestión de Clientes (CRM)',
    descripcion: 'Registrar clientes, capturar cédula con OCR, subir documentos y referencias.',
    icon: Users,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    ruta: '/clientes',
    nivel: 'Básico',
    pasos: [
      { titulo: 'Crear nuevo cliente', detalle: 'Botón "Nuevo Cliente" → completa los datos personales en pestañas: Personal, Laboral, Domicilio, Referencias.' },
      { titulo: 'OCR de cédula', detalle: 'Sube la foto de la cédula y el sistema extraerá automáticamente nombre, cédula, fecha de nacimiento y dirección usando IA (Gemini Vision).' },
      { titulo: 'Subir documentos', detalle: 'En el perfil del cliente, pestaña "Documentos": carga cédula frontal/reverso, comprobantes de ingreso, etc.' },
      { titulo: 'Agregar referencias personales', detalle: 'Mínimo 2 referencias con teléfono y relación con el cliente.' },
      { titulo: 'Capturar geolocalización', detalle: 'GPS de domicilio y trabajo para facilitar visitas de cobro (se enlaza con Google Maps).' },
      { titulo: 'Revisar Score Crediticio', detalle: 'El sistema asigna un score 0-100 basado en historial de pagos, mora y monto colocado.' },
    ],
    tips: ['Estados: Activo, Inactivo, Bloqueado. Solo Admin puede desbloquear.', 'La cédula debe tener proporciones 85.60 x 53.98 mm.'],
    alertas: ['Un cliente Bloqueado NO puede recibir nuevos préstamos.'],
  },
  {
    id: 'solicitudes',
    modulo: 'Solicitudes',
    titulo: 'Crear y Evaluar Solicitudes',
    descripcion: 'Registrar solicitud de préstamo, agregar garantías y aprobar/rechazar.',
    icon: FileText,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    ruta: '/solicitudes',
    nivel: 'Intermedio',
    pasos: [
      { titulo: 'Nueva solicitud', detalle: 'Selecciona cliente, monto, plazo (cuotas), frecuencia (diaria/semanal/quincenal/mensual) y tasa de interés.' },
      { titulo: 'Vista previa de cuotas', detalle: 'El sistema calcula automáticamente la amortización y muestra el cronograma antes de guardar.' },
      { titulo: 'Agregar garantía (opcional)', detalle: 'Pestaña Garantías: vehículo, propiedad, equipo o garante personal. El sistema valida LTV (loan-to-value).' },
      { titulo: 'Evaluación', detalle: 'Cambia el estado a "En Evaluación" para análisis. El score crediticio del cliente se muestra en pantalla.' },
      { titulo: 'Aprobar o Rechazar', detalle: 'Si apruebas, la solicitud pasa al módulo Desembolsos. Si rechazas, queda registrada con motivo.' },
      { titulo: 'Generar cotización PDF', detalle: 'Antes de aprobar puedes imprimir una cotización con el cronograma propuesto.' },
    ],
    tips: ['"Frecuencia" se muestra como "Plazo" en algunas pantallas.', 'Puedes editar monto, plazo y tasa antes de aprobar.'],
  },
  {
    id: 'desembolsos',
    modulo: 'Desembolsos',
    titulo: 'Desembolsar Préstamos Aprobados',
    descripcion: 'Convertir solicitudes aprobadas en préstamos activos con cronograma.',
    icon: Banknote,
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    ruta: '/desembolsos',
    nivel: 'Intermedio',
    pasos: [
      { titulo: 'Seleccionar solicitud aprobada', detalle: 'En la lista aparecen solo solicitudes en estado "Aprobada".' },
      { titulo: 'Configurar fecha de desembolso', detalle: 'Puede ser distinta a la fecha de aprobación. La primera cuota se calcula desde aquí.' },
      { titulo: 'Revisar monto neto', detalle: 'Monto bruto menos cargos de cierre y gastos legales = monto neto a entregar.' },
      { titulo: 'Confirmar desembolso', detalle: 'Genera automáticamente: número de préstamo (PRE-XXXXXX), cronograma completo, contrato tripartito y pagaré notarial.' },
      { titulo: 'Imprimir documentos', detalle: 'Descarga PDFs de contrato, pagaré, recibo de desembolso y cronograma para firma del cliente.' },
      { titulo: 'Recolectar firmas digitales', detalle: 'El cliente firma en pantalla (SignaturePad) y la firma se inserta en el PDF del contrato.' },
    ],
    tips: ['Una solicitud desembolsada desaparece de la lista de aprobadas automáticamente.', 'El recibo de desembolso muestra: bruto, comisiones y neto entregado.'],
    alertas: ['Verifica que la caja esté abierta antes de desembolsar en efectivo.'],
  },
  {
    id: 'cobranza',
    modulo: 'Cobranza',
    titulo: 'Gestión de Cobranza',
    descripcion: 'Consultar cuotas por vencer, en mora y registrar gestiones de cobro.',
    icon: Receipt,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    ruta: '/cobranza',
    nivel: 'Básico',
    pasos: [
      { titulo: 'Filtrar por estado', detalle: 'Cuotas Por Vencer, Vencidas Hoy, En Mora. Usa los filtros superiores.' },
      { titulo: 'Ver detalle de préstamo', detalle: 'Clic en una fila abre el panel con cronograma completo y pagos aplicados.' },
      { titulo: 'Registrar gestión', detalle: 'Anota llamadas, visitas o promesas de pago con fecha y observaciones.' },
      { titulo: 'Aplicar pago rápido', detalle: 'Botón "Pago Rápido" o usa el módulo Cobro POS para el flujo completo.' },
    ],
  },
  {
    id: 'cobro-pos',
    modulo: 'Cobro POS',
    titulo: 'Cobro POS (Punto de Venta)',
    descripcion: 'Aplicar pagos en efectivo o transferencia con distribución automática.',
    icon: CreditCard,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    ruta: '/cobro-pos',
    nivel: 'Básico',
    pasos: [
      { titulo: 'Buscar cliente o préstamo', detalle: 'Busca por nombre, cédula o número de préstamo (PRE-XXXXXX).' },
      { titulo: 'Seleccionar préstamo', detalle: 'Muestra cuotas pendientes con mora calculada en tiempo real.' },
      { titulo: 'Ingresar monto a pagar', detalle: 'El sistema distribuye automáticamente: 1° Mora → 2° Intereses → 3° Capital.' },
      { titulo: 'Elegir método de pago', detalle: 'Efectivo (calcula cambio), Transferencia (pide referencia bancaria), Cheque (pide número y banco).' },
      { titulo: 'Confirmar y emitir recibo', detalle: 'Genera recibo térmico de 80mm en PDF descargable con detalle completo.' },
    ],
    tips: ['La caja debe estar abierta para aceptar pagos en efectivo.', 'Los recibos quedan en el historial del préstamo y del cliente.'],
    alertas: ['Si transfiere, la referencia bancaria es obligatoria.'],
  },
  {
    id: 'prestamos',
    modulo: 'Préstamos',
    titulo: 'Administración de Préstamos',
    descripcion: 'Consultar préstamos activos, refinanciar, saldar o reimprimir documentos.',
    icon: Landmark,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    ruta: '/prestamos',
    nivel: 'Intermedio',
    pasos: [
      { titulo: 'Filtrar y buscar', detalle: 'Filtros por estado (Activo, En Mora, Cancelado) y búsqueda por número.' },
      { titulo: 'Ver detalle completo', detalle: 'Clic en un préstamo abre panel con: cronograma, pagos, mora, saldos y documentos.' },
      { titulo: 'Saldar préstamo', detalle: 'Botón "Saldar": calcula capital pendiente + mora (sin penalidades por pago anticipado).' },
      { titulo: 'Reimprimir documentos', detalle: 'Contrato, pagaré, estado de cuenta consolidado, cronograma — todos disponibles como PDF.' },
    ],
    tips: ['Estados: Al Día, En Mora, Cancelado, Castigado.', 'El estado de cuenta consolidado muestra todo el historial del cliente.'],
  },
  {
    id: 'reportes',
    modulo: 'Reportes',
    titulo: 'Reportes Financieros',
    descripcion: 'Generar reportes de cartera, mora, productividad y exportar a CSV.',
    icon: BarChart3,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    ruta: '/reportes',
    nivel: 'Avanzado',
    pasos: [
      { titulo: 'Elegir tipo de reporte', detalle: 'Cartera, Cobranza, Mora, Desembolsos, Clientes, Productividad por cobrador.' },
      { titulo: 'Aplicar filtros', detalle: 'Rango de fechas, sucursal, oficial de crédito, estado de préstamo.' },
      { titulo: 'Visualizar en pantalla', detalle: 'Tabla con totales calculados y gráficos cuando aplica.' },
      { titulo: 'Exportar a CSV', detalle: 'Botón "Exportar CSV" descarga los datos filtrados para análisis externo en Excel.' },
    ],
  },
  {
    id: 'cierre-caja',
    modulo: 'Cierre de Caja',
    titulo: 'Apertura y Cierre de Caja',
    descripcion: 'Control diario obligatorio para operaciones en efectivo.',
    icon: Wallet,
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    ruta: '/cierre-caja',
    nivel: 'Básico',
    pasos: [
      { titulo: 'Abrir caja al iniciar el día', detalle: 'Ingresa el monto inicial en efectivo disponible.' },
      { titulo: 'Operar normalmente', detalle: 'Todos los pagos en efectivo y desembolsos se registran contra la caja abierta.' },
      { titulo: 'Cierre al fin del día', detalle: 'Cuenta el efectivo físico y registra el monto. El sistema calcula sobrante/faltante.' },
      { titulo: 'Confirmar cierre', detalle: 'Una vez cerrada, no se pueden registrar más movimientos en efectivo hasta abrir nuevamente.' },
    ],
    alertas: ['Sin caja abierta no se pueden hacer cobros ni desembolsos en efectivo.'],
  },
  {
    id: 'bitacora',
    modulo: 'Bitácora',
    titulo: 'Bitácora de Auditoría',
    descripcion: 'Registro de todas las acciones del sistema para trazabilidad.',
    icon: History,
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    ruta: '/bitacora',
    nivel: 'Avanzado',
    pasos: [
      { titulo: 'Consultar acciones', detalle: 'Quién, qué, cuándo: creación de clientes, aprobaciones, desembolsos, pagos, cambios de estado.' },
      { titulo: 'Filtrar por usuario o módulo', detalle: 'Útil para auditorías internas o investigaciones de discrepancias.' },
    ],
    tips: ['Solo usuarios con rol Admin pueden acceder.'],
  },
  {
    id: 'ajustes',
    modulo: 'Ajustes',
    titulo: 'Configuración del Sistema',
    descripcion: 'Empresa, sucursales, impresión, plantillas de contratos y parámetros.',
    icon: Settings,
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    ruta: '/ajustes',
    nivel: 'Avanzado',
    pasos: [
      { titulo: 'Datos de Empresa', detalle: 'Razón social, RNC, dirección, teléfono, logo. Aparecen en todos los documentos PDF.' },
      { titulo: 'Sucursales', detalle: 'Alta de múltiples sucursales con dirección y responsable.' },
      { titulo: 'Configuración de Impresión', detalle: 'Tamaño de papel (térmico 80mm o carta), encabezado/pie, copias por defecto.' },
      { titulo: 'Plantillas de Documentos', detalle: 'Edita los modelos de Contrato Tripartito, Pagaré Notarial, Acuerdo de Pago. Soporta variables {{cliente}}, {{monto}}, etc.' },
      { titulo: 'Parámetros del Sistema', detalle: 'Tasa de mora, días de gracia, comisión de cierre, gastos legales — variables financieras globales.' },
    ],
    tips: ['Cambios en plantillas afectan todos los documentos que se generen a futuro.'],
  },
  {
    id: 'garantias',
    modulo: 'Garantías',
    titulo: 'Gestión de Garantías',
    descripcion: 'Integradas en Solicitudes: vehículos, propiedades, equipos y garantes.',
    icon: ShieldCheck,
    color: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    ruta: '/solicitudes',
    nivel: 'Intermedio',
    pasos: [
      { titulo: 'Capturar garantía prendaria', detalle: 'Tipo (vehículo/propiedad/equipo), descripción, valor de mercado, fotos.' },
      { titulo: 'Validación LTV', detalle: 'El sistema calcula el monto máximo prestable según el % LTV configurado (ej: 70% del valor).' },
      { titulo: 'Garante personal', detalle: 'Datos del fiador, cédula, ingresos y firma. Aparece en el contrato tripartito.' },
      { titulo: 'Seguimiento del ciclo', detalle: 'Estados: En Evaluación → Activa → Liberada (al saldar) o En Proceso Legal (mora avanzada).' },
    ],
  },
];

const NIVELES = ['Todos', 'Básico', 'Intermedio', 'Avanzado'] as const;

export default function Ayuda() {
  const [search, setSearch] = useState('');
  const [nivelFilter, setNivelFilter] = useState<typeof NIVELES[number]>('Todos');
  const [selected, setSelected] = useState<Guia | null>(null);

  const filtered = GUIAS.filter((g) => {
    const matchSearch =
      !search ||
      g.titulo.toLowerCase().includes(search.toLowerCase()) ||
      g.modulo.toLowerCase().includes(search.toLowerCase()) ||
      g.descripcion.toLowerCase().includes(search.toLowerCase());
    const matchNivel = nivelFilter === 'Todos' || g.nivel === nivelFilter;
    return matchSearch && matchNivel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HelpCircle className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Centro de Ayuda</h1>
              <p className="text-muted-foreground">Guías paso a paso para dominar cada módulo del sistema</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          {GUIAS.length} guías disponibles
        </Badge>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar guía por módulo o palabra clave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {NIVELES.map((n) => (
            <button
              key={n}
              onClick={() => setNivelFilter(n)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                nivelFilter === n
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de guías */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Search className="h-12 w-12 opacity-30" />
            <p>No se encontraron guías con ese criterio</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => {
            const Icon = g.icon;
            return (
              <Card
                key={g.id}
                onClick={() => setSelected(g)}
                className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 group"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${g.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {g.nivel}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                      {g.titulo}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">{g.modulo}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{g.descripcion}</p>
                  <div className="flex items-center justify-between mt-4 text-xs">
                    <span className="text-muted-foreground">
                      {g.pasos.length} pasos
                    </span>
                    <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver guía <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de detalle */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${selected.color}`}>
                    <selected.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selected.titulo}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{selected.modulo}</Badge>
                      <Badge variant="outline" className="text-xs">{selected.nivel}</Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-6 py-2">
                  <p className="text-sm text-muted-foreground">{selected.descripcion}</p>

                  {/* Pasos */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Paso a paso
                    </h3>
                    <ol className="space-y-3">
                      {selected.pasos.map((p, i) => (
                        <li key={i} className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-sm text-foreground">{p.titulo}</div>
                            <div className="text-xs text-muted-foreground leading-relaxed">{p.detalle}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tips */}
                  {selected.tips && selected.tips.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-primary">
                        <Lightbulb className="h-4 w-4" />
                        Tips útiles
                      </h3>
                      <ul className="space-y-1.5 text-xs text-foreground/80">
                        {selected.tips.map((t, i) => (
                          <li key={i} className="flex gap-2"><span className="text-primary">•</span>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Alertas */}
                  {selected.alertas && selected.alertas.length > 0 && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Importante
                      </h3>
                      <ul className="space-y-1.5 text-xs text-foreground/80">
                        {selected.alertas.map((a, i) => (
                          <li key={i} className="flex gap-2"><span className="text-destructive">•</span>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Acceso directo */}
                  <a
                    href={selected.ruta}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Ir al módulo {selected.modulo}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
