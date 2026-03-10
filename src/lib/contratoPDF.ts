import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/format';

export interface ContratoData {
  numero_prestamo: string;
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_direccion: string;
  cliente_telefono: string;
  cliente_cedula_frontal_url?: string;
  cliente_cedula_trasera_url?: string;
  firma_cliente?: string; // base64 data URL from signature pad
  monto_aprobado: number;
  tasa_interes: number;
  plazo_meses: number;
  frecuencia_pago: string;
  metodo_amortizacion: string;
  fecha_desembolso: string;
  fecha_vencimiento: string;
  cuota_estimada: number;
  total_cuotas: number;
  garante?: {
    nombre_completo: string;
    cedula: string;
    telefono: string;
    direccion: string;
    relacion: string;
    lugar_trabajo?: string;
    ingreso_mensual?: number;
  } | null;
  garantia?: {
    tipo: string;
    descripcion: string;
    marca?: string;
    modelo?: string;
    valor_estimado?: number;
    numero_placa?: string;
    numero_chasis?: string;
    numero_serie?: string;
    numero_titulo?: string;
  } | null;
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

  const writeParagraph = (text: string, fontSize = 9) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxW - 4);
    checkPage(lines.length * 4.5 + 3);
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.5 + 3;
  };

  const writeSection = (title: string) => {
    checkPage(15);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
  };

  const writeField = (label: string, value: string, labelW = 55) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label, margin + 4, y);
    doc.setFont('helvetica', 'normal');
    const valLines = doc.splitTextToSize(value, maxW - labelW - 8);
    doc.text(valLines, margin + labelW, y);
    y += Math.max(valLines.length * 5, 6);
  };

  // ═══════════════════════════════════════════════════════════
  // PÁGINA 1: CONTRATO DE PRÉSTAMO
  // ═══════════════════════════════════════════════════════════

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE PRÉSTAMO', pw / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nro. ${data.numero_prestamo}`, pw / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text(`República Dominicana · ${formatDateLong(data.fecha_desembolso)}`, pw / 2, y, { align: 'center' });
  y += 8;
  doc.setDrawColor(100);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // ── SECCIÓN I: PARTES INVOLUCRADAS ──────────────────────
  writeSection('I. PARTES INVOLUCRADAS');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('A) EL ACREEDOR:', margin + 4, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  writeParagraph('JBM RD Préstamos, entidad de intermediación financiera con domicilio en la República Dominicana (en adelante "EL PRESTAMISTA" o "EL ACREEDOR").', 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('B) EL DEUDOR:', margin + 4, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  writeParagraph(`${data.cliente_nombre}, dominicano(a), mayor de edad, portador(a) de la Cédula de Identidad y Electoral No. ${data.cliente_cedula}, con domicilio y residencia en ${data.cliente_direccion || '[dirección registrada en el sistema]'}, teléfono ${data.cliente_telefono} (en adelante "EL PRESTATARIO" o "EL DEUDOR").`, 9);

  if (data.garante) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('C) EL GARANTE / FIADOR SOLIDARIO:', margin + 4, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    writeParagraph(`${data.garante.nombre_completo}, dominicano(a), mayor de edad, portador(a) de la Cédula de Identidad y Electoral No. ${data.garante.cedula}, con domicilio en ${data.garante.direccion || '[dirección registrada]'}, teléfono ${data.garante.telefono}${data.garante.lugar_trabajo ? `, quien labora en ${data.garante.lugar_trabajo}` : ''}${data.garante.ingreso_mensual ? ` con ingresos mensuales de ${formatCurrency(data.garante.ingreso_mensual)}` : ''}, quien interviene en el presente acto en calidad de GARANTE y FIADOR SOLIDARIO (en adelante "EL GARANTE").`, 9);
  }

  // ── SECCIÓN II: CONDICIONES DEL PRÉSTAMO ────────────────
  writeSection('II. CONDICIONES DEL PRÉSTAMO');

  const condiciones: [string, string][] = [
    ['Monto del Préstamo:', formatCurrency(data.monto_aprobado)],
    ['Tasa de Interés:', `${data.tasa_interes}% mensual`],
    ['Plazo:', `${data.plazo_meses} meses`],
    ['Número de Cuotas:', `${data.total_cuotas} cuotas ${frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago}es y consecutivas`],
    ['Frecuencia de Pago:', frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago],
    ['Método de Amortización:', metodoLabel[data.metodo_amortizacion] ?? data.metodo_amortizacion],
    ['Cuota Estimada:', formatCurrency(data.cuota_estimada)],
    ['Fecha de Desembolso:', formatDateLong(data.fecha_desembolso)],
    ['Fecha de Vencimiento:', formatDateLong(data.fecha_vencimiento)],
  ];

  doc.setFontSize(10);
  for (const [label, value] of condiciones) {
    checkPage(7);
    writeField(label, value);
  }
  y += 2;

  // ── SECCIÓN III: GARANTÍA SOLIDARIA ─────────────────────
  if (data.garante) {
    writeSection('III. GARANTÍA SOLIDARIA');
    writeParagraph(`${data.garante.nombre_completo}, identificado(a) con Cédula No. ${data.garante.cedula}, se constituye voluntariamente como GARANTE y FIADOR SOLIDARIO del presente préstamo, comprometiéndose de forma irrevocable a pagar la TOTALIDAD de la deuda, incluyendo capital, intereses, moras y cualquier otro cargo derivado del presente contrato, en caso de que EL DEUDOR principal no cumpla con sus obligaciones de pago.`, 9);
    writeParagraph('EL GARANTE renuncia expresamente a los beneficios de ORDEN, EXCUSIÓN y DIVISIÓN establecidos en los artículos 2021 y siguientes del Código Civil de la República Dominicana, facultando a EL PRESTAMISTA a perseguir el cobro directamente contra el garante sin necesidad de agotar previamente las acciones contra el deudor principal.', 9);
    writeParagraph(`Relación con el deudor: ${data.garante.relacion || 'No especificada'}.`, 9);
  }

  // ── SECCIÓN IV: GARANTÍA PRENDARIA ──────────────────────
  if (data.garantia) {
    writeSection(data.garante ? 'IV. GARANTÍA PRENDARIA' : 'III. GARANTÍA PRENDARIA');
    writeParagraph(`EL PRESTATARIO deja en garantía prendaria el siguiente bien, el cual no podrá ser enajenado, trasladado ni gravado mientras subsista la deuda:`, 9);

    const gaInfo: [string, string][] = [
      ['Tipo de Bien:', data.garantia.tipo],
      ['Descripción:', data.garantia.descripcion],
    ];
    if (data.garantia.marca) gaInfo.push(['Marca / Modelo:', `${data.garantia.marca} ${data.garantia.modelo ?? ''}`]);
    if (data.garantia.numero_placa) gaInfo.push(['Número de Placa:', data.garantia.numero_placa]);
    if (data.garantia.numero_chasis) gaInfo.push(['Número de Chasis:', data.garantia.numero_chasis]);
    if (data.garantia.numero_serie) gaInfo.push(['Número de Serie:', data.garantia.numero_serie]);
    if (data.garantia.numero_titulo) gaInfo.push(['Título de Propiedad:', data.garantia.numero_titulo]);
    if (data.garantia.valor_estimado) gaInfo.push(['Valor Estimado:', formatCurrency(data.garantia.valor_estimado)]);

    doc.setFontSize(10);
    for (const [l, v] of gaInfo) {
      checkPage(7);
      writeField(l, v, 50);
    }
    y += 2;
  }

  // ── SECCIÓN: CLÁUSULAS ──────────────────────────────────
  const clausulaSection = data.garante && data.garantia ? 'V' : data.garante || data.garantia ? 'IV' : 'III';
  writeSection(`${clausulaSection}. CLÁUSULAS Y CONDICIONES`);

  const clausulas = [
    `PRIMERA (OBJETO DEL CONTRATO): Por medio del presente acto, EL PRESTAMISTA entrega a EL PRESTATARIO la suma de ${formatCurrency(data.monto_aprobado)} (${numberToWords(data.monto_aprobado)} pesos dominicanos) en calidad de préstamo de consumo, conforme a lo establecido en los artículos 1892 y siguientes del Código Civil de la República Dominicana. EL PRESTATARIO declara haber recibido dicha suma a su entera satisfacción en la fecha de firma del presente contrato.`,

    `SEGUNDA (FORMA Y PLAZO DE PAGO): EL PRESTATARIO se obliga a devolver el préstamo en ${data.total_cuotas} cuotas de frecuencia ${frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago}, consecutivas e ininterrumpidas, por un monto estimado de ${formatCurrency(data.cuota_estimada)} cada una, comprendiendo capital e intereses. Los pagos deberán efectuarse puntualmente en las fechas estipuladas en el cronograma de pagos anexo al presente contrato, el cual forma parte integral e indivisible del mismo.`,

    `TERCERA (TASA DE INTERÉS): La tasa de interés convencional aplicable al presente préstamo es del ${data.tasa_interes}% mensual, calculada mediante el método de ${metodoLabel[data.metodo_amortizacion] ?? data.metodo_amortizacion} sobre el saldo del capital adeudado. Esta tasa se encuentra dentro de los límites establecidos por la Ley Monetaria y Financiera No. 183-02 y sus modificaciones.`,

    `CUARTA (MORA E INTERESES MORATORIOS): En caso de que EL PRESTATARIO incurra en mora en el pago de cualquier cuota a su fecha de vencimiento, se aplicará un recargo por mora equivalente al cinco por ciento (5%) del monto de la cuota vencida por cada período de atraso, además de los intereses moratorios de conformidad con el artículo 1153 del Código Civil Dominicano. La mora se producirá de pleno derecho por el solo vencimiento del plazo, sin necesidad de intimación, puesta en mora ni requerimiento alguno, conforme al artículo 1139 del Código Civil.`,

    `QUINTA (PAGOS ANTICIPADOS Y ABONOS EXTRAORDINARIOS): EL PRESTATARIO tendrá derecho a realizar abonos extraordinarios al capital o pagos anticipados totales del saldo adeudado en cualquier momento, sin penalidad alguna. Dichos pagos se imputarán directamente al saldo del capital pendiente, recalculándose las cuotas restantes conforme corresponda.`,

    `SEXTA (VENCIMIENTO ANTICIPADO Y CLÁUSULA ACELERATORIA): El incumplimiento en el pago de tres (3) cuotas consecutivas o cinco (5) alternas dará derecho a EL PRESTAMISTA a declarar de pleno derecho vencido anticipadamente el plazo total del préstamo, haciéndose exigible de inmediato la totalidad del saldo pendiente de capital, intereses devengados, intereses moratorios y cualquier otro cargo derivado del presente contrato, sin necesidad de resolución judicial previa.`,

    `SÉPTIMA (DECLARACIONES DEL PRESTATARIO): EL PRESTATARIO declara bajo fe de juramento que: a) La información proporcionada para la obtención de este préstamo es verídica y comprobable; b) Los fondos serán utilizados para fines lícitos; c) No se encuentra en estado de insolvencia ni sujeto a procedimiento alguno de quiebra o liquidación; d) Cuenta con capacidad legal plena para obligarse mediante el presente contrato.`,

    `OCTAVA (CESIÓN DE DERECHOS): EL PRESTAMISTA se reserva el derecho de ceder, total o parcialmente, los derechos emanados del presente contrato a terceros, sin necesidad de consentimiento previo de EL PRESTATARIO, quedando obligado únicamente a notificarle de dicha cesión.`,

    `NOVENA (GASTOS Y COSTAS): Todos los gastos, honorarios, costas y demás erogaciones que se generen como consecuencia del cobro judicial o extrajudicial de las obligaciones derivadas del presente contrato correrán por cuenta exclusiva de EL PRESTATARIO, incluyendo los honorarios de abogado fijados conforme a la Ley 302 sobre Honorarios de Abogados.`,

    `DÉCIMA (JURISDICCIÓN Y COMPETENCIA): Para todos los efectos legales derivados del presente contrato, las partes eligen como domicilio la ciudad donde se otorga el mismo, sometiéndose irrevocablemente a la jurisdicción y competencia de los tribunales ordinarios de la República Dominicana. Las partes renuncian expresamente a cualquier otro fuero o jurisdicción que pudiera corresponderles.`,

    `DÉCIMA PRIMERA (PROTECCIÓN DE DATOS): De conformidad con la Ley No. 172-13 sobre Protección de Datos Personales, EL PRESTATARIO autoriza expresamente a EL PRESTAMISTA a almacenar, procesar y utilizar sus datos personales y financieros para los fines relacionados con el presente contrato y la gestión crediticia.`,
  ];

  if (data.garante) {
    clausulas.push(
      `DÉCIMA SEGUNDA (FIANZA SOLIDARIA E INDIVISIBLE): ${data.garante.nombre_completo}, portador(a) de la Cédula de Identidad y Electoral No. ${data.garante.cedula}${data.garante.lugar_trabajo ? `, quien labora en ${data.garante.lugar_trabajo}` : ''}${data.garante.ingreso_mensual ? ` con ingresos mensuales declarados de ${formatCurrency(data.garante.ingreso_mensual)}` : ''}, se constituye voluntariamente como FIADOR SOLIDARIO e INDIVISIBLE de todas y cada una de las obligaciones pecuniarias derivadas del presente contrato, incluyendo capital, intereses convencionales, intereses moratorios, recargos por mora, gastos de cobranza, costas y honorarios de abogado. EL GARANTE renuncia expresamente e irrevocablemente a los beneficios de ORDEN, EXCUSIÓN y DIVISIÓN establecidos en los artículos 2021, 2022 y 2026 del Código Civil de la República Dominicana, facultando a EL PRESTAMISTA a dirigir sus acciones de cobro directa e indistintamente contra EL DEUDOR principal, contra EL GARANTE, o contra ambos simultáneamente, por la totalidad de la deuda. La presente fianza subsistirá hasta la cancelación total y definitiva de todas las obligaciones garantizadas. Relación con el deudor: ${data.garante.relacion || 'No especificada'}.`,
    );
  }

  if (data.garantia) {
    const tipoGarantia = data.garantia.tipo?.toLowerCase();
    const esVehiculo = tipoGarantia === 'vehiculo' || tipoGarantia === 'vehículo' || tipoGarantia === 'motocicleta';
    const esInmueble = tipoGarantia === 'inmueble' || tipoGarantia === 'vivienda' || tipoGarantia === 'terreno';
    
    let clausulaGarantia = '';
    
    if (esVehiculo) {
      clausulaGarantia = `CLÁUSULA DE GARANTÍA PRENDARIA SOBRE VEHÍCULO: EL PRESTATARIO constituye prenda sin desapoderamiento, conforme a la Ley No. 6186 de Fomento Agrícola y sus aplicaciones análogas, sobre el vehículo descrito en la sección correspondiente del presente contrato${data.garantia.numero_placa ? ` (Placa: ${data.garantia.numero_placa})` : ''}${data.garantia.numero_chasis ? ` (Chasis: ${data.garantia.numero_chasis})` : ''}, con valor estimado de ${data.garantia.valor_estimado ? formatCurrency(data.garantia.valor_estimado) : 'valor por determinar'}. EL PRESTATARIO se obliga a: a) No enajenar, gravar, traspasar ni disponer del vehículo mientras subsista la deuda; b) Mantener el vehículo en buen estado de conservación y funcionamiento; c) Mantener vigente el seguro del vehículo durante la vigencia del contrato; d) Permitir la inspección del bien por parte de EL PRESTAMISTA cuando este lo requiera. En caso de incumplimiento de las obligaciones de pago, EL PRESTAMISTA queda irrevocablemente autorizado a tomar posesión del vehículo y proceder a su venta o adjudicación para cubrir la totalidad de la deuda pendiente, incluyendo capital, intereses, mora y gastos de ejecución, conforme a la legislación vigente.`;
    } else if (esInmueble) {
      clausulaGarantia = `CLÁUSULA DE GARANTÍA HIPOTECARIA: EL PRESTATARIO constituye hipoteca convencional sobre el inmueble descrito en la sección correspondiente del presente contrato, con valor estimado de ${data.garantia.valor_estimado ? formatCurrency(data.garantia.valor_estimado) : 'valor por determinar'}${data.garantia.numero_titulo ? ` (Título de Propiedad No. ${data.garantia.numero_titulo})` : ''}. Dicha hipoteca se rige por las disposiciones de la Ley 108-05 de Registro Inmobiliario y el Código Civil Dominicano. EL PRESTATARIO se obliga a: a) No enajenar, gravar ni disponer del inmueble sin consentimiento previo y escrito de EL PRESTAMISTA; b) Mantener el inmueble en buen estado de conservación; c) Pagar puntualmente los impuestos y cargas que graven el inmueble. En caso de incumplimiento, EL PRESTAMISTA podrá ejecutar la garantía conforme al procedimiento de embargo inmobiliario establecido en la Ley 108-05 y disposiciones aplicables del Código de Procedimiento Civil.`;
    } else {
      clausulaGarantia = `CLÁUSULA DE GARANTÍA PRENDARIA: EL PRESTATARIO constituye prenda sin desapoderamiento sobre el bien descrito en la sección correspondiente de este contrato (${data.garantia.tipo}: ${data.garantia.descripcion}), con valor estimado de ${data.garantia.valor_estimado ? formatCurrency(data.garantia.valor_estimado) : 'valor por determinar'}. Dicho bien no podrá ser enajenado, gravado, trasladado ni modificado mientras subsista la deuda. EL PRESTATARIO se obliga a conservar el bien en perfecto estado y permitir su inspección por EL PRESTAMISTA. En caso de incumplimiento de las obligaciones de pago, EL PRESTAMISTA queda autorizado a ejecutar la garantía conforme a la legislación dominicana vigente, aplicando el producto de la venta o adjudicación al pago total de la deuda pendiente.`;
    }
    
    clausulas.push(clausulaGarantia);
  }

  doc.setFont('helvetica', 'normal');
  for (const c of clausulas) {
    writeParagraph(c, 9);
  }

  // ── SECCIÓN: DOCUMENTACIÓN REQUERIDA ────────────────────
  const docSection = getNextSection(clausulaSection);
  writeSection(`${docSection}. DOCUMENTACIÓN`);
  writeParagraph('Para la formalización del presente contrato, las partes han presentado la siguiente documentación:', 9);

  const docs = [
    `• Cédula de Identidad y Electoral del Deudor: ${data.cliente_cedula}`,
  ];
  if (data.garante) {
    docs.push(`• Cédula de Identidad y Electoral del Garante: ${data.garante.cedula}`);
  }
  if (data.garantia) {
    docs.push(`• Documentos del bien dado en garantía (${data.garantia.tipo}: ${data.garantia.descripcion})`);
  }
  docs.push('• Documentos que demuestren solvencia económica de las partes');

  for (const d of docs) {
    checkPage(6);
    doc.setFontSize(9);
    doc.text(d, margin + 4, y);
    y += 5;
  }
  y += 3;

  // ── SECCIÓN: LEGALIZACIÓN ───────────────────────────────
  const legSection = getNextSection(docSection);
  writeSection(`${legSection}. LEGALIZACIÓN`);
  writeParagraph('El presente contrato deberá ser legalizado ante un Notario Público de la República Dominicana para tener plena validez legal y fuerza ejecutoria conforme a las leyes dominicanas vigentes. Los gastos de legalización y registro correrán por cuenta de EL PRESTATARIO, salvo acuerdo en contrario.', 9);

  // ── FIRMAS ──────────────────────────────────────────────
  checkPage(55);
  y = Math.max(y + 10, y);
  doc.setDrawColor(100);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Las partes declaran haber leído y comprendido el contenido íntegro de este contrato, firmando en señal de conformidad.', pw / 2, y, { align: 'center' });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const firmaY = y + 15;

  // Firma Prestamista
  doc.line(margin, firmaY, margin + 65, firmaY);
  doc.text('EL PRESTAMISTA / ACREEDOR', margin + 2, firmaY + 5);
  doc.text('JBM RD Préstamos', margin + 2, firmaY + 10);

  // Firma Deudor
  if (data.firma_cliente) {
    try {
      doc.addImage(data.firma_cliente, 'PNG', pw - margin - 65, firmaY - 20, 65, 20);
    } catch { /* ignore */ }
  }
  doc.line(pw - margin - 65, firmaY, pw - margin, firmaY);
  doc.text('EL PRESTATARIO / DEUDOR', pw - margin - 63, firmaY + 5);
  doc.text(data.cliente_nombre, pw - margin - 63, firmaY + 10);
  doc.setFontSize(8);
  doc.text(`Cédula: ${data.cliente_cedula}`, pw - margin - 63, firmaY + 14);

  // Firma Garante
  if (data.garante) {
    const gFirmaY = firmaY + 28;
    checkPage(30);
    doc.line(pw / 2 - 35, gFirmaY, pw / 2 + 35, gFirmaY);
    doc.setFontSize(10);
    doc.text('EL GARANTE / FIADOR SOLIDARIO', pw / 2, gFirmaY + 5, { align: 'center' });
    doc.text(data.garante.nombre_completo, pw / 2, gFirmaY + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Cédula: ${data.garante.cedula}`, pw / 2, gFirmaY + 14, { align: 'center' });
  }

  // Fecha y lugar
  doc.setFontSize(9);
  const footerY = data.garante ? firmaY + 48 : firmaY + 28;
  checkPage(10);
  doc.text(
    `Hecho y firmado en ________________, República Dominicana, a los ${formatDateLong(data.fecha_desembolso)}.`,
    pw / 2,
    Math.min(footerY, ph - 15),
    { align: 'center' },
  );

  // Espacio para notario
  const notY = Math.min(footerY + 12, ph - 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Espacio reservado para legalización notarial:', margin, notY);
  doc.line(margin, notY + 15, pw - margin, notY + 15);
  doc.text('Firma y Sello del Notario Público', pw / 2, notY + 20, { align: 'center' });

  // ═══════════════════════════════════════════════════════════
  // PÁGINA SEPARADA: CRONOGRAMA DE PAGOS
  // ═══════════════════════════════════════════════════════════
  if (data.cuotas && data.cuotas.length > 0) {
    doc.addPage();
    y = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CRONOGRAMA DE PAGOS', pw / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Préstamo: ${data.numero_prestamo} | Cliente: ${data.cliente_nombre} (${data.cliente_cedula})`, pw / 2, y, { align: 'center' });
    y += 5;
    doc.text(`Monto: ${formatCurrency(data.monto_aprobado)} | Tasa: ${data.tasa_interes}% | Plazo: ${data.plazo_meses} meses | Frecuencia: ${frecLabel[data.frecuencia_pago] ?? data.frecuencia_pago}`, pw / 2, y, { align: 'center' });
    y += 7;
    doc.setDrawColor(150);
    doc.line(margin, y, pw - margin, y);
    y += 5;

    // Table columns
    const cols = [
      { label: '#', x: margin },
      { label: 'Fecha de Pago', x: margin + 12 },
      { label: 'Capital', x: margin + 45 },
      { label: 'Interés', x: margin + 75 },
      { label: 'Total Cuota', x: margin + 105 },
      { label: 'Saldo Pendiente', x: margin + 135 },
    ];

    const drawTableHeader = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, y - 3.5, maxW, 6, 'F');
      cols.forEach((c) => doc.text(c.label, c.x + 1, y));
      y += 6;
      doc.setFont('helvetica', 'normal');
    };

    drawTableHeader();

    let totalCapital = 0, totalInteres = 0, totalCuota = 0;

    for (const cuota of data.cuotas) {
      if (y > ph - 25) {
        doc.addPage();
        y = 20;
        drawTableHeader();
      }

      totalCapital += cuota.capital;
      totalInteres += cuota.interes;
      totalCuota += cuota.monto_cuota;

      doc.setFontSize(7.5);
      const fv = new Date(cuota.fecha_vencimiento).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.text(String(cuota.numero_cuota), cols[0].x + 1, y);
      doc.text(fv, cols[1].x + 1, y);
      doc.text(formatCurrency(cuota.capital), cols[2].x + 1, y);
      doc.text(formatCurrency(cuota.interes), cols[3].x + 1, y);
      doc.text(formatCurrency(cuota.monto_cuota), cols[4].x + 1, y);
      doc.text(formatCurrency(cuota.saldo_pendiente), cols[5].x + 1, y);
      y += 4.5;
    }

    // Totals
    y += 3;
    doc.setDrawColor(150);
    doc.line(margin, y - 2, pw - margin, y - 2);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALES', cols[0].x + 1, y);
    doc.text(formatCurrency(totalCapital), cols[2].x + 1, y);
    doc.text(formatCurrency(totalInteres), cols[3].x + 1, y);
    doc.text(formatCurrency(totalCuota), cols[4].x + 1, y);
    y += 8;

    // Fecha de finalización
    const lastCuota = data.cuotas[data.cuotas.length - 1];
    const fechaFin = new Date(lastCuota.fecha_vencimiento).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha de finalización del préstamo: ${fechaFin}`, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Este cronograma forma parte integral del contrato de préstamo y tiene carácter vinculante para las partes.', margin, y);
    y += 12;

    // Firmas en cronograma
    checkPage(25);
    doc.setFontSize(9);
    const cFirmaY = y + 10;
    doc.line(margin, cFirmaY, margin + 60, cFirmaY);
    doc.text('EL PRESTAMISTA', margin + 10, cFirmaY + 5);

    doc.line(pw - margin - 60, cFirmaY, pw - margin, cFirmaY);
    doc.text('EL PRESTATARIO', pw - margin - 50, cFirmaY + 5);
    doc.text(data.cliente_nombre, pw - margin - 55, cFirmaY + 10);
  }

  // ═══════════════════════════════════════════════════════════
  // PÁGINA: DOCUMENTO DE IDENTIDAD DEL CLIENTE
  // ═══════════════════════════════════════════════════════════
  if (data.cliente_cedula_frontal_url || data.cliente_cedula_trasera_url) {
    doc.addPage();
    let iy = 25;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENTO DE IDENTIDAD DEL CLIENTE', pw / 2, iy, { align: 'center' });
    iy += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.cliente_nombre} — Cédula: ${data.cliente_cedula}`, pw / 2, iy, { align: 'center' });
    iy += 10;

    const imgW = 140;
    const imgH = 90;

    if (data.cliente_cedula_frontal_url) {
      try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Frente', pw / 2, iy, { align: 'center' });
        iy += 5;
        doc.addImage(data.cliente_cedula_frontal_url, 'JPEG', (pw - imgW) / 2, iy, imgW, imgH);
        iy += imgH + 10;
      } catch {
        doc.setFontSize(9);
        doc.text('[No se pudo cargar la imagen frontal]', pw / 2, iy, { align: 'center' });
        iy += 10;
      }
    }

    if (data.cliente_cedula_trasera_url) {
      try {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Reverso', pw / 2, iy, { align: 'center' });
        iy += 5;
        doc.addImage(data.cliente_cedula_trasera_url, 'JPEG', (pw - imgW) / 2, iy, imgW, imgH);
        iy += imgH + 10;
      } catch {
        doc.setFontSize(9);
        doc.text('[No se pudo cargar la imagen trasera]', pw / 2, iy, { align: 'center' });
        iy += 10;
      }
    }
  }

  doc.save(`Contrato_${data.numero_prestamo}.pdf`);
}

// Helper: convert number to basic Spanish words for contract
function numberToWords(n: number): string {
  const int = Math.floor(n);
  if (int === 0) return 'cero';
  const formatted = int.toLocaleString('es-DO');
  return formatted;
}

// Helper: get next roman-ish section number
function getNextSection(current: string): string {
  const map: Record<string, string> = {
    'III': 'IV', 'IV': 'V', 'V': 'VI', 'VI': 'VII', 'VII': 'VIII', 'VIII': 'IX',
  };
  return map[current] ?? 'IX';
}
