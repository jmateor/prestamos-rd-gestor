import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, Heart, Briefcase } from 'lucide-react';
import { useAddReferencia, useDeleteReferencia, useAddDependiente, useDeleteDependiente, useUpsertConyuge } from '@/hooks/useClienteProfile';
import type { ReferenciaCliente, DependienteCliente, ConyugeCliente } from '@/hooks/useClienteProfile';
import { formatCurrency } from '@/lib/format';

interface Props {
  clienteId: string;
  conyuge: ConyugeCliente | null | undefined;
  dependientes: DependienteCliente[];
  referencias: ReferenciaCliente[];
}

export function ClienteReferenciasTab({ clienteId, conyuge, dependientes, referencias }: Props) {
  const addRef = useAddReferencia();
  const delRef = useDeleteReferencia();
  const addDep = useAddDependiente();
  const delDep = useDeleteDependiente();
  const upsertConyuge = useUpsertConyuge();

  const [showRefForm, setShowRefForm] = useState(false);
  const [showDepForm, setShowDepForm] = useState(false);
  const [showConyugeForm, setShowConyugeForm] = useState(false);

  const refPersonales = referencias.filter(r => r.tipo === 'personal');
  const refComerciales = referencias.filter(r => r.tipo === 'comercial');

  return (
    <div className="space-y-4">
      {/* Cónyuge */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4" /> Cónyuge</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowConyugeForm(!showConyugeForm)}>
            {conyuge ? 'Editar' : <><Plus className="h-3 w-3 mr-1" />Agregar</>}
          </Button>
        </CardHeader>
        <CardContent>
          {conyuge && !showConyugeForm ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Nombre</p><p className="font-medium">{conyuge.nombre_completo}</p></div>
              <div><p className="text-xs text-muted-foreground">Cédula</p><p className="font-medium">{conyuge.cedula || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Teléfono</p><p className="font-medium">{conyuge.telefono || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Trabajo</p><p className="font-medium">{conyuge.lugar_trabajo || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Ingreso</p><p className="font-medium">{formatCurrency(conyuge.ingreso_mensual || 0)}</p></div>
            </div>
          ) : !showConyugeForm ? (
            <p className="text-sm text-muted-foreground">Sin cónyuge registrado</p>
          ) : null}
          {showConyugeForm && (
            <ConyugeForm
              clienteId={clienteId}
              initial={conyuge}
              onSave={async (data) => {
                await upsertConyuge.mutateAsync(data);
                setShowConyugeForm(false);
              }}
              onCancel={() => setShowConyugeForm(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Dependientes */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Dependientes ({dependientes.length})</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowDepForm(!showDepForm)}>
            <Plus className="h-3 w-3 mr-1" />Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {dependientes.map(d => (
            <div key={d.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div>
                <p className="font-medium">{d.nombre_completo}</p>
                <p className="text-xs text-muted-foreground">{d.parentesco}{d.edad ? ` · ${d.edad} años` : ''}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delDep.mutate({ id: d.id, cliente_id: clienteId })}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
          {showDepForm && (
            <DependienteForm
              clienteId={clienteId}
              onSave={async (data) => { await addDep.mutateAsync(data); setShowDepForm(false); }}
              onCancel={() => setShowDepForm(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Referencias Personales */}
      <RefSection
        title="Referencias Personales"
        icon={<Users className="h-4 w-4" />}
        tipo="personal"
        items={refPersonales}
        clienteId={clienteId}
        showForm={showRefForm}
        setShowForm={setShowRefForm}
        addRef={addRef}
        delRef={delRef}
      />

      {/* Referencias Comerciales */}
      <RefSection
        title="Referencias Comerciales"
        icon={<Briefcase className="h-4 w-4" />}
        tipo="comercial"
        items={refComerciales}
        clienteId={clienteId}
      />
    </div>
  );
}

function RefSection({ title, icon, tipo, items, clienteId, showForm, setShowForm, addRef, delRef }: any) {
  const [localShow, setLocalShow] = useState(false);
  const show = showForm ?? localShow;
  const setShow = setShowForm ?? setLocalShow;
  const addRefHook = addRef ?? useAddReferencia();
  const delRefHook = delRef ?? useDeleteReferencia();

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">{icon} {title} ({items.length})</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setShow(!show)}>
          <Plus className="h-3 w-3 mr-1" />Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((r: ReferenciaCliente) => (
          <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2">
            <div>
              <p className="font-medium">{r.nombre_completo}</p>
              <p className="text-xs text-muted-foreground">{r.relacion} · {r.telefono}</p>
              {r.empresa && <p className="text-xs text-muted-foreground">{r.empresa}</p>}
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delRefHook.mutate({ id: r.id, cliente_id: clienteId })}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        {show && (
          <ReferenciaForm
            clienteId={clienteId}
            tipo={tipo}
            onSave={async (data: any) => { await addRefHook.mutateAsync(data); setShow(false); }}
            onCancel={() => setShow(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ── Mini forms ──

function ConyugeForm({ clienteId, initial, onSave, onCancel }: any) {
  const [f, setF] = useState({
    nombre_completo: initial?.nombre_completo || '',
    cedula: initial?.cedula || '',
    telefono: initial?.telefono || '',
    lugar_trabajo: initial?.lugar_trabajo || '',
    cargo: initial?.cargo || '',
    ingreso_mensual: initial?.ingreso_mensual || 0,
    notas: initial?.notas || '',
  });

  return (
    <div className="space-y-2 border rounded-lg p-3 mt-2">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Nombre</Label><Input value={f.nombre_completo} onChange={e => setF({ ...f, nombre_completo: e.target.value })} /></div>
        <div><Label className="text-xs">Cédula</Label><Input value={f.cedula} onChange={e => setF({ ...f, cedula: e.target.value })} /></div>
        <div><Label className="text-xs">Teléfono</Label><Input value={f.telefono} onChange={e => setF({ ...f, telefono: e.target.value })} /></div>
        <div><Label className="text-xs">Trabajo</Label><Input value={f.lugar_trabajo} onChange={e => setF({ ...f, lugar_trabajo: e.target.value })} /></div>
        <div><Label className="text-xs">Cargo</Label><Input value={f.cargo} onChange={e => setF({ ...f, cargo: e.target.value })} /></div>
        <div><Label className="text-xs">Ingreso</Label><Input type="number" value={f.ingreso_mensual} onChange={e => setF({ ...f, ingreso_mensual: +e.target.value })} /></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...f, cliente_id: clienteId })} disabled={!f.nombre_completo}>Guardar</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function DependienteForm({ clienteId, onSave, onCancel }: any) {
  const [f, setF] = useState({ nombre_completo: '', parentesco: '', edad: null as number | null, notas: '' });
  return (
    <div className="space-y-2 border rounded-lg p-3">
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">Nombre</Label><Input value={f.nombre_completo} onChange={e => setF({ ...f, nombre_completo: e.target.value })} /></div>
        <div><Label className="text-xs">Parentesco</Label><Input value={f.parentesco} onChange={e => setF({ ...f, parentesco: e.target.value })} /></div>
        <div><Label className="text-xs">Edad</Label><Input type="number" value={f.edad ?? ''} onChange={e => setF({ ...f, edad: e.target.value ? +e.target.value : null })} /></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...f, cliente_id: clienteId })} disabled={!f.nombre_completo}>Guardar</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function ReferenciaForm({ clienteId, tipo, onSave, onCancel }: any) {
  const [f, setF] = useState({ nombre_completo: '', telefono: '', relacion: '', direccion: '', empresa: '', notas: '' });
  return (
    <div className="space-y-2 border rounded-lg p-3">
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Nombre</Label><Input value={f.nombre_completo} onChange={e => setF({ ...f, nombre_completo: e.target.value })} /></div>
        <div><Label className="text-xs">Teléfono</Label><Input value={f.telefono} onChange={e => setF({ ...f, telefono: e.target.value })} /></div>
        <div><Label className="text-xs">Relación</Label><Input value={f.relacion} onChange={e => setF({ ...f, relacion: e.target.value })} /></div>
        <div><Label className="text-xs">Dirección</Label><Input value={f.direccion} onChange={e => setF({ ...f, direccion: e.target.value })} /></div>
        {tipo === 'comercial' && <div><Label className="text-xs">Empresa</Label><Input value={f.empresa} onChange={e => setF({ ...f, empresa: e.target.value })} /></div>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...f, tipo, cliente_id: clienteId })} disabled={!f.nombre_completo}>Guardar</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}
