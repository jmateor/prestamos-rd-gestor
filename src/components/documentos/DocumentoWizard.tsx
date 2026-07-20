import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, ChevronLeft, ChevronRight, Search, FileText, Printer, Download, Save, X, Plus, Users, Trash2, Check, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { usePlantillas } from '@/hooks/useConfiguracion';
import { useTestigos, useCrearTestigo } from '@/hooks/useTestigos';
import { useCrearDocumento } from '@/hooks/useDocumentos';
import { useAuth } from '@/hooks/useAuth';
import { buildVariablesFromPrestamo, validarVariables } from '@/lib/documentoVariables';
import { renderTemplate } from '@/lib/plantillas';
import { generarDocx } from '@/lib/documentoDocx';
import { renderDocxTemplate, descargarBlob } from '@/lib/docxTemplate';
import { generarPdfDesdeTexto } from '@/lib/documentoPdf';
import { imprimirDocumento } from '@/lib/documentoPrint';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Papel = 'letter' | 'legal' | 'a4';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prestamoIdInicial?: string | null;
}

const PASOS = [
  'Préstamo', 'Tipo de documento', 'Papel', 'Vencimiento', 'Testigos', 'Vista previa', 'Generar',
];

export function DocumentoWizard({ open, onOpenChange, prestamoIdInicial }: Props) {
  const { user } = useAuth();
  const [paso, setPaso] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [prestamoId, setPrestamoId] = useState<string | null>(prestamoIdInicial ?? null);
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [papel, setPapel] = useState<Papel>('letter');
  const [fechaVenc, setFechaVenc] = useState<string>('');
  const [incluirTestigos, setIncluirTestigos] = useState(false);
  const [testigosSeleccionados, setTestigosSeleccionados] = useState<any[]>([]);
  const [nuevoTestigo, setNuevoTestigo] = useState({ nombre: '', cedula: '', direccion: '', telefono: '' });
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [preview, setPreview] = useState('');
  const [loadingVars, setLoadingVars] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: plantillas } = usePlantillas();
  const { data: testigosDB } = useTestigos();
  const crearTestigo = useCrearTestigo();
  const crearDocumento = useCrearDocumento();

  const plantillasActivas = useMemo(
    () => (plantillas ?? []).filter((p) => p.activo),
    [plantillas],
  );
  const plantillaSel = plantillasActivas.find((p) => p.id === plantillaId);

  // Búsqueda de préstamos
  const { data: prestamos, isLoading: loadingPrest } = useQuery({
    queryKey: ['prestamos-doc-search', busqueda],
    enabled: open && paso === 0,
    queryFn: async () => {
      let q = (supabase as any)
        .from('prestamos')
        .select('id, numero_prestamo, monto_aprobado, estado, clientes(primer_nombre, primer_apellido, cedula)')
        .order('created_at', { ascending: false })
        .limit(40);
      if (busqueda.trim()) q = q.ilike('numero_prestamo', `%${busqueda.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      let list = data ?? [];
      if (busqueda.trim() && list.length < 10) {
        // fallback: buscar por cliente
        const { data: byCli } = await (supabase as any)
          .from('prestamos')
          .select('id, numero_prestamo, monto_aprobado, estado, clientes!inner(primer_nombre, primer_apellido, cedula)')
          .or(`primer_nombre.ilike.%${busqueda.trim()}%,primer_apellido.ilike.%${busqueda.trim()}%,cedula.ilike.%${busqueda.trim()}%`, { foreignTable: 'clientes' })
          .limit(30);
        const ids = new Set(list.map((p: any) => p.id));
        for (const p of byCli ?? []) if (!ids.has(p.id)) list.push(p);
      }
      return list;
    },
  });

  const prestamoElegido = prestamos?.find((p: any) => p.id === prestamoId);

  // Carga variables cuando cambia préstamo/testigos/vencimiento
  useEffect(() => {
    if (!prestamoId) { setVariables({}); return; }
    setLoadingVars(true);
    buildVariablesFromPrestamo(prestamoId, {
      fechaVencimientoOverride: fechaVenc || null,
      testigos: incluirTestigos ? testigosSeleccionados : [],
      usuarioNombre: user?.email ?? '',
    })
      .then(setVariables)
      .catch((e) => toast.error('Error cargando datos: ' + e.message))
      .finally(() => setLoadingVars(false));
  }, [prestamoId, fechaVenc, incluirTestigos, testigosSeleccionados, user?.email]);

  // Preview cada vez que cambia plantilla o variables
  useEffect(() => {
    if (!plantillaSel || !variables) { setPreview(''); return; }
    setPreview(renderTemplate(plantillaSel.contenido_html ?? '', variables));
  }, [plantillaSel, variables]);

  const faltantes = useMemo(
    () => (plantillaSel && Object.keys(variables).length ? validarVariables(variables, plantillaSel.tipo) : []),
    [variables, plantillaSel],
  );

  const canNext = () => {
    if (paso === 0) return !!prestamoId;
    if (paso === 1) return !!plantillaId;
    if (paso === 4) return true;
    return true;
  };

  const reset = () => {
    setPaso(0); setBusqueda(''); setPrestamoId(prestamoIdInicial ?? null);
    setPlantillaId(null); setPapel('letter'); setFechaVenc('');
    setIncluirTestigos(false); setTestigosSeleccionados([]);
    setNuevoTestigo({ nombre: '', cedula: '', direccion: '', telefono: '' });
    setVariables({}); setPreview('');
  };

  const nombreArchivo = () => {
    const cli = variables.cliente_nombre?.replace(/\s+/g, '_') ?? 'documento';
    const t = plantillaSel?.nombre?.replace(/\s+/g, '_') ?? 'doc';
    return `${t}_${cli}`;
  };

  const handleDescargarDocx = async () => {
    if (faltantes.length) { toast.error('Faltan datos: ' + faltantes.join(', ')); return; }
    try { await generarDocx(preview, papel, nombreArchivo()); } catch (e: any) { toast.error('Error: ' + e.message); }
  };
  const handleDescargarPdf = () => {
    if (faltantes.length) { toast.error('Faltan datos: ' + faltantes.join(', ')); return; }
    try { generarPdfDesdeTexto(preview, papel, nombreArchivo(), variables.empresa?.nombre); } catch (e: any) { toast.error('Error: ' + e.message); }
  };
  const handleImprimir = () => {
    if (faltantes.length) { toast.error('Faltan datos: ' + faltantes.join(', ')); return; }
    imprimirDocumento(preview, plantillaSel?.nombre ?? 'Documento', papel);
  };
  const handleGuardar = async () => {
    if (!plantillaSel || !prestamoElegido) return;
    if (faltantes.length) { toast.error('Faltan datos: ' + faltantes.join(', ')); return; }
    setSaving(true);
    try {
      await crearDocumento.mutateAsync({
        tipo_documento: plantillaSel.tipo,
        categoria: (plantillaSel as any).categoria ?? null,
        plantilla_id: plantillaSel.id,
        prestamo_id: prestamoId,
        cliente_id: (prestamoElegido as any).clientes ? (prestamoElegido as any).cliente_id ?? null : null,
        papel,
        fecha_vencimiento: fechaVenc || null,
        contenido_html: preview,
        variables_snapshot: variables,
        testigos_snapshot: incluirTestigos ? testigosSeleccionados : [],
      });
      reset();
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const agregarTestigo = async () => {
    if (!nuevoTestigo.nombre) return;
    const t = await crearTestigo.mutateAsync(nuevoTestigo);
    setTestigosSeleccionados((p) => [...p, t]);
    setNuevoTestigo({ nombre: '', cedula: '', direccion: '', telefono: '' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Nuevo Documento Legal
          </DialogTitle>
          {/* Stepper */}
          <div className="flex items-center gap-1 mt-3 overflow-x-auto">
            {PASOS.map((p, i) => (
              <div key={p} className="flex items-center gap-1 flex-shrink-0">
                <div className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs',
                  i === paso ? 'bg-primary text-primary-foreground' :
                  i < paso ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                )}>
                  <div className="h-5 w-5 rounded-full bg-background/40 flex items-center justify-center text-[10px] font-bold">
                    {i < paso ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="whitespace-nowrap">{p}</span>
                </div>
                {i < PASOS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {/* Paso 0: Préstamo */}
          {paso === 0 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, cédula o número de préstamo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              {loadingPrest && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(prestamos ?? []).map((p: any) => {
                  const cli = p.clientes ?? {};
                  const sel = p.id === prestamoId;
                  return (
                    <Card
                      key={p.id}
                      className={cn('p-3 cursor-pointer transition hover:border-primary', sel && 'border-primary bg-primary/5')}
                      onClick={() => setPrestamoId(p.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {cli.primer_nombre} {cli.primer_apellido}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {p.numero_prestamo} · Cédula {cli.cedula ?? '—'}
                          </div>
                          <div className="text-xs mt-1 font-semibold text-primary">
                            RD$ {Number(p.monto_aprobado).toLocaleString('es-DO')}
                          </div>
                        </div>
                        {sel && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </Card>
                  );
                })}
                {!loadingPrest && (prestamos ?? []).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
                    Sin préstamos que coincidan
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 1: Tipo */}
          {paso === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {plantillasActivas.map((p) => {
                const sel = p.id === plantillaId;
                return (
                  <Card
                    key={p.id}
                    className={cn('p-3 cursor-pointer transition hover:border-primary', sel && 'border-primary bg-primary/5')}
                    onClick={() => setPlantillaId(p.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{p.nombre}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {(p as any).descripcion ?? p.tipo}
                        </div>
                        {(p as any).categoria && (
                          <Badge variant="outline" className="mt-1.5 text-[10px]">{(p as any).categoria}</Badge>
                        )}
                      </div>
                      {sel && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </Card>
                );
              })}
              {plantillasActivas.length === 0 && (
                <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
                  No hay plantillas activas. Crea una en Ajustes → Plantillas.
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Papel */}
          {paso === 2 && (
            <div className="space-y-3 max-w-md">
              <Label>Tamaño de papel</Label>
              <RadioGroup value={papel} onValueChange={(v) => setPapel(v as Papel)}>
                {[
                  { v: 'letter', l: 'Carta (8.5 × 11 in)' },
                  { v: 'legal', l: 'Legal (8.5 × 14 in)' },
                  { v: 'a4', l: 'A4 (21 × 29.7 cm)' },
                ].map((opt) => (
                  <div key={opt.v} className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40" onClick={() => setPapel(opt.v as Papel)}>
                    <RadioGroupItem value={opt.v} id={opt.v} />
                    <Label htmlFor={opt.v} className="cursor-pointer flex-1">{opt.l}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Paso 3: Vencimiento */}
          {paso === 3 && (
            <div className="space-y-3 max-w-md">
              <Label>Fecha de vencimiento (opcional)</Label>
              <p className="text-xs text-muted-foreground">Si se deja vacía, se usa la fecha de vencimiento propia del préstamo.</p>
              <Input type="date" value={fechaVenc} onChange={(e) => setFechaVenc(e.target.value)} />
            </div>
          )}

          {/* Paso 4: Testigos */}
          {paso === 4 && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Incluir testigos</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Añade testigos al documento (usan variables {'{{testigo1}}'}, {'{{testigo2}}'}…)</p>
                </div>
                <Switch checked={incluirTestigos} onCheckedChange={setIncluirTestigos} />
              </div>

              {incluirTestigos && (
                <>
                  <div>
                    <Label className="text-xs">Testigos previamente registrados</Label>
                    <Select onValueChange={(id) => {
                      const t = testigosDB?.find((x) => x.id === id);
                      if (t && !testigosSeleccionados.find((s) => s.id === t.id)) {
                        setTestigosSeleccionados((p) => [...p, t]);
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar testigo existente…" /></SelectTrigger>
                      <SelectContent>
                        {(testigosDB ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.nombre} — {t.cedula ?? 's/c'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-md p-3 space-y-2">
                    <Label className="text-xs">Agregar nuevo testigo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Nombre" value={nuevoTestigo.nombre} onChange={(e) => setNuevoTestigo((p) => ({ ...p, nombre: e.target.value }))} />
                      <Input placeholder="Cédula" value={nuevoTestigo.cedula} onChange={(e) => setNuevoTestigo((p) => ({ ...p, cedula: e.target.value }))} />
                      <Input placeholder="Dirección" value={nuevoTestigo.direccion} onChange={(e) => setNuevoTestigo((p) => ({ ...p, direccion: e.target.value }))} />
                      <Input placeholder="Teléfono" value={nuevoTestigo.telefono} onChange={(e) => setNuevoTestigo((p) => ({ ...p, telefono: e.target.value }))} />
                    </div>
                    <Button size="sm" onClick={agregarTestigo} disabled={!nuevoTestigo.nombre || crearTestigo.isPending} className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Agregar
                    </Button>
                  </div>

                  {testigosSeleccionados.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Testigos en este documento ({testigosSeleccionados.length})</Label>
                      {testigosSeleccionados.map((t, i) => (
                        <div key={t.id ?? i} className="flex items-center justify-between border rounded-md p-2 text-sm">
                          <div>
                            <span className="font-medium">Testigo {i + 1}: {t.nombre}</span>
                            <span className="text-xs text-muted-foreground ml-2">Cédula {t.cedula ?? '—'}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTestigosSeleccionados((p) => p.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Paso 5: Vista previa */}
          {paso === 5 && (
            <div>
              {loadingVars ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                <>
                  {faltantes.length > 0 && (
                    <div className="mb-3 border border-warning/40 bg-warning/10 rounded-md p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                      <div className="text-xs">
                        <p className="font-medium text-warning">Faltan datos obligatorios:</p>
                        <ul className="list-disc pl-4 mt-1">
                          {faltantes.map((f) => <li key={f}>{f}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                  <div className="border rounded-md bg-white text-black p-6 min-h-[400px] whitespace-pre-wrap text-sm leading-relaxed shadow-inner"
                       style={{ fontFamily: 'Times New Roman, serif' }}>
                    {preview || <span className="text-muted-foreground italic">Sin contenido</span>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Paso 6: Generar */}
          {paso === 6 && (
            <div className="space-y-4 max-w-2xl mx-auto text-center py-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Documento listo para generar</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plantillaSel?.nombre} — {variables.cliente_nombre}
                </p>
              </div>

              {faltantes.length > 0 && (
                <div className="border border-destructive/40 bg-destructive/10 rounded-md p-3 text-left">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Faltan datos obligatorios
                  </p>
                  <ul className="text-xs list-disc pl-5 mt-1">{faltantes.map((f) => <li key={f}>{f}</li>)}</ul>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <Button variant="outline" onClick={handleDescargarDocx} disabled={!!faltantes.length} className="gap-1.5">
                  <Download className="h-4 w-4" /> DOCX
                </Button>
                <Button variant="outline" onClick={handleDescargarPdf} disabled={!!faltantes.length} className="gap-1.5">
                  <Download className="h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" onClick={handleImprimir} disabled={!!faltantes.length} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button onClick={handleGuardar} disabled={!!faltantes.length || saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Al guardar se registra en el historial con snapshot completo.</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-3 border-t flex-row justify-between items-center gap-2">
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }} className="gap-1.5">
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPaso((p) => Math.max(0, p - 1))} disabled={paso === 0} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </Button>
            {paso < PASOS.length - 1 && (
              <Button onClick={() => setPaso((p) => Math.min(PASOS.length - 1, p + 1))} disabled={!canNext()} className="gap-1.5">
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
