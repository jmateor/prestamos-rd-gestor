import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadClienteDocument } from '@/hooks/useClienteProfile';
import { useUpdateCliente, type Cliente } from '@/hooks/useClientes';
import { toast } from 'sonner';

interface Props {
  cliente: Cliente;
}

export function ClienteDocumentosTab({ cliente }: Props) {
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const updateCliente = useUpdateCliente();

  const fotoRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    file: File,
    tipo: 'foto' | 'cedula_frontal' | 'cedula_trasera',
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    try {
      const url = await uploadClienteDocument(cliente.id, file, tipo);
      const field = tipo === 'foto' ? 'foto' : tipo === 'cedula_frontal' ? 'cedula_frontal_url' : 'cedula_trasera_url';
      await updateCliente.mutateAsync({ id: cliente.id, data: { [field]: url } });
      toast.success('Documento subido exitosamente');
    } catch (e: any) {
      toast.error('Error al subir: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Foto de Perfil */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Foto de Perfil</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          {cliente.foto ? (
            <img src={cliente.foto} alt="Foto" className="h-24 w-24 rounded-lg object-cover border" />
          ) : (
            <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f, 'foto', setUploadingFoto);
            }} />
            <Button size="sm" variant="outline" className="gap-1" onClick={() => fotoRef.current?.click()} disabled={uploadingFoto}>
              {uploadingFoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Subir Foto
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Opcional</p>
          </div>
        </CardContent>
      </Card>

      {/* Cédula Frontal */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cédula — Frente</CardTitle></CardHeader>
        <CardContent>
          {cliente.cedula_frontal_url ? (
            <img src={cliente.cedula_frontal_url} alt="Cédula Frontal" className="w-full max-w-sm rounded-lg border" />
          ) : (
            <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Sin documento</p>
            </div>
          )}
          <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'cedula_frontal', setUploadingFront);
          }} />
          <Button size="sm" variant="outline" className="gap-1 mt-3" onClick={() => frontRef.current?.click()} disabled={uploadingFront}>
            {uploadingFront ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Subir Cédula Frontal
          </Button>
        </CardContent>
      </Card>

      {/* Cédula Trasera */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cédula — Reverso</CardTitle></CardHeader>
        <CardContent>
          {cliente.cedula_trasera_url ? (
            <img src={cliente.cedula_trasera_url} alt="Cédula Trasera" className="w-full max-w-sm rounded-lg border" />
          ) : (
            <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Sin documento</p>
            </div>
          )}
          <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'cedula_trasera', setUploadingBack);
          }} />
          <Button size="sm" variant="outline" className="gap-1 mt-3" onClick={() => backRef.current?.click()} disabled={uploadingBack}>
            {uploadingBack ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Subir Cédula Reverso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
