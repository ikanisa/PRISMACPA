// Supabase Edge Functions for OpenClaw/FirmOS
// 
// This directory contains Deno-based edge functions deployed to Supabase.
// Each function lives in its own subdirectory with an index.ts entrypoint.
//
// Planned functions:
// - ocr-processor     : Document OCR and text extraction
// - webhook-handler   : External webhook receivers (EBM, CFR)
// - notification      : Email/push notification triggers
// - aml-screening     : Automated AML/sanctions screening
//
// Deployment:
//   supabase functions deploy <function-name>
//
// Local development:
//   supabase functions serve <function-name>
//
// See: https://supabase.com/docs/guides/functions
