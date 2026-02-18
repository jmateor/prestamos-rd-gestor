/**
 * Motor de amortización para préstamos JBM RD
 * Soporta: cuota_fija, interes_simple, saldo_insoluto
 * Frecuencias: diaria, semanal, quincenal, mensual
 */

export interface CuotaCalc {
  numero_cuota: number;
  fecha_vencimiento: Date;
  monto_cuota: number;
  capital: number;
  interes: number;
  saldo_pendiente: number;
}

/** Días entre cuotas según frecuencia */
const DIAS_FRECUENCIA: Record<string, number> = {
  diaria: 1,
  semanal: 7,
  quincenal: 15,
  mensual: 30,
};

/** Número de cuotas totales según frecuencia y plazo en meses */
export function totalCuotas(plazo_meses: number, frecuencia: string): number {
  switch (frecuencia) {
    case 'diaria':    return plazo_meses * 30;
    case 'semanal':   return plazo_meses * 4;
    case 'quincenal': return plazo_meses * 2;
    case 'mensual':   return plazo_meses;
    default:          return plazo_meses;
  }
}

function addDias(date: Date, dias: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + dias);
  return d;
}

function addMes(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function nextFecha(base: Date, n: number, frecuencia: string): Date {
  if (frecuencia === 'mensual') {
    const d = new Date(base);
    d.setMonth(d.getMonth() + n);
    return d;
  }
  return addDias(base, DIAS_FRECUENCIA[frecuencia] * n);
}

/**
 * Cuota Fija (French / annuity)
 * tasa_mensual: tasa mensual en decimal (ej. 0.05 para 5%)
 */
export function calcCuotaFija(
  monto: number,
  tasa_mensual: number,
  plazo_meses: number,
  frecuencia: string,
  fecha_inicio: Date,
): CuotaCalc[] {
  const n = totalCuotas(plazo_meses, frecuencia);
  // Tasa por período
  const tasaPeriodo = tasa_mensual * (DIAS_FRECUENCIA[frecuencia] / 30);
  let cuotaFija: number;
  if (tasaPeriodo === 0) {
    cuotaFija = monto / n;
  } else {
    cuotaFija = (monto * tasaPeriodo * Math.pow(1 + tasaPeriodo, n)) / (Math.pow(1 + tasaPeriodo, n) - 1);
  }

  let saldo = monto;
  const tabla: CuotaCalc[] = [];

  for (let i = 1; i <= n; i++) {
    const interes = round2(saldo * tasaPeriodo);
    const capital = i < n ? round2(cuotaFija - interes) : round2(saldo);
    saldo = round2(saldo - capital);
    tabla.push({
      numero_cuota: i,
      fecha_vencimiento: nextFecha(fecha_inicio, i, frecuencia),
      monto_cuota: round2(capital + interes),
      capital,
      interes,
      saldo_pendiente: Math.max(0, saldo),
    });
  }
  return tabla;
}

/**
 * Interés Simple sobre capital original
 */
export function calcInteresSimple(
  monto: number,
  tasa_mensual: number,
  plazo_meses: number,
  frecuencia: string,
  fecha_inicio: Date,
): CuotaCalc[] {
  const n = totalCuotas(plazo_meses, frecuencia);
  const tasaPeriodo = tasa_mensual * (DIAS_FRECUENCIA[frecuencia] / 30);
  const interesPeriodo = round2(monto * tasaPeriodo);
  const capitalPorCuota = round2(monto / n);
  const cuota = round2(capitalPorCuota + interesPeriodo);

  let saldo = monto;
  return Array.from({ length: n }, (_, idx) => {
    const i = idx + 1;
    const capital = i < n ? capitalPorCuota : round2(saldo);
    saldo = round2(saldo - capital);
    return {
      numero_cuota: i,
      fecha_vencimiento: nextFecha(fecha_inicio, i, frecuencia),
      monto_cuota: cuota,
      capital,
      interes: interesPeriodo,
      saldo_pendiente: Math.max(0, saldo),
    };
  });
}

/**
 * Saldo Insoluto (interés sobre saldo)
 */
export function calcSaldoInsoluto(
  monto: number,
  tasa_mensual: number,
  plazo_meses: number,
  frecuencia: string,
  fecha_inicio: Date,
): CuotaCalc[] {
  const n = totalCuotas(plazo_meses, frecuencia);
  const tasaPeriodo = tasa_mensual * (DIAS_FRECUENCIA[frecuencia] / 30);
  const capitalPorCuota = round2(monto / n);

  let saldo = monto;
  return Array.from({ length: n }, (_, idx) => {
    const i = idx + 1;
    const interes = round2(saldo * tasaPeriodo);
    const capital = i < n ? capitalPorCuota : round2(saldo);
    const cuota = round2(capital + interes);
    saldo = round2(saldo - capital);
    return {
      numero_cuota: i,
      fecha_vencimiento: nextFecha(fecha_inicio, i, frecuencia),
      monto_cuota: cuota,
      capital,
      interes,
      saldo_pendiente: Math.max(0, saldo),
    };
  });
}

export function calcAmortizacion(
  monto: number,
  tasa_mensual: number,
  plazo_meses: number,
  frecuencia: string,
  metodo: string,
  fecha_inicio: Date,
): CuotaCalc[] {
  switch (metodo) {
    case 'interes_simple':  return calcInteresSimple(monto, tasa_mensual, plazo_meses, frecuencia, fecha_inicio);
    case 'saldo_insoluto':  return calcSaldoInsoluto(monto, tasa_mensual, plazo_meses, frecuencia, fecha_inicio);
    default:                return calcCuotaFija(monto, tasa_mensual, plazo_meses, frecuencia, fecha_inicio);
  }
}

function round2(n: number) { return Math.round(n * 100) / 100; }
