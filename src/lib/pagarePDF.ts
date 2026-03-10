import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/format';

export interface PagareData {
  numero_prestamo: string;
  lugar: string; // ciudad donde se firma
  fecha_emision: string;
  fecha_vencimiento: string;
  monto: number;
  tasa_interes: number;
  plazo_meses: number;
  frecuencia_pago: string;
  total_cuotas: number;
  cuota_estimada: number;
  deudor_nombre: string;
  deudor_cedula: string;
  deudor_direccion: string;
  deudor_telefono: string;
  deudor_nacionalidad?: string;
  deudor_estado_civil?: string;
  garante?: {
    nombre_completo: string;
    cedula: string;
    direccion: string;
    telefono: string;
  } | null;
  firma_cliente?: string;
}

function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function numberToWordsBasic(n: number): string {
  const int = Math.floor(n);
  if (int === 0) return 'cero';
  return int.toLocaleString('es-DO');
}

export function generarPagarePDF(data: PagareData) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 25;
  const maxW = pw - margin * 2;
  let y = 30;

  const checkPage = (need: number) => {
    if (y + need > ph - 25) { doc.addPage(); y = 30; }
  };

  const writeParagraph = (text: string, fontSize = 10, indent = 0) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxW - indent);
    checkPage(lines.length * 5 + 3);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5 + 3;
  };

  // ═══════════════════════════════════════════════════════════
  // ENCABEZADO
  // ═══════════════════════════════════════════════════════════
  
  // Border decorativo
  doc.setDrawColor(50, 50, 80);
  doc.setLineWidth(1.5);
  doc.rect(15, 12, pw - 30, ph - 24);
  doc.setLineWidth(0.3);
  doc.rect(17, 14, pw - 34, ph - 28);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PAGARÉ NOTARIAL', pw / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('A LA ORDEN', pw / 2, y, { align: 'center' });
  y += 6;

  doc.setDrawColor(100);
  doc.setLineWidth(0.5);
  doc.line(margin + 30, y, pw - margin - 30, y);
  y += 8;

  // Datos de referencia
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`No. Referencia: ${data.numero_prestamo}`, margin, y);
  doc.text(`Monto: ${formatCurrency(data.monto)}`, pw - margin, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Lugar: ${data.lugar || 'República Dominicana'}`, margin, y);
  doc.text(`Fecha: ${formatDateLong(data.fecha_emision)}`, pw - margin, y, { align: 'right' });
  y += 10;

  // ═══════════════════════════════════════════════════════════
  // CUERPO DEL PAGARÉ
  // ═══════════════════════════════════════════════════════════

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VALE POR:', margin, y);
  doc.setFontSize(14);
  doc.text(` ${formatCurrency(data.monto)}`, margin + 25, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`(${numberToWordsBasic(data.monto)} pesos dominicanos con 00/100)`, margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');

  writeParagraph(
    `Yo, ${data.deudor_nombre}, ${data.deudor_nacionalidad || 'dominicano(a)'}, mayor de edad, ${data.deudor_estado_civil || ''}, portador(a) de la Cédula de Identidad y Electoral No. ${data.deudor_cedula}, con domicilio y residencia en ${data.deudor_direccion || '[dirección registrada]'}, teléfono ${data.deudor_telefono}, por medio del presente PAGARÉ A LA ORDEN me comprometo incondicional e irrevocablemente a pagar a JBM RD Préstamos, o a su orden, la suma de ${formatCurrency(data.monto)} (${numberToWordsBasic(data.monto)} PESOS DOMINICANOS), valor recibido a mi entera satisfacción.`,
    10
  );

  // Condiciones de pago
  checkPage(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CONDICIONES DE PAGO:', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');

  const frecLabel: Record<string, string> = {
    diaria: 'diarias', semanal: 'semanales', quincenal: 'quincenales', mensual: 'mensuales',
  };

  writeParagraph(
    `El presente pagaré será pagado en ${data.total_cuotas} cuotas ${frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago}, consecutivas e ininterrumpidas de ${formatCurrency(data.cuota_estimada)} cada una, que comprenden capital e intereses, comenzando el primer pago en la fecha indicada en el cronograma de pagos del contrato de préstamo No. ${data.numero_prestamo}.`,
    10
  );

  writeParagraph(
    `La tasa de interés convencional pactada es del ${data.tasa_interes}% mensual sobre el saldo deudor. La fecha de vencimiento total del presente pagaré es el ${formatDateLong(data.fecha_vencimiento)}.`,
    10
  );

  // Cláusulas legales
  checkPage(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ESTIPULACIONES LEGALES:', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');

  const estipulaciones = [
    `PRIMERO: En caso de falta de pago a la fecha de vencimiento de cualquier cuota, el suscriptor incurrirá en mora de pleno derecho, sin necesidad de intimación, requerimiento ni puesta en mora alguna, de conformidad con el artículo 1139 del Código Civil de la República Dominicana, generándose intereses moratorios adicionales a los convencionales pactados.`,

    `SEGUNDO: El incumplimiento de tres (3) cuotas consecutivas o cinco (5) alternas producirá el vencimiento anticipado de la totalidad del presente pagaré, haciéndose exigible de inmediato el saldo total de capital, intereses devengados, intereses moratorios y cualquier recargo, pudiendo el tenedor legítimo de este pagaré iniciar las acciones ejecutorias que correspondan.`,

    `TERCERO: El presente pagaré tiene fuerza ejecutoria y constituye título ejecutivo, conforme a las disposiciones del artículo 1er de la Ley No. 845 del 15 de julio de 1978 sobre Ventas Condicionales de Muebles y al Código de Procedimiento Civil de la República Dominicana, pudiendo ser ejecutado por vía de embargo ejecutivo sin necesidad de obtener sentencia previa.`,

    `CUARTO: El suscriptor renuncia expresamente al beneficio de domicilio, sometiéndose a la jurisdicción y competencia de los tribunales del lugar donde sea presentado para su cobro. Asimismo, renuncia al beneficio de cualquier plazo de gracia y acepta que todos los gastos judiciales, extrajudiciales, honorarios de abogado y costas procesales que se generen por el cobro de este pagaré serán de su exclusiva cuenta y cargo.`,

    `QUINTO: El presente pagaré es indivisible, negociable, transferible por endoso y se rige por las disposiciones del Código de Comercio de la República Dominicana y demás leyes aplicables a los instrumentos de crédito y títulos valores.`,
  ];

  for (const e of estipulaciones) {
    writeParagraph(e, 9, 2);
  }

  // Aval / Garante
  if (data.garante) {
    checkPage(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('AVAL:', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');

    writeParagraph(
      `Yo, ${data.garante.nombre_completo}, portador(a) de la Cédula de Identidad y Electoral No. ${data.garante.cedula}, con domicilio en ${data.garante.direccion || '[dirección registrada]'}, teléfono ${data.garante.telefono}, por medio del presente acto me constituyo en AVALISTA y FIADOR SOLIDARIO del pagaré que antecede por la totalidad de su importe. Renuncio expresamente a los beneficios de orden, excusión y división consagrados en los artículos 2021 y siguientes del Código Civil Dominicano, aceptando responder solidaria e indivisiblemente por el pago total de la obligación, incluyendo capital, intereses, mora, gastos y costas, como si fuera el deudor principal.`,
      10
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FIRMAS
  // ═══════════════════════════════════════════════════════════
  checkPage(60);
  y += 5;
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Firmado libre y voluntariamente, sin vicios del consentimiento, en señal de aceptación y conformidad.', pw / 2, y, { align: 'center' });
  y += 15;

  const firmaY = y + 15;

  // Firma del suscriptor (deudor)
  if (data.firma_cliente) {
    try {
      doc.addImage(data.firma_cliente, 'PNG', margin, firmaY - 20, 65, 20);
    } catch { /* ignore */ }
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.line(margin, firmaY, margin + 70, firmaY);
  doc.text('EL SUSCRIPTOR (DEUDOR)', margin + 5, firmaY + 5);
  doc.setFontSize(9);
  doc.text(data.deudor_nombre, margin + 2, firmaY + 10);
  doc.setFontSize(8);
  doc.text(`Cédula: ${data.deudor_cedula}`, margin + 2, firmaY + 14);

  // Firma del beneficiario
  doc.setFontSize(10);
  doc.line(pw - margin - 70, firmaY, pw - margin, firmaY);
  doc.text('EL BENEFICIARIO', pw - margin - 60, firmaY + 5);
  doc.setFontSize(9);
  doc.text('JBM RD Préstamos', pw - margin - 65, firmaY + 10);

  // Firma del avalista
  if (data.garante) {
    const avFirmaY = firmaY + 28;
    checkPage(25);
    doc.setFontSize(10);
    doc.line(pw / 2 - 35, avFirmaY, pw / 2 + 35, avFirmaY);
    doc.text('EL AVALISTA / FIADOR SOLIDARIO', pw / 2, avFirmaY + 5, { align: 'center' });
    doc.setFontSize(9);
    doc.text(data.garante.nombre_completo, pw / 2, avFirmaY + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Cédula: ${data.garante.cedula}`, pw / 2, avFirmaY + 14, { align: 'center' });
  }

  // Espacio notarial
  const notarioY = data.garante ? firmaY + 50 : firmaY + 30;
  checkPage(35);
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(margin, notarioY, pw - margin, notarioY);

  let ny = notarioY + 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICACIÓN NOTARIAL', pw / 2, ny, { align: 'center' });
  ny += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const notarialText = `Certifico y doy fe que las firmas que anteceden fueron estampadas en mi presencia por las personas arriba identificadas, quienes me han exhibido sus respectivas Cédulas de Identidad y Electoral, declarando actuar libre y voluntariamente.`;
  const notLines = doc.splitTextToSize(notarialText, maxW - 10);
  doc.text(notLines, margin + 5, ny);
  ny += notLines.length * 4 + 8;

  doc.text(`En la ciudad de __________________, República Dominicana,`, margin + 5, ny);
  ny += 5;
  doc.text(`a los ______ días del mes de __________________ del año ________.`, margin + 5, ny);
  ny += 15;

  doc.line(pw / 2 - 35, ny, pw / 2 + 35, ny);
  ny += 5;
  doc.setFontSize(9);
  doc.text('Firma y Sello del Notario Público', pw / 2, ny, { align: 'center' });
  ny += 4;
  doc.setFontSize(7);
  doc.text('Nombre: ________________________________', pw / 2, ny, { align: 'center' });
  ny += 4;
  doc.text('Matrícula: ______________________________', pw / 2, ny, { align: 'center' });

  doc.save(`Pagare_${data.numero_prestamo}.pdf`);
}
