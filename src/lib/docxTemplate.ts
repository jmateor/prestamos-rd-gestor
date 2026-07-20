import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { supabase } from '@/integrations/supabase/client';
import { buildRedesSocialesVars } from '@/lib/plantillas';

/**
 * Downloads a .docx template stored in the `plantillas-legales` bucket and
 * renders it with the given variables. Placeholders inside the Word document
 * must use `{{variable}}` syntax (also supports `{{empresa.nombre}}`,
 * `{{#lista}}...{{/lista}}` loops via docxtemplater).
 */
export async function renderDocxTemplate(
  archivoPath: string,
  variables: Record<string, any>,
): Promise<Blob> {
  // Download the template from private bucket
  const { data, error } = await supabase.storage
    .from('plantillas-legales')
    .download(archivoPath);
  if (error || !data) throw new Error('No se pudo descargar la plantilla: ' + (error?.message ?? ''));

  const arrayBuffer = await data.arrayBuffer();
  const zip = new PizZip(arrayBuffer);

  const doc = new Docxtemplater(zip, {
    delimiters: { start: '{{', end: '}}' },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  });

  // Auto-inject redes sociales helpers if empresa is present
  const vars = { ...variables };
  if (vars.empresa && !vars.redes_sociales) {
    const { redes_sociales, redes_sociales_lista } = buildRedesSocialesVars(vars.empresa);
    vars.redes_sociales = redes_sociales;
    vars.redes_sociales_lista = redes_sociales_lista;
  }

  doc.render(vars);
  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre.endsWith('.docx') ? nombre : `${nombre}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Scan a .docx file client-side and return the list of {{variables}} it uses.
 * Useful to preview which placeholders the uploaded template contains.
 */
export async function extraerVariablesDocx(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const zip = new PizZip(buf);
  const xml = zip.file('word/document.xml')?.asText() ?? '';
  // Strip Word's split runs inside a tag: <w:t>{{cli</w:t>...</w:t>ente}}</w:t>
  const plain = xml.replace(/<[^>]+>/g, '');
  const found = new Set<string>();
  const re = /\{\{\s*([#/]?[\w.]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plain))) found.add(m[1]);
  return Array.from(found);
}
