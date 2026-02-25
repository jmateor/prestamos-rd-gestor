import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateGarantiaPrendaria, useUploadGarantiaDoc } from '@/hooks/useGarantias';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X, Car, Home, Package } from 'lucide-react';

const tipoOptions = [
  { value: 'vehiculo', label: 'Vehículo', icon: Car },
  { value: 'inmueble', label: 'Inmueble / Casa', icon: Home },
  { value: 'electrodomestico', label: 'Electrodoméstico', icon: Package },
  { value: 'otro', label: 'Otro Artículo', icon: Package },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GarantiaPrendariaForm({ open, onClose }: Props) {
  const createGarantia = useCreateGarantiaPrendaria();
  const uploadDoc = useUploadGarantiaDoc();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipo, setTipo] = useState('vehiculo');
  const [descripcion, setDescripcion] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [color, setColor] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [numeroPlaca, setNumeroPlaca] = useState('');
  const [numeroChasis, setNumeroChasis] = useState('');
  const [numeroMatricula, setNumeroMatricula] = useState('');
  const [numeroTitulo, setNumeroTitulo] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [notas, setNotas] = useState('');
  const [files, setFiles] = useState<{ file: File; tipo: string; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: clientes } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, primer_nombre, primer_apellido, cedula').eq('estado', 'activo').order('primer_nombre');
      return data || [];
    },
  });

  const addFiles = (newFiles: FileList | null, docTipo: string) => {
    if (!newFiles) return;
    const added = Array.from(newFiles).map(f => ({
      file: f,
      tipo: docTipo,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
    }));
    setFiles(prev => [...prev, ...added]);
  };

  const removeFile = (idx: number) => {
    setFiles(prev => {
      const copy = [...prev];
      if (copy[idx].preview) URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;
    setSaving(true);
    try {
      const result = await createGarantia.mutateAsync({
        tipo,
        descripcion,
        marca, modelo,
        anio: anio ? parseInt(anio) : null,
        color, numero_serie: numeroSerie,
        numero_placa: numeroPlaca, numero_chasis: numeroChasis,
        numero_matricula: numeroMatricula, numero_titulo: numeroTitulo,
        valor_estimado: valorEstimado ? parseFloat(valorEstimado) : 0,
        ubicacion,
        cliente_id: clienteId || null,
        notas,
      } as any);

      // Upload files
      for (const f of files) {
        await uploadDoc.mutateAsync({ garantiaId: result.id, file: f.file, tipo: f.tipo });
      }

      onClose();
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTipo('vehiculo'); setDescripcion(''); setMarca(''); setModelo('');
    setAnio(''); setColor(''); setNumeroSerie(''); setNumeroPlaca('');
    setNumeroChasis(''); setNumeroMatricula(''); setNumeroTitulo('');
    setValorEstimado(''); setUbicacion(''); setClienteId(''); setNotas('');
    files.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const isVehicle = tipo === 'vehiculo';
  const isInmueble = tipo === 'inmueble';

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Garantía Prendaria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Garantía *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente (opcional)</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.primer_nombre} {c.primer_apellido} - {c.cedula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label>Descripción *</Label>
            <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Toyota Corolla 2020 color gris" required />
          </div>

          {/* Vehicle / article details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Toyota" />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Corolla" />
            </div>
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Input type="number" value={anio} onChange={e => setAnio(e.target.value)} placeholder="2020" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input value={color} onChange={e => setColor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Estimado (RD$)</Label>
              <Input type="number" step="0.01" value={valorEstimado} onChange={e => setValorEstimado(e.target.value)} />
            </div>
          </div>

          {/* Vehicle-specific fields */}
          {isVehicle && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>No. Placa</Label>
                <Input value={numeroPlaca} onChange={e => setNumeroPlaca(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>No. Chasis</Label>
                <Input value={numeroChasis} onChange={e => setNumeroChasis(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>No. Matrícula</Label>
                <Input value={numeroMatricula} onChange={e => setNumeroMatricula(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>No. Serie</Label>
                <Input value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} />
              </div>
            </div>
          )}

          {/* Inmueble fields */}
          {isInmueble && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>No. Título de Propiedad</Label>
                <Input value={numeroTitulo} onChange={e => setNumeroTitulo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ubicación</Label>
                <Input value={ubicacion} onChange={e => setUbicacion(e.target.value)} placeholder="Dirección del inmueble" />
              </div>
            </div>
          )}

          {/* Non-vehicle/inmueble serial */}
          {!isVehicle && !isInmueble && (
            <div className="space-y-1.5">
              <Label>No. Serie / Identificación</Label>
              <Input value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} />
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
          </div>

          {/* File uploads */}
          <div className="space-y-2">
            <Label>Fotos y Documentos</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => { fileInputRef.current?.setAttribute('data-tipo', 'foto'); fileInputRef.current?.click(); }}>
                <Upload className="h-3 w-3" /> Fotos del artículo
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => { fileInputRef.current?.setAttribute('data-tipo', 'matricula'); fileInputRef.current?.click(); }}>
                <Upload className="h-3 w-3" /> Matrícula
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => { fileInputRef.current?.setAttribute('data-tipo', 'titulo'); fileInputRef.current?.click(); }}>
                <Upload className="h-3 w-3" /> Título
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={e => {
                const docTipo = fileInputRef.current?.getAttribute('data-tipo') || 'foto';
                addFiles(e.target.files, docTipo);
                e.target.value = '';
              }}
            />
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="relative rounded-md border bg-muted/30 p-1 group">
                    {f.preview ? (
                      <img src={f.preview} alt="" className="h-20 w-full object-cover rounded" />
                    ) : (
                      <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">{f.file.name}</div>
                    )}
                    <span className="text-[10px] text-muted-foreground block text-center mt-0.5 capitalize">{f.tipo}</span>
                    <button type="button" onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { onClose(); resetForm(); }}>Cancelar</Button>
            <Button type="submit" disabled={saving || !descripcion.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Guardar Garantía
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
