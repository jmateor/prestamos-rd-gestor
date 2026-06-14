import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarClock, Search, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useCitas, type Cita } from '@/hooks/useCitas';
import { CitaFormDialog } from '@/components/CitaFormDialog';
import { CitaDetailSheet } from '@/components/CitaDetailSheet';

const estadoBadge: Record<string, { class: string; label: string }> = {
  programada: { class: 'bg-warning/10 text-warning border-warning/20', label: 'Programada' },
  confirmada: { class: 'bg-primary/10 text-primary border-primary/20', label: 'Confirmada' },
  atendida: { class: 'bg-success/10 text-success border-success/20', label: 'Atendida' },
  cancelada: { class: 'bg-muted text-muted-foreground', label: 'Cancelada' },
  no_asistio: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'No asistió' },
};

export default function Citas() {
  const [tab, setTab] = useState<'hoy' | 'proximas' | 'mias' | 'historial'>('hoy');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('todos');

  const today = new Date().toISOString().slice(0, 10);

  const filtros = useMemo(() => {
    switch (tab) {
      case 'hoy':       return { desde: today, hasta: today };
      case 'proximas':  return { desde: today, estado: estado === 'todos' ? undefined : estado };
      case 'mias':      return { solo_mias: true, estado: estado === 'todos' ? undefined : estado };
      case 'historial': return { hasta: today, estado: estado === 'todos' ? undefined : estado };
    }
  }, [tab, today, estado]);

  const { data: citas, isLoading } = useCitas(filtros);
  const [selected, setSelected] = useState<Cita | null>(null);

  const filtradas = (citas ?? []).filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const nombre = `${c.clientes?.primer_nombre ?? ''} ${c.clientes?.primer_apellido ?? ''}`.toLowerCase();
    return c.numero_cita.toLowerCase().includes(s) || nombre.includes(s) || (c.clientes?.cedula ?? '').includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Citas con Clientes</h1>
          <p className="text-muted-foreground">Programa entrevistas con el administrador antes de aprobar solicitudes</p>
        </div>
        <CitaFormDialog />
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cita, cliente o cédula..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {tab !== 'hoy' && (
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="programada">Programada</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="atendida">Atendida</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="no_asistio">No asistió</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="proximas">Próximas</TabsTrigger>
          <TabsTrigger value="mias">Mías</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <CalendarClock className="h-12 w-12 opacity-30" />
              <p>No hay citas en esta vista</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtradas.map((c) => {
                const cl = c.clientes;
                const fecha = new Date(c.fecha_cita + 'T12:00:00');
                const isPast = c.fecha_cita < today;
                return (
                  <Card
                    key={c.id}
                    className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                    onClick={() => setSelected(c)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{c.numero_cita}</p>
                          <p className="font-semibold">{cl ? `${cl.primer_nombre} ${cl.primer_apellido}` : 'Cliente'}</p>
                        </div>
                        <Badge variant="outline" className={estadoBadge[c.estado]?.class}>{estadoBadge[c.estado]?.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {fecha.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })} · {c.hora_cita.slice(0, 5)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.motivo}</p>
                      {c.solicitudes && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">Solicitud:</span>{' '}
                          <span className="font-mono">{c.solicitudes.numero_solicitud}</span>
                        </p>
                      )}
                      {c.resultado && (
                        <div className="flex items-center gap-1 text-xs">
                          {c.resultado === 'aprobar' && <CheckCircle className="h-3 w-3 text-success" />}
                          {c.resultado === 'rechazar' && <XCircle className="h-3 w-3 text-destructive" />}
                          {c.resultado === 'posponer' && <Clock className="h-3 w-3 text-warning" />}
                          <span className="capitalize">{c.resultado}</span>
                        </div>
                      )}
                      {isPast && c.estado === 'programada' && (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Vencida sin atender</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CitaDetailSheet cita={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
