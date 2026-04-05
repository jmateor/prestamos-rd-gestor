import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, History, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/format';

const PAGE_SIZE = 25;

interface AuditEntryWithUser {
  id: string;
  user_id: string;
  accion: string;
  tabla: string;
  registro_id: string | null;
  notas: string | null;
  created_at: string;
  user_name?: string;
}

const accionColor: Record<string, string> = {
  reverso_pago: 'bg-destructive/10 text-destructive border-destructive/20',
  crear: 'bg-green-500/10 text-green-700 border-green-500/20',
  actualizar: 'bg-primary/10 text-primary border-primary/20',
  eliminar: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Bitacora() {
  const [filterAccion, setFilterAccion] = useState<string>('todas');
  const [filterTabla, setFilterTabla] = useState<string>('todas');
  const [searchText, setSearchText] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-log-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      // Get unique user_ids
      const userIds = [...new Set(data.map((l) => l.user_id))];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);

      return data.map((l) => ({
        ...l,
        user_name: nameMap.get(l.user_id) || 'Usuario desconocido',
      })) as AuditEntryWithUser[];
    },
  });

  const acciones = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map((l) => l.accion))].sort();
  }, [logs]);

  const tablas = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map((l) => l.tabla))].sort();
  }, [logs]);

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter((l) => {
      if (filterAccion !== 'todas' && l.accion !== filterAccion) return false;
      if (filterTabla !== 'todas' && l.tabla !== filterTabla) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        return (
          l.notas?.toLowerCase().includes(s) ||
          l.tabla.toLowerCase().includes(s) ||
          l.accion.toLowerCase().includes(s) ||
          l.user_name?.toLowerCase().includes(s) ||
          l.registro_id?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [logs, filterAccion, filterTabla, searchText]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6" /> Bitácora de Auditoría
        </h1>
        <p className="text-muted-foreground">Registro de todas las acciones del sistema</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en notas, tabla, usuario..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-[180px]">
          <Select value={filterAccion} onValueChange={setFilterAccion}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las acciones</SelectItem>
              {acciones.map((a) => (
                <SelectItem key={a} value={a}>{a.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={filterTabla} onValueChange={setFilterTabla}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Tabla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las tablas</SelectItem>
              {tablas.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="h-10 px-3 flex items-center">
          {filtered.length} registros
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <History className="h-12 w-12 opacity-30" />
              <p>Sin registros de auditoría</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                    <TableCell className="text-sm font-medium">{l.user_name}</TableCell>
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
