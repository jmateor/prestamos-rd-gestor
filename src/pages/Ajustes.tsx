import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Settings, Users, Landmark, MapPin, UserCheck, Trash2, Save, SlidersHorizontal } from 'lucide-react';
import {
  useUsuarios, useAsignarRol, useRemoverRol,
  useFinanciamientos, useCrearFinanciamiento, useActualizarFinanciamiento,
  useZonas, useCrearZona,
  useCobradores, useCrearCobrador,
  useBancos, useCrearBanco,
} from '@/hooks/useAjustes';
import { useParametrosSistema, useActualizarParametro } from '@/hooks/useParametrosSistema';
import { useUserRole } from '@/hooks/useUserRole';

const ROLES = ['admin', 'oficial_credito', 'cajero', 'supervisor'] as const;
const rolLabel: Record<string, string> = {
  admin: 'Administrador',
  oficial_credito: 'Oficial de Crédito',
  cajero: 'Cajero',
  supervisor: 'Supervisor',
};

// ── Tab: Usuarios ────────────────────────────────────────────────────────────

function UsuariosTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: usuarios, isLoading } = useUsuarios();
  const asignar = useAsignarRol();
  const remover = useRemoverRol();
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Usuarios y Roles</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Roles Actuales</TableHead>
              <TableHead>Asignar Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || '(sin nombre)'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.position || '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs gap-1">
                        {rolLabel[r] ?? r}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() => remover.mutate({ user_id: u.user_id, role: r })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {u.roles.length === 0 && <span className="text-xs text-muted-foreground">Sin roles</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Select
                      value={selectedRole[u.user_id] ?? ''}
                      onValueChange={(v) => setSelectedRole((p) => ({ ...p, [u.user_id]: v }))}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                          <SelectItem key={r} value={r}>{rolLabel[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      disabled={!selectedRole[u.user_id] || asignar.isPending}
                      onClick={() => {
                        asignar.mutate({ user_id: u.user_id, role: selectedRole[u.user_id] });
                        setSelectedRole((p) => ({ ...p, [u.user_id]: '' }));
                      }}
                    >
                      Asignar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Tab: Financiamientos ─────────────────────────────────────────────────────

function FinanciamientosTab() {
  const { data, isLoading } = useFinanciamientos();
  const crear = useCrearFinanciamiento();
  const actualizar = useActualizarFinanciamiento();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: '', tasa_interes: '', interes_moratorio: '', plazo_min: '', plazo_max: '', tipo_amortizacion: 'cuota_fija',
  });

  const handleCreate = async () => {
    await crear.mutateAsync({
      nombre: form.nombre,
      tasa_interes: parseFloat(form.tasa_interes) || null,
      interes_moratorio: parseFloat(form.interes_moratorio) || null,
      plazo_min: parseInt(form.plazo_min) || null,
      plazo_max: parseInt(form.plazo_max) || null,
      tipo_amortizacion: form.tipo_amortizacion,
      activo: true,
    });
    setForm({ nombre: '', tasa_interes: '', interes_moratorio: '', plazo_min: '', plazo_max: '', tipo_amortizacion: 'cuota_fija' });
    setOpen(false);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tipos de Financiamiento</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nuevo Tipo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Tipo de Financiamiento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Nombre *</label>
                <Input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Microcrédito Personal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tasa Interés (%)</label>
                  <Input type="number" step="0.5" value={form.tasa_interes} onChange={(e) => setForm((p) => ({ ...p, tasa_interes: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Interés Moratorio (%)</label>
                  <Input type="number" step="0.5" value={form.interes_moratorio} onChange={(e) => setForm((p) => ({ ...p, interes_moratorio: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Plazo Mín (meses)</label>
                  <Input type="number" value={form.plazo_min} onChange={(e) => setForm((p) => ({ ...p, plazo_min: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Plazo Máx (meses)</label>
                  <Input type="number" value={form.plazo_max} onChange={(e) => setForm((p) => ({ ...p, plazo_max: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Amortización</label>
                <Select value={form.tipo_amortizacion} onValueChange={(v) => setForm((p) => ({ ...p, tipo_amortizacion: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuota_fija">Cuota Fija (Francés)</SelectItem>
                    <SelectItem value="interes_simple">Interés Simple</SelectItem>
                    <SelectItem value="saldo_insoluto">Saldo Insoluto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" disabled={!form.nombre || crear.isPending} onClick={handleCreate}>
                {crear.isPending ? 'Creando...' : 'Crear Financiamiento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tasa (%)</TableHead>
              <TableHead>Mora (%)</TableHead>
              <TableHead>Plazo</TableHead>
              <TableHead>Amortización</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nombre}</TableCell>
                <TableCell>{f.tasa_interes ?? '—'}%</TableCell>
                <TableCell>{f.interes_moratorio ?? '—'}%</TableCell>
                <TableCell className="text-sm">{f.plazo_min ?? '—'} – {f.plazo_max ?? '—'} meses</TableCell>
                <TableCell className="text-sm capitalize">{f.tipo_amortizacion?.replace('_', ' ') ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => actualizar.mutate({ id: f.id, activo: !f.activo })}
                  >
                    <Badge variant="outline" className={f.activo ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                      {f.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Tab: Catálogos (Zonas, Cobradores, Bancos) ──────────────────────────────

function CatalogosTab() {
  const { data: zonas, isLoading: lz } = useZonas();
  const { data: cobradores, isLoading: lc } = useCobradores();
  const { data: bancos, isLoading: lb } = useBancos();
  const crearZona = useCrearZona();
  const crearCobrador = useCrearCobrador();
  const crearBanco = useCrearBanco();

  const [zona, setZona] = useState('');
  const [cobrador, setCobrador] = useState({ nombre: '', identificacion: '' });
  const [banco, setBanco] = useState({ nombre: '', numero_cuenta: '' });

  const loading = lz || lc || lb;

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid gap-6">
      {/* Zonas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Zonas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input placeholder="Nueva zona..." value={zona} onChange={(e) => setZona(e.target.value)} className="max-w-xs" />
            <Button size="sm" disabled={!zona || crearZona.isPending} onClick={() => { crearZona.mutate(zona); setZona(''); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {zonas?.map((z) => (
              <Badge key={z.id} variant="secondary">{z.nombre}</Badge>
            ))}
            {(!zonas || zonas.length === 0) && <span className="text-sm text-muted-foreground">Sin zonas</span>}
          </div>
        </CardContent>
      </Card>

      {/* Cobradores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4" /> Cobradores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input placeholder="Nombre" value={cobrador.nombre} onChange={(e) => setCobrador((p) => ({ ...p, nombre: e.target.value }))} className="max-w-xs" />
            <Input placeholder="Cédula" value={cobrador.identificacion} onChange={(e) => setCobrador((p) => ({ ...p, identificacion: e.target.value }))} className="max-w-[180px]" />
            <Button size="sm" disabled={!cobrador.nombre || crearCobrador.isPending} onClick={() => { crearCobrador.mutate(cobrador); setCobrador({ nombre: '', identificacion: '' }); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cobradores?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.identificacion ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.activo ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bancos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4" /> Bancos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input placeholder="Nombre del banco" value={banco.nombre} onChange={(e) => setBanco((p) => ({ ...p, nombre: e.target.value }))} className="max-w-xs" />
            <Input placeholder="Nro. cuenta" value={banco.numero_cuenta} onChange={(e) => setBanco((p) => ({ ...p, numero_cuenta: e.target.value }))} className="max-w-[200px]" />
            <Button size="sm" disabled={!banco.nombre || crearBanco.isPending} onClick={() => { crearBanco.mutate(banco); setBanco({ nombre: '', numero_cuenta: '' }); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Nro. Cuenta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.numero_cuenta ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Parámetros del Sistema ───────────────────────────────────────────────

const categoriaLabel: Record<string, string> = {
  tasas: '📊 Tasas',
  moras: '⚠️ Moras',
  gastos: '💰 Gastos',
  prestamos: '📋 Préstamos',
  empresa: '🏢 Empresa',
  operaciones: '⚙️ Operaciones',
};

function ParametrosTab() {
  const { data: parametros, isLoading } = useParametrosSistema();
  const actualizar = useActualizarParametro();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  // Group by categoria
  const grouped = new Map<string, typeof parametros>();
  for (const p of parametros ?? []) {
    const cat = p.categoria ?? 'otros';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(p);
  }

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([cat, params]) => (
        <Card key={cat}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{categoriaLabel[cat] ?? cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {params!.map((p) => {
              const edited = editValues[p.id] !== undefined;
              const currentVal = edited ? editValues[p.id] : p.valor;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.descripcion || p.clave}</p>
                    <p className="text-xs text-muted-foreground">{p.clave}</p>
                  </div>
                  <Input
                    className="max-w-[200px] h-8 text-sm"
                    type={p.tipo === 'numero' ? 'number' : 'text'}
                    value={currentVal}
                    onChange={(e) => setEditValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                  />
                  {edited && (
                    <Button
                      size="sm"
                      className="h-8 gap-1"
                      disabled={actualizar.isPending}
                      onClick={() => {
                        actualizar.mutate({ id: p.id, valor: editValues[p.id] });
                        setEditValues(prev => {
                          const n = { ...prev };
                          delete n[p.id];
                          return n;
                        });
                      }}
                    >
                      <Save className="h-3 w-3" /> Guardar
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Ajustes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" /> Ajustes del Sistema
        </h1>
        <p className="text-muted-foreground">Gestión de usuarios, roles, tasas, parámetros y catálogos</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-1.5">
            <Users className="h-4 w-4" /> Usuarios
          </TabsTrigger>
          <TabsTrigger value="parametros" className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4" /> Parámetros
          </TabsTrigger>
          <TabsTrigger value="financiamientos" className="gap-1.5">
            <Landmark className="h-4 w-4" /> Financiamientos
          </TabsTrigger>
          <TabsTrigger value="catalogos" className="gap-1.5">
            <MapPin className="h-4 w-4" /> Catálogos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <UsuariosTab />
        </TabsContent>
        <TabsContent value="parametros" className="mt-4">
          <ParametrosTab />
        </TabsContent>
        <TabsContent value="financiamientos" className="mt-4">
          <FinanciamientosTab />
        </TabsContent>
        <TabsContent value="catalogos" className="mt-4">
          <CatalogosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
