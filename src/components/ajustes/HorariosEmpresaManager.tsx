import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarClock, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HorarioRow {
  id: string;
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  es_dia_completo: boolean;
  activo: boolean;
}

const DIAS = [
  { num: 0, nombre: 'Domingo' },
  { num: 1, nombre: 'Lunes' },
  { num: 2, nombre: 'Martes' },
  { num: 3, nombre: 'Miércoles' },
  { num: 4, nombre: 'Jueves' },
  { num: 5, nombre: 'Viernes' },
  { num: 6, nombre: 'Sábado' },
];

const trimSeg = (t: string) => (t ? t.slice(0, 5) : '08:00');

export function HorariosEmpresaManager({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['empresa_horarios'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('empresa_horarios').select('*').order('dia_semana');
      if (error) throw error;
      return data as HorarioRow[];
    },
  });

  const [rows, setRows] = useState<Record<number, HorarioRow>>({});

  useEffect(() => {
    if (!data) return;
    const map: Record<number, HorarioRow> = {};
    for (const d of DIAS) {
      const existing = data.find((r) => r.dia_semana === d.num);
      map[d.num] = existing ?? {
        id: '',
        dia_semana: d.num,
        hora_apertura: '08:00:00',
        hora_cierre: '17:00:00',
        es_dia_completo: false,
        activo: false,
      };
    }
    setRows(map);
  }, [data]);

  const guardar = useMutation({
    mutationFn: async () => {
      const payload = Object.values(rows).map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        dia_semana: r.dia_semana,
        hora_apertura: trimSeg(r.hora_apertura) + ':00',
        hora_cierre: trimSeg(r.hora_cierre) + ':00',
        es_dia_completo: r.es_dia_completo,
        activo: r.activo,
      }));
      const { error } = await (supabase as any)
        .from('empresa_horarios')
        .upsert(payload, { onConflict: 'dia_semana' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empresa_horarios'] });
      toast.success('Horarios actualizados');
    },
    onError: (e: any) => toast.error('Error: ' + e.message),
  });

  const update = (dia: number, patch: Partial<HorarioRow>) =>
    setRows((prev) => ({ ...prev, [dia]: { ...prev[dia], ...patch } }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" /> Horario Laboral de la Empresa
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Define el horario operativo de Domingo a Sábado. Controla cuándo los usuarios pueden registrar operaciones.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="hidden md:grid grid-cols-12 gap-3 px-2 pb-2 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-3">Día</div>
          <div className="col-span-2">Abierto</div>
          <div className="col-span-3">Apertura</div>
          <div className="col-span-3">Cierre</div>
          <div className="col-span-1 text-right">24h</div>
        </div>

        {DIAS.map((d) => {
          const r = rows[d.num];
          if (!r) return null;
          const esFinde = d.num === 0 || d.num === 6;
          return (
            <div
              key={d.num}
              className={`grid grid-cols-12 gap-3 items-center p-2 rounded-md border ${
                r.activo ? 'bg-card' : 'bg-muted/30'
              } ${esFinde ? 'border-primary/20' : ''}`}
            >
              <div className="col-span-12 md:col-span-3 font-medium text-sm flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${r.activo ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                {d.nombre}
              </div>
              <div className="col-span-4 md:col-span-2 flex items-center gap-2">
                <Switch
                  checked={r.activo}
                  disabled={!isAdmin}
                  onCheckedChange={(v) => update(d.num, { activo: v })}
                />
                <span className="text-xs text-muted-foreground">{r.activo ? 'Sí' : 'No'}</span>
              </div>
              <div className="col-span-4 md:col-span-3">
                <Input
                  type="time"
                  value={trimSeg(r.hora_apertura)}
                  disabled={!isAdmin || !r.activo || r.es_dia_completo}
                  onChange={(e) => update(d.num, { hora_apertura: e.target.value + ':00' })}
                  className="h-8"
                />
              </div>
              <div className="col-span-4 md:col-span-3">
                <Input
                  type="time"
                  value={trimSeg(r.hora_cierre)}
                  disabled={!isAdmin || !r.activo || r.es_dia_completo}
                  onChange={(e) => update(d.num, { hora_cierre: e.target.value + ':00' })}
                  className="h-8"
                />
              </div>
              <div className="col-span-12 md:col-span-1 flex md:justify-end items-center gap-2">
                <Switch
                  checked={r.es_dia_completo}
                  disabled={!isAdmin || !r.activo}
                  onCheckedChange={(v) =>
                    update(d.num, {
                      es_dia_completo: v,
                      ...(v ? { hora_apertura: '00:00:00', hora_cierre: '23:59:00' } : {}),
                    })
                  }
                />
                <span className="text-xs text-muted-foreground md:hidden">24 horas</span>
              </div>
            </div>
          );
        })}

        {isAdmin && (
          <div className="flex justify-end pt-3">
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending} className="gap-1.5">
              {guardar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar horarios
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
