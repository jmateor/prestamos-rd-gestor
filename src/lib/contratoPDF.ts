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
  // New: garante & garantia
  garante?: {
    nombre_completo: string;
    cedula: string;
    telefono: string;
    direccion: string;
    relacion: string;
  } | null;
  garantia?: {
    tipo: string;
    descripcion: string;
    marca?: string;
    modelo?: string;
    valor_estimado?: number;
    numero_placa?: string;
    numero_chasis?: string;
  } | null;
  // Cronograma de cuotas
  cuotas?: {
    numero_cuota: number;
    fecha_vencimiento: string;
    capital: number;
    interes: number;
    monto_cuota: number;
    saldo_pendiente: number;
  }[];
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
  const ph = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxW = pw - margin * 2;
  let y = 25;

  const checkPage = (need: number) => {
    if (y + need > ph - 20) { doc.addPage(); y = 25; }
  };

  // ── Header ───────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE PRÉSTAMO', pw / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nro. ${data.numero_prestamo}`, pw / 2, y, { align: 'center' });
  y += 10;

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
  checkPage(60);
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

  // ── Garante ──────────────────────────────────────────────
  if (data.garante) {
    checkPage(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('GARANTE PERSONAL', margin, y);
    y += 7;
    doc.setFontSize(10);

    const gInfo = [
      ['Nombre:', data.garante.nombre_completo],
      ['Cédula:', data.garante.cedula],
      ['Teléfono:', data.garante.telefono],
      ['Dirección:', data.garante.direccion || '—'],
      ['Relación:', data.garante.relacion || '—'],
    ];
    for (const [l, v] of gInfo) {
      doc.setFont('helvetica', 'bold');
      doc.text(l, margin + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v, margin + 40, y);
      y += 6;
    }
    y += 4;
  }

  // ── Garantía Prendaria ───────────────────────────────────
  if (data.garantia) {
    checkPage(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('GARANTÍA PRENDARIA', margin, y);
    y += 7;
    doc.setFontSize(10);

    const gaInfo: [string, string][] = [
      ['Tipo:', data.garantia.tipo],
      ['Descripción:', data.garantia.descripcion],
    ];
    if (data.garantia.marca) gaInfo.push(['Marca/Modelo:', `${data.garantia.marca} ${data.garantia.modelo ?? ''}`]);
    if (data.garantia.numero_placa) gaInfo.push(['Placa:', data.garantia.numero_placa]);
    if (data.garantia.numero_chasis) gaInfo.push(['Chasis:', data.garantia.numero_chasis]);
    if (data.garantia.valor_estimado) gaInfo.push(['Valor Estimado:', formatCurrency(data.garantia.valor_estimado)]);

    for (const [l, v] of gaInfo) {
      doc.setFont('helvetica', 'bold');
      doc.text(l, margin + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v, margin + 45, y);
      y += 6;
    }
    y += 4;
  }

  // ── Cláusulas ────────────────────────────────────────────
  checkPage(30);
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

  if (data.garante) {
    clausulas.push(`OCTAVA: ${data.garante.nombre_completo}, portador(a) de la cédula No. ${data.garante.cedula}, se constituye como GARANTE SOLIDARIO del presente préstamo, obligándose al cumplimiento total de las obligaciones aquí pactadas en caso de incumplimiento del PRESTATARIO.`);
  }

  if (data.garantia) {
    clausulas.push(`${data.garante ? 'NOVENA' : 'OCTAVA'}: EL PRESTATARIO deja en garantía prendaria el bien descrito como "${data.garantia.descripcion}" (${data.garantia.tipo}), con valor estimado de ${data.garantia.valor_estimado ? formatCurrency(data.garantia.valor_estimado) : 'no especificado'}, el cual no podrá ser enajenado ni gravado mientras subsista la deuda.`);
  }

  for (const c of clausulas) {
    const lines = doc.splitTextToSize(c, maxW - 4);
    checkPage(lines.length * 4.5 + 3);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.5 + 3;
  }

  // ── Cronograma de Pagos ──────────────────────────────────
  if (data.cuotas && data.cuotas.length > 0) {
    doc.addPage();
    y = 25;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CRONOGRAMA DE PAGOS', pw / 2, y, { align: 'center' });
    y += 8;

    const cols = [
      { label: '#', x: margin },
      { label: 'Fecha', x: margin + 12 },
      { label: 'Capital', x: margin + 42 },
      { label: 'Interés', x: margin + 72 },
      { label: 'Cuota', x: margin + 100 },
      { label: 'Saldo', x: margin + 130 },
    ];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y - 3, maxW, 6, 'F');
    cols.forEach((c) => doc.text(c.label, c.x + 1, y));
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    for (const cuota of data.cuotas) {
      if (y > ph - 20) { doc.addPage(); y = 25; }
      const fv = new Date(cuota.fecha_vencimiento).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(String(cuota.numero_cuota), cols[0].x + 1, y);
      doc.text(fv, cols[1].x + 1, y);
      doc.text(formatCurrency(cuota.capital), cols[2].x + 1, y);
      doc.text(formatCurrency(cuota.interes), cols[3].x + 1, y);
      doc.text(formatCurrency(cuota.monto_cuota), cols[4].x + 1, y);
      doc.text(formatCurrency(cuota.saldo_pendiente), cols[5].x + 1, y);
      y += 4.5;
    }
  }

  // ── Firmas ───────────────────────────────────────────────
  checkPage(50);
  y = Math.max(y + 15, 200);
  if (y > ph - 50) { doc.addPage(); y = 60; }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const firmaY = y + 15;
  doc.line(margin, firmaY, margin + 65, firmaY);
  doc.text('EL PRESTAMISTA', margin + 10, firmaY + 5);
  doc.text('JBM RD Préstamos', margin + 8, firmaY + 10);

  doc.line(pw - margin - 65, firmaY, pw - margin, firmaY);
  doc.text('EL PRESTATARIO', pw - margin - 55, firmaY + 5);
  doc.text(data.cliente_nombre, pw - margin - 60, firmaY + 10);
  doc.setFontSize(8);
  doc.text(`Cédula: ${data.cliente_cedula}`, pw - margin - 60, firmaY + 14);

  // Garante signature
  if (data.garante) {
    const gFirmaY = firmaY + 25;
    checkPage(30);
    doc.line(pw / 2 - 32, gFirmaY, pw / 2 + 32, gFirmaY);
    doc.setFontSize(10);
    doc.text('EL GARANTE', pw / 2, gFirmaY + 5, { align: 'center' });
    doc.text(data.garante.nombre_completo, pw / 2, gFirmaY + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Cédula: ${data.garante.cedula}`, pw / 2, gFirmaY + 14, { align: 'center' });
  }

  // Date
  doc.setFontSize(9);
  const footerY = data.garante ? firmaY + 45 : firmaY + 25;
  doc.text(
    `Firmado en ________________, República Dominicana, a los ${formatDateLong(data.fecha_desembolso)}.`,
    pw / 2,
    Math.min(footerY, ph - 15),
    { align: 'center' },
  );

  doc.save(`Contrato_${data.numero_prestamo}.pdf`);
}
