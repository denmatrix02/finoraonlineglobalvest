/**
 * Finora Email Service
 * Routes OTP and receipt emails through Supabase Edge Functions,
 * which use Resend API for reliable delivery.
 */
import { supabase, IS_MOCK_ENV, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

// ─── Resolve the edge function base URL from env ──────────────────────────────
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

/**
 * Calls a Supabase Edge Function with the current user's auth token.
 */
async function callEdgeFunction(functionName, payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('No active session. Please log in and try again.');
  }

  const response = await fetch(`${FUNCTIONS_BASE}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error ?? `Edge function error: ${response.status}`);
  }

  return json;
}

/**
 * Sends a 6-digit OTP to the user's registered email via the
 * `request-transfer-otp` edge function.
 */
export async function sendOtpEmail({ email, transactionId, amount, recipientName }) {
  const formattedAmount = `$${parseFloat(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  console.log(`[emailService] Requesting OTP for tx: ${transactionId} → ${email}`);

  if (IS_MOCK_ENV) {
    console.log('====================================================');
    console.log(`[MOCK] OTP EMAIL TO: ${email}`);
    console.log(`[MOCK] Amount: ${formattedAmount} | Recipient: ${recipientName}`);
    console.log('====================================================');
    return { success: true, message: 'Mock OTP dispatched.' };
  }

  const result = await callEdgeFunction('request-transfer-otp', {
    transactionId,
    amount: parseFloat(amount || 0),
    recipientName: recipientName || 'Recipient',
    userEmail: email,
  });

  return result;
}

/**
 * Verifies a submitted OTP code via the `verify-transfer-otp` edge function.
 */
export async function verifyOtpViaEdgeFunction({ transactionId, submittedOtp }) {
  if (IS_MOCK_ENV) {
    console.log(`[MOCK] Verifying OTP "${submittedOtp}" for tx: ${transactionId}`);
    return { success: true, transactionId, message: 'Mock verification passed.' };
  }

  const result = await callEdgeFunction('verify-transfer-otp', {
    transactionId,
    submittedOtp,
  });

  return result;
}

/**
 * Sends a transaction confirmation receipt (console log; can be extended to
 * call a `send-receipt` edge function for full email delivery).
 */
export async function sendTransactionReceiptEmail({ email, transaction }) {
  const formattedAmount = `$${parseFloat(transaction.amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
  })}`;

  console.log('====================================================');
  console.log(`[RECEIPT] Sent to: ${email}`);
  console.log(`[RECEIPT] ${formattedAmount} to ${transaction.recipientName || 'recipient'}`);
  console.log(`[RECEIPT] Tx ID: ${transaction.id} | Status: Completed`);
  console.log('====================================================');

  return { success: true, message: 'Receipt logged.' };
}
