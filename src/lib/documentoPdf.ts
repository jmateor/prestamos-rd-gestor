import jsPDF from 'jspdf';

type Papel = 'letter' | 'legal' | 'a4';

/**
 * Genera un PDF a partir de texto plano renderizado. Respeta saltos de línea,
 * detecta títulos (líneas en MAYÚSCULAS) y aplica márgenes y tamaño de papel.
 */
export function generarPdfDesdeTexto(
  contenidoTexto: string,
  papel: Papel,
  nombreArchivo: string,
  encabezado?: string,
) {
  const format: any = papel === 'a4' ? 'a4' : papel === 'legal' ? 'legal' : 'letter';
  const doc = new jsPDF({ unit: 'mm', format });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 22;
  const maxW = pw - margin * 2;
  let y = 25;

  if (encabezado) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120);
    doc.text(encabezado, pw / 2, 15, { align: 'center' });
    doc.setTextColor(0);
  }

  const lineas = contenidoTexto.split(/\r?\n/);
  for (const raw of lineas) {
    const linea = raw.trimEnd();
    if (!linea.trim()) { y += 4; continue; }

    const upper = linea === linea.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(linea);
    const esTitulo = upper && linea.length < 80;
    const esCentrado = esTitulo && linea.length < 45;

    doc.setFont('helvetica', esTitulo ? 'bold' : 'normal');
    doc.setFontSize(esTitulo ? 13 : 11);

    const wrapped = doc.splitTextToSize(linea, maxW);
    for (const w of wrapped) {
      if (y > ph - 20) { doc.addPage(); y = 25; }
      if (esCentrado) doc.text(w, pw / 2, y, { align: 'center' });
      else doc.text(w, margin, y, { align: 'justify', maxWidth: maxW } as any);
      y += esTitulo ? 6.5 : 5.5;
    }
    y += esTitulo ? 3 : 1.5;
  }

  doc.save(`${nombreArchivo}.pdf`);
}
