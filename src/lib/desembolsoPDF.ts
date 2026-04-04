import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from '@/lib/format';

export interface DesembolsoData {
  numero_prestamo: string;
  cliente_nombre: string;
  cliente_cedula: string;
  monto_aprobado: number;
  gastos_legales: number;
  gastos_cierre: number;
  monto_neto: number;
  fecha_desembolso: string;
  tasa_interes: number;
  plazo_meses: number;
  frecuencia: string;
  cuota_estimada: number;
  metodo: string;
}

const frecLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

export function generarDesembolsoPDF(data: DesembolsoData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const w = 216;
  let y = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COMPROBANTE DE DESEMBOLSO', w / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Préstamo: ${data.numero_prestamo}`, w / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Fecha: ${formatDate(data.fecha_desembolso)}`, w / 2, y, { align: 'center' });
  y += 10;

  doc.setDrawColor(180);
  doc.line(15, y, w - 15, y);
  y += 7;

  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(value, 100, y);
    y += 6;
  };

  row('Cliente:', data.cliente_nombre);
  row('Cédula:', data.cliente_cedula);
  y += 3;
  doc.line(15, y, w - 15, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DETALLE FINANCIERO', 20, y);
  y += 7;
  doc.setFontSize(10);

  row('Monto Aprobado:', formatCurrency(data.monto_aprobado));
  row('(-) Gastos Legales:', formatCurrency(data.gastos_legales));
  row('(-) Gastos de Cierre:', formatCurrency(data.gastos_cierre));

  y += 2;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 4, w - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('MONTO NETO ENTREGADO:', 20, y + 1);
  doc.text(formatCurrency(data.monto_neto), w - 20, y + 1, { align: 'right' });
  y += 12;

  doc.setFontSize(10);
  row('Tasa de Interés:', `${data.tasa_interes}% mensual`);
  row('Cuotas:', String(data.plazo_meses));
  row('Plazo:', frecLabel[data.frecuencia] ?? data.frecuencia);
  row('Cuota Estimada:', formatCurrency(data.cuota_estimada));

  y += 10;
  doc.line(15, y, w - 15, y);
  y += 15;

  // Signature lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.line(20, y, 90, y);
  doc.text('Firma del Cliente', 40, y + 4);

  doc.line(120, y, 195, y);
  doc.text('Firma Autorizada', 145, y + 4);

  y += 15;
  doc.setFontSize(7);
  doc.text('Declaro haber recibido el monto neto indicado y acepto las condiciones del préstamo.', w / 2, y, { align: 'center' });

  return doc;
}
