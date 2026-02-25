import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Plus, Search, Car, Home, Package, User, Loader2 } from 'lucide-react';
import { useGarantiasPrendarias, useGarantesPersonales, type GarantiaPrendaria } from '@/hooks/useGarantias';
import { GarantiaPrendariaForm } from '@/components/GarantiaPrendariaForm';
import { GarantePersonalForm } from '@/components/GarantePersonalForm';
import { GarantiaDetailSheet } from '@/components/GarantiaDetailSheet';
import { formatCurrency, formatDate } from '@/lib/format';

const tipoIcon: Record<string, any> = { vehiculo: Car, inmueble: Home, electrodomestico: Package, otro: Package };
const tipoLabel: Record<string, string> = { vehiculo: 'Vehículo', inmueble: 'Inmueble', electrodomestico: 'Electrodoméstico', otro: 'Otro' };
const estadoBadge: Record<string, { class: string; label: string }> = {
  activo: { class: 'bg-success/10 text-success border-success/20', label: 'Activo' },
  liberado: { class: 'bg-muted text-muted-foreground', label: 'Liberado' },
  ejecutado: { class: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Ejecutado' },
};

export default function Garantias() {
  const [tab, setTab] = useState('prendarias');
  const [searchPrend, setSearchPrend] = useState('');
  const [tipoPrend, setTipoPrend] = useState('todos');
  const [searchGarante, setSearchGarante] = useState('');
  const [showPrendForm, setShowPrendForm] = useState(false);
  const [showGaranteForm, setShowGaranteForm] = useState(false);
  const [selectedGarantia, setSelectedGarantia] = useState<GarantiaPrendaria | null>(null);

  const { data: prendarias, isLoading: loadingP } = useGarantiasPrendarias({ tipo: tipoPrend, search: searchPrend });
  const { data: garantes, isLoading: loadingG } = useGarantesPersonales({ search: searchGarante });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Garantías
          </h1>
          <p className="text-muted-foreground">Gestión de garantías prendarias y garantes personales</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="prendarias" className="gap-1"><Package className="h-4 w-4" /> Prendarias</TabsTrigger>
          <TabsTrigger value="garantes" className="gap-1"><User className="h-4 w-4" /> Garantes Personales</TabsTrigger>
        </TabsList>

        {/* ── Prendarias Tab ── */}
        <TabsContent value="prendarias" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por descripción, placa, matrícula..." className="pl-9" value={searchPrend} onChange={e => setSearchPrend(e.target.value)} />
            </div>
            <Select value={tipoPrend} onValueChange={setTipoPrend}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="vehiculo">Vehículo</SelectItem>
                <SelectItem value="inmueble">Inmueble</SelectItem>
                <SelectItem value="electrodomestico">Electrodoméstico</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-1" onClick={() => setShowPrendForm(true)}>
              <Plus className="h-4 w-4" /> Nueva Garantía
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              {loadingP ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : prendarias && prendarias.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor Est.</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prendarias.map(g => {
                      const Icon = tipoIcon[g.tipo] || Package;
                      return (
                        <TableRow key={g.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedGarantia(g)}>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{tipoLabel[g.tipo] || g.tipo}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{g.descripcion}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {g.clientes ? `${g.clientes.primer_nombre} ${g.clientes.primer_apellido}` : '—'}
                          </TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(g.valor_estimado)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={estadoBadge[g.estado]?.class}>
                              {estadoBadge[g.estado]?.label || g.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(g.created_at)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
                  <ShieldCheck className="h-12 w-12 opacity-30" />
                  <p>No hay garantías prendarias registradas</p>
                  <Button variant="outline" className="gap-1" onClick={() => setShowPrendForm(true)}>
                    <Plus className="h-4 w-4" /> Registrar Primera Garantía
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Garantes Personales Tab ── */}
        <TabsContent value="garantes" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o cédula..." className="pl-9" value={searchGarante} onChange={e => setSearchGarante(e.target.value)} />
            </div>
            <Button className="gap-1" onClick={() => setShowGaranteForm(true)}>
              <Plus className="h-4 w-4" /> Nuevo Garante
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              {loadingG ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : garantes && garantes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Trabajo</TableHead>
                      <TableHead className="text-right">Ingreso</TableHead>
                      <TableHead>Relación</TableHead>
                      <TableHead>Cliente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {garantes.map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium text-sm">{g.nombre_completo}</TableCell>
                        <TableCell className="text-sm">{g.cedula}</TableCell>
                        <TableCell className="text-sm">{g.telefono}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.lugar_trabajo || '—'}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(g.ingreso_mensual)}</TableCell>
                        <TableCell className="text-sm">{g.relacion || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {g.clientes ? `${g.clientes.primer_nombre} ${g.clientes.primer_apellido}` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
                  <User className="h-12 w-12 opacity-30" />
                  <p>No hay garantes personales registrados</p>
                  <Button variant="outline" className="gap-1" onClick={() => setShowGaranteForm(true)}>
                    <Plus className="h-4 w-4" /> Registrar Primer Garante
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <GarantiaPrendariaForm open={showPrendForm} onClose={() => setShowPrendForm(false)} />
      <GarantePersonalForm open={showGaranteForm} onClose={() => setShowGaranteForm(false)} />
      <GarantiaDetailSheet garantia={selectedGarantia} onClose={() => setSelectedGarantia(null)} />
    </div>
  );
}
