import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Save, Eye, Upload, Download, FileType2, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePlantillas, useActualizarPlantilla, useEmpresaInfo } from '@/hooks/useConfiguracion';
import { renderTemplate, VARIABLES_DISPONIBLES, buildRedesSocialesVars } from '@/lib/plantillas';
import { supabase } from '@/integrations/supabase/client';
import { extraerVariablesDocx, renderDocxTemplate, descargarBlob } from '@/lib/docxTemplate';


const SAMPLE_EMPRESA_FALLBACK = {
  nombre: 'Mi Empresa',
  rnc: '130-12345-6',
  direccion: 'Av. Principal #1',
  telefono: '(809) 555-0100',
  email: 'contacto@miempresa.do',
  sitio_web: 'https://miempresa.do',
  whatsapp_numero: '18095550100',
  facebook_url: 'https://facebook.com/miempresa',
  instagram_url: 'https://instagram.com/miempresa',
};

export function PlantillasDocumentosManager({ isAdmin }: { isAdmin: boolean }) {
  const { data: plantillas, isLoading } = usePlantillas();
  const { data: empresa } = useEmpresaInfo();
  const actualizar = useActualizarPlantilla();
  const [selectedId, setSelectedId] = useState<string>('');
  const [contenido, setContenido] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const empresaSample = empresa ?? SAMPLE_EMPRESA_FALLBACK;
  const { redes_sociales, redes_sociales_lista } = buildRedesSocialesVars(empresaSample);
  const SAMPLE_VARS = {
    cliente_nombre: 'Juan Pérez',
    cliente_cedula: '402-1234567-8',
    cliente_direccion: 'Calle Duarte #12, Santo Domingo',
    cliente_telefono: '+1 (809) 555-0123',
    numero_prestamo: 'PRE-000012',
    monto: 'RD$ 50,000.00',
    tasa: '5% mensual',
    plazo: '12 cuotas',
    frecuencia: 'mensual',
    fecha_desembolso: '20/05/2026',
    fecha_vencimiento: '20/05/2027',
    empresa: empresaSample,
    redes_sociales,
    redes_sociales_lista,
    garante_nombre: 'María Gómez',
    garante_cedula: '001-9876543-2',
    fecha_hoy: new Date().toLocaleDateString('es-DO'),
    lugar: 'Santo Domingo',
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const current = plantillas?.find((p) => p.id === selectedId);
  const [docxVars, setDocxVars] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [testing, setTesting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const pl = plantillas?.find((p) => p.id === id);
    setContenido(pl?.contenido_html ?? '');
    setShowPreview(false);
    setDocxVars(null);
  };

  const handleSave = () => {
    if (!selectedId) return;
    actualizar.mutate({ id: selectedId, contenido_html: contenido });
  };

  const insertVar = (clave: string) => {
    setContenido((prev) => prev + ` {{${clave}}}`);
  };

  const handleUploadDocx = async (file: File) => {
    if (!current) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error('Solo se aceptan archivos .docx');
      return;
    }
    setUploading(true);
    try {
      const detected = await extraerVariablesDocx(file);
      setDocxVars(detected);
      const path = `${current.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
      const { error: upErr } = await supabase.storage
        .from('plantillas-legales')
        .upload(path, file, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: false,
        });
      if (upErr) throw upErr;
      // Best-effort cleanup of previous file
      if (current.archivo_url) {
        await supabase.storage.from('plantillas-legales').remove([current.archivo_url]).catch(() => {});
      }
      await actualizar.mutateAsync({ id: current.id, archivo_url: path });
      toast.success(`Plantilla Word cargada · ${detected.length} variable(s) detectada(s)`);
    } catch (e: any) {
      toast.error('Error al cargar: ' + e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveDocx = async () => {
    if (!current?.archivo_url) return;
    if (!confirm('¿Eliminar el archivo Word de esta plantilla?')) return;
    await supabase.storage.from('plantillas-legales').remove([current.archivo_url]).catch(() => {});
    await actualizar.mutateAsync({ id: current.id, archivo_url: null });
    setDocxVars(null);
  };

  const handleTestDocx = async () => {
    if (!current?.archivo_url) return;
    setTesting(true);
    try {
      const blob = await renderDocxTemplate(current.archivo_url, SAMPLE_VARS);
      descargarBlob(blob, `${current.nombre}-prueba`);
    } catch (e: any) {
      toast.error('Error al generar prueba: ' + e.message);
    } finally {
      setTesting(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Plantillas de Documentos Legales</CardTitle>
        <p className="text-xs text-muted-foreground">
          Edita los contratos y documentos que el sistema usa al generar PDFs. Usa variables tipo <code className="bg-muted px-1 rounded">{'{{cliente_nombre}}'}</code> para insertar datos dinámicos.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <Select value={selectedId} onValueChange={handleSelect}>
            <SelectTrigger><SelectValue placeholder="Selecciona una plantilla para editar..." /></SelectTrigger>
            <SelectContent>
              {plantillas?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre} <span className="text-muted-foreground ml-1">(v{p.version})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {current && (
          <>
            <div className="flex flex-wrap gap-1 border rounded-md bg-muted/30 p-2">
              <span className="text-[11px] text-muted-foreground w-full mb-1">Insertar variable:</span>
              {VARIABLES_DISPONIBLES.map((v) => (
                <Badge
                  key={v.clave}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-[10px]"
                  title={v.desc}
                  onClick={() => isAdmin && insertVar(v.clave)}
                >
                  {`{{${v.clave}}}`}
                </Badge>
              ))}
            </div>

            <Textarea
              value={contenido}
              disabled={!isAdmin}
              onChange={(e) => setContenido(e.target.value)}
              rows={16}
              className="font-mono text-xs"
              placeholder={`Ejemplo:\n\nEn la ciudad de {{lugar}}, a los {{fecha_hoy}}, comparece el Sr./Sra. {{cliente_nombre}}, portador(a) de la cédula {{cliente_cedula}}, quien declara haber recibido de {{empresa.nombre}} la suma de {{monto}}...`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Versión actual: <b>v{current.version}</b> · Actualizada {new Date(current.updated_at).toLocaleString('es-DO')}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowPreview((v) => !v)}>
                  <Eye className="h-3.5 w-3.5" /> {showPreview ? 'Ocultar' : 'Vista previa'}
                </Button>
                {isAdmin && (
                  <Button size="sm" onClick={handleSave} disabled={actualizar.isPending} className="gap-1.5">
                    {actualizar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Guardar plantilla
                  </Button>
                )}
              </div>
            </div>

            {showPreview && (
              <div className="border rounded-md bg-card p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {renderTemplate(contenido, SAMPLE_VARS) || <span className="text-muted-foreground italic">Sin contenido</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
