import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin, Phone, DollarSign, Search, AlertTriangle,
  Clock, Navigation, Loader2, User, ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PagoRapidoDialog } from '@/components/PagoRapidoDialog';
import type { CuotaCobranza } from '@/hooks/useCobranza';
import { formatCurrency, formatDate } from '@/lib/format';
import { useCobradores } from '@/hooks/useReportes';

function diasMora(fecha: string): number {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const v = new Date(fecha); v.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((hoy.getTime() - v.getTime()) / 86_400_000));
}

export default function CobranzaCampo() {
  const [cobradorId, setCobradorId] = useState<string>('__all__');
  const [search, setSearch] = useState('');
  const [cuotaPago, setCuotaPago] = useState<CuotaCobranza | null>(null);
  const { data: cobradores } = useCobradores();

  const { data: cuotas, isLoading } = useQuery({
    queryKey: ['cobranza-campo', cobradorId],
    queryFn: async () => {
      let query = supabase
        .from('cuotas')
        .select(`
          *,
          prestamos (
            id, numero_prestamo, frecuencia_pago, cliente_id, cobrador_id,
            clientes (
              id, primer_nombre, primer_apellido, cedula, telefono, direccion,
              latitud, longitud, sector, ciudad
            ),
            cobradores (nombre)
          )
        `)
        .neq('estado', 'pagada')
        .order('fecha_vencimiento', { ascending: true });

      if (cobradorId !== '__all__') {
        // Filter by cobrador in the prestamos relation
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data as any[]) ?? [];

      // Filter by cobrador client-side
      if (cobradorId !== '__all__') {
        result = result.filter(c => c.prestamos?.cobrador_id === cobradorId);
      }

      return result;
    },
  });

  const filtered = useMemo(() => {
    if (!cuotas) return [];
    let result = cuotas;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c: any) => {
        const cl = c.prestamos?.clientes;
        const nombre = `${cl?.primer_nombre ?? ''} ${cl?.primer_apellido ?? ''}`.toLowerCase();
        return nombre.includes(q) || (cl?.cedula ?? '').includes(q) || (c.prestamos?.numero_prestamo ?? '').toLowerCase().includes(q);
      });
    }
    return result;
  }, [cuotas, search]);

  // Group by client
  const grouped = useMemo(() => {
    const map = new Map<string, { cliente: any; cuotas: any[]; totalPendiente: number; maxMora: number }>();
    for (const c of filtered) {
      const cl = c.prestamos?.clientes;
      if (!cl) continue;
      const key = cl.id;
      if (!map.has(key)) {
        map.set(key, { cliente: cl, cuotas: [], totalPendiente: 0, maxMora: 0 });
      }
      const g = map.get(key)!;
      g.cuotas.push(c);
      g.totalPendiente += c.monto_cuota - c.monto_pagado;
      g.maxMora = Math.max(g.maxMora, diasMora(c.fecha_vencimiento));
    }
    // Sort by most mora first
    return [...map.values()].sort((a, b) => b.maxMora - a.maxMora);
  }, [filtered]);

  const totalGeneral = grouped.reduce((s, g) => s + g.totalPendiente, 0);

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Navigation className="h-6 w-6" /> Cobranza en Campo
        </h1>
        <p className="text-muted-foreground">Vista optimizada para cobradores</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={cobradorId} onValueChange={setCobradorId}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Seleccionar cobrador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los cobradores</SelectItem>
            {(cobradores ?? []).map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{grouped.length}</p>
            <p className="text-xs text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">Cuotas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalGeneral)}</p>
            <p className="text-xs text-muted-foreground">Total Pendiente</p>
          </CardContent>
        </Card>
      </div>

      {/* Client cards - mobile optimized */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-12 w-12 mx-auto opacity-30 mb-2" />
          <p>Sin clientes pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ cliente, cuotas: cuotasCliente, totalPendiente, maxMora }) => (
            <Card key={cliente.id} className={`shadow-sm ${maxMora > 0 ? 'border-destructive/30' : 'border-border'}`}>
              <CardContent className="p-4">
                {/* Client header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {cliente.primer_nombre} {cliente.primer_apellido}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${cliente.telefono}`} className="text-primary underline">{cliente.telefono}</a>
                    </div>
                    {cliente.direccion && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="truncate">{cliente.direccion}{cliente.sector ? `, ${cliente.sector}` : ''}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-destructive">{formatCurrency(totalPendiente)}</p>
                    {maxMora > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        {maxMora}d mora
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Cuotas list */}
                <div className="space-y-1.5">
                  {cuotasCliente.map((c: any) => {
                    const pend = c.monto_cuota - c.monto_pagado;
                    const dias = diasMora(c.fecha_vencimiento);
                    return (
                      <div key={c.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs text-muted-foreground">{c.prestamos?.numero_prestamo}</span>
                          <span className="mx-1.5 text-muted-foreground">·</span>
                          <span>Cuota #{c.numero_cuota}</span>
                          <span className="mx-1.5 text-muted-foreground">·</span>
                          <span className="text-xs">{formatDate(c.fecha_vencimiento)}</span>
                          {dias > 0 && (
                            <Badge variant="outline" className="ml-1.5 text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                              {dias}d
                            </Badge>
                          )}
                        </div>
                        <span className="font-semibold text-destructive whitespace-nowrap">{formatCurrency(pend)}</span>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs gap-1 shrink-0"
                          onClick={() => setCuotaPago({
                            ...c,
                            prestamos: c.prestamos,
                          } as CuotaCobranza)}
                        >
                          <DollarSign className="h-3 w-3" /> Cobrar
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Quick actions */}
                {cliente.latitud && cliente.longitud && (
                  <div className="mt-2 pt-2 border-t">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${cliente.latitud},${cliente.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Navigation className="h-3 w-3" /> Navegar hasta el cliente
                      <ChevronRight className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PagoRapidoDialog cuota={cuotaPago} onClose={() => setCuotaPago(null)} />
    </div>
  );
}
