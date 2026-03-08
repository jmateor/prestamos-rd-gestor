import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cliente_id } = await req.json();
    if (!cliente_id) throw new Error("cliente_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch client
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, ingreso_mensual, otros_ingresos, created_at, estado")
      .eq("id", cliente_id)
      .single();

    if (!cliente) throw new Error("Cliente not found");

    // Fetch all prestamos for this client
    const { data: prestamos } = await supabase
      .from("prestamos")
      .select("id, estado, monto_aprobado, created_at")
      .eq("cliente_id", cliente_id);

    const pres = prestamos ?? [];
    const presIds = pres.map((p) => p.id);

    // Fetch all cuotas
    let cuotas: any[] = [];
    if (presIds.length > 0) {
      const { data } = await supabase
        .from("cuotas")
        .select("id, estado, fecha_vencimiento, fecha_pago, prestamo_id")
        .in("prestamo_id", presIds);
      cuotas = data ?? [];
    }

    // Fetch solicitudes
    const { data: solicitudes } = await supabase
      .from("solicitudes")
      .select("id, estado")
      .eq("cliente_id", cliente_id);

    const sols = solicitudes ?? [];

    // ═══════════════════════════════════════════
    // CREDIT SCORE CALCULATION (0-100)
    // ═══════════════════════════════════════════

    let score = 50; // Base score

    // 1. Payment history (max +30 / -30)
    const totalCuotas = cuotas.length;
    if (totalCuotas > 0) {
      const pagadas = cuotas.filter((c) => c.estado === "pagada").length;
      const vencidas = cuotas.filter(
        (c) => c.estado === "pendiente" && new Date(c.fecha_vencimiento) < new Date()
      ).length;
      const puntuales = cuotas.filter((c) => {
        if (c.estado !== "pagada" || !c.fecha_pago) return false;
        return new Date(c.fecha_pago) <= new Date(c.fecha_vencimiento);
      }).length;

      const ratePuntual = pagadas > 0 ? puntuales / pagadas : 0;
      score += Math.round(ratePuntual * 20); // Up to +20 for punctuality

      const rateVencida = vencidas / totalCuotas;
      score -= Math.round(rateVencida * 25); // Up to -25 for overdue
    }

    // 2. Loan behavior (max +20 / -15)
    const activos = pres.filter((p) => p.estado === "activo").length;
    const saldados = pres.filter((p) => p.estado === "saldado").length;
    const enMora = pres.filter((p) => p.estado === "mora" || p.estado === "vencido").length;

    score += Math.min(saldados * 5, 15); // Up to +15 for completed loans
    score -= enMora * 10; // -10 per loan in default
    if (activos > 3) score -= (activos - 3) * 3; // Penalize too many active loans

    // 3. Economic capacity (max +15)
    const ingresoTotal = (cliente.ingreso_mensual ?? 0) + (cliente.otros_ingresos ?? 0);
    const deudaActiva = pres
      .filter((p) => p.estado === "activo")
      .reduce((s, p) => s + (p.monto_aprobado ?? 0), 0);
    
    const ratioDeuda = ingresoTotal > 0 ? deudaActiva / (ingresoTotal * 12) : 1;
    if (ratioDeuda < 0.3) score += 15;
    else if (ratioDeuda < 0.5) score += 10;
    else if (ratioDeuda < 0.7) score += 5;
    else score -= 5;

    // 4. Client tenure (max +10)
    const mesesCliente = Math.floor(
      (Date.now() - new Date(cliente.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (mesesCliente >= 24) score += 10;
    else if (mesesCliente >= 12) score += 7;
    else if (mesesCliente >= 6) score += 4;
    else score += 1;

    // 5. Rejections penalty
    const rechazos = sols.filter((s) => s.estado === "rechazada").length;
    score -= rechazos * 3;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    let nivel_riesgo: string;
    if (score >= 80) nivel_riesgo = "bajo";
    else if (score >= 50) nivel_riesgo = "medio";
    else nivel_riesgo = "alto";

    // Update client record
    await supabase
      .from("clientes")
      .update({ credit_score: score, nivel_riesgo })
      .eq("id", cliente_id);

    // Calculate additional metrics for response
    const cuotasVencidasCount = cuotas.filter(
      (c) => c.estado === "pendiente" && new Date(c.fecha_vencimiento) < new Date()
    ).length;

    return new Response(
      JSON.stringify({
        credit_score: score,
        nivel_riesgo,
        detalles: {
          prestamos_activos: activos,
          prestamos_saldados: saldados,
          prestamos_en_mora: enMora,
          cuotas_vencidas: cuotasVencidasCount,
          total_cuotas: totalCuotas,
          ratio_deuda_ingreso: Math.round(ratioDeuda * 100),
          meses_como_cliente: mesesCliente,
          solicitudes_rechazadas: rechazos,
          ingreso_total: ingresoTotal,
          deuda_activa: deudaActiva,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("credit-score error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
