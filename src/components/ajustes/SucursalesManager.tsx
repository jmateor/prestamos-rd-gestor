import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MapPin, Plus, Trash2, Star } from 'lucide-react';
import { useSucursales, useCrearSucursal, useActualizarSucursal, useEliminarSucursal } from '@/hooks/useConfiguracion';

export function SucursalesManager({ isAdmin }: { isAdmin: boolean }) {
  const { data, isLoading } = useSucursales();
  const crear = useCrearSucursal();
  const actualizar = useActualizarSucursal();
  const eliminar = useEliminarSucursal();
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '' });

  const handleAdd = async () => {
    if (!form.nombre.trim()) return;
    await crear.mutateAsync({
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      telefono: form.telefono.trim(),
      es_principal: !data?.length,
      activo: true,
    });
    setForm({ nombre: '', direccion: '', telefono: '' });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Sucursales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-b pb-3">
            <Input placeholder="Nombre *" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
            <Input placeholder="Dirección" value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} />
            <Input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} />
            <Button size="sm" disabled={!form.nombre || crear.isPending} onClick={handleAdd} className="gap-1.5">
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && <TableHead className="w-28">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium flex items-center gap-1.5">
                  {s.es_principal && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                  {s.nombre}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.direccion || '—'}</TableCell>
                <TableCell className="text-sm">{s.telefono || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={s.activo ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                    {s.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex gap-1">
                      {!s.es_principal && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" title="Marcar principal"
                          onClick={async () => {
                            // unset previous principal
                            const prev = data.find((x) => x.es_principal);
                            if (prev) await actualizar.mutateAsync({ id: prev.id, es_principal: false });
                            actualizar.mutate({ id: s.id, es_principal: true });
                          }}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => eliminar.mutate(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-sm text-muted-foreground py-6">Sin sucursales registradas</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
