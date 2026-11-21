/**
 * Finora — verify-transfer-otp
 * Supabase Edge Function
 *
 * Accepts a submitted 6-digit OTP and transaction ID from the client,
 * hashes the submission with SHA-256, and compares it to the stored hash
 * in `transaction_otps`. Enforces:
 *   - 5-minute expiry
 *   - Maximum 3 verification attempts
 *   - Single-use (is_used flag)
 *   - User ownership check
 *
 * On success: marks the OTP as used, updates the transaction status to
 * "Completed", writes an audit log entry, and returns success.
 * The caller (client app) then handles the debit/credit settlement.
 *
 * Environment variables (Supabase Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL                — injected automatically
 *   SUPABASE_SERVICE_ROLE_KEY   — injected automatically
 *   SUPABASE_ANON_KEY           — injected automatically
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS Headers ────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── SHA-256 Helper ───────────────────────────────────────────────────────────
async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Auth: Verify Bearer token ──────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const clientToken = authHeader.replace("Bearer ", "");

    // Admin client (service role) — used for DB reads/writes, bypasses RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // User-context client — validates JWT to get caller identity
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${clientToken}` } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid session token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse Request Body ─────────────────────────────────────────────────
    const body = await req.json();
    const {
      transactionId,
      submittedOtp,
    }: {
      transactionId: string;
      submittedOtp: string;
    } = body;

    if (!transactionId || !submittedOtp) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: transactionId, submittedOtp." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize: strip non-digits, enforce exactly 6 digits
    const cleanOtp = submittedOtp.replace(/[^0-9]/g, "").slice(0, 6);
    if (cleanOtp.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format. Must be 6 numeric digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch OTP Record ───────────────────────────────────────────────────
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("transaction_otps")
      .select("*")
      .eq("transaction_id", transactionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired transaction session." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = Date.now();

    // ── Guard: Already Used ────────────────────────────────────────────────
    if (otpRecord.is_used) {
      return new Response(
        JSON.stringify({ error: "This OTP code has already been used." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Guard: Expired ─────────────────────────────────────────────────────
    const expiresMs = new Date(otpRecord.expires_at).getTime();
    if (now > expiresMs) {
      await supabaseAdmin.from("otp_audit_logs").insert({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        transaction_id: transactionId,
        user_id: user.id,
        action: "EXPIRED",
        details: "Attempted to use an expired OTP",
        ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
        timestamp: new Date(now).toISOString(),
      });

      return new Response(
        JSON.stringify({ error: "OTP has expired. Please request a new code." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Guard: Max Attempts (3) ────────────────────────────────────────────
    if (otpRecord.attempts_count >= 3) {
      await supabaseAdmin.from("otp_audit_logs").insert({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        transaction_id: transactionId,
        user_id: user.id,
        action: "MAX_ATTEMPTS_EXCEEDED",
        details: "Maximum verification attempts exceeded (3/3)",
        ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
        timestamp: new Date(now).toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "Maximum verification attempts exceeded (3/3). Please request a new OTP code.",
          attemptsExceeded: true,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Hash Submitted OTP & Compare ──────────────────────────────────────
    const submittedHash = await sha256Hex(cleanOtp);

    if (submittedHash !== otpRecord.otp_hash) {
      // Increment attempt count
      const newAttempts = (otpRecord.attempts_count ?? 0) + 1;

      await supabaseAdmin
        .from("transaction_otps")
        .update({ attempts_count: newAttempts })
        .eq("transaction_id", transactionId)
        .eq("user_id", user.id);

      await supabaseAdmin.from("otp_audit_logs").insert({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        transaction_id: transactionId,
        user_id: user.id,
        action: "VERIFICATION_FAILED",
        details: `Failed OTP match: attempt ${newAttempts} of 3`,
        ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
        timestamp: new Date(now).toISOString(),
      });

      const remaining = 3 - newAttempts;

      if (remaining <= 0) {
        return new Response(
          JSON.stringify({
            error: "Maximum verification attempts exceeded. Please request a new OTP code.",
            attemptsExceeded: true,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: `Invalid verification code. You have ${remaining} attempt(s) remaining.`,
          attemptsRemaining: remaining,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── OTP MATCHED — Mark as Used & Complete Transaction ─────────────────
    await supabaseAdmin
      .from("transaction_otps")
      .update({ is_used: true })
      .eq("transaction_id", transactionId)
      .eq("user_id", user.id);

    await supabaseAdmin
      .from("transactions")
      .update({ status: "Completed" })
      .eq("id", transactionId);

    // Write success audit log
    await supabaseAdmin.from("otp_audit_logs").insert({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transaction_id: transactionId,
      user_id: user.id,
      action: "VERIFICATION_SUCCESS",
      details: "OTP verified successfully. Transaction marked as Completed.",
      ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
      timestamp: new Date(now).toISOString(),
    });

    console.log(
      `[verify-transfer-otp] SUCCESS — tx: ${transactionId}, user: ${user.id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        message: "OTP verified. Transaction authorized and completed.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[verify-transfer-otp] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

