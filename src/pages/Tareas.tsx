import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckSquare, Plus, Loader2, Search, Calendar, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { useTareas, useUpdateTarea, useDeleteTarea, type Tarea } from '@/hooks/useTareas';
import { TareaFormDialog } from '@/components/TareaFormDialog';
import { useAuth } from '@/hooks/useAuth';

const PRIO_COLOR: Record<string, string> = {
  baja: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  media: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  alta: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  urgente: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export default function Tareas() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'mias' | 'todas' | 'completadas'>('mias');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Tarea | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtro = tab === 'mias'
    ? { asignadoA: user?.id }
    : tab === 'completadas'
    ? { estado: 'completada' }
    : {};

  const { data: tareas, isLoading } = useTareas(filtro);
  const actualizar = useUpdateTarea();
  const eliminar = useDeleteTarea();

  const filtered = (tareas ?? []).filter((t) => {
    if (tab === 'mias' && t.estado === 'completada') return false;
    if (!search) return true;
    return t.titulo.toLowerCase().includes(search.toLowerCase());
  });

  const toggleCompletar = (t: Tarea) => {
    actualizar.mutate({ id: t.id, data: { estado: t.estado === 'completada' ? 'pendiente' : 'completada' } });
  };

  const isVencida = (t: Tarea) => {
    if (!t.fecha_vencimiento || t.estado === 'completada' || t.estado === 'cancelada') return false;
    return new Date(t.fecha_vencimiento) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tareas</h1>
          <p className="text-muted-foreground">Pendientes y recordatorios del equipo</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Tarea
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="mias">Mis pendientes</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="completadas">Completadas</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <CheckSquare className="h-12 w-12 opacity-30" />
              <p>No hay tareas en esta vista</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <Card key={t.id} className={`transition-all ${isVencida(t) ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                  <CardContent className="py-3 flex items-start gap-3">
                    <Checkbox
                      checked={t.estado === 'completada'}
                      onCheckedChange={() => toggleCompletar(t)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium ${t.estado === 'completada' ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</p>
                        <Badge variant="outline" className={`text-[10px] ${PRIO_COLOR[t.prioridad]}`}>{t.prioridad}</Badge>
                        {isVencida(t) && (
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 gap-1">
                            <AlertTriangle className="h-3 w-3" /> Vencida
                          </Badge>
                        )}
                      </div>
                      {t.descripcion && <p className="text-xs text-muted-foreground mt-1">{t.descripcion}</p>}
                      {t.fecha_vencimiento && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.fecha_vencimiento).toLocaleString('es-DO')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => { if (confirm('¿Eliminar tarea?')) eliminar.mutate(t.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TareaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} tarea={editing} />
    </div>
  );
}
