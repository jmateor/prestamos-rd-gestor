import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Mail, MessageSquare, Users, StickyNote, Video, Plus, Trash2, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { useInteracciones, useCreateInteraccion, useDeleteInteraccion, TIPOS_INTERACCION, type TipoInteraccion } from '@/hooks/useInteracciones';
import { formatDate } from '@/lib/format';

const TIPO_ICON: Record<TipoInteraccion, JSX.Element> = {
  llamada: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  visita: <Users className="h-4 w-4" />,
  nota: <StickyNote className="h-4 w-4" />,
  reunion: <Video className="h-4 w-4" />,
};

const TIPO_COLOR: Record<TipoInteraccion, string> = {
  llamada: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  whatsapp: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  email: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  sms: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  visita: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  nota: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  reunion: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

interface Props {
  clienteId?: string;
  leadId?: string;
}

export function InteraccionesTimeline({ clienteId, leadId }: Props) {
  const { data: interacciones, isLoading } = useInteracciones({ clienteId, leadId });
  const crear = useCreateInteraccion();
  const eliminar = useDeleteInteraccion();
  const [tipo, setTipo] = useState<TipoInteraccion>('llamada');
  const [direccion, setDireccion] = useState<'entrante' | 'saliente'>('saliente');
  const [asunto, setAsunto] = useState('');
  const [contenido, setContenido] = useState('');

  const submit = async () => {
    if (!contenido.trim() && !asunto.trim()) return;
    await crear.mutateAsync({
      cliente_id: clienteId ?? null, lead_id: leadId ?? null,
      tipo, direccion, asunto: asunto.trim() || null, contenido: contenido.trim() || null,
    });
    setAsunto(''); setContenido('');
  };

  return (
    <div className="space-y-4">
      {/* Formulario rápido */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoInteraccion)}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_INTERACCION.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={direccion} onValueChange={(v) => setDireccion(v as any)}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="saliente">Saliente</SelectItem>
                <SelectItem value="entrante">Entrante</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} className="h-8 text-xs flex-1 min-w-[180px]" />
          </div>
          <Textarea placeholder="Descripción / notas..." rows={2} value={contenido} onChange={(e) => setContenido(e.target.value)} className="text-sm" />
          <div className="flex justify-end">
            <Button size="sm" onClick={submit} disabled={crear.isPending} className="gap-1">
              {crear.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Registrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !interacciones?.length ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Aún no hay interacciones registradas
        </div>
      ) : (
        <div className="relative pl-4 space-y-3 border-l-2 border-border">
          {interacciones.map((i) => (
            <div key={i.id} className="relative">
              <div className={`absolute -left-[22px] top-2 h-8 w-8 rounded-full border-2 border-background flex items-center justify-center ${TIPO_COLOR[i.tipo]}`}>
                {TIPO_ICON[i.tipo]}
              </div>
              <Card className="ml-4">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${TIPO_COLOR[i.tipo]}`}>{i.tipo}</Badge>
                        {i.direccion && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            {i.direccion === 'entrante' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {i.direccion}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{new Date(i.fecha).toLocaleString('es-DO')}</span>
                      </div>
                      {i.asunto && <p className="font-medium text-sm mt-1">{i.asunto}</p>}
                      {i.contenido && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{i.contenido}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => eliminar.mutate(i.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
