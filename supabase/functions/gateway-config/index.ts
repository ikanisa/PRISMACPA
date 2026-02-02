/**
 * Gateway Config Edge Function
 * 
 * Returns dynamic gateway URL and token based on environment.
 * Token is stored in Supabase secrets, never exposed in code.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GatewayConfig {
    url: string;
    token: string;
    environment: "local" | "staging" | "production";
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get environment from Supabase secrets
        const environment = Deno.env.get("GATEWAY_ENVIRONMENT") || "production";
        const gatewayToken = Deno.env.get("OPENCLAW_GATEWAY_TOKEN") || "";
        const gatewayUrl = Deno.env.get("GATEWAY_URL") || "";

        // Determine gateway URL based on environment
        let url: string;
        let token: string;
        let env: GatewayConfig["environment"];

        if (environment === "local") {
            // Local development - use localhost
            url = "ws://localhost:19001";
            token = "dev-token";
            env = "local";
        } else if (environment === "staging") {
            // Staging environment
            url = gatewayUrl || "wss://gateway-staging.firmos.app";
            token = gatewayToken;
            env = "staging";
        } else {
            // Production environment
            url = gatewayUrl || "wss://gateway.firmos.app";
            token = gatewayToken;
            env = "production";
        }

        // Validate token is set for non-local environments
        if (env !== "local" && !token) {
            console.error("OPENCLAW_GATEWAY_TOKEN not configured for", env);
            return new Response(
                JSON.stringify({ error: "Gateway not configured" }),
                {
                    status: 503,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        const config: GatewayConfig = { url, token, environment: env };

        return new Response(
            JSON.stringify(config),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            }
        );

    } catch (error) {
        console.error("Gateway config error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
