import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadClienteDocument } from '@/hooks/useClienteProfile';
import { useUpdateCliente, type Cliente } from '@/hooks/useClientes';
import { SignedImage } from '@/components/SignedImage';
import { toast } from 'sonner';

interface Props {
  cliente: Cliente;
}

export function ClienteDocumentosTab({ cliente }: Props) {
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  
  // Local state to show preview immediately after upload
  const [localFoto, setLocalFoto] = useState<string | null>(null);
  const [localFront, setLocalFront] = useState<string | null>(null);
  const [localBack, setLocalBack] = useState<string | null>(null);
  
  const updateCliente = useUpdateCliente();

  const fotoRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const fotoPath = localFoto || cliente.foto || '';
  const frontPath = localFront || cliente.cedula_frontal_url || '';
  const backPath = localBack || cliente.cedula_trasera_url || '';

  const handleUpload = async (
    file: File,
    tipo: 'foto' | 'cedula_frontal' | 'cedula_trasera',
    setLoading: (v: boolean) => void,
    setLocalUrl: (v: string) => void
  ) => {
    setLoading(true);
    try {
      const path = await uploadClienteDocument(cliente.id, file, tipo);
      const field = tipo === 'foto' ? 'foto' : tipo === 'cedula_frontal' ? 'cedula_frontal_url' : 'cedula_trasera_url';
      await updateCliente.mutateAsync({ id: cliente.id, data: { [field]: path } });
      setLocalUrl(path);
      toast.success('Documento subido exitosamente');
    } catch (e: any) {
      setLocalUrl('');
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
          {fotoPath ? (
            <SignedImage bucket="clientes" path={fotoPath} alt="Foto"
              className="h-24 w-24 rounded-lg object-cover border"
              fallbackClassName="h-24 w-24 rounded-lg bg-muted flex items-center justify-center" />
          ) : (
            <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f, 'foto', setUploadingFoto, setLocalFoto);
              e.target.value = '';
            }} />
            <Button size="sm" variant="outline" className="gap-1" onClick={() => fotoRef.current?.click()} disabled={uploadingFoto}>
              {uploadingFoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {fotoPath ? 'Cambiar Foto' : 'Subir Foto'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Opcional</p>
          </div>
        </CardContent>
      </Card>

      {/* Cédula Frontal */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cédula — Frente</CardTitle></CardHeader>
        <CardContent>
          {frontPath ? (
            <SignedImage bucket="clientes" path={frontPath} alt="Cédula Frontal"
              className="w-full max-w-sm rounded-lg border"
              fallbackClassName="h-32 w-full max-w-sm rounded-lg bg-muted flex items-center justify-center" />
          ) : (
            <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Sin documento</p>
            </div>
          )}
          <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'cedula_frontal', setUploadingFront, setLocalFront);
            e.target.value = '';
          }} />
          <Button size="sm" variant="outline" className="gap-1 mt-3" onClick={() => frontRef.current?.click()} disabled={uploadingFront}>
            {uploadingFront ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {frontPath ? 'Cambiar Cédula Frontal' : 'Subir Cédula Frontal'}
          </Button>
        </CardContent>
      </Card>

      {/* Cédula Trasera */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Cédula — Reverso</CardTitle></CardHeader>
        <CardContent>
          {backPath ? (
            <SignedImage bucket="clientes" path={backPath} alt="Cédula Trasera"
              className="w-full max-w-sm rounded-lg border"
              fallbackClassName="h-32 w-full max-w-sm rounded-lg bg-muted flex items-center justify-center" />
          ) : (
            <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Sin documento</p>
            </div>
          )}
          <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'cedula_trasera', setUploadingBack, setLocalBack);
            e.target.value = '';
          }} />
          <Button size="sm" variant="outline" className="gap-1 mt-3" onClick={() => backRef.current?.click()} disabled={uploadingBack}>
            {uploadingBack ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {backPath ? 'Cambiar Cédula Reverso' : 'Subir Cédula Reverso'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
