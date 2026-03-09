import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bell, AlertTriangle, Clock, CalendarCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

interface Alerta {
  tipo: 'vencida' | 'hoy' | 'manana';
  mensaje: string;
  detalle: string;
  prestamoId: string;
}

export function useAlertasCobranza() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const manana = new Date(today);
  manana.setDate(manana.getDate() + 1);
  const mananaStr = manana.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['alertas-cobranza'],
    queryFn: async () => {
      const [{ data: vencidas }, { data: hoy }, { data: mananaData }] = await Promise.all([
        supabase
          .from('cuotas')
          .select('id, numero_cuota, monto_cuota, monto_pagado, fecha_vencimiento, prestamo_id, prestamos(numero_prestamo, clientes(primer_nombre, primer_apellido))')
          .lt('fecha_vencimiento', todayStr)
          .neq('estado', 'pagada')
          .order('fecha_vencimiento')
          .limit(20),
        supabase
          .from('cuotas')
          .select('id, numero_cuota, monto_cuota, monto_pagado, fecha_vencimiento, prestamo_id, prestamos(numero_prestamo, clientes(primer_nombre, primer_apellido))')
          .eq('fecha_vencimiento', todayStr)
          .neq('estado', 'pagada')
          .limit(20),
        supabase
          .from('cuotas')
          .select('id, numero_cuota, monto_cuota, monto_pagado, fecha_vencimiento, prestamo_id, prestamos(numero_prestamo, clientes(primer_nombre, primer_apellido))')
          .eq('fecha_vencimiento', mananaStr)
          .neq('estado', 'pagada')
          .limit(20),
      ]);

      const alertas: Alerta[] = [];

      for (const c of (vencidas ?? []) as any[]) {
        const dias = Math.floor((today.getTime() - new Date(c.fecha_vencimiento).getTime()) / 86_400_000);
        const cliente = c.prestamos?.clientes;
        const nombre = cliente ? `${cliente.primer_nombre} ${cliente.primer_apellido}` : 'Cliente';
        alertas.push({
          tipo: 'vencida',
          mensaje: `Cuota #${c.numero_cuota} vencida (${dias} días)`,
          detalle: `${nombre} — ${c.prestamos?.numero_prestamo} — ${formatCurrency(c.monto_cuota - c.monto_pagado)}`,
          prestamoId: c.prestamo_id,
        });
      }

      for (const c of (hoy ?? []) as any[]) {
        const cliente = c.prestamos?.clientes;
        const nombre = cliente ? `${cliente.primer_nombre} ${cliente.primer_apellido}` : 'Cliente';
        alertas.push({
          tipo: 'hoy',
          mensaje: `Cuota #${c.numero_cuota} vence hoy`,
          detalle: `${nombre} — ${c.prestamos?.numero_prestamo} — ${formatCurrency(c.monto_cuota - c.monto_pagado)}`,
          prestamoId: c.prestamo_id,
        });
      }

      for (const c of (mananaData ?? []) as any[]) {
        const cliente = c.prestamos?.clientes;
        const nombre = cliente ? `${cliente.primer_nombre} ${cliente.primer_apellido}` : 'Cliente';
        alertas.push({
          tipo: 'manana',
          mensaje: `Cuota #${c.numero_cuota} vence mañana`,
          detalle: `${nombre} — ${c.prestamos?.numero_prestamo} — ${formatCurrency(c.monto_cuota - c.monto_pagado)}`,
          prestamoId: c.prestamo_id,
        });
      }

      return alertas;
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });
}

const iconMap = {
  vencida: <AlertTriangle className="h-4 w-4 text-destructive" />,
  hoy: <Clock className="h-4 w-4 text-warning" />,
  manana: <CalendarCheck className="h-4 w-4 text-primary" />,
};

const bgMap = {
  vencida: 'bg-destructive/5 border-destructive/20',
  hoy: 'bg-warning/5 border-warning/20',
  manana: 'bg-primary/5 border-primary/20',
};

export function NotificacionesPanel() {
  const { data: alertas } = useAlertasCobranza();
  const [open, setOpen] = useState(false);

  const count = alertas?.length ?? 0;
  const vencidasCount = alertas?.filter(a => a.tipo === 'vencida').length ?? 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notificaciones
            {vencidasCount > 0 && (
              <Badge variant="destructive" className="text-xs">{vencidasCount} vencidas</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {!alertas || alertas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Bell className="h-12 w-12 opacity-30" />
            <p>Sin alertas pendientes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className={`rounded-lg border p-3 ${bgMap[a.tipo]}`}>
                <div className="flex items-start gap-2">
                  {iconMap[a.tipo]}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.mensaje}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.detalle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
