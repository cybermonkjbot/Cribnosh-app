// @ts-nocheck
import { mutation } from "../_generated/server";

const DEFAULT_TEMPLATES = [
  {
    templateId: "welcome",
    name: "Welcome Email",
    emailType: "welcome_message",
    isSystem: true,
    subject: "Welcome to CribNosh!",
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <title>Welcome to CribNosh</title>
</head>
<body style="background-color:#ffffff;margin:0;padding:20px">
  <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #E5E7EB;border-radius:12px;padding:32px;">
    <tbody>
      <tr>
        <td>
          <img alt="CribNosh Logo" height="40" src="https://cribnosh.com/logo.svg" style="display:block;margin:0 auto" width="155" />
          <h1 style="font-size:32px;font-weight:700;text-align:center;margin-top:24px;">Welcome to CribNosh!</h1>
          <p style="font-size:18px;line-height:1.6;color:#1A1A1A;">Hi {{userName}},</p>
          <p style="font-size:16px;line-height:1.6;color:#4B5563;">Thanks for joining CribNosh! We're building a platform where every meal is a vibe and every chef is a storyteller.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{actionUrl}}" style="background-color:#ff3b30;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:500;display:inline-block;">Get Started</a>
          </div>
          <footer style="text-align:center;border-top:1px solid #E5E7EB;padding-top:24px;margin-top:32px;font-size:12px;color:#6B7280;">
            <p>{{companyAddress}}</p>
            <p><a href="{{unsubscribeUrl}}" style="color:#ff3b30;">Unsubscribe</a></p>
          </footer>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`
  },
  {
    templateId: "otp-verification",
    name: "OTP Verification",
    emailType: "otp_verification",
    isSystem: true,
    subject: "Verify your email - {{otpCode}}",
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify your email</title>
</head>
<body style="font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
    <h2>Email Verification</h2>
    <p>Hi {{recipientName}},</p>
    <p>Your verification code is:</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f4f4f4; border-radius: 5px; margin: 20px 0;">
      {{otpCode}}
    </div>
    <p>This code will expire in {{expiryMinutes}} minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 12px; color: #888;">{{companyAddress}}</p>
  </div>
</body>
</html>`
  },
  {
    templateId: "account-deletion",
    name: "Account Deletion",
    emailType: "account_deletion",
    isSystem: true,
    subject: "Account Deletion Request Confirmed",
    htmlContent: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1>Account Deletion Request Received</h1>
    <p>Hi {{userName}},</p>
    <p>Your account deletion request has been received. Your account will be permanently deleted on <strong>{{deletionDate}}</strong>.</p>
    <p>If you change your mind, please contact support within 7 days.</p>
    <p>Best regards,<br>The CribNosh Team</p>
  </div>
</body>
</html>`
  },
  {
    templateId: "data-download",
    name: "Data Download",
    emailType: "data_download",
    isSystem: true,
    subject: "Your Data Download is Ready",
    htmlContent: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1>Your Data Download is Ready</h1>
    <p>Hi {{userName}},</p>
    <p>Your data download is ready. Click the link below to download your archive:</p>
    <p><a href="{{downloadUrl}}" style="padding: 10px 20px; background: #ff3b30; color: white; text-decoration: none; border-radius: 5px;">Download Data</a></p>
    <p>This link expires on {{expiresAt}}.</p>
  </div>
</body>
</html>`
  },
  {
    templateId: "family-invitation",
    name: "Family Invitation",
    emailType: "family_invitation",
    isSystem: true,
    subject: "You've been invited to join a family profile",
    htmlContent: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1>Family Profile Invitation</h1>
    <p>Hi {{userName}},</p>
    <p><strong>{{inviterName}}</strong> has invited you to join their family profile on CribNosh.</p>
    <p><a href="{{acceptUrl}}" style="padding: 10px 20px; background: #ff3b30; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
  </div>
</body>
</html>`
  },
  {
    templateId: "support-case",
    name: "Support Case Notification",
    emailType: "support_case",
    isSystem: true,
    subject: "Support Case Created: {{supportCaseRef}}",
    htmlContent: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1>Support Case Created</h1>
    <p>Hi {{userName}},</p>
    <p>Your support case <strong>{{supportCaseRef}}</strong> has been created regarding: {{subject}}</p>
    <p>We'll get back to you soon.</p>
  </div>
</body>
</html>`
  },
  {
    templateId: "review-received",
    name: "New Review Received",
    emailType: "review_received",
    isSystem: true,
    subject: "New {{rating}}-Star Review from {{customerName}}",
    htmlContent: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1>New Review Received</h1>
    <p>Hi {{userName}},</p>
    <p><strong>{{customerName}}</strong> left you a {{rating}}-star rating.</p>
    <p><em>"{{reviewText}}"</em></p>
  </div>
</body>
</html>`
  },
  {
    templateId: "password-reset",
    name: "Password Reset",
    emailType: "password_reset",
    isSystem: true,
    subject: "Reset your CribNosh password",
    htmlContent: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1>Reset Your Password</h1>
    <p>Hi {{userName}},</p>
    <p>We received a request to reset your password for your CribNosh account.</p>
    <p>Click the button below to reset your password. This link will expire in {{expiryHours}} hour(s).</p>
    <p><a href="{{resetUrl}}" style="padding: 10px 20px; background: #ff3b30; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p>Best regards,<br>The CribNosh Team</p>
  </div>
</body>
</html>`
  }
];

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    let createdCount = 0;
    let updatedCount = 0;

    for (const templateData of DEFAULT_TEMPLATES) {
      const existing = await ctx.db
        .query("emailTemplates")
        .withIndex("by_type", (q) => q.eq("emailType", templateData.emailType))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...templateData,
          updatedAt: Date.now(),
        });
        updatedCount++;
      } else {
        await ctx.db.insert("emailTemplates", {
          ...templateData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        createdCount++;
      }
    }

    return { createdCount, updatedCount };
  },
});
