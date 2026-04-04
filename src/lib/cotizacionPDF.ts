import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from '@/lib/format';
import { calcAmortizacion, totalCuotas, type CuotaCalc } from '@/lib/amortizacion';

export interface CotizacionData {
  cliente_nombre: string;
  cliente_cedula: string;
  monto: number;
  tasa_mensual: number;
  plazo_meses: number;
  frecuencia: string;
  metodo: string;
  gastos_legales?: number;
  gastos_cierre?: number;
  fecha?: string;
}

const frecLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

const metodoLabel: Record<string, string> = {
  cuota_fija: 'Cuota Fija (Francés)', interes_simple: 'Interés Simple', saldo_insoluto: 'Saldo Insoluto',
};

export function generarCotizacionPDF(data: CotizacionData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const w = 216;
  let y = 15;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COTIZACIÓN DE PRÉSTAMO', w / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDate(data.fecha ?? new Date().toISOString())}`, w / 2, y, { align: 'center' });
  y += 10;

  // Client info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.cliente_nombre, 40, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Cédula:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.cliente_cedula, 40, y);
  y += 8;

  // Loan params
  doc.setDrawColor(200);
  doc.line(15, y, w - 15, y);
  y += 6;

  const param = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, y);
    y += 5;
  };

  param('Monto Solicitado:', formatCurrency(data.monto));
  param('Tasa Mensual:', `${data.tasa_mensual}%`);
  param('Cuotas:', String(data.plazo_meses));
  param('Plazo:', frecLabel[data.frecuencia] ?? data.frecuencia);
  param('Método:', metodoLabel[data.metodo] ?? data.metodo);

  const gastosLeg = data.gastos_legales ?? 0;
  const gastosCie = data.gastos_cierre ?? 0;
  const totalGastos = gastosLeg + gastosCie;

  if (totalGastos > 0) {
    param('Gastos Legales:', formatCurrency(gastosLeg));
    param('Gastos de Cierre:', formatCurrency(gastosCie));
    param('Monto Neto a Recibir:', formatCurrency(data.monto - totalGastos));
  }

  y += 3;
  doc.line(15, y, w - 15, y);
  y += 8;

  // Amortization table
  const cuotas = calcAmortizacion(data.monto, data.tasa_mensual / 100, data.plazo_meses, data.frecuencia, data.metodo, new Date(data.fecha ?? Date.now()));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TABLA DE AMORTIZACIÓN', w / 2, y, { align: 'center' });
  y += 7;

  // Table header
  const cols = [15, 30, 62, 95, 128, 161];
  const headers = ['#', 'Vencimiento', 'Cuota', 'Capital', 'Interés', 'Saldo'];
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 4, w - 30, 6, 'F');
  headers.forEach((h, i) => doc.text(h, cols[i], y));
  y += 5;

  doc.setFont('helvetica', 'normal');
  let totalInteres = 0;
  let totalCapital = 0;

  for (const c of cuotas) {
    if (y > 260) {
      doc.addPage();
      y = 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y - 4, w - 30, 6, 'F');
      headers.forEach((h, i) => doc.text(h, cols[i], y));
      y += 5;
      doc.setFont('helvetica', 'normal');
    }
    doc.text(String(c.numero_cuota), cols[0], y);
    doc.text(formatDate(c.fecha_vencimiento.toISOString()), cols[1], y);
    doc.text(formatCurrency(c.monto_cuota), cols[2], y);
    doc.text(formatCurrency(c.capital), cols[3], y);
    doc.text(formatCurrency(c.interes), cols[4], y);
    doc.text(formatCurrency(c.saldo_pendiente), cols[5], y);
    totalInteres += c.interes;
    totalCapital += c.capital;
    y += 4;
  }

  // Totals
  y += 2;
  doc.line(15, y, w - 15, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Capital:', cols[2], y);
  doc.text(formatCurrency(totalCapital), cols[3], y);
  y += 4;
  doc.text('Total Interés:', cols[2], y);
  doc.text(formatCurrency(totalInteres), cols[3], y);
  y += 4;
  doc.text('Total a Pagar:', cols[2], y);
  doc.text(formatCurrency(totalCapital + totalInteres), cols[3], y);

  // Footer
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Esta cotización es informativa y no representa un compromiso de aprobación.', w / 2, y, { align: 'center' });

  return doc;
}
