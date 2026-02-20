import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart3, Download, Loader2, AlertTriangle,
  Users, DollarSign, CalendarDays, Landmark, TrendingUp,
} from 'lucide-react';
import {
  useReporteCartera, useReporteClientesNuevos, useReporteIngresos,
  useReportePagosDia, useReporteMorosidad, useReporteFrecuencia,
} from '@/hooks/useReportes';
import { formatCurrency, formatDate } from '@/lib/format';

// ── Helpers ───────────────────────────────────────────────────────────────────

const today      = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SummaryBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${className ?? ''}`}>
      {children}
    </span>
  );
}

// ── Sub-reports ───────────────────────────────────────────────────────────────

function ReporteCartera() {
  const { data, isLoading } = useReporteCartera();
  if (isLoading) return <LoadingRow />;
  const activos  = (data ?? []).filter((p) => p.estado === 'activo');
  const enMora   = (data ?? []).filter((p) => p.estado === 'en_mora');
  const totalA   = activos.reduce((s: number, p: any) => s + Number(p.monto_aprobado), 0);
  const totalM   = enMora.reduce((s: number, p: any)  => s + Number(p.monto_aprobado), 0);

  const doExport = () => exportCSV('cartera.csv',
    ['N° Préstamo', 'Cliente', 'Cédula', 'Monto', 'Estado', 'Desembolso', 'Vencimiento'],
    (data ?? []).map((p: any) => [
      p.numero_prestamo,
      `${p.clientes?.primer_nombre} ${p.clientes?.primer_apellido}`,
      p.clientes?.cedula ?? '',
      p.monto_aprobado,
      p.estado,
      p.fecha_desembolso,
      p.fecha_vencimiento ?? '',
    ])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span>Activos: <strong className="text-success">{activos.length}</strong> — {formatCurrency(totalA)}</span>
          <span>En Mora: <strong className="text-destructive">{enMora.length}</strong> — {formatCurrency(totalM)}</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={doExport}>
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>
      <TableWrap>
        <TableHeader>
          <TableRow>
            <TableHead>N° Préstamo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Cédula</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Vencimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((p: any) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-sm">{p.numero_prestamo}</TableCell>
              <TableCell className="text-sm">{p.clientes?.primer_nombre} {p.clientes?.primer_apellido}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.clientes?.cedula}</TableCell>
              <TableCell className="text-sm">{formatCurrency(p.monto_aprobado)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={p.estado === 'en_mora'
                  ? 'bg-destructive/10 text-destructive border-destructive/20 text-xs'
                  : 'bg-success/10 text-success border-success/20 text-xs'}>
                  {p.estado === 'en_mora' ? 'En Mora' : 'Activo'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{p.fecha_vencimiento ? formatDate(p.fecha_vencimiento) : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableWrap>
    </div>
  );
}

function ReporteClientes() {
  const [desde, setDesde] = useState(firstOfMonth);
  const [hasta, setHasta] = useState(today);
  const { data, isLoading } = useReporteClientesNuevos(desde, hasta);

  const doExport = () => exportCSV('clientes-nuevos.csv',
    ['Nombre', 'Cédula', 'Teléfono', 'Fecha Registro', 'Estado'],
    (data ?? []).map((c: any) => [
      `${c.primer_nombre} ${c.primer_apellido}`,
      c.cedula, c.telefono,
      formatDate(c.created_at), c.estado,
    ])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <DateRange desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} />
        <div className="ml-auto flex items-center gap-2">
          {!isLoading && <span className="text-sm text-muted-foreground">{data?.length ?? 0} clientes</span>}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={doExport}>
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>
      </div>
      {isLoading ? <LoadingRow /> : (
        <TableWrap>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm font-medium">{c.primer_nombre} {c.primer_apellido}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.cedula}</TableCell>
                <TableCell className="text-sm">{c.telefono}</TableCell>
                <TableCell className="text-sm">{formatDate(c.created_at)}</TableCell>
                <TableCell>
                  <SummaryBadge className="bg-success/10 text-success border-success/20">{c.estado}</SummaryBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableWrap>
      )}
    </div>
  );
}

function ReporteIngresos() {
  const [desde, setDesde] = useState(firstOfMonth);
  const [hasta, setHasta] = useState(today);
  const { data, isLoading } = useReporteIngresos(desde, hasta);
  const total = (data ?? []).reduce((s: number, p: any) => s + Number(p.monto_pagado), 0);

  const doExport = () => exportCSV('ingresos.csv',
    ['Fecha', 'Préstamo', 'Cliente', 'Monto Cobrado', 'Método'],
    (data ?? []).map((p: any) => [
      p.fecha_pago,
      p.prestamos?.numero_prestamo ?? '',
      `${p.prestamos?.clientes?.primer_nombre ?? ''} ${p.prestamos?.clientes?.primer_apellido ?? ''}`,
      p.monto_pagado,
      p.metodo_pago,
    ])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <DateRange desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} />
        <div className="ml-auto flex items-center gap-3">
          {!isLoading && (
            <span className="text-sm font-semibold text-success">
              Total: {formatCurrency(total)}
            </span>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={doExport}>
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>
      </div>
      {isLoading ? <LoadingRow /> : (
        <TableWrap>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Préstamo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">{formatDate(p.fecha_pago)}</TableCell>
                <TableCell className="font-mono text-sm">{p.prestamos?.numero_prestamo}</TableCell>
                <TableCell className="text-sm">{p.prestamos?.clientes?.primer_nombre} {p.prestamos?.clientes?.primer_apellido}</TableCell>
                <TableCell className="text-sm font-semibold">{formatCurrency(p.monto_pagado)}</TableCell>
                <TableCell className="text-sm capitalize">{p.metodo_pago}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableWrap>
      )}
    </div>
  );
}

function ReportePagosDia() {
  const [fecha, setFecha] = useState(today);
  const { data, isLoading } = useReportePagosDia(fecha);
  const total = (data ?? []).reduce((s: number, p: any) => s + Number(p.monto_pagado), 0);

  const doExport = () => exportCSV(`pagos-${fecha}.csv`,
    ['Préstamo', 'Cliente', 'Monto', 'Método', 'Referencia'],
    (data ?? []).map((p: any) => [
      p.prestamos?.numero_prestamo ?? '',
      `${p.prestamos?.clientes?.primer_nombre ?? ''} ${p.prestamos?.clientes?.primer_apellido ?? ''}`,
      p.monto_pagado, p.metodo_pago, p.referencia ?? '',
    ])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Fecha:</label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-40 h-8" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {!isLoading && (
            <span className="text-sm font-semibold text-success">
              Total: {formatCurrency(total)} ({data?.length ?? 0} pagos)
            </span>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={doExport}>
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>
      </div>
      {isLoading ? <LoadingRow /> : (data ?? []).length === 0 ? (
        <EmptyRow label="No hay pagos en esta fecha" />
      ) : (
        <TableWrap>
          <TableHeader>
            <TableRow>
              <TableHead>Préstamo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Referencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.prestamos?.numero_prestamo}</TableCell>
                <TableCell className="text-sm">{p.prestamos?.clientes?.primer_nombre} {p.prestamos?.clientes?.primer_apellido}</TableCell>
                <TableCell className="text-sm font-semibold">{formatCurrency(p.monto_pagado)}</TableCell>
                <TableCell className="text-sm capitalize">{p.metodo_pago}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.referencia || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableWrap>
      )}
    </div>
  );
}

function ReporteMorosidad() {
  const { data, isLoading } = useReporteMorosidad();

  const tramos = ['1-30 días', '31-60 días', '61-90 días', 'Más de 90 días'];
  const resumen = tramos.map((t) => {
    const rows = (data ?? []).filter((c: any) => c.tramo === t);
    return { tramo: t, count: rows.length, monto: rows.reduce((s: number, c: any) => s + (c.monto_cuota - c.monto_pagado), 0) };
  });

  const doExport = () => exportCSV('morosidad.csv',
    ['Préstamo', 'Cliente', 'Cédula', 'Teléfono', 'Cuota #', 'Vencimiento', 'Días', 'Tramo', 'Pendiente'],
    (data ?? []).map((c: any) => [
      c.prestamos?.numero_prestamo ?? '',
      `${c.prestamos?.clientes?.primer_nombre ?? ''} ${c.prestamos?.clientes?.primer_apellido ?? ''}`,
      c.prestamos?.clientes?.cedula ?? '',
      c.prestamos?.clientes?.telefono ?? '',
      c.numero_cuota, c.fecha_vencimiento, c.dias, c.tramo,
      c.monto_cuota - c.monto_pagado,
    ])
  );

  return (
    <div className="space-y-4">
      {/* Resumen por tramo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {resumen.map(({ tramo, count, monto }) => (
          <Card key={tramo} className="shadow-none border">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{tramo}</p>
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs text-destructive font-medium">{formatCurrency(monto)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={doExport}>
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>
      {isLoading ? <LoadingRow /> : (
        <TableWrap>
          <TableHeader>
            <TableRow>
              <TableHead>Préstamo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Cuota #</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Tramo</TableHead>
              <TableHead>Pendiente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((c: any) => (
              <TableRow key={c.id} className="bg-destructive/5 hover:bg-destructive/10">
                <TableCell className="font-mono text-sm">{c.prestamos?.numero_prestamo}</TableCell>
                <TableCell className="text-sm">{c.prestamos?.clientes?.primer_nombre} {c.prestamos?.clientes?.primer_apellido}</TableCell>
                <TableCell className="text-sm">{c.prestamos?.clientes?.telefono}</TableCell>
                <TableCell className="text-sm text-muted-foreground">#{c.numero_cuota}</TableCell>
                <TableCell className="text-sm">{formatDate(c.fecha_vencimiento)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    c.dias > 90 ? 'bg-destructive/20 text-destructive border-destructive/30 text-xs'
                    : 'bg-destructive/10 text-destructive border-destructive/20 text-xs'
                  }>
                    {c.dias}d
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.tramo}</TableCell>
                <TableCell className="text-sm font-semibold text-destructive">
                  {formatCurrency(c.monto_cuota - c.monto_pagado)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableWrap>
      )}
    </div>
  );
}

function ReporteFrecuencia() {
  const { data, isLoading } = useReporteFrecuencia();
  const labels: Record<string, string> = {
    diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
  };
  if (isLoading) return <LoadingRow />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(data ?? []).map((r: any) => (
          <Card key={r.frecuencia} className="shadow-none border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{labels[r.frecuencia] ?? r.frecuencia}</p>
              <p className="text-2xl font-bold mt-1">{r.count}</p>
              <p className="text-xs text-primary font-medium mt-0.5">{formatCurrency(r.monto)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <TableWrap>
        <TableHeader>
          <TableRow>
            <TableHead>Frecuencia</TableHead>
            <TableHead>N° Préstamos</TableHead>
            <TableHead>Monto Total</TableHead>
            <TableHead>Promedio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((r: any) => (
            <TableRow key={r.frecuencia}>
              <TableCell className="font-medium">{labels[r.frecuencia] ?? r.frecuencia}</TableCell>
              <TableCell>{r.count}</TableCell>
              <TableCell>{formatCurrency(r.monto)}</TableCell>
              <TableCell>{formatCurrency(r.count ? r.monto / r.count : 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableWrap>
    </div>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>{children}</Table>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="text-center text-muted-foreground py-10">{label}</p>
  );
}

function DateRange({ desde, hasta, onDesde, onHasta }: {
  desde: string; hasta: string;
  onDesde: (v: string) => void; onHasta: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Desde:</label>
      <Input type="date" value={desde} onChange={(e) => onDesde(e.target.value)} className="w-36 h-8" />
      <label className="text-sm font-medium">Hasta:</label>
      <Input type="date" value={hasta} onChange={(e) => onHasta(e.target.value)} className="w-36 h-8" />
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────

const tabs = [
  { value: 'cartera',    label: 'Cartera',         icon: Landmark,     component: ReporteCartera },
  { value: 'clientes',   label: 'Clientes Nuevos', icon: Users,        component: ReporteClientes },
  { value: 'ingresos',   label: 'Ingresos',        icon: TrendingUp,   component: ReporteIngresos },
  { value: 'pagos-dia',  label: 'Pagos del Día',   icon: CalendarDays, component: ReportePagosDia },
  { value: 'morosidad',  label: 'Morosidad',       icon: AlertTriangle,component: ReporteMorosidad },
  { value: 'frecuencia', label: 'Por Frecuencia',  icon: BarChart3,    component: ReporteFrecuencia },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Reportes() {
  const [activeTab, setActiveTab] = useState<string>('cartera');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Reportes financieros del sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5 text-xs sm:text-sm">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ value, component: Comp }) => (
          <TabsContent key={value} value={value}>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {tabs.find((t) => t.value === value)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Comp />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
