import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, History } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { formatDate } from '@/lib/format';

const accionColor: Record<string, string> = {
  reverso_pago: 'bg-destructive/10 text-destructive border-destructive/20',
  crear: 'bg-success/10 text-success border-success/20',
  actualizar: 'bg-primary/10 text-primary border-primary/20',
  eliminar: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Bitacora() {
  const { data: logs, isLoading } = useAuditLog({ limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6" /> Bitácora de Auditoría
        </h1>
        <p className="text-muted-foreground">Registro de todas las acciones del sistema</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <History className="h-12 w-12 opacity-30" />
              <p>Sin registros de auditoría</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{formatDate(l.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${accionColor[l.accion] ?? 'bg-muted text-muted-foreground'}`}>
                        {l.accion.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{l.tabla}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono truncate max-w-[120px]">{l.registro_id ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{l.notas || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
