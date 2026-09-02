/**
 * COMPLYGeM Email Service
 * Sends real OTP verification emails via Gmail SMTP (Nodemailer).
 *
 * Configuration (set in .env):
 *   SMTP_HOST       - defaults to smtp.gmail.com
 *   SMTP_PORT       - defaults to 587
 *   SMTP_USER       - your Gmail address
 *   SMTP_APP_PASS   - Gmail App Password (NOT your login password)
 *   EMAIL_FROM_NAME - Sender display name
 *
 * HOW TO GET A GMAIL APP PASSWORD:
 *   1. Enable 2-Step Verification on your Google Account.
 *   2. Visit https://myaccount.google.com/apppasswords
 *   3. Generate an App Password for "Mail".
 *   4. Copy the 16-character password into SMTP_APP_PASS.
 */

const nodemailer = require('nodemailer');

// ── Transport Configuration ──────────────────────────────────────────────────
function createTransport() {
  const host = process.env.SMTP_HOST     || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

function buildOtpEmailHtml(otp, email, expiryMinutes) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>COMPLYGeM Verification</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e293b,#0f1e3a);border-radius:16px;border:1px solid rgba(99,102,241,0.3);overflow:hidden;">
<tr><td style="padding:32px 40px 24px;text-align:center;background:linear-gradient(135deg,#312e81,#1e1b4b);">
<div style="font-size:28px;font-weight:800;color:#c7d2fe;">⚖️ COMPLYGeM</div>
<div style="font-size:12px;color:#818cf8;letter-spacing:3px;margin-top:4px;">AI-POWERED GOVERNMENT e-MARKETPLACE</div>
</td></tr>
<tr><td style="padding:36px 40px;">
<h2 style="margin:0 0 8px;font-size:20px;color:#e2e8f0;">Verify Your Email Address</h2>
<p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">To complete your Bidder Registration on the Government e-Marketplace, please use the verification code below.</p>
<div style="background:linear-gradient(135deg,#312e81,#1e40af);border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
<div style="font-size:13px;color:#a5b4fc;letter-spacing:2px;margin-bottom:12px;">YOUR VERIFICATION CODE</div>
<div style="font-size:42px;font-weight:900;color:#ffffff;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</div>
<div style="font-size:12px;color:#7dd3fc;margin-top:12px;">⏱ Valid for <strong>${expiryMinutes} minutes</strong> only</div>
</div>
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:12px 16px;">
<span style="font-size:13px;color:#6ee7b7;">✓ This code was requested for: <strong style="color:#a7f3d0;">${email}</strong></span>
</td></tr></table>
<p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.7;">If you did not attempt to register on COMPLYGeM, please ignore this email. Do not share this code with anyone.</p>
</td></tr>
<tr><td style="padding:20px 40px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(255,255,255,0.05);">
<p style="margin:0;font-size:11px;color:#475569;text-align:center;line-height:1.6;">COMPLYGeM — Smart India Hackathon 2026 Prototype<br/>Ministry of Commerce &amp; Industry | Government e-Marketplace (GeM)</p>
</td></tr></table></td></tr></table></body></html>`;
}

function buildOtpEmailText(otp, email, expiryMinutes) {
  return [
    'COMPLYGeM – Email Verification',
    '================================',
    '',
    `Your verification code: ${otp}`,
    `Valid for ${expiryMinutes} minutes.`,
    `Requested for: ${email}`,
    '',
    'Do NOT share this code with anyone.',
    '-- COMPLYGeM | Smart India Hackathon 2026'
  ].join('\n');
}

/**
 * Sends an OTP email. Falls back to console simulation if SMTP is unconfigured.
 * @param {string} toEmail
 * @param {string} otp  - plain-text 6-digit OTP
 * @param {number} [expiryMinutes=5]
 */
async function sendOtpEmail(toEmail, otp, expiryMinutes = 5) {
  const fromName  = process.env.EMAIL_FROM_NAME || 'COMPLYGeM Verification';
  const fromEmail = process.env.SMTP_USER       || 'noreply@complygem.gov.in';
  const from      = `"${fromName}" <${fromEmail}>`;
  const mailOptions = {
    from, to: toEmail,
    subject: `[COMPLYGeM] Your Email Verification Code: ${otp}`,
    text: buildOtpEmailText(otp, toEmail, expiryMinutes),
    html: buildOtpEmailHtml(otp, toEmail, expiryMinutes)
  };
  const transport = createTransport();
  if (transport) {
    try {
      const info = await transport.sendMail(mailOptions);
      console.log(`\x1b[32m[EMAIL SERVICE]\x1b[0m OK sent to ${toEmail} (msgId: ${info.messageId})`);
      return { sent: true, simulated: false, messageId: info.messageId };
    } catch (smtpErr) {
      console.error(`\x1b[31m[EMAIL SERVICE]\x1b[0m SMTP error: ${smtpErr.message} — falling back to simulation`);
    }
  }
  // Simulation fallback
  console.log('\x1b[36m══════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m[EMAIL SERVICE]\x1b[0m SIMULATED (no SMTP configured)');
  console.log(`\x1b[36m  To  :\x1b[0m ${toEmail}`);
  console.log(`\x1b[36m  OTP :\x1b[0m \x1b[33m${otp}\x1b[0m`);
  console.log('\x1b[36m══════════════════════════════════════════════════\x1b[0m');
  return { sent: false, simulated: true, preview: `OTP for ${toEmail}: ${otp}` };
}

async function verifySmtpConnection() {
  const transport = createTransport();
  if (!transport) {
    console.warn('\x1b[33m[EMAIL SERVICE]\x1b[0m SMTP_USER/SMTP_APP_PASS not set — running in simulation mode.');
    return false;
  }
  try {
    await transport.verify();
    console.log('\x1b[32m[EMAIL SERVICE]\x1b[0m SMTP verified — real emails will be sent.');
    return true;
  } catch (err) {
    console.error(`\x1b[31m[EMAIL SERVICE]\x1b[0m SMTP verify failed: ${err.message}`);
    return false;
  }
}

module.exports = { sendOtpEmail, verifySmtpConnection };
