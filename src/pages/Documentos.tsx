import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  FileSignature, Plus, Search, Loader2, MoreVertical, Eye, Download, Printer, Trash2, FileText,
} from 'lucide-react';
import { useDocumentos, useEliminarDocumento, type DocumentoGenerado } from '@/hooks/useDocumentos';
import { useUserRole } from '@/hooks/useUserRole';
import { DocumentoWizard } from '@/components/documentos/DocumentoWizard';
import { generarDocx } from '@/lib/documentoDocx';
import { generarPdfDesdeTexto } from '@/lib/documentoPdf';
import { imprimirDocumento } from '@/lib/documentoPrint';
import { formatDate } from '@/lib/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Documentos() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<DocumentoGenerado | null>(null);
  const { data: documentos, isLoading } = useDocumentos({ search });
  const eliminar = useEliminarDocumento();
  const { isAdmin } = useUserRole();

  const clienteNombre = (d: DocumentoGenerado) => {
    if (d.clientes) return `${d.clientes.primer_nombre ?? ''} ${d.clientes.primer_apellido ?? ''}`.trim() || '—';
    return d.variables_snapshot?.cliente_nombre ?? '—';
  };

  const nombreArchivo = (d: DocumentoGenerado) => {
    const cli = (clienteNombre(d) || 'documento').replace(/\s+/g, '_');
    return `${d.tipo_documento}_${cli}_${d.numero_documento}`;
  };

  const descargarDocx = (d: DocumentoGenerado) => generarDocx(d.contenido_html, d.papel as any, nombreArchivo(d));
  const descargarPdf = (d: DocumentoGenerado) => generarPdfDesdeTexto(d.contenido_html, d.papel as any, nombreArchivo(d), d.variables_snapshot?.empresa?.nombre);
  const imprimir = (d: DocumentoGenerado) => imprimirDocumento(d.contenido_html, d.tipo_documento, d.papel as any);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" /> Documentos Legales
          </h1>
          <p className="text-sm text-muted-foreground">Genera pagarés, contratos, cartas y actas a partir de plantillas.</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nuevo Documento
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Historial ({documentos?.length ?? 0})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (documentos?.length ?? 0) === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No hay documentos generados aún. Presiona "Nuevo Documento" para empezar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos?.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs font-semibold">{d.numero_documento}</TableCell>
                    <TableCell className="text-sm">{d.tipo_documento.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-sm">{clienteNombre(d)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.prestamos?.numero_prestamo ?? '—'}</TableCell>
                    <TableCell className="text-xs">{formatDate(d.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={d.estado === 'generado' ? 'bg-success/10 text-success border-success/20' : ''}>
                        {d.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreview(d)} className="gap-2"><Eye className="h-4 w-4" /> Ver</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => descargarDocx(d)} className="gap-2"><Download className="h-4 w-4" /> Descargar DOCX</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => descargarPdf(d)} className="gap-2"><Download className="h-4 w-4" /> Descargar PDF</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => imprimir(d)} className="gap-2"><Printer className="h-4 w-4" /> Imprimir</DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 text-destructive">
                                    <Trash2 className="h-4 w-4" /> Eliminar
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar {d.numero_documento}?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => eliminar.mutate(d.id)} className="bg-destructive">Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Wizard */}
      <DocumentoWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Preview */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>{preview?.numero_documento} — {preview?.tipo_documento.replace(/_/g, ' ')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="border rounded-md bg-white text-black p-8 whitespace-pre-wrap text-sm leading-relaxed shadow"
                 style={{ fontFamily: 'Times New Roman, serif' }}>
              {preview?.contenido_html}
            </div>
          </ScrollArea>
          {preview && (
            <div className="px-6 py-3 border-t flex flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={() => descargarDocx(preview)} className="gap-1.5"><Download className="h-4 w-4" /> DOCX</Button>
              <Button variant="outline" onClick={() => descargarPdf(preview)} className="gap-1.5"><Download className="h-4 w-4" /> PDF</Button>
              <Button onClick={() => imprimir(preview)} className="gap-1.5"><Printer className="h-4 w-4" /> Imprimir</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
