import { formatCurrency, formatDate } from '@/lib/format';
import { numeroEnLetras, porcentajeEnLetras } from '@/lib/numeroEnLetras';
import { supabase } from '@/integrations/supabase/client';

/**
 * Construye el diccionario completo de variables para renderizar una plantilla legal
 * a partir de un préstamo. Hace todas las relaciones necesarias (cliente, garante,
 * garantía prendaria, empresa) para evitar duplicación.
 */
export async function buildVariablesFromPrestamo(prestamoId: string, opts?: {
  fechaVencimientoOverride?: string | null;
  testigos?: Array<{ nombre: string; cedula?: string | null; direccion?: string | null; telefono?: string | null }>;
  usuarioNombre?: string;
}): Promise<Record<string, any>> {
  const { data: prestamo, error } = await (supabase as any)
    .from('prestamos')
    .select('*, clientes(*), solicitudes(id)')
    .eq('id', prestamoId)
    .maybeSingle();
  if (error) throw error;
  if (!prestamo) throw new Error('Préstamo no encontrado');

  const cliente = prestamo.clientes ?? {};

  // Empresa (prestamista)
  const { data: empresa } = await (supabase as any)
    .from('empresa_info').select('*').limit(1).maybeSingle();

  // Garante personal (buscar por solicitud)
  let garante: any = null;
  if (prestamo.solicitud_id) {
    const { data: gs } = await (supabase as any)
      .from('garantes_personales').select('*').eq('solicitud_id', prestamo.solicitud_id).limit(1);
    garante = gs?.[0] ?? null;
  }

  // Garantía prendaria (vehículo)
  let vehiculo: any = null;
  if (prestamo.solicitud_id) {
    const { data: gp } = await (supabase as any)
      .from('garantias_prendarias').select('*').eq('solicitud_id', prestamo.solicitud_id).limit(1);
    vehiculo = gp?.[0] ?? null;
  }

  const nombreCliente = [cliente.primer_nombre, cliente.segundo_nombre, cliente.primer_apellido, cliente.segundo_apellido]
    .filter(Boolean).join(' ');
  const apellidoCliente = [cliente.primer_apellido, cliente.segundo_apellido].filter(Boolean).join(' ');

  const hoy = new Date();
  const fechaCorta = hoy.toLocaleDateString('es-DO');
  const fechaLarga = hoy.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });

  const testigosList = (opts?.testigos ?? []).map((t, i) => ({
    numero: i + 1,
    nombre: t.nombre,
    cedula: t.cedula ?? '',
    direccion: t.direccion ?? '',
    telefono: t.telefono ?? '',
  }));

  const vars: Record<string, any> = {
    __monto_num: Number(prestamo.monto_aprobado ?? 0),
    // Prestamista (empresa)
    prestamista_nombre: empresa?.nombre ?? '',
    prestamista_cedula: empresa?.rnc ?? '',
    prestamista_direccion: empresa?.direccion ?? '',
    prestamista_telefono: empresa?.telefono ?? '',
    empresa: empresa ?? {},
    rnc: empresa?.rnc ?? '',

    // Cliente
    cliente_nombre: nombreCliente,
    cliente_apellido: apellidoCliente,
    cliente_cedula: cliente.cedula ?? '',
    cliente_direccion: cliente.direccion ?? '',
    cliente_telefono: cliente.telefono ?? cliente.celular ?? '',
    cliente_estado_civil: cliente.estado_civil ?? '',
    cliente_ocupacion: cliente.ocupacion ?? '',
    cliente_nacionalidad: cliente.nacionalidad ?? 'Dominicano(a)',

    // Préstamo
    numero_prestamo: prestamo.numero_prestamo ?? '',
    monto: formatCurrency(prestamo.monto_aprobado ?? 0),
    monto_letras: numeroEnLetras(prestamo.monto_aprobado ?? 0),
    capital: formatCurrency(prestamo.monto_aprobado ?? 0),
    saldo: formatCurrency(prestamo.saldo_pendiente ?? prestamo.monto_aprobado ?? 0),
    interes: String(prestamo.tasa_interes ?? ''),
    interes_letras: porcentajeEnLetras(prestamo.tasa_interes ?? 0),
    cuotas: String(prestamo.total_cuotas ?? prestamo.plazo_meses ?? ''),
    valor_cuota: formatCurrency(prestamo.cuota_estimada ?? 0),
    frecuencia: prestamo.frecuencia_pago ?? '',
    fecha: prestamo.fecha_desembolso ? formatDate(prestamo.fecha_desembolso) : fechaCorta,
    fecha_larga: fechaLarga,
    fecha_hoy: fechaCorta,
    fecha_desembolso: prestamo.fecha_desembolso ? formatDate(prestamo.fecha_desembolso) : '',
    fecha_vencimiento: opts?.fechaVencimientoOverride
      ? formatDate(opts.fechaVencimientoOverride)
      : (prestamo.fecha_vencimiento ? formatDate(prestamo.fecha_vencimiento) : ''),

    // Garante
    garante: garante ? [garante.primer_nombre, garante.primer_apellido].filter(Boolean).join(' ') : '',
    garante_nombre: garante ? [garante.primer_nombre, garante.primer_apellido].filter(Boolean).join(' ') : '',
    garante_cedula: garante?.cedula ?? '',
    garante_direccion: garante?.direccion ?? '',
    garante_telefono: garante?.telefono ?? '',

    // Vehículo / garantía
    vehiculo: vehiculo ? `${vehiculo.marca ?? ''} ${vehiculo.modelo ?? ''}`.trim() : '',
    marca: vehiculo?.marca ?? '',
    modelo: vehiculo?.modelo ?? '',
    chasis: vehiculo?.chasis ?? vehiculo?.numero_chasis ?? '',
    motor: vehiculo?.motor ?? vehiculo?.numero_motor ?? '',
    placa: vehiculo?.placa ?? '',
    color: vehiculo?.color ?? '',
    ano_vehiculo: vehiculo?.ano ?? vehiculo?.anio ?? '',

    // Testigos
    testigos_lista: testigosList,
    testigo1: testigosList[0]?.nombre ?? '',
    testigo1_cedula: testigosList[0]?.cedula ?? '',
    testigo2: testigosList[1]?.nombre ?? '',
    testigo2_cedula: testigosList[1]?.cedula ?? '',

    // Contexto
    usuario: opts?.usuarioNombre ?? '',
    lugar: empresa?.ciudad ?? empresa?.provincia ?? 'Santo Domingo',
  };

  return vars;
}

/**
 * Valida que las variables mínimas para generar un documento estén completas.
 * Devuelve lista de campos faltantes (vacía si OK).
 */
export function validarVariables(vars: Record<string, any>, tipo: string): string[] {
  const faltantes: string[] = [];
  if (!vars.cliente_nombre) faltantes.push('Nombre del cliente');
  if (!vars.cliente_cedula) faltantes.push('Cédula del cliente');
  if (!vars.cliente_direccion) faltantes.push('Dirección del cliente');
  if (!vars.cliente_telefono) faltantes.push('Teléfono del cliente');
  if (!vars.prestamista_nombre) faltantes.push('Empresa (prestamista) — configurar en Ajustes');
  if (!vars.numero_prestamo) faltantes.push('Número del préstamo');
  if (!vars.__monto_num || vars.__monto_num <= 0) faltantes.push('Monto del préstamo');

  if (tipo.includes('garantia') || tipo.includes('venta_reserva') || tipo.includes('entrega')) {
    if (!vars.marca) faltantes.push('Datos del vehículo / garantía prendaria');
  }
  return faltantes;
}
