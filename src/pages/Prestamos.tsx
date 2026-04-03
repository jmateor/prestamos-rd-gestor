import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Landmark, Loader2 } from 'lucide-react';
import { usePrestamos } from '@/hooks/usePrestamos';
import { PrestamoFormDialog } from '@/components/PrestamoFormDialog';
import { PrestamoDetailSheet } from '@/components/PrestamoDetailSheet';
import { formatCurrency, formatDate } from '@/lib/format';

const estadoBadge: Record<string, string> = {
  activo:    'bg-success/10 text-success border-success/20',
  al_dia:    'bg-success/10 text-success border-success/20',
  en_mora:   'bg-destructive/10 text-destructive border-destructive/20',
  cancelado: 'bg-muted text-muted-foreground border-border',
  castigado: 'bg-destructive/20 text-destructive border-destructive/30',
};

const estadoLabel: Record<string, string> = {
  activo: 'Activo', al_dia: 'Al Día', en_mora: 'En Mora', cancelado: 'Cancelado', castigado: 'Castigado',
};

const frecuenciaLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

export default function Prestamos() {
  const [search, setSearch]           = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  const { data: prestamos, isLoading } = usePrestamos({ estado: estadoFilter, search });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Préstamos</h1>
          <p className="text-muted-foreground">Administración de préstamos activos</p>
        </div>
        <PrestamoFormDialog />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="en_mora">En Mora</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !prestamos || prestamos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Landmark className="h-12 w-12 opacity-30" />
              <p>No hay préstamos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Préstamo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Tasa</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Desembolso</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestamos.map((p) => {
                  const cliente = p.clientes;
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedId(p.id)}
                    >
                      <TableCell className="font-mono text-sm font-medium">{p.numero_prestamo}</TableCell>
                      <TableCell>
                        {cliente
                          ? `${cliente.primer_nombre} ${cliente.primer_apellido}`
                          : <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell>{formatCurrency(p.monto_aprobado)}</TableCell>
                      <TableCell>{p.tasa_interes}%</TableCell>
                      <TableCell>{frecuenciaLabel[p.frecuencia_pago] ?? p.frecuencia_pago}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.fecha_desembolso)}</TableCell>
                      <TableCell className="text-sm">
                        {p.fecha_vencimiento ? formatDate(p.fecha_vencimiento) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadge[p.estado] ?? ''}>
                          {estadoLabel[p.estado] ?? p.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail panel */}
      <PrestamoDetailSheet prestamoId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
