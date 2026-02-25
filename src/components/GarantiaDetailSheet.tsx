import { useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGarantiaDocumentos, useUploadGarantiaDoc, useDeleteGarantiaDoc, type GarantiaPrendaria } from '@/hooks/useGarantias';
import { formatCurrency, formatDate } from '@/lib/format';
import { Upload, Trash2, ExternalLink, Loader2, Car, Home, Package } from 'lucide-react';

const tipoIcon: Record<string, any> = { vehiculo: Car, inmueble: Home, electrodomestico: Package, otro: Package };
const tipoLabel: Record<string, string> = { vehiculo: 'Vehículo', inmueble: 'Inmueble', electrodomestico: 'Electrodoméstico', otro: 'Otro' };
const estadoBadge: Record<string, string> = { activo: 'bg-success/10 text-success border-success/20', liberado: 'bg-muted text-muted-foreground', ejecutado: 'bg-destructive/10 text-destructive border-destructive/20' };

interface Props {
  garantia: GarantiaPrendaria | null;
  onClose: () => void;
}

export function GarantiaDetailSheet({ garantia, onClose }: Props) {
  const { data: docs, isLoading: loadingDocs } = useGarantiaDocumentos(garantia?.id);
  const uploadDoc = useUploadGarantiaDoc();
  const deleteDoc = useDeleteGarantiaDoc();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!garantia) return null;

  const Icon = tipoIcon[garantia.tipo] || Package;

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadDoc.mutateAsync({ garantiaId: garantia.id, file, tipo: 'foto' });
    }
  };

  return (
    <Sheet open={!!garantia} onOpenChange={() => onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {tipoLabel[garantia.tipo] || garantia.tipo}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{garantia.descripcion}</span>
            <Badge variant="outline" className={estadoBadge[garantia.estado] || ''}>
              {garantia.estado}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {garantia.marca && <div><span className="text-muted-foreground">Marca:</span> {garantia.marca}</div>}
            {garantia.modelo && <div><span className="text-muted-foreground">Modelo:</span> {garantia.modelo}</div>}
            {garantia.anio && <div><span className="text-muted-foreground">Año:</span> {garantia.anio}</div>}
            {garantia.color && <div><span className="text-muted-foreground">Color:</span> {garantia.color}</div>}
            {garantia.numero_placa && <div><span className="text-muted-foreground">Placa:</span> {garantia.numero_placa}</div>}
            {garantia.numero_chasis && <div><span className="text-muted-foreground">Chasis:</span> {garantia.numero_chasis}</div>}
            {garantia.numero_matricula && <div><span className="text-muted-foreground">Matrícula:</span> {garantia.numero_matricula}</div>}
            {garantia.numero_titulo && <div><span className="text-muted-foreground">Título:</span> {garantia.numero_titulo}</div>}
            {garantia.numero_serie && <div><span className="text-muted-foreground">Serie:</span> {garantia.numero_serie}</div>}
            <div><span className="text-muted-foreground">Valor Est.:</span> {formatCurrency(garantia.valor_estimado)}</div>
            {garantia.ubicacion && <div className="col-span-2"><span className="text-muted-foreground">Ubicación:</span> {garantia.ubicacion}</div>}
            {garantia.clientes && (
              <div className="col-span-2"><span className="text-muted-foreground">Cliente:</span> {garantia.clientes.primer_nombre} {garantia.clientes.primer_apellido}</div>
            )}
            <div className="col-span-2"><span className="text-muted-foreground">Registrado:</span> {formatDate(garantia.created_at)}</div>
          </div>

          {garantia.notas && (
            <div className="text-sm"><span className="text-muted-foreground">Notas:</span> {garantia.notas}</div>
          )}

          {/* Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Documentos y Fotos</span>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3 w-3" /> Subir
              </Button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => { handleUpload(e.target.files); e.target.value = ''; }} />
            </div>

            {loadingDocs ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : docs && docs.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {docs.map(doc => (
                  <div key={doc.id} className="relative rounded-md border overflow-hidden group">
                    {doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={doc.url} alt={doc.nombre} className="h-28 w-full object-cover" />
                    ) : (
                      <div className="h-28 flex items-center justify-center bg-muted/50 text-xs text-muted-foreground p-2 text-center">{doc.nombre}</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1.5 py-0.5 flex items-center justify-between">
                      <span className="text-[10px] capitalize text-muted-foreground">{doc.tipo}</span>
                      <div className="flex gap-1">
                        <a href={doc.url} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-3 w-3" /></a>
                        <button onClick={() => deleteDoc.mutate({ id: doc.id, garantiaId: garantia.id })} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">Sin documentos</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
