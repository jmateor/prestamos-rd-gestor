import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/format';

export interface ContratoData {
  numero_prestamo: string;
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_direccion: string;
  cliente_telefono: string;
  monto_aprobado: number;
  tasa_interes: number;
  plazo_meses: number;
  frecuencia_pago: string;
  metodo_amortizacion: string;
  fecha_desembolso: string;
  fecha_vencimiento: string;
  cuota_estimada: number;
  total_cuotas: number;
}

const frecLabel: Record<string, string> = {
  diaria: 'diaria', semanal: 'semanal', quincenal: 'quincenal', mensual: 'mensual',
};

const metodoLabel: Record<string, string> = {
  cuota_fija: 'Cuota Fija (Francés)',
  interes_simple: 'Interés Simple',
  saldo_insoluto: 'Saldo Insoluto',
};

function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function generarContratoPDF(data: ContratoData) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxW = pw - margin * 2;
  let y = 25;

  // ── Header ───────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE PRÉSTAMO', pw / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nro. ${data.numero_prestamo}`, pw / 2, y, { align: 'center' });
  y += 10;

  // ── Line ─────────────────────────────────────────────────
  doc.setDrawColor(100);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // ── Partes ───────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTES DEL CONTRATO', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const partesTexto = `Entre JBM RD Préstamos (en adelante "EL PRESTAMISTA") y ${data.cliente_nombre}, portador(a) de la cédula de identidad No. ${data.cliente_cedula}, con domicilio en ${data.cliente_direccion || 'dirección registrada en el sistema'}, teléfono ${data.cliente_telefono} (en adelante "EL PRESTATARIO"), se acuerda lo siguiente:`;
  const partesLines = doc.splitTextToSize(partesTexto, maxW);
  doc.text(partesLines, margin, y);
  y += partesLines.length * 5 + 6;

  // ── Condiciones ──────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CONDICIONES DEL PRÉSTAMO', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const condiciones = [
    ['Monto Aprobado:', formatCurrency(data.monto_aprobado)],
    ['Tasa de Interés:', `${data.tasa_interes}% mensual`],
    ['Plazo:', `${data.plazo_meses} meses`],
    ['Frecuencia de Pago:', frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago],
    ['Método de Amortización:', metodoLabel[data.metodo_amortizacion] ?? data.metodo_amortizacion],
    ['Cuota Estimada:', formatCurrency(data.cuota_estimada)],
    ['Total de Cuotas:', `${data.total_cuotas}`],
    ['Fecha de Desembolso:', formatDateLong(data.fecha_desembolso)],
    ['Fecha de Vencimiento:', formatDateLong(data.fecha_vencimiento)],
  ];

  for (const [label, value] of condiciones) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, y);
    y += 6;
  }
  y += 4;

  // ── Cláusulas ────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CLÁUSULAS', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const clausulas = [
    `PRIMERA: EL PRESTAMISTA entrega a EL PRESTATARIO la cantidad de ${formatCurrency(data.monto_aprobado)} en calidad de préstamo, la cual EL PRESTATARIO declara haber recibido a su entera satisfacción.`,
    `SEGUNDA: EL PRESTATARIO se compromete a pagar el préstamo en ${data.total_cuotas} cuotas de frecuencia ${frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago}, por un monto estimado de ${formatCurrency(data.cuota_estimada)} cada una, que incluye capital e intereses.`,
    `TERCERA: La tasa de interés aplicable es del ${data.tasa_interes}% mensual, calculada mediante el método de ${metodoLabel[data.metodo_amortizacion] ?? data.metodo_amortizacion}.`,
    `CUARTA: En caso de mora en el pago de cualquier cuota, EL PRESTATARIO deberá pagar un recargo por mora equivalente al 5% del monto de la cuota por cada período de atraso, además de los intereses moratorios vigentes.`,
    `QUINTA: EL PRESTATARIO podrá realizar pagos anticipados parciales o totales sin penalidad alguna, aplicándose el saldo al capital pendiente.`,
    `SEXTA: El incumplimiento de tres (3) cuotas consecutivas dará derecho a EL PRESTAMISTA a declarar vencido el plazo total del préstamo y exigir el pago inmediato de la totalidad del saldo pendiente.`,
    `SÉPTIMA: Para todos los efectos del presente contrato, las partes eligen como domicilio la ciudad donde se otorga el mismo, sometiéndose a la jurisdicción de los tribunales competentes de la República Dominicana.`,
  ];

  for (let i = 0; i < clausulas.length; i++) {
    const lines = doc.splitTextToSize(clausulas[i], maxW - 4);
    if (y + lines.length * 4.5 > 260) {
      doc.addPage();
      y = 25;
    }
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.5 + 3;
  }

  // ── Firmas ───────────────────────────────────────────────
  y = Math.max(y + 10, 220);
  if (y > 240) {
    doc.addPage();
    y = 60;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const firmaY = y + 15;
  // Prestamista
  doc.line(margin, firmaY, margin + 65, firmaY);
  doc.text('EL PRESTAMISTA', margin + 10, firmaY + 5);
  doc.text('JBM RD Préstamos', margin + 8, firmaY + 10);

  // Prestatario
  doc.line(pw - margin - 65, firmaY, pw - margin, firmaY);
  doc.text('EL PRESTATARIO', pw - margin - 55, firmaY + 5);
  doc.text(data.cliente_nombre, pw - margin - 60, firmaY + 10);
  doc.setFontSize(8);
  doc.text(`Cédula: ${data.cliente_cedula}`, pw - margin - 60, firmaY + 14);

  // ── Fecha ────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.text(
    `Firmado en ________________, República Dominicana, a los ${formatDateLong(data.fecha_desembolso)}.`,
    pw / 2,
    firmaY + 25,
    { align: 'center' },
  );

  // Save
  doc.save(`Contrato_${data.numero_prestamo}.pdf`);
}
