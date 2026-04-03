import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/format';

export interface CronogramaData {
  numero_prestamo: string;
  cliente_nombre: string;
  cliente_cedula: string;
  monto_aprobado: number;
  tasa_interes: number;
  plazo_meses: number;
  frecuencia_pago: string;
  metodo_amortizacion: string;
  fecha_desembolso: string;
  cuotas: {
    numero_cuota: number;
    fecha_vencimiento: string;
    capital: number;
    interes: number;
    mora: number;
    monto_cuota: number;
    saldo_pendiente: number;
  }[];
}

const frecLabel: Record<string, string> = {
  diaria: 'Diaria', semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
};

const metodoLabel: Record<string, string> = {
  cuota_fija: 'Cuota Fija (Francés)', interes_simple: 'Interés Simple', saldo_insoluto: 'Saldo Insoluto',
};

export function generarCronogramaPDF(data: CronogramaData) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 20;

  const drawHeader = () => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CRONOGRAMA DE PAGOS', pw / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Préstamo: ${data.numero_prestamo} | Cliente: ${data.cliente_nombre} (${data.cliente_cedula})`, pw / 2, y, { align: 'center' });
    y += 5;
    doc.text(`Monto: ${formatCurrency(data.monto_aprobado)} | Tasa: ${data.tasa_interes}% | Cuotas: ${data.plazo_meses} | Plazo: ${frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago} | Método: ${metodoLabel[data.metodo_amortizacion] ?? data.metodo_amortizacion}`, pw / 2, y, { align: 'center' });
    y += 6;
    doc.setDrawColor(150);
    doc.line(margin, y, pw - margin, y);
    y += 4;
  };

  drawHeader();

  // Table header
  const cols = [
    { label: '#', x: margin, w: 10 },
    { label: 'Fecha Pago', x: margin + 12, w: 28 },
    { label: 'Capital', x: margin + 42, w: 28 },
    { label: 'Interés', x: margin + 72, w: 25 },
    { label: 'Mora', x: margin + 99, w: 22 },
    { label: 'Total Cuota', x: margin + 123, w: 28 },
    { label: 'Saldo', x: margin + 153, w: 28 },
  ];

  const drawTableHeader = () => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 3, pw - margin * 2, 6, 'F');
    cols.forEach((c) => doc.text(c.label, c.x + 1, y));
    y += 5;
    doc.setFont('helvetica', 'normal');
  };

  drawTableHeader();

  let totalCapital = 0, totalInteres = 0, totalMora = 0, totalCuota = 0;

  for (const cuota of data.cuotas) {
    if (y > ph - 25) {
      doc.addPage();
      y = 20;
      drawHeader();
      drawTableHeader();
    }

    totalCapital += cuota.capital;
    totalInteres += cuota.interes;
    totalMora += cuota.mora;
    totalCuota += cuota.monto_cuota;

    doc.setFontSize(7.5);
    const fv = new Date(cuota.fecha_vencimiento).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(String(cuota.numero_cuota), cols[0].x + 1, y);
    doc.text(fv, cols[1].x + 1, y);
    doc.text(formatCurrency(cuota.capital), cols[2].x + 1, y);
    doc.text(formatCurrency(cuota.interes), cols[3].x + 1, y);
    doc.text(formatCurrency(cuota.mora), cols[4].x + 1, y);
    doc.text(formatCurrency(cuota.monto_cuota), cols[5].x + 1, y);
    doc.text(formatCurrency(cuota.saldo_pendiente), cols[6].x + 1, y);
    y += 4.5;
  }

  // Totals row
  y += 2;
  doc.setDrawColor(150);
  doc.line(margin, y - 2, pw - margin, y - 2);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTALES', cols[0].x + 1, y);
  doc.text(formatCurrency(totalCapital), cols[2].x + 1, y);
  doc.text(formatCurrency(totalInteres), cols[3].x + 1, y);
  doc.text(formatCurrency(totalMora), cols[4].x + 1, y);
  doc.text(formatCurrency(totalCuota), cols[5].x + 1, y);

  doc.save(`Cronograma_${data.numero_prestamo}.pdf`);
}
