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

/** Construye las variables de redes sociales a partir del objeto empresa_info. */
export function buildRedesSocialesVars(empresa: any): {
  redes_sociales: string;
  redes_sociales_lista: Array<{ red: string; url: string; handle: string }>;
} {
  if (!empresa) return { redes_sociales: '', redes_sociales_lista: [] };

  const map: Array<[string, string | undefined]> = [
    ['Facebook',  empresa.facebook_url],
    ['Instagram', empresa.instagram_url],
    ['Twitter',   empresa.twitter_url],
    ['LinkedIn',  empresa.linkedin_url],
    ['YouTube',   empresa.youtube_url],
    ['TikTok',    empresa.tiktok_url],
    ['WhatsApp',  empresa.whatsapp_numero ? `https://wa.me/${empresa.whatsapp_numero.replace(/\D/g, '')}` : undefined],
    ['Sitio web', empresa.sitio_web],
  ];

  const lista = map
    .filter(([, url]) => !!url)
    .map(([red, url]) => ({
      red,
      url: url as string,
      handle: cleanSocialHandle(url as string),
    }));

  const redes_sociales = lista.map((r) => `${r.red}: ${r.handle}`).join(' · ');

  return { redes_sociales, redes_sociales_lista: lista };
}

function cleanSocialHandle(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const path = u.pathname.replace(/^\/+|\/+$/g, '');
    return path ? `@${path.split('/')[0].replace(/^@/, '')}` : u.hostname;
  } catch {
    return url;
  }
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
  { clave: 'empresa.telefono', desc: 'Teléfono de la empresa' },
  { clave: 'empresa.email', desc: 'Email de la empresa' },
  { clave: 'empresa.sitio_web', desc: 'Sitio web de la empresa' },
  { clave: 'empresa.whatsapp_numero', desc: 'WhatsApp de la empresa' },
  { clave: 'empresa.facebook_url', desc: 'URL de Facebook' },
  { clave: 'empresa.instagram_url', desc: 'URL de Instagram' },
  { clave: 'empresa.twitter_url', desc: 'URL de Twitter / X' },
  { clave: 'empresa.linkedin_url', desc: 'URL de LinkedIn' },
  { clave: 'empresa.youtube_url', desc: 'URL de YouTube' },
  { clave: 'empresa.tiktok_url', desc: 'URL de TikTok' },
  { clave: 'redes_sociales', desc: 'Todas las redes en una línea (Facebook: @x · Instagram: @y …)' },
  { clave: 'redes_sociales_lista', desc: 'Loop: {{#redes_sociales_lista}}{{red}}: {{handle}}\\n{{/redes_sociales_lista}}' },
  { clave: 'garante_nombre', desc: 'Nombre del garante (si aplica)' },
  { clave: 'garante_cedula', desc: 'Cédula del garante (si aplica)' },
  { clave: 'fecha_hoy', desc: 'Fecha actual' },
  { clave: 'lugar', desc: 'Lugar de emisión' },
];
