// Conversor de números a letras en español (para uso legal en RD$).
const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DIEZ_A_VEINTE = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function centenaEnLetras(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) partes.push(decenaEnLetras(resto));
  return partes.join(' ');
}

function decenaEnLetras(n: number): string {
  if (n === 0) return '';
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIEZ_A_VEINTE[n - 10];
  if (n < 30) {
    const u = n - 20;
    return u === 0 ? 'VEINTE' : `VEINTI${UNIDADES[u]}`;
  }
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
}

function milesEnLetras(n: number): string {
  if (n === 0) return '';
  if (n < 1000) return centenaEnLetras(n);
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  const milesStr = miles === 1 ? 'MIL' : `${centenaEnLetras(miles)} MIL`;
  return resto > 0 ? `${milesStr} ${centenaEnLetras(resto)}` : milesStr;
}

function millonesEnLetras(n: number): string {
  if (n === 0) return 'CERO';
  if (n < 1_000_000) return milesEnLetras(n);
  const mills = Math.floor(n / 1_000_000);
  const resto = n % 1_000_000;
  const millsStr = mills === 1 ? 'UN MILLÓN' : `${milesEnLetras(mills)} MILLONES`;
  return resto > 0 ? `${millsStr} ${milesEnLetras(resto)}` : millsStr;
}

/** Convierte 12345.67 → "DOCE MIL TRESCIENTOS CUARENTA Y CINCO PESOS DOMINICANOS CON 67/100" */
export function numeroEnLetras(amount: number, moneda = 'PESOS DOMINICANOS'): string {
  const num = Number(amount) || 0;
  const entero = Math.floor(Math.abs(num));
  const centavos = Math.round((Math.abs(num) - entero) * 100);
  const enteroStr = millonesEnLetras(entero);
  const centStr = String(centavos).padStart(2, '0');
  const signo = num < 0 ? 'MENOS ' : '';
  return `${signo}${enteroStr} ${moneda} CON ${centStr}/100`;
}

/** Convierte porcentaje 12.5 → "DOCE PUNTO CINCO POR CIENTO" */
export function porcentajeEnLetras(pct: number): string {
  const n = Number(pct) || 0;
  const entero = Math.floor(n);
  const dec = Math.round((n - entero) * 100);
  const enteroStr = millonesEnLetras(entero);
  if (dec === 0) return `${enteroStr} POR CIENTO`;
  return `${enteroStr} PUNTO ${millonesEnLetras(dec)} POR CIENTO`;
}
