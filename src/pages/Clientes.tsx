import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Loader2 } from 'lucide-react';
import { useClientes, type Cliente } from '@/hooks/useClientes';
import { ClienteFormDialog } from '@/components/ClienteFormDialog';
import { ClienteProfileSheet } from '@/components/ClienteProfileSheet';
import { formatCurrency } from '@/lib/format';

const estadoBadge: Record<string, string> = {
  activo: 'bg-success/10 text-success border-success/20',
  inactivo: 'bg-muted text-muted-foreground border-muted',
  bloqueado: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Clientes() {
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: clientes, isLoading } = useClientes(search);

  const openProfile = (c: Cliente) => {
    setSelectedCliente(c);
    setProfileOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestión de clientes del sistema</p>
        </div>
        <ClienteFormDialog />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !clientes?.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Users className="h-12 w-12 opacity-30" />
              <p>No hay clientes registrados aún.</p>
              <p className="text-sm">Presiona "Nuevo Cliente" para comenzar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Ingreso</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <button
                          className="flex items-center gap-3 text-left hover:underline"
                          onClick={() => openProfile(c)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={c.foto || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {c.primer_nombre[0]}{c.primer_apellido[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-primary">
                            {c.primer_nombre} {c.primer_apellido}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>{c.cedula}</TableCell>
                      <TableCell>{c.telefono}</TableCell>
                      <TableCell>{c.ciudad || '—'}</TableCell>
                      <TableCell>{formatCurrency(c.ingreso_mensual || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoBadge[c.estado] || ''}>
                          {c.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ClienteProfileSheet
        cliente={selectedCliente}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
}
