import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserPlus, Loader2, Search, Phone, Mail, MapPin, DollarSign, Pencil, Trash2, ArrowRight, UserCheck } from 'lucide-react';
import { useLeads, useUpdateLead, useDeleteLead, ETAPAS_LEAD, type Lead, type EtapaLead } from '@/hooks/useLeads';
import { useCreateCliente } from '@/hooks/useClientes';
import { LeadFormDialog } from '@/components/LeadFormDialog';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

const ETAPA_META: Record<EtapaLead, { label: string; color: string }> = {
  nuevo:       { label: 'Nuevo',       color: 'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300' },
  contactado:  { label: 'Contactado',  color: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300' },
  calificado:  { label: 'Calificado',  color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-300' },
  cotizado:    { label: 'Cotizado',    color: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300' },
  ganado:      { label: 'Ganado',      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300' },
  perdido:     { label: 'Perdido',     color: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300' },
};

export default function Leads() {
  const { data: leads, isLoading } = useLeads();
  const actualizar = useUpdateLead();
  const eliminar = useDeleteLead();
  const crearCliente = useCreateCliente();
  const [editing, setEditing] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);

  const filtered = (leads ?? []).filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return l.nombre_completo.toLowerCase().includes(s) || (l.cedula ?? '').includes(s) || (l.telefono ?? '').includes(s);
  });

  const grouped = ETAPAS_LEAD.reduce((acc, e) => {
    acc[e] = filtered.filter((l) => l.etapa === e);
    return acc;
  }, {} as Record<EtapaLead, Lead[]>);

  const totals = ETAPAS_LEAD.reduce((acc, e) => {
    acc[e] = grouped[e].reduce((s, l) => s + (l.monto_estimado ?? 0), 0);
    return acc;
  }, {} as Record<EtapaLead, number>);

  const totalPipeline = filtered.reduce((s, l) => s + (l.monto_estimado ?? 0), 0);
  const conversion = filtered.length ? Math.round((grouped.ganado.length / filtered.length) * 100) : 0;

  const moverEtapa = (id: string, etapa: EtapaLead) => {
    const data: any = { etapa };
    if (etapa === 'ganado') data.convertido_at = new Date().toISOString();
    actualizar.mutate({ id, data });
  };

  const convertirACliente = async (lead: Lead) => {
    if (!lead.nombre_completo || !lead.telefono || !lead.cedula) {
      toast.error('Faltan datos para convertir: nombre, cédula y teléfono son obligatorios');
      return;
    }
    const parts = lead.nombre_completo.trim().split(/\s+/);
    try {
      const cliente = await crearCliente.mutateAsync({
        primer_nombre: parts[0] ?? '',
        segundo_nombre: parts.length > 2 ? parts[1] : '',
        primer_apellido: parts.length > 2 ? parts[2] : parts[1] ?? '',
        segundo_apellido: parts[3] ?? '',
        cedula: lead.cedula, telefono: lead.telefono, telefono2: '', email: lead.email ?? '',
        direccion: '', sector: '', ciudad: lead.ciudad ?? '', provincia: '', referencia_direccion: '',
        tipo_vivienda: '', tiempo_residencia: '', lugar_trabajo: '', cargo: '',
        direccion_trabajo: '', telefono_trabajo: '', ingreso_mensual: 0, otros_ingresos: 0,
        antiguedad_laboral: '', estado: 'activo', notas: lead.notas ?? '',
        banco_nombre: '', numero_cuenta: '', nota_bloqueo: '', latitud: null, longitud: null,
        fecha_nacimiento: null, sexo: null, estado_civil: null, nacionalidad: 'Dominicana',
      } as any);
      await actualizar.mutateAsync({
        id: lead.id,
        data: { cliente_id: cliente.id, etapa: 'ganado', convertido_at: new Date().toISOString() },
      });
      toast.success('Lead convertido a cliente');
    } catch (e: any) {
      toast.error('Error al convertir: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline de Leads</h1>
          <p className="text-muted-foreground">Prospectos y su avance en el ciclo de venta</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <UserPlus className="h-4 w-4" /> Nuevo Lead
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total Leads" value={String(filtered.length)} />
        <KPI label="Pipeline (RD$)" value={formatCurrency(totalPipeline)} />
        <KPI label="Ganados" value={String(grouped.ganado.length)} />
        <KPI label="Conversión" value={`${conversion}%`} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, cédula o teléfono..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {ETAPAS_LEAD.map((etapa) => (
            <div
              key={etapa}
              className="bg-muted/30 rounded-lg p-2 min-h-[300px] flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragging) { moverEtapa(dragging, etapa); setDragging(null); } }}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <Badge variant="outline" className={ETAPA_META[etapa].color}>{ETAPA_META[etapa].label}</Badge>
                <span className="text-xs text-muted-foreground">{grouped[etapa].length}</span>
              </div>
              <div className="text-[10px] text-muted-foreground px-1 mb-2">{formatCurrency(totals[etapa])}</div>
              <div className="space-y-2 flex-1">
                {grouped[etapa].map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead.id)}
                    onDragEnd={() => setDragging(null)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4"
                    style={{ borderLeftColor: 'hsl(var(--primary))' }}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{lead.nombre_completo}</p>
                          {lead.cedula && <p className="text-[10px] text-muted-foreground font-mono">{lead.cedula}</p>}
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 h-4 shrink-0">{lead.origen.replace('_', ' ')}</Badge>
                      </div>
                      {lead.monto_estimado != null && (
                        <div className="flex items-center gap-1 text-xs font-medium text-primary">
                          <DollarSign className="h-3 w-3" />{formatCurrency(lead.monto_estimado)}
                        </div>
                      )}
                      <div className="space-y-0.5 text-[11px] text-muted-foreground">
                        {lead.telefono && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefono}</div>}
                        {lead.email && <div className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{lead.email}</div>}
                        {lead.ciudad && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.ciudad}</div>}
                      </div>
                      <div className="flex items-center gap-1 pt-1 border-t">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setEditing(lead); setDialogOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {!lead.cliente_id && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600" title="Convertir a cliente" onClick={() => convertirACliente(lead)}>
                            <UserCheck className="h-3 w-3" />
                          </Button>
                        )}
                        {lead.cliente_id && <Badge variant="outline" className="h-4 text-[9px] px-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Cliente</Badge>}
                        <div className="flex-1" />
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={() => { if (confirm('¿Eliminar lead?')) eliminar.mutate(lead.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {grouped[etapa].length === 0 && (
                  <div className="text-[11px] text-muted-foreground/50 text-center py-6 border border-dashed rounded">
                    Arrastra aquí
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} lead={editing} />
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
