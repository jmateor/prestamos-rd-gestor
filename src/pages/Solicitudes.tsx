import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { SolicitudFormDialog } from '@/components/SolicitudFormDialog';
import { SolicitudDetailDialog } from '@/components/SolicitudDetailDialog';
import { formatCurrency } from '@/lib/format';

const estadoBadge: Record<string, { class: string; label: string }> = {
  pendiente:     { class: 'bg-warning/10 text-warning border-warning/20',            label: 'Pendiente' },
  en_evaluacion: { class: 'bg-primary/10 text-primary border-primary/20',            label: 'En Evaluación' },
  aprobada:      { class: 'bg-success/10 text-success border-success/20',             label: 'Aprobada' },
  rechazada:     { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Rechazada' },
};

const frecuenciaLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

export default function Solicitudes() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: solicitudes, isLoading } = useSolicitudes({ estado: estadoFilter, search });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitudes</h1>
          <p className="text-muted-foreground">Gestión de solicitudes de préstamo</p>
        </div>
        <SolicitudFormDialog />
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
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_evaluacion">En Evaluación</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
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
          ) : !solicitudes || solicitudes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-30" />
              <p>No se encontraron solicitudes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Solicitud</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Cuotas</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.map((sol) => {
                  const cliente = sol.clientes;
                  const badge = estadoBadge[sol.estado] ?? { class: '', label: sol.estado };
                  return (
                    <TableRow
                      key={sol.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedId(sol.id)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {sol.numero_solicitud}
                        {(sol as any).tiene_garantia && (
                          <Badge variant="outline" className="ml-2 text-[10px] py-0 bg-primary/5 text-primary border-primary/20">
                            <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Garantía
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente
                          ? `${cliente.primer_nombre} ${cliente.primer_apellido}`
                          : <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell>{formatCurrency(sol.monto_solicitado)}</TableCell>
                      <TableCell>{sol.plazo_meses} meses</TableCell>
                      <TableCell>{frecuenciaLabel[sol.frecuencia_pago] ?? sol.frecuencia_pago}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.class}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(sol.created_at).toLocaleDateString('es-DO')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <SolicitudDetailDialog solicitudId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
