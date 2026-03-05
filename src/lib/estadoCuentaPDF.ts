import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/format';

export interface EstadoCuentaData {
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_telefono: string;
  cliente_direccion: string;
  prestamos: {
    numero_prestamo: string;
    monto_aprobado: number;
    tasa_interes: number;
    estado: string;
    fecha_desembolso: string;
    total_pagado: number;
    saldo_pendiente: number;
    cuotas_pagadas: number;
    cuotas_total: number;
    cuotas_vencidas: number;
  }[];
  pagos: {
    fecha: string;
    monto: number;
    metodo: string;
    prestamo: string;
    referencia: string;
  }[];
}

export function generarEstadoCuentaPDF(data: EstadoCuentaData) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO DE CUENTA', pw / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}`, pw / 2, y, { align: 'center' });
  y += 8;

  // Client info
  doc.setDrawColor(150);
  doc.line(margin, y, pw - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DATOS DEL CLIENTE', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const info = [
    ['Nombre:', data.cliente_nombre],
    ['Cédula:', data.cliente_cedula],
    ['Teléfono:', data.cliente_telefono],
    ['Dirección:', data.cliente_direccion || 'No registrada'],
  ];
  for (const [l, v] of info) {
    doc.setFont('helvetica', 'bold');
    doc.text(l, margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v, margin + 30, y);
    y += 5;
  }
  y += 4;

  // Loans summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMEN DE PRÉSTAMOS', margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 3, pw - margin * 2, 6, 'F');
  const hCols = ['Nro.', 'Monto', 'Tasa', 'Estado', 'Pagado', 'Saldo', 'Cuotas'];
  const hX = [margin + 1, margin + 28, margin + 58, margin + 78, margin + 102, margin + 132, margin + 158];
  hCols.forEach((h, i) => doc.text(h, hX[i], y));
  y += 5;
  doc.setFont('helvetica', 'normal');

  for (const p of data.prestamos) {
    doc.setFontSize(7.5);
    doc.text(p.numero_prestamo, hX[0], y);
    doc.text(formatCurrency(p.monto_aprobado), hX[1], y);
    doc.text(`${p.tasa_interes}%`, hX[2], y);
    doc.text(p.estado, hX[3], y);
    doc.text(formatCurrency(p.total_pagado), hX[4], y);
    doc.text(formatCurrency(p.saldo_pendiente), hX[5], y);
    doc.text(`${p.cuotas_pagadas}/${p.cuotas_total}`, hX[6], y);
    y += 4.5;
  }
  y += 6;

  // Payment history
  if (data.pagos.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('HISTORIAL DE PAGOS', margin, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 3, pw - margin * 2, 6, 'F');
    const pCols = ['Fecha', 'Préstamo', 'Monto', 'Método', 'Referencia'];
    const pX = [margin + 1, margin + 30, margin + 62, margin + 98, margin + 135];
    pCols.forEach((h, i) => doc.text(h, pX[i], y));
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    for (const p of data.pagos.slice(0, 50)) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.text(new Date(p.fecha).toLocaleDateString('es-DO'), pX[0], y);
      doc.text(p.prestamo, pX[1], y);
      doc.text(formatCurrency(p.monto), pX[2], y);
      doc.text(p.metodo, pX[3], y);
      doc.text(p.referencia || '—', pX[4], y);
      y += 4.5;
    }
  }

  doc.save(`EstadoCuenta_${data.cliente_cedula}.pdf`);
}
