export const verificationEmail = ({ otp, userName, expiresInMinutes = 10 }) => ({
  subject: "Your Personal Cloud verification code",
  html: `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Code</title>
</head>
<body>
  <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div style="text-align:center;">
      <img src="https://your-cdn.com/logo.png" alt="Personal Cloud" width="120" style="margin-bottom:10px;"/>
      <h2 style="color:#2c3e50;">Email Verification</h2>
    </div>
    <p>Hello ${userName || "User"},</p>
    <p>Use the following <strong>one‑time password (OTP)</strong> to verify your email address. The code expires in <strong>${expiresInMinutes} minutes</strong>:</p>
    <p style="font-size:28px;font-weight:bold;color:#2980b9;text-align:center;letter-spacing:2px;">${otp}</p>
    <p>If you did not request this code, you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
    <p style="font-size:12px;color:#777;text-align:center;">
      © ${new Date().getFullYear()} Personal Cloud. All rights reserved.
    </p>
  </div>
</body>
</html>`
});
