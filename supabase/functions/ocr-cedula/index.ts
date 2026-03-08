import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an OCR specialist for Dominican Republic ID cards (cédula de identidad).
Extract the following fields from the image:
- cedula: The ID number (format: XXX-XXXXXXX-X)
- nombre: Full name
- fecha_nacimiento: Date of birth (format: YYYY-MM-DD)
- sexo: M or F
- nacionalidad: Nationality

Respond ONLY with a JSON object with these fields. Use null for any field you cannot read.
Example: {"cedula":"001-1234567-8","nombre":"JUAN PEREZ","fecha_nacimiento":"1990-05-15","sexo":"M","nacionalidad":"DOMINICANA"}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the data from this Dominican Republic ID card (cédula):",
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_cedula_data",
              description: "Extract structured data from a Dominican Republic ID card",
              parameters: {
                type: "object",
                properties: {
                  cedula: { type: "string", description: "ID number in format XXX-XXXXXXX-X" },
                  nombre: { type: "string", description: "Full name as shown on the card" },
                  fecha_nacimiento: { type: "string", description: "Date of birth in YYYY-MM-DD format" },
                  sexo: { type: "string", enum: ["M", "F"], description: "Gender" },
                  nacionalidad: { type: "string", description: "Nationality" },
                },
                required: ["cedula", "nombre"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_cedula_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intente más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para OCR." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error: " + response.status);
    }

    const result = await response.json();
    
    // Extract tool call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let extractedData = null;
    
    if (toolCall?.function?.arguments) {
      try {
        extractedData = JSON.parse(toolCall.function.arguments);
      } catch {
        // Try parsing from content as fallback
        const content = result.choices?.[0]?.message?.content ?? "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!extractedData) {
      // Fallback: try parsing content
      const content = result.choices?.[0]?.message?.content ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ocr-cedula error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
