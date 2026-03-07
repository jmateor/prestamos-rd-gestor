import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart3, Download, Loader2, AlertTriangle,
  Users, DollarSign, CalendarDays, Landmark, TrendingUp, Filter, X,
} from 'lucide-react';
import {
  useReporteCartera, useReporteClientesNuevos, useReporteIngresos,
  useReportePagosDia, useReporteMorosidad, useReporteFrecuencia,
  useZonas, useCobradores, useOficiales,
} from '@/hooks/useReportes';
import { formatCurrency, formatDate } from '@/lib/format';

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [headers, ...rows]
    .map((r) => r.map((v) => `"${v}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function clientName(row: any): string {
  const c = row?.clientes || row?.prestamos?.clientes || row;
  return `${c?.primer_nombre ?? ''} ${c?.primer_apellido ?? ''}`.trim().toLowerCase();
}

function clientCedula(row: any): string {
  const c = row?.clientes || row?.prestamos?.clientes || row;
  return c?.cedula ?? '';
}

function matchesSearch(row: any, search: string): boolean {
  if (!search) return true;
  const s = search.toLowerCase();
  return clientName(row).includes(s) || clientCedula(row).includes(s)
    || (row?.numero_prestamo ?? '').toLowerCase().includes(s)
    || (row?.prestamos?.numero_prestamo ?? '').toLowerCase().includes(s);
}

function matchesMonto(monto: number, montoMin: string, montoMax: string): boolean {
  if (montoMin && monto < Number(montoMin)) return false;
  if (montoMax && monto > Number(montoMax)) return false;
  return true;
}

// ── Filter Bar Component ─────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  montoMin: string;
  montoMax: string;
  onMontoMin: (v: string) => void;
  onMontoMax: (v: string) => void;
  zona?: string;
  onZona?: (v: string) => void;
  oficial?: string;
  onOficial?: (v: string) => void;
  cobrador?: string;
  onCobrador?: (v: string) => void;
  estado?: string;
  onEstado?: (v: string) => void;
  estadoOptions?: { value: string; label: string }[];
  tramo?: string;
  onTramo?: (v: string) => void;
  metodo?: string;
  onMetodo?: (v: string) => void;
  showDates?: boolean;
  desde?: string;
  hasta?: string;
  onDesde?: (v: string) => void;
  onHasta?: (v: string) => void;
  showFecha?: boolean;
  fecha?: string;
  onFecha?: (v: string) => void;
  onClear: () => void;
  resultCount?: number;
  totalLabel?: string;
  totalAmount?: number;
  onExport?: () => void;
}

function FilterBar({
  search, onSearch, montoMin, montoMax, onMontoMin, onMontoMax,
  zona, onZona, oficial, onOficial, cobrador, onCobrador,
  estado, onEstado, estadoOptions,
  tramo, onTramo, metodo, onMetodo,
  showDates, desde, hasta, onDesde, onHasta,
  showFecha, fecha, onFecha,
  onClear, resultCount, totalLabel, totalAmount, onExport,
}: FilterBarProps) {
  const { data: zonas } = useZonas();
  const { data: oficiales } = useOficiales();
  const { data: cobradores } = useCobradores();

  const hasFilters = search || montoMin || montoMax
    || (zona && zona !== '__all__') || (oficial && oficial !== '__all__')
    || (cobrador && cobrador !== '__all__') || (estado && estado !== '__all__')
    || (tramo && tramo !== '__all__') || (metodo && metodo !== '__all__');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente, cédula o préstamo..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="h-8 w-56"
        />

        {showDates && onDesde && onHasta && (
          <>
            <Input type="date" value={desde} onChange={(e) => onDesde(e.target.value)} className="w-36 h-8" />
            <span className="text-xs text-muted-foreground">a</span>
            <Input type="date" value={hasta} onChange={(e) => onHasta(e.target.value)} className="w-36 h-8" />
          </>
        )}

        {showFecha && onFecha && (
          <Input type="date" value={fecha} onChange={(e) => onFecha(e.target.value)} className="w-36 h-8" />
        )}

        <Input placeholder="Monto mín." value={montoMin} onChange={(e) => onMontoMin(e.target.value)} className="h-8 w-28" type="number" />
        <Input placeholder="Monto máx." value={montoMax} onChange={(e) => onMontoMax(e.target.value)} className="h-8 w-28" type="number" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onZona && (
          <Select value={zona || '__all__'} onValueChange={(v) => onZona(v)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Zona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las zonas</SelectItem>
              {(zonas ?? []).map((z) => (
                <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onOficial && (
          <Select value={oficial || '__all__'} onValueChange={(v) => onOficial(v)}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Oficial de crédito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los oficiales</SelectItem>
              {(oficiales ?? []).map((o) => (
                <SelectItem key={o.user_id} value={o.user_id}>{o.full_name || 'Sin nombre'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onCobrador && (
          <Select value={cobrador || '__all__'} onValueChange={(v) => onCobrador(v)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Cobrador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los cobradores</SelectItem>
              {(cobradores ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onEstado && estadoOptions && (
          <Select value={estado || '__all__'} onValueChange={(v) => onEstado(v)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {estadoOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onTramo && (
          <Select value={tramo || '__all__'} onValueChange={(v) => onTramo(v)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Tramo mora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los tramos</SelectItem>
              <SelectItem value="1-30 días">1-30 días</SelectItem>
              <SelectItem value="31-60 días">31-60 días</SelectItem>
              <SelectItem value="61-90 días">61-90 días</SelectItem>
              <SelectItem value="Más de 90 días">Más de 90 días</SelectItem>
            </SelectContent>
          </Select>
        )}

        {onMetodo && (
          <Select value={metodo || '__all__'} onValueChange={(v) => onMetodo(v)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Método pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onClear}>
            <X className="h-3 w-3" /> Limpiar
          </Button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {resultCount !== undefined && (
            <span className="text-xs text-muted-foreground">{resultCount} resultados</span>
          )}
          {totalAmount !== undefined && (
            <span className="text-sm font-semibold text-primary">
              {totalLabel ?? 'Total'}: {formatCurrency(totalAmount)}
            </span>
          )}
          {onExport && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={onExport}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-reports ───────────────────────────────────────────────────────────────

function ReporteCartera() {
  const { data, isLoading } = useReporteCartera();
  const [search, setSearch] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [zona, setZona] = useState('__all__');
  const [oficial, setOficial] = useState('__all__');
  const [cobrador, setCobrador] = useState('__all__');
  const [estado, setEstado] = useState('__all__');

  const filtered = useMemo(() => {
    return (data ?? []).filter((p: any) => {
      if (!matchesSearch(p, search)) return false;
      if (!matchesMonto(Number(p.monto_aprobado), montoMin, montoMax)) return false;
      if (zona !== '__all__' && p.zona_id !== zona) return false;
      if (oficial !== '__all__' && p.oficial_credito_id !== oficial) return false;
      if (cobrador !== '__all__' && p.cobrador_id !== cobrador) return false;
      if (estado !== '__all__' && p.estado !== estado) return false;
      return true;
    });
  }, [data, search, montoMin, montoMax, zona, oficial, cobrador, estado]);

  const totalMonto = filtered.reduce((s: number, p: any) => s + Number(p.monto_aprobado), 0);

  const doExport = () => exportCSV('cartera.csv',
    ['N° Préstamo', 'Cliente', 'Cédula', 'Monto', 'Estado', 'Zona', 'Cobrador', 'Desembolso', 'Vencimiento'],
    filtered.map((p: any) => [
      p.numero_prestamo,
      `${p.clientes?.primer_nombre} ${p.clientes?.primer_apellido}`,
      p.clientes?.cedula ?? '', p.monto_aprobado, p.estado,
      p.zonas?.nombre ?? '', p.cobradores?.nombre ?? '',
      p.fecha_desembolso, p.fecha_vencimiento ?? '',
    ])
  );

  const clearFilters = () => { setSearch(''); setMontoMin(''); setMontoMax(''); setZona('__all__'); setOficial('__all__'); setCobrador('__all__'); setEstado('__all__'); };

  if (isLoading) return <LoadingRow />;

  return (
    <div className="space-y-4">
      <FilterBar
        search={search} onSearch={setSearch}
        montoMin={montoMin} montoMax={montoMax} onMontoMin={setMontoMin} onMontoMax={setMontoMax}
        zona={zona} onZona={setZona}
        oficial={oficial} onOficial={setOficial}
        cobrador={cobrador} onCobrador={setCobrador}
        estado={estado} onEstado={setEstado}
        estadoOptions={[{ value: 'activo', label: 'Activo' }, { value: 'en_mora', label: 'En Mora' }]}
        onClear={clearFilters}
        resultCount={filtered.length}
        totalAmount={totalMonto}
        onExport={doExport}
      />
      <TableWrap>
        <TableHeader>
          <TableRow>
            <TableHead>N° Préstamo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Cédula</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead>Cobrador</TableHead>
            <TableHead>Vencimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>
          ) : filtered.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-sm">{p.numero_prestamo}</TableCell>
              <TableCell className="text-sm">{p.clientes?.primer_nombre} {p.clientes?.primer_apellido}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.clientes?.cedula}</TableCell>
              <TableCell className="text-sm">{formatCurrency(p.monto_aprobado)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={p.estado === 'en_mora'
                  ? 'bg-destructive/10 text-destructive border-destructive/20 text-xs'
                  : 'bg-green-500/10 text-green-600 border-green-500/20 text-xs'}>
                  {p.estado === 'en_mora' ? 'En Mora' : 'Activo'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.zonas?.nombre ?? '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{p.cobradores?.nombre ?? '—'}</TableCell>
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
  const [search, setSearch] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [estado, setEstado] = useState('__all__');

  const filtered = useMemo(() => {
    return (data ?? []).filter((c: any) => {
      if (!matchesSearch(c, search)) return false;
      if (estado !== '__all__' && c.estado !== estado) return false;
      return true;
    });
  }, [data, search, estado]);

  const doExport = () => exportCSV('clientes-nuevos.csv',
    ['Nombre', 'Cédula', 'Teléfono', 'Fecha Registro', 'Estado'],
    filtered.map((c: any) => [
      `${c.primer_nombre} ${c.primer_apellido}`, c.cedula, c.telefono,
      formatDate(c.created_at), c.estado,
    ])
  );

  const clearFilters = () => { setSearch(''); setMontoMin(''); setMontoMax(''); setEstado('__all__'); };

  return (
    <div className="space-y-4">
      <FilterBar
        search={search} onSearch={setSearch}
        montoMin={montoMin} montoMax={montoMax} onMontoMin={setMontoMin} onMontoMax={setMontoMax}
        showDates desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta}
        estado={estado} onEstado={setEstado}
        estadoOptions={[{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]}
        onClear={clearFilters}
        resultCount={filtered.length}
        onExport={doExport}
      />
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
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>
            ) : filtered.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="text-sm font-medium">{c.primer_nombre} {c.primer_apellido}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.cedula}</TableCell>
                <TableCell className="text-sm">{c.telefono}</TableCell>
                <TableCell className="text-sm">{formatDate(c.created_at)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">{c.estado}</Badge>
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
  const [search, setSearch] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [zona, setZona] = useState('__all__');
  const [oficial, setOficial] = useState('__all__');
  const [cobrador, setCobrador] = useState('__all__');
  const [metodo, setMetodo] = useState('__all__');

  const filtered = useMemo(() => {
    return (data ?? []).filter((p: any) => {
      if (!matchesSearch(p, search)) return false;
      if (!matchesMonto(Number(p.monto_pagado), montoMin, montoMax)) return false;
      if (zona !== '__all__' && p.prestamos?.zona_id !== zona) return false;
      if (oficial !== '__all__' && p.prestamos?.oficial_credito_id !== oficial) return false;
      if (cobrador !== '__all__' && p.prestamos?.cobrador_id !== cobrador) return false;
      if (metodo !== '__all__' && p.metodo_pago !== metodo) return false;
      return true;
    });
  }, [data, search, montoMin, montoMax, zona, oficial, cobrador, metodo]);

  const total = filtered.reduce((s: number, p: any) => s + Number(p.monto_pagado), 0);

  const doExport = () => exportCSV('ingresos.csv',
    ['Fecha', 'Préstamo', 'Cliente', 'Monto Cobrado', 'Método', 'Zona', 'Cobrador'],
    filtered.map((p: any) => [
      p.fecha_pago, p.prestamos?.numero_prestamo ?? '',
      `${p.prestamos?.clientes?.primer_nombre ?? ''} ${p.prestamos?.clientes?.primer_apellido ?? ''}`,
      p.monto_pagado, p.metodo_pago,
      p.prestamos?.zonas?.nombre ?? '', p.prestamos?.cobradores?.nombre ?? '',
    ])
  );

  const clearFilters = () => { setSearch(''); setMontoMin(''); setMontoMax(''); setZona('__all__'); setOficial('__all__'); setCobrador('__all__'); setMetodo('__all__'); };

  return (
    <div className="space-y-4">
      <FilterBar
        search={search} onSearch={setSearch}
        montoMin={montoMin} montoMax={montoMax} onMontoMin={setMontoMin} onMontoMax={setMontoMax}
        showDates desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta}
        zona={zona} onZona={setZona}
        oficial={oficial} onOficial={setOficial}
        cobrador={cobrador} onCobrador={setCobrador}
        metodo={metodo} onMetodo={setMetodo}
        onClear={clearFilters}
        resultCount={filtered.length}
        totalLabel="Total Ingresos" totalAmount={total}
        onExport={doExport}
      />
      {isLoading ? <LoadingRow /> : (
        <TableWrap>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Préstamo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Cobrador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>
            ) : filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">{formatDate(p.fecha_pago)}</TableCell>
                <TableCell className="font-mono text-sm">{p.prestamos?.numero_prestamo}</TableCell>
                <TableCell className="text-sm">{p.prestamos?.clientes?.primer_nombre} {p.prestamos?.clientes?.primer_apellido}</TableCell>
                <TableCell className="text-sm font-semibold">{formatCurrency(p.monto_pagado)}</TableCell>
                <TableCell className="text-sm capitalize">{p.metodo_pago}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.prestamos?.zonas?.nombre ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.prestamos?.cobradores?.nombre ?? '—'}</TableCell>
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
  const [search, setSearch] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [zona, setZona] = useState('__all__');
  const [cobrador, setCobrador] = useState('__all__');
  const [metodo, setMetodo] = useState('__all__');

  const filtered = useMemo(() => {
    return (data ?? []).filter((p: any) => {
      if (!matchesSearch(p, search)) return false;
      if (!matchesMonto(Number(p.monto_pagado), montoMin, montoMax)) return false;
      if (zona !== '__all__' && p.prestamos?.zona_id !== zona) return false;
      if (cobrador !== '__all__' && p.prestamos?.cobrador_id !== cobrador) return false;
      if (metodo !== '__all__' && p.metodo_pago !== metodo) return false;
      return true;
    });
  }, [data, search, montoMin, montoMax, zona, cobrador, metodo]);

  const total = filtered.reduce((s: number, p: any) => s + Number(p.monto_pagado), 0);

  const doExport = () => exportCSV(`pagos-${fecha}.csv`,
    ['Préstamo', 'Cliente', 'Monto', 'Método', 'Referencia', 'Zona', 'Cobrador'],
    filtered.map((p: any) => [
      p.prestamos?.numero_prestamo ?? '',
      `${p.prestamos?.clientes?.primer_nombre ?? ''} ${p.prestamos?.clientes?.primer_apellido ?? ''}`,
      p.monto_pagado, p.metodo_pago, p.referencia ?? '',
      p.prestamos?.zonas?.nombre ?? '', p.prestamos?.cobradores?.nombre ?? '',
    ])
  );

  const clearFilters = () => { setSearch(''); setMontoMin(''); setMontoMax(''); setZona('__all__'); setCobrador('__all__'); setMetodo('__all__'); };

  return (
    <div className="space-y-4">
      <FilterBar
        search={search} onSearch={setSearch}
        montoMin={montoMin} montoMax={montoMax} onMontoMin={setMontoMin} onMontoMax={setMontoMax}
        showFecha fecha={fecha} onFecha={setFecha}
        zona={zona} onZona={setZona}
        cobrador={cobrador} onCobrador={setCobrador}
        metodo={metodo} onMetodo={setMetodo}
        onClear={clearFilters}
        resultCount={filtered.length}
        totalLabel="Total Día" totalAmount={total}
        onExport={doExport}
      />
      {isLoading ? <LoadingRow /> : filtered.length === 0 ? (
        <EmptyRow label="No hay pagos con estos filtros" />
      ) : (
        <TableWrap>
          <TableHeader>
            <TableRow>
              <TableHead>Préstamo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Cobrador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.prestamos?.numero_prestamo}</TableCell>
                <TableCell className="text-sm">{p.prestamos?.clientes?.primer_nombre} {p.prestamos?.clientes?.primer_apellido}</TableCell>
                <TableCell className="text-sm font-semibold">{formatCurrency(p.monto_pagado)}</TableCell>
                <TableCell className="text-sm capitalize">{p.metodo_pago}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.referencia || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.prestamos?.zonas?.nombre ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.prestamos?.cobradores?.nombre ?? '—'}</TableCell>
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
  const [search, setSearch] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [zona, setZona] = useState('__all__');
  const [oficial, setOficial] = useState('__all__');
  const [cobrador, setCobrador] = useState('__all__');
  const [tramo, setTramo] = useState('__all__');

  const filtered = useMemo(() => {
    return (data ?? []).filter((c: any) => {
      if (!matchesSearch(c, search)) return false;
      const pendiente = c.monto_cuota - c.monto_pagado;
      if (!matchesMonto(pendiente, montoMin, montoMax)) return false;
      if (zona !== '__all__' && c.prestamos?.zona_id !== zona) return false;
      if (oficial !== '__all__' && c.prestamos?.oficial_credito_id !== oficial) return false;
      if (cobrador !== '__all__' && c.prestamos?.cobrador_id !== cobrador) return false;
      if (tramo !== '__all__' && c.tramo !== tramo) return false;
      return true;
    });
  }, [data, search, montoMin, montoMax, zona, oficial, cobrador, tramo]);

  const tramos = ['1-30 días', '31-60 días', '61-90 días', 'Más de 90 días'];
  const resumen = tramos.map((t) => {
    const rows = filtered.filter((c: any) => c.tramo === t);
    return { tramo: t, count: rows.length, monto: rows.reduce((s: number, c: any) => s + (c.monto_cuota - c.monto_pagado), 0) };
  });
  const totalPendiente = filtered.reduce((s: number, c: any) => s + (c.monto_cuota - c.monto_pagado), 0);

  const doExport = () => exportCSV('morosidad.csv',
    ['Préstamo', 'Cliente', 'Cédula', 'Teléfono', 'Cuota #', 'Vencimiento', 'Días', 'Tramo', 'Pendiente', 'Zona', 'Cobrador'],
    filtered.map((c: any) => [
      c.prestamos?.numero_prestamo ?? '',
      `${c.prestamos?.clientes?.primer_nombre ?? ''} ${c.prestamos?.clientes?.primer_apellido ?? ''}`,
      c.prestamos?.clientes?.cedula ?? '', c.prestamos?.clientes?.telefono ?? '',
      c.numero_cuota, c.fecha_vencimiento, c.dias, c.tramo,
      c.monto_cuota - c.monto_pagado,
      c.prestamos?.zonas?.nombre ?? '', c.prestamos?.cobradores?.nombre ?? '',
    ])
  );

  const clearFilters = () => { setSearch(''); setMontoMin(''); setMontoMax(''); setZona('__all__'); setOficial('__all__'); setCobrador('__all__'); setTramo('__all__'); };

  if (isLoading) return <LoadingRow />;

  return (
    <div className="space-y-4">
      <FilterBar
        search={search} onSearch={setSearch}
        montoMin={montoMin} montoMax={montoMax} onMontoMin={setMontoMin} onMontoMax={setMontoMax}
        zona={zona} onZona={setZona}
        oficial={oficial} onOficial={setOficial}
        cobrador={cobrador} onCobrador={setCobrador}
        tramo={tramo} onTramo={setTramo}
        onClear={clearFilters}
        resultCount={filtered.length}
        totalLabel="Total Pendiente" totalAmount={totalPendiente}
        onExport={doExport}
      />
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
            <TableHead>Zona</TableHead>
            <TableHead>Cobrador</TableHead>
            <TableHead>Pendiente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Sin resultados</TableCell></TableRow>
          ) : filtered.map((c: any) => (
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
              <TableCell className="text-sm text-muted-foreground">{c.prestamos?.zonas?.nombre ?? '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.prestamos?.cobradores?.nombre ?? '—'}</TableCell>
              <TableCell className="text-sm font-semibold text-destructive">
                {formatCurrency(c.monto_cuota - c.monto_pagado)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableWrap>
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
    <div className="rounded-md border overflow-auto">
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

// ── Tab config ────────────────────────────────────────────────────────────────

const tabsConfig = [
  { value: 'cartera', label: 'Cartera', icon: Landmark, component: ReporteCartera },
  { value: 'clientes', label: 'Clientes Nuevos', icon: Users, component: ReporteClientes },
  { value: 'ingresos', label: 'Ingresos', icon: TrendingUp, component: ReporteIngresos },
  { value: 'pagos-dia', label: 'Pagos del Día', icon: CalendarDays, component: ReportePagosDia },
  { value: 'morosidad', label: 'Morosidad', icon: AlertTriangle, component: ReporteMorosidad },
  { value: 'frecuencia', label: 'Por Frecuencia', icon: BarChart3, component: ReporteFrecuencia },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Reportes() {
  const [activeTab, setActiveTab] = useState<string>('cartera');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Reportes financieros con filtros combinados</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabsConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5 text-xs sm:text-sm">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsConfig.map(({ value, component: Comp }) => (
          <TabsContent key={value} value={value}>
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {tabsConfig.find((t) => t.value === value)?.label}
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
