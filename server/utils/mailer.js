const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send OTP verification email
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - User's name
 */
async function sendOtpEmail(to, otp, name) {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#f5f0ff;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(127,0,255,0.12);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#7F00FF 0%,#E100FF 100%);padding:36px 32px 32px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:10px 12px;margin-bottom:16px;">
          <span style="color:#fff;font-size:24px;">💬</span>
        </div>
        <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">DocuChat</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;">Email Verification</p>
      </div>

      <!-- Body -->
      <div style="padding:36px 32px;">
        <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hey <strong>${name}</strong> 👋</p>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
          Thanks for signing up! Use the verification code below to complete your registration. This code expires in <strong>5 minutes</strong>.
        </p>

        <!-- OTP Box -->
        <div style="background:linear-gradient(135deg,#faf5ff 0%,#f3e8ff 100%);border:2px solid #e9d5ff;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
          <p style="color:#7F00FF;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your Verification Code</p>
          <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#7F00FF;font-family:'Courier New',monospace;margin:0;">
            ${otp}
          </div>
        </div>

        <div style="background:#fef3c7;border-radius:12px;padding:14px 16px;margin:0 0 24px;display:flex;align-items:flex-start;">
          <span style="margin-right:10px;font-size:16px;">⚠️</span>
          <p style="color:#92400e;font-size:13px;line-height:1.5;margin:0;">
            If you didn't request this code, you can safely ignore this email. Never share your OTP with anyone.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#faf5ff;padding:20px 32px;text-align:center;border-top:1px solid #f3e8ff;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">
          Made with ❤️ by DocuChat &bull; AI-Powered Document Analysis
        </p>
      </div>
    </div>
  </body>
  </html>`;

  const mailOptions = {
    from: `"DocuChat" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🔐 ${otp} — Your DocuChat Verification Code`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP SENT SUCCESS to:', to);
  } catch (error) {
    console.log('OTP ERROR:', error.message || error);
    throw error; // re-throw so auth route returns 500
  }
}

module.exports = { sendOtpEmail };
