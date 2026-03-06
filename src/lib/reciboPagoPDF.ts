import jsPDF from 'jspdf';
import { formatCurrency, formatDate } from '@/lib/format';

export interface ReciboPagoData {
  // Pago
  monto_pagado: number;
  fecha_pago: string;
  metodo_pago: string;
  referencia: string;
  // Cuota
  numero_cuota: number;
  monto_cuota: number;
  monto_pagado_acumulado: number; // total pagado en esta cuota después del pago
  // Préstamo
  numero_prestamo: string;
  monto_aprobado: number;
  // Cliente
  cliente_nombre: string;
  cliente_cedula: string;
  // Resumen restante
  cuotas_restantes: number;
  saldo_total_pendiente: number;
}

const metodoLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  deposito: 'Depósito',
};

export function generarReciboPago(data: ReciboPagoData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] }); // receipt-style narrow
  const w = 80;
  let y = 8;

  const center = (text: string, yy: number, size = 8) => {
    doc.setFontSize(size);
    const tw = doc.getTextWidth(text);
    doc.text(text, (w - tw) / 2, yy);
  };

  const line = (yy: number) => {
    doc.setDrawColor(180);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, yy, w - 4, yy);
  };

  // Header
  doc.setFont('helvetica', 'bold');
  center('COMPROBANTE DE PAGO', y, 10);
  y += 6;
  doc.setFont('helvetica', 'normal');
  center(formatDate(new Date().toISOString()), y, 7);
  y += 5;
  line(y);
  y += 4;

  // Cliente
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 4, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.cliente_nombre, 20, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Cédula:', 4, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.cliente_cedula, 20, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Préstamo:', 4, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.numero_prestamo, 24, y);
  y += 5;
  line(y);
  y += 4;

  // Detalle del pago
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  center('DETALLE DEL PAGO', y);
  y += 5;
  doc.setFontSize(7);

  const row = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, w - 4, y, { align: 'right' });
    y += 4;
  };

  row('Cuota #', String(data.numero_cuota));
  row('Fecha de pago:', formatDate(data.fecha_pago));
  row('Método:', metodoLabel[data.metodo_pago] ?? data.metodo_pago);
  if (data.referencia) {
    row('Referencia:', data.referencia);
  }
  row('Monto cuota:', formatCurrency(data.monto_cuota));
  row('Pagado ahora:', formatCurrency(data.monto_pagado));

  const restaCuota = data.monto_cuota - data.monto_pagado_acumulado;
  if (restaCuota > 0.01) {
    row('Resta en cuota:', formatCurrency(restaCuota));
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text('Estado cuota:', 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text('PAGADA ✓', w - 4, y, { align: 'right' });
    y += 4;
  }

  y += 1;
  line(y);
  y += 5;

  // Resumen del préstamo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  center('RESUMEN DEL PRÉSTAMO', y);
  y += 5;
  doc.setFontSize(7);

  row('Monto préstamo:', formatCurrency(data.monto_aprobado));
  row('Cuotas restantes:', String(data.cuotas_restantes));

  // Highlight saldo pendiente
  y += 1;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(4, y - 3, w - 8, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SALDO PENDIENTE:', 6, y + 2);
  doc.text(formatCurrency(data.saldo_total_pendiente), w - 6, y + 2, { align: 'right' });
  y += 12;

  line(y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  center('Este comprobante es válido como constancia de pago.', y);
  y += 3;
  center('Gracias por su pago puntual.', y);

  return doc;
}
