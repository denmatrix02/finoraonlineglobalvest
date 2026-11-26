import https from 'https';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { email, amount, recipientName, otpCode, transactionId } = body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Missing required parameters (email, otpCode).' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error('[send-otp api] RESEND_API_KEY environment variable is not set.');
      return res.status(500).json({ error: 'Email service not configured. Contact support.' });
    }
    const formattedAmount = amount ? `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'transfer';
    const targetRecipient = recipientName || 'Recipient';

    const emailHtml = `<!DOCTYPE html>
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

          <!-- Lime Accent Line -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#CAFF33 0%,#769E0C 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 20px 32px;text-align:center;">
              <span style="color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">FINORA</span><span style="color:#CAFF33;font-size:24px;font-weight:700;">.</span>
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
              <h1 style="color:#FFFFFF;font-size:20px;font-weight:700;margin:0 0 10px 0;">
                Transaction Security Authorization
              </h1>
              <p style="color:#999999;font-size:14px;line-height:22px;margin:0 0 6px 0;">
                A transfer of <strong style="color:#CAFF33;">${formattedAmount}</strong> to <strong style="color:#CCCCCC;">${targetRecipient}</strong> has been initiated.
              </p>
              <p style="color:#999999;font-size:14px;line-height:22px;margin:0 0 28px 0;">
                Use the one-time code below to authorize this transaction. It expires in <strong style="color:#CCCCCC;">5 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 28px auto;">
                <tr>
                  <td style="background-color:#1E1E1E;border:2px dashed #CAFF33;border-radius:16px;padding:20px 36px;text-align:center;">
                    <span style="color:#CAFF33;font-size:36px;font-weight:800;letter-spacing:10px;font-family:Courier,monospace,sans-serif;display:block;">
                      ${otpCode}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="color:#666666;font-size:12px;line-height:18px;margin:0;">
                Never share this authorization code with anyone. Finora staff will never ask for your code.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0E0E0E;padding:20px 32px;text-align:center;border-top:1px solid #1E1E1E;">
              <p style="color:#555555;font-size:11px;margin:0 0 4px 0;">
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

    const postData = JSON.stringify({
      from: 'Finora <noreply@finoraglobalvest.org>',
      to: [email],
      reply_to: 'finoraonlineglobalvest@gmail.com',
      subject: `FINORA Security Code: ${otpCode}`,
      html: emailHtml,
    });

    const resendResult = await new Promise((resolve, reject) => {
      const apiReq = https.request('https://api.resend.com/emails', {
        method: 'POST',
        family: 4, // Force IPv4 for bulletproof connectivity
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (apiRes) => {
        let resBody = '';
        apiRes.on('data', chunk => resBody += chunk);
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(resBody);
            resolve({ statusCode: apiRes.statusCode, data: parsed });
          } catch (e) {
            resolve({ statusCode: apiRes.statusCode, data: { raw: resBody } });
          }
        });
      });

      apiReq.on('error', (err) => reject(err));
      apiReq.write(postData);
      apiReq.end();
    });

    if (resendResult.statusCode >= 400) {
      console.error('[send-otp api] Resend API error:', resendResult.statusCode, resendResult.data);
      return res.status(resendResult.statusCode).json({ error: resendResult.data?.message || 'Failed to dispatch email via Resend.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP email dispatched successfully.',
      id: resendResult.data?.id,
      transactionId,
    });
  } catch (error) {
    console.error('[send-otp api] Internal error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
}
