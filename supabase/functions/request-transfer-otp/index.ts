/**
 * Finora — request-transfer-otp
 * Supabase Edge Function
 *
 * Receives a transfer initiation payload from the client app,
 * generates a secure random 6-digit OTP, hashes it with SHA-256,
 * stores the hashed record in the `transaction_otps` table, and
 * dispatches a branded HTML email to the user via Resend SMTP.
 *
 * Environment variables (set in Supabase Dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY        — Your Resend API key (re_...)
 *   SENDER_EMAIL          — support@FINORAreserve.online
 *   SENDER_NAME           — Finora
 *   SUPABASE_URL          — injected automatically by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase
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

// ─── SHA-256 Helper (Web Crypto — built into Deno) ───────────────────────────
async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Generate Secure 6-Digit OTP ─────────────────────────────────────────────
function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Guaranteed 6 digits: 100000–999999
  return (100000 + (array[0] % 900000)).toString();
}

// ─── Build Branded OTP Email HTML ────────────────────────────────────────────
function buildOtpEmailHtml(otpCode: string, amount: string, recipientName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FINORA Security Code</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0B0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0B0B0B;padding:40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#141414;border:1px solid #262626;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.8);">

          <!-- Top Lime Accent Line -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#CAFF33 0%,#769E0C 100%);"></td>
          </tr>

          <!-- Logo Header -->
          <tr>
            <td style="padding:32px 32px 24px 32px;text-align:center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="background-color:rgba(202,255,51,0.12);border:1px solid rgba(202,255,51,0.3);border-radius:14px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CAFF33" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.5px;">FINORA</span><span style="color:#CAFF33;font-size:22px;font-weight:700;">.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background-color:#222222;width:100%;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;text-align:center;">
              <h1 style="color:#FFFFFF;font-size:20px;font-weight:700;margin:0 0 10px 0;letter-spacing:-0.3px;">
                Transaction Security Authorization
              </h1>
              <p style="color:#999999;font-size:14px;line-height:22px;margin:0 0 6px 0;">
                A transfer of <strong style="color:#CAFF33;">${amount}</strong> to <strong style="color:#CCCCCC;">${recipientName}</strong> has been initiated.
              </p>
              <p style="color:#999999;font-size:14px;line-height:22px;margin:0 0 28px 0;">
                Use the code below to authorize this transfer. It expires in <strong style="color:#CCCCCC;">5 minutes</strong>.
              </p>

              <!-- OTP Code Box -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 28px auto;">
                <tr>
                  <td style="background-color:#1A1A1A;border:1.5px solid #CAFF33;border-radius:16px;padding:18px 36px;text-align:center;box-shadow:0 0 25px rgba(202,255,51,0.15);">
                    <span style="color:#CAFF33;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;padding-left:10px;">${otpCode}</span>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1A1A1A;border:1px solid #282828;border-radius:14px;">
                <tr>
                  <td style="padding:16px;text-align:left;">
                    <p style="color:#888888;font-size:12px;line-height:18px;margin:0;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CAFF33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:text-bottom;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <strong style="color:#FFFFFF;">Security Notice:</strong> Never share this code with anyone. FINORA staff will never ask for your verification code over the phone or email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0E0E0E;border-top:1px solid #222222;padding:24px 32px;text-align:center;">
              <p style="color:#555555;font-size:12px;line-height:18px;margin:0 0 8px 0;">
                This email was sent automatically by FINORA Financial Systems.
              </p>
              <p style="color:#444444;font-size:11px;margin:0;">
                &copy; 2026 Finora Inc. All rights reserved. &bull; 100 Financial Plaza, New York, NY
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Email via Resend API ────────────────────────────────────────────────
async function sendEmailViaResend({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") ?? "support@FINORAreserve.online";
  const SENDER_NAME = Deno.env.get("SENDER_NAME") ?? "Finora";

  if (!RESEND_API_KEY) {
    console.error("[send-email] RESEND_API_KEY is not set.");
    return { success: false, error: "Email service not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[send-email] Resend API error:", response.status, errorBody);
    return { success: false, error: `Resend API error: ${response.status}` };
  }

  return { success: true };
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
    // ── Auth: Verify Bearer token from the calling client ──────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const clientToken = authHeader.replace("Bearer ", "");

    // Create Supabase admin client (service role) to bypass RLS for DB writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create user-context client to validate the JWT and get user identity
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
      amount,
      recipientName,
      userEmail,
    }: {
      transactionId: string;
      amount: number;
      recipientName: string;
      userEmail: string;
    } = body;

    if (!transactionId || !amount || !userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: transactionId, amount, userEmail." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Enforce 60-Second Resend Cooldown ──────────────────────────────────
    const { data: existingOtp } = await supabaseAdmin
      .from("transaction_otps")
      .select("last_resent_at, is_used, expires_at")
      .eq("transaction_id", transactionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingOtp) {
      if (existingOtp.is_used) {
        return new Response(
          JSON.stringify({ error: "This transaction has already been completed." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lastResent = new Date(existingOtp.last_resent_at).getTime();
      const secondsElapsed = Math.floor((Date.now() - lastResent) / 1000);
      if (secondsElapsed < 60) {
        const waitRemaining = 60 - secondsElapsed;
        return new Response(
          JSON.stringify({
            error: `Please wait ${waitRemaining} seconds before requesting a new OTP.`,
            retryAfter: waitRemaining,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Generate & Hash OTP ────────────────────────────────────────────────
    const rawOtp = generateOtp();
    const otpHash = await sha256Hex(rawOtp);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    // ── Upsert OTP Record in DB ────────────────────────────────────────────
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (existingOtp) {
      // Update existing record (resend flow)
      const { error: updateError } = await supabaseAdmin
        .from("transaction_otps")
        .update({
          otp_hash: otpHash,
          expires_at: expiresAt.toISOString(),
          last_resent_at: now.toISOString(),
          attempts_count: 0,
        })
        .eq("transaction_id", transactionId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[request-transfer-otp] DB update error:", updateError);
      }
    } else {
      // Insert new OTP record (first-time flow)
      const { error: insertError } = await supabaseAdmin
        .from("transaction_otps")
        .insert({
          id: otpId,
          transaction_id: transactionId,
          user_id: user.id,
          otp_hash: otpHash,
          expires_at: expiresAt.toISOString(),
          attempts_count: 0,
          last_resent_at: now.toISOString(),
          is_used: false,
        });

      if (insertError) {
        console.error("[request-transfer-otp] DB insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create OTP session. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Write Audit Log ────────────────────────────────────────────────────
    await supabaseAdmin.from("otp_audit_logs").insert({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transaction_id: transactionId,
      user_id: user.id,
      action: existingOtp ? "RESENT" : "GENERATED",
      details: `OTP ${existingOtp ? "resent" : "generated"} for transfer of $${parseFloat(String(amount)).toFixed(2)} to ${recipientName}`,
      ip_address: req.headers.get("x-forwarded-for") ?? "unknown",
      timestamp: now.toISOString(),
    });

    // ── Send OTP Email via Resend ──────────────────────────────────────────
    const formattedAmount = `$${parseFloat(String(amount)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const emailHtml = buildOtpEmailHtml(rawOtp, formattedAmount, recipientName || "Recipient");

    const emailResult = await sendEmailViaResend({
      to: userEmail,
      subject: "Transaction Verification Code — Finora",
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error("[request-transfer-otp] Email dispatch failed:", emailResult.error);
      // Note: OTP is still saved. We return success so the modal opens.
      // Client can prompt resend if user didn't receive the email.
    }

    console.log(`[request-transfer-otp] OTP dispatched for tx: ${transactionId}, user: ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        expiresAt: expiresAt.toISOString(),
        emailSent: emailResult.success,
        // Only expose in non-production for debugging; remove before go-live
        ...(Deno.env.get("ENVIRONMENT") === "development" && { devOtp: rawOtp }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[request-transfer-otp] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

