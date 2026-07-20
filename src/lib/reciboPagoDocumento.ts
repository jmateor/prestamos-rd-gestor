import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ReciboPagoData } from '@/lib/reciboPagoPDF';

const metodoLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  deposito: 'Depósito',
};

function buildHtml(data: ReciboPagoData): string {
  const restaCuota = Math.max(0, data.monto_cuota - data.monto_pagado_acumulado);
  const rows: [string, string][] = [
    ['Cliente', data.cliente_nombre],
    ['Cédula', data.cliente_cedula],
    ['Préstamo', data.numero_prestamo],
    ['Cuota #', String(data.numero_cuota)],
    ['Fecha de pago', formatDate(data.fecha_pago)],
    ['Método', metodoLabel[data.metodo_pago] ?? data.metodo_pago],
  ];
  if (data.metodo_pago === 'transferencia' && data.referencia) {
    rows.push(['Nro. Transferencia', data.referencia]);
  }
  rows.push(
    ['Monto cuota', formatCurrency(data.monto_cuota)],
    ['Monto pagado', formatCurrency(data.monto_pagado)],
  );
  if (data.metodo_pago === 'efectivo' && data.monto_recibido) {
    rows.push(['Monto recibido', formatCurrency(data.monto_recibido)]);
    if (data.devuelta && data.devuelta > 0.01) {
      rows.push(['Devuelta', formatCurrency(data.devuelta)]);
    }
  }
  rows.push(
    [restaCuota > 0.01 ? 'Resta en cuota' : 'Estado cuota', restaCuota > 0.01 ? formatCurrency(restaCuota) : 'PAGADA'],
    ['Monto préstamo', formatCurrency(data.monto_aprobado)],
    ['Cuotas restantes', String(data.cuotas_restantes)],
    ['Saldo pendiente', formatCurrency(data.saldo_total_pendiente)],
  );

  const tr = rows.map(([k, v]) => `<tr><td style="padding:4px 8px;color:#555">${k}</td><td style="padding:4px 8px;text-align:right;font-weight:600">${v}</td></tr>`).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
    <h2 style="text-align:center;margin:0 0 4px">COMPROBANTE DE PAGO</h2>
    <p style="text-align:center;color:#666;margin:0 0 12px;font-size:12px">${formatDate(new Date().toISOString())}</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;font-size:13px">${tr}</table>
    ${data.usuario ? `<p style="text-align:center;color:#666;margin-top:12px;font-size:11px">Registrado por: ${data.usuario}</p>` : ''}
  </div>`;
}

/**
 * Persist a payment receipt into documentos_generados so it shows up in the
 * loan history and the Documentos module. Silent-fail: any error is logged
 * but does not interrupt the payment flow.
 */
export async function guardarReciboPagoDocumento(params: {
  data: ReciboPagoData;
  prestamo_id: string;
  cliente_id?: string | null;
}): Promise<void> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const html = buildHtml(params.data);
    const { error } = await (supabase as any).from('documentos_generados').insert({
      tipo_documento: 'recibo_pago',
      categoria: 'operacional',
      prestamo_id: params.prestamo_id,
      cliente_id: params.cliente_id ?? null,
      papel: '80mm',
      contenido_html: html,
      variables_snapshot: params.data as any,
      testigos_snapshot: [],
      estado: 'generado',
      version: 1,
      generado_por: userRes.user?.id ?? null,
    });
    if (error) console.warn('[reciboPagoDocumento] insert error', error);
  } catch (e) {
    console.warn('[reciboPagoDocumento] failed', e);
  }
}
