import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WebhookSource = "ebm" | "cfr" | "rra" | "fiau" | "generic";

interface WebhookPayload {
    source: WebhookSource;
    event_type: string;
    reference_id?: string;
    payload: Record<string, unknown>;
    signature?: string;
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

        const webhook: WebhookPayload = await req.json();

        // Validate required fields
        if (!webhook.source || !webhook.event_type) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required fields: source, event_type"
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                },
            );
        }

        // TODO: Verify webhook signatures based on source
        // - EBM: Rwanda electronic billing machine webhooks
        // - CFR: Malta Commissioner for Revenue notifications
        // - RRA: Rwanda Revenue Authority callbacks
        // - FIAU: Malta Financial Intelligence Analysis Unit

        // Log the webhook event
        const { error: logError } = await supabaseClient
            .from("agent_activity_log")
            .insert({
                event_type: `webhook.${webhook.source}.${webhook.event_type}`,
                metadata: {
                    source: webhook.source,
                    event_type: webhook.event_type,
                    reference_id: webhook.reference_id,
                    received_at: new Date().toISOString(),
                },
            });

        if (logError) {
            console.error("Failed to log webhook:", logError);
        }

        // Route webhook based on source
        switch (webhook.source) {
            case "ebm":
                // Handle Rwanda EBM webhooks (e-invoicing confirmations)
                console.log("EBM webhook received:", webhook.event_type);
                break;

            case "cfr":
                // Handle Malta CFR webhooks (tax filing confirmations)
                console.log("CFR webhook received:", webhook.event_type);
                break;

            case "rra":
                // Handle Rwanda RRA webhooks (tax portal notifications)
                console.log("RRA webhook received:", webhook.event_type);
                break;

            case "fiau":
                // Handle Malta FIAU webhooks (AML/STR acknowledgments)
                console.log("FIAU webhook received:", webhook.event_type);
                break;

            default:
                console.log("Generic webhook received:", webhook.event_type);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Webhook processed: ${webhook.source}/${webhook.event_type}`
            }),
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
