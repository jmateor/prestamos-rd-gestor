import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';

type Papel = 'letter' | 'legal' | 'a4';

// DXA (1 inch = 1440)
const PAGE_SIZES: Record<Papel, { width: number; height: number }> = {
  letter: { width: 12240, height: 15840 },
  legal:  { width: 12240, height: 20160 },
  a4:     { width: 11906, height: 16838 },
};

/**
 * Convierte texto renderizado (con \n como salto de párrafo) en DOCX.
 * Reconoce líneas en MAYÚSCULAS o terminadas en ":" como títulos en negrita.
 */
export async function generarDocx(
  contenidoTexto: string,
  papel: Papel,
  nombreArchivo: string,
) {
  const size = PAGE_SIZES[papel] ?? PAGE_SIZES.letter;

  const paragraphs: Paragraph[] = contenidoTexto.split(/\r?\n/).map((linea) => {
    const raw = linea.trimEnd();
    if (!raw.trim()) return new Paragraph({ children: [new TextRun('')] });

    const upper = raw === raw.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(raw);
    const esTitulo = upper && raw.length < 80;
    const esCentrado = esTitulo && raw.length < 45;

    return new Paragraph({
      alignment: esCentrado ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      spacing: { after: 120, line: 300 },
      children: [
        new TextRun({
          text: raw,
          bold: esTitulo,
          size: esTitulo ? 26 : 22,
          font: 'Times New Roman',
        }),
      ],
    });
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Times New Roman', size: 22 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: size.width, height: size.height, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${nombreArchivo}.docx`);
}
