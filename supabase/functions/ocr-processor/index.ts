import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OCRRequest {
  storage_path: string;
  evidence_entry_id: string;
}

interface OCRResult {
  success: boolean;
  extracted_text?: string;
  confidence?: number;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { storage_path, evidence_entry_id }: OCRRequest = await req.json();

    if (!storage_path || !evidence_entry_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: storage_path, evidence_entry_id" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        },
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from("evidence")
      .download(storage_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to download file: ${downloadError?.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        },
      );
    }

    // TODO: Integrate with actual OCR service (Google Vision, Tesseract, etc.)
    // For now, return placeholder indicating the function structure is ready
    const result: OCRResult = {
      success: true,
      extracted_text: "[OCR integration pending - connect to Vision API]",
      confidence: 0,
    };

    // Update evidence entry with extraction status
    const { error: updateError } = await supabaseClient
      .from("evidence_ledger")
      .update({
        status: "extracting",
        extraction_metadata: {
          function_invoked: true,
          invoked_at: new Date().toISOString(),
        },
      })
      .eq("id", evidence_entry_id);

    if (updateError) {
      console.error("Failed to update evidence entry:", updateError);
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    );
  }
});
