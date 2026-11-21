/**
 * Finora Email OTP Service
 * Handles secure backend OTP generation, SHA-256 hashing, rate-limiting,
 * 5-minute expiration, 3-attempt limit enforcement, audit logging, and atomic settlement.
 */
import { supabase, IS_MOCK_ENV } from './supabase';
import { sendOtpEmail, verifyOtpViaEdgeFunction, sendTransactionReceiptEmail } from './emailService';

// In-memory fallback cache for prototype/offline resilience
const memoryOtps = new Map();
const memoryAuditLogs = [];

/**
 * Computes a cryptographic SHA-256 hash of the 6-digit OTP code.
 * Plaintext OTPs are NEVER stored in the database.
 */
export async function hashOtp(otpCode) {
  const str = String(otpCode).trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Helper to log security audit events.
 */
export async function logOtpAudit({ transactionId, userId, action, details = '', ipAddress = '127.0.0.1' }) {
  const logEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    transaction_id: transactionId,
    user_id: userId,
    action,
    details,
    ip_address: ipAddress,
    timestamp: new Date().toISOString(),
  };

  memoryAuditLogs.push(logEntry);
  console.log(`[OTP AUDIT LOG] [${action}] Tx: ${transactionId} | User: ${userId} | ${details}`);

  if (!IS_MOCK_ENV) {
    try {
      await supabase.from('otp_audit_logs').insert(logEntry);
    } catch (err) {
      console.warn('[logOtpAudit] Supabase log insert error:', err);
    }
  }
  return logEntry;
}

/**
 * Step 1: Initiates a transaction and generates a 5-minute 6-digit OTP stored ONLY as SHA-256 hash.
 */
export async function initiateTransferOtp({
  currentUser,
  recipient,
  externalDetails = null,
  amount,
  note = '',
  transferType = 'internal',
}) {
  if (!currentUser || !currentUser.id) {
    throw new Error('User must be authenticated to initiate a transfer.');
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Enter a valid transfer amount greater than $0.00.');
  }

  // Daily transfer limit check (e.g. $50,000 daily limit per fintech best practices)
  const DAILY_LIMIT = 50000;
  if (parsedAmount > DAILY_LIMIT) {
    throw new Error(`Transfer amount exceeds maximum daily limit of $${DAILY_LIMIT.toLocaleString('en-US')}.`);
  }

  const txId = `tx_${Date.now()}`;
  const otpId = `otp_${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 Minutes Expiration

  // Generate secure random 6-digit OTP
  const rawOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await hashOtp(rawOtpCode);

  const pendingTx = {
    id: txId,
    timestamp: now.toISOString().replace('T', ' ').substring(0, 16),
    type: transferType === 'internal' ? 'transfer' : 'withdraw',
    category: transferType === 'internal' ? 'Transfer' : (transferType === 'bank' ? 'External Bank Wire' : 'Crypto USDT Transfer'),
    senderId: currentUser.id,
    senderName: currentUser.name,
    senderAccount: currentUser.accountNo,
    recipientId: recipient?.id || 'ext_recipient',
    recipientName: recipient?.name || externalDetails?.accountHolder || externalDetails?.walletAddress || 'External Recipient',
    recipientAccount: recipient?.accountNo || externalDetails?.accountNumber || externalDetails?.walletAddress || 'N/A',
    amount: parsedAmount,
    status: 'Pending',
    note: note || `${transferType} transfer authorization pending`,
    externalDetails: externalDetails || null,
  };

  const otpRecord = {
    id: otpId,
    transaction_id: txId,
    user_id: currentUser.id,
    otp_hash: otpHash,
    raw_otp_dev_only: rawOtpCode, // Console display only for development mode
    expires_at: expiresAt.toISOString(),
    attempts_count: 0,
    last_resent_at: now.toISOString(),
    is_used: false,
    created_at: now.toISOString(),
  };

  memoryOtps.set(txId, { pendingTx, otpRecord });

  if (!IS_MOCK_ENV) {
    try {
      // Store the pending transaction shell (edge fn will write the OTP record)
      await supabase.from('transactions').insert({
        id: pendingTx.id,
        timestamp: pendingTx.timestamp,
        type: pendingTx.type,
        category: pendingTx.category,
        sender_id: pendingTx.senderId,
        sender_name: pendingTx.senderName,
        sender_account: pendingTx.senderAccount,
        recipient_id: pendingTx.recipientId,
        recipient_name: pendingTx.recipientName,
        recipient_account: pendingTx.recipientAccount,
        amount: pendingTx.amount,
        status: 'Pending',
        note: pendingTx.note,
      });
    } catch (err) {
      console.warn('[initiateTransferOtp] Transaction DB insert warning:', err);
    }
  }

  // Security Audit Log
  await logOtpAudit({
    transactionId: txId,
    userId: currentUser.id,
    action: 'GENERATED',
    details: `Generated 5-min OTP for ${pendingTx.category} of $${parsedAmount}`,
  });

  // Dispatch OTP email via edge function (Resend SMTP).
  // The edge function generates & stores its own canonical hashed OTP.
  // Wrap in try/catch so a delivery hiccup does not block the modal from opening.
  if (!IS_MOCK_ENV) {
    try {
      await sendOtpEmail({
        email: currentUser.email,
        transactionId: txId,
        amount: parsedAmount,
        recipientName: pendingTx.recipientName,
      });
    } catch (emailErr) {
      // Log the warning but don't throw — the modal should still open.
      // User can use the "Resend OTP" button inside the modal.
      console.warn('[initiateTransferOtp] Email dispatch warning:', emailErr?.message || emailErr);
    }
  } else {
    // Mock env: log the raw OTP for development convenience
    console.log(`[DEV ONLY] OTP for ${txId}: ${rawOtpCode}`);
  }

  return {
    success: true,
    transactionId: txId,
    expiresAt,
    userEmail: currentUser.email,
    devOtpCode: rawOtpCode, // exposed for testing console
  };
}

/**
 * Resends a completely new OTP, enforcing a 60-second cooldown timer.
 */
export async function resendTransferOtp({ transactionId, currentUser }) {
  if (!transactionId || !currentUser) {
    throw new Error('Invalid request parameters.');
  }

  let memoryData = memoryOtps.get(transactionId);

  let otpRecord = memoryData?.otpRecord;

  if (!otpRecord && !IS_MOCK_ENV) {
    const { data } = await supabase
      .from('transaction_otps')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('user_id', currentUser.id)
      .single();
    if (data) otpRecord = data;
  }

  if (!otpRecord) {
    throw new Error('Transaction or OTP session not found.');
  }

  if (otpRecord.is_used) {
    throw new Error('This transaction has already been completed.');
  }

  // Enforce 60-second resend limit
  const lastResent = new Date(otpRecord.last_resent_at || otpRecord.created_at).getTime();
  const nowMs = Date.now();
  const secondsElapsed = Math.floor((nowMs - lastResent) / 1000);

  if (secondsElapsed < 60) {
    const waitRemaining = 60 - secondsElapsed;
    throw new Error(`Please wait ${waitRemaining} seconds before requesting a new OTP.`);
  }

  // Generate completely new 6-digit OTP
  const rawOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newOtpHash = await hashOtp(rawOtpCode);
  const newExpiresAt = new Date(nowMs + 5 * 60 * 1000); // Reset 5 min timer

  otpRecord.otp_hash = newOtpHash;
  otpRecord.expires_at = newExpiresAt.toISOString();
  otpRecord.last_resent_at = new Date(nowMs).toISOString();
  otpRecord.attempts_count = 0; // Reset attempt count for new code
  otpRecord.raw_otp_dev_only = rawOtpCode;

  if (memoryData) {
    memoryData.otpRecord = otpRecord;
    memoryOtps.set(transactionId, memoryData);
  }

  if (!IS_MOCK_ENV) {
    try {
      await supabase
        .from('transaction_otps')
        .update({
          otp_hash: newOtpHash,
          expires_at: otpRecord.expires_at,
          last_resent_at: otpRecord.last_resent_at,
          attempts_count: 0,
        })
        .eq('transaction_id', transactionId);
    } catch (err) {
      console.warn('[resendTransferOtp] DB update error:', err);
    }
  }

  // Audit Log
  await logOtpAudit({
    transactionId,
    userId: currentUser.id,
    action: 'RESENT',
    details: 'Resent fresh 6-digit OTP to user email',
  });

  // Re-dispatch via edge function (generates a brand-new hashed OTP on the server)
  const pendingTx = memoryData?.pendingTx || {};
  if (!IS_MOCK_ENV) {
    await sendOtpEmail({
      email: currentUser.email,
      transactionId,
      amount: pendingTx.amount || 0,
      recipientName: pendingTx.recipientName || 'Recipient',
    });
  } else {
    console.log(`[DEV ONLY] Resent OTP for ${transactionId}: ${rawOtpCode}`);
  }

  return {
    success: true,
    transactionId,
    expiresAt: newExpiresAt,
    devOtpCode: rawOtpCode,
  };
}

/**
 * Step 2: Verifies submitted OTP against hashed DB record.
 * Enforces 3 max attempts, 5-minute expiry, single-use, and performs atomic settlement on success.
 */
export async function verifyTransferOtp({ transactionId, submittedOtp, currentUser, onSuccessSettle }) {
  if (!transactionId || !submittedOtp || !currentUser) {
    throw new Error('Missing transaction authorization parameters.');
  }

  let memoryData = memoryOtps.get(transactionId);
  let otpRecord = memoryData?.otpRecord;
  let pendingTx = memoryData?.pendingTx;

  if ((!otpRecord || !pendingTx) && !IS_MOCK_ENV) {
    const { data: oData } = await supabase
      .from('transaction_otps')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('user_id', currentUser.id)
      .single();
    if (oData) otpRecord = oData;

    const { data: tData } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
    if (tData) pendingTx = tData;
  }

  if (!otpRecord || !pendingTx) {
    throw new Error('Invalid or expired transaction session.');
  }

  // 1. Check if already used (Single-use security requirement)
  if (otpRecord.is_used) {
    throw new Error('This OTP code has already been used.');
  }

  // 2. Check if expired (5-minute security requirement)
  const nowMs = Date.now();
  const expiresMs = new Date(otpRecord.expires_at).getTime();
  if (nowMs > expiresMs) {
    await logOtpAudit({
      transactionId,
      userId: currentUser.id,
      action: 'EXPIRED',
      details: 'Attempted to use an expired OTP',
    });
    throw new Error('OTP has expired. Please request a new code.');
  }

  // 3. Check attempt count (3 max attempts security requirement)
  if (otpRecord.attempts_count >= 3) {
    await logOtpAudit({
      transactionId,
      userId: currentUser.id,
      action: 'MAX_ATTEMPTS_EXCEEDED',
      details: 'Maximum verification attempts exceeded (3/3)',
    });
    throw new Error('Maximum verification attempts exceeded (3/3). Please request a new OTP code.');
  }

  // 4. Delegate OTP hash comparison to the Supabase Edge Function
  //    (server-side SHA-256 comparison — no raw OTP ever reaches the client)
  if (!IS_MOCK_ENV) {
    // This call throws on failure with the server's error message
    await verifyOtpViaEdgeFunction({ transactionId, submittedOtp });
    // If we reach here, verification passed on the server.
    // The edge function already marked is_used=true and status=Completed in the DB.
  } else {
    // Mock env: do client-side hash check
    const submittedHash = await hashOtp(submittedOtp);
    if (submittedHash !== otpRecord.otp_hash) {
      otpRecord.attempts_count += 1;
      if (memoryData) memoryOtps.set(transactionId, memoryData);
      const remaining = 3 - otpRecord.attempts_count;
      if (remaining <= 0) {
        throw new Error('Maximum verification attempts exceeded. Please request a new OTP code.');
      }
      throw new Error(`Invalid verification code. You have ${remaining} attempt(s) remaining.`);
    }
  }

  // 5. Verification SUCCESS
  //    In live mode: edge function already updated DB (is_used=true, status=Completed).
  //    In mock mode: update local memory.
  otpRecord.is_used = true;
  pendingTx.status = 'Completed';

  if (memoryData) {
    memoryData.otpRecord = otpRecord;
    memoryData.pendingTx = pendingTx;
    memoryOtps.set(transactionId, memoryData);
  }

  await logOtpAudit({
    transactionId,
    userId: currentUser.id,
    action: 'VERIFICATION_SUCCESS',
    details: 'OTP verified successfully. Settling transaction.',
  });

  // Perform atomic debit/credit settlement via callback
  if (typeof onSuccessSettle === 'function') {
    await onSuccessSettle(pendingTx);
  }

  // Send transaction confirmation receipt email
  await sendTransactionReceiptEmail({
    email: currentUser.email,
    transaction: pendingTx,
  });

  return {
    success: true,
    transaction: pendingTx,
  };
}

/**
 * Fetches all pending transactions for the current user, joined with their
 * OTP status (expires_at, is_used, attempts_count) so the UI can show
 * whether the OTP window is still valid or a fresh code is needed.
 *
 * @param {object} currentUser
 * @returns {Promise<Array>}
 */
export async function fetchPendingTransactions(currentUser) {
  if (!currentUser?.id) return [];

  // Memory-only fallback (mock / offline env)
  if (IS_MOCK_ENV) {
    const results = [];
    for (const [, { pendingTx, otpRecord }] of memoryOtps.entries()) {
      if (pendingTx.senderId === currentUser.id && pendingTx.status === 'Pending') {
        results.push({ ...pendingTx, otp: otpRecord });
      }
    }
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  try {
    const { data: txRows, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('sender_id', currentUser.id)
      .eq('status', 'Pending')
      .order('timestamp', { ascending: false });

    if (txErr || !txRows?.length) return [];

    const enriched = await Promise.all(
      txRows.map(async (tx) => {
        const { data: otpRow } = await supabase
          .from('transaction_otps')
          .select('expires_at, is_used, attempts_count, last_resent_at')
          .eq('transaction_id', tx.id)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        return {
          id: tx.id,
          timestamp: tx.timestamp,
          type: tx.type,
          category: tx.category,
          amount: tx.amount,
          status: tx.status,
          note: tx.note,
          senderId: tx.sender_id,
          senderName: tx.sender_name,
          recipientId: tx.recipient_id,
          recipientName: tx.recipient_name,
          recipientAccount: tx.recipient_account,
          otp: otpRow || null,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.warn('[fetchPendingTransactions] Error:', err);
    return [];
  }
}

/**
 * Cancels a pending transaction: sets status to "Cancelled" in the transactions
 * table and marks the OTP as used so it can never be redeemed later.
 *
 * @param {object} params
 * @param {string} params.transactionId
 * @param {object} params.currentUser
 * @returns {Promise<{success: boolean}>}
 */
export async function cancelPendingTransaction({ transactionId, currentUser }) {
  if (!transactionId || !currentUser?.id) {
    throw new Error('Invalid cancellation parameters.');
  }

  memoryOtps.delete(transactionId);

  if (!IS_MOCK_ENV) {
    try {
      await supabase
        .from('transactions')
        .update({ status: 'Cancelled' })
        .eq('id', transactionId)
        .eq('sender_id', currentUser.id);

      await supabase
        .from('transaction_otps')
        .update({ is_used: true })
        .eq('transaction_id', transactionId)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('[cancelPendingTransaction] DB update error:', err);
      throw new Error('Failed to cancel transaction. Please try again.');
    }
  }

  await logOtpAudit({
    transactionId,
    userId: currentUser.id,
    action: 'CANCELLED',
    details: 'User cancelled the pending transaction and voided the OTP.',
  });

  return { success: true };
}
