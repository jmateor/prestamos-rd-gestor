/**
 * Imprime un texto renderizado directamente desde el navegador, sin descargar.
 * Crea un iframe oculto con el contenido formateado y dispara print().
 */
export function imprimirDocumento(contenidoTexto: string, titulo: string, papel: 'letter' | 'legal' | 'a4') {
  const size = papel === 'a4' ? 'A4' : papel === 'legal' ? 'legal' : 'letter';

  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(titulo)}</title>
      <style>
        @page { size: ${size} portrait; margin: 2.5cm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; text-align: justify; color: #000; }
        h1, h2, h3 { text-align: center; font-weight: bold; margin: 12pt 0; }
        p { margin: 6pt 0; white-space: pre-wrap; }
        .titulo { font-weight: bold; text-align: center; font-size: 14pt; margin: 10pt 0 6pt; }
        .subtitulo { font-weight: bold; margin: 8pt 0 4pt; }
      </style>
    </head>
    <body>${formatearAHtml(contenidoTexto)}</body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const idoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!idoc) { document.body.removeChild(iframe); return; }
  idoc.open();
  idoc.write(html);
  idoc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };
  if (iframe.contentWindow?.document.readyState === 'complete') doPrint();
  else iframe.onload = doPrint;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function formatearAHtml(texto: string): string {
  return texto.split(/\r?\n/).map((linea) => {
    const raw = linea.trimEnd();
    if (!raw.trim()) return '<p>&nbsp;</p>';
    const upper = raw === raw.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(raw);
    const esTitulo = upper && raw.length < 80;
    const esCentrado = esTitulo && raw.length < 45;
    if (esCentrado) return `<p class="titulo">${escapeHtml(raw)}</p>`;
    if (esTitulo) return `<p class="subtitulo">${escapeHtml(raw)}</p>`;
    return `<p>${escapeHtml(raw)}</p>`;
  }).join('');
}
