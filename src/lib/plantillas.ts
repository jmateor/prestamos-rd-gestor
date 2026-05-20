/**
 * Renderizado simple de plantillas tipo {{variable}} con soporte de loops {{#items}}...{{/items}}.
 * Usado para que el admin pueda editar contratos legales desde Ajustes sin tocar código.
 */
export function renderTemplate(template: string, vars: Record<string, any>): string {
  if (!template) return '';
  let out = template;

  // Bloques de loops: {{#nombre}}...{{/nombre}}
  out = out.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (_m, key, inner) => {
    const arr = vars[key];
    if (!Array.isArray(arr)) return '';
    return arr.map((item) => renderTemplate(inner, { ...vars, ...item })).join('');
  });

  // Variables simples: {{var}} o {{a.b}}
  out = out.replace(/{{\s*([\w.]+)\s*}}/g, (_m, path: string) => {
    const value = path.split('.').reduce((acc: any, k) => (acc == null ? acc : acc[k]), vars);
    return value == null ? '' : String(value);
  });

  return out;
}

/** Lista de variables comunes que el admin puede usar en plantillas. */
export const VARIABLES_DISPONIBLES = [
  { clave: 'cliente_nombre', desc: 'Nombre completo del cliente' },
  { clave: 'cliente_cedula', desc: 'Cédula del cliente' },
  { clave: 'cliente_direccion', desc: 'Dirección del cliente' },
  { clave: 'cliente_telefono', desc: 'Teléfono del cliente' },
  { clave: 'numero_prestamo', desc: 'Número del préstamo (PRE-XXXXXX)' },
  { clave: 'monto', desc: 'Monto aprobado (RD$)' },
  { clave: 'tasa', desc: 'Tasa de interés mensual' },
  { clave: 'plazo', desc: 'Cantidad de cuotas' },
  { clave: 'frecuencia', desc: 'Frecuencia de pago' },
  { clave: 'fecha_desembolso', desc: 'Fecha de desembolso' },
  { clave: 'fecha_vencimiento', desc: 'Fecha de vencimiento final' },
  { clave: 'empresa.nombre', desc: 'Nombre de la empresa' },
  { clave: 'empresa.rnc', desc: 'RNC de la empresa' },
  { clave: 'empresa.direccion', desc: 'Dirección de la empresa' },
  { clave: 'garante_nombre', desc: 'Nombre del garante (si aplica)' },
  { clave: 'garante_cedula', desc: 'Cédula del garante (si aplica)' },
  { clave: 'fecha_hoy', desc: 'Fecha actual' },
  { clave: 'lugar', desc: 'Lugar de emisión' },
];
