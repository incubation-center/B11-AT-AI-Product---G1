import type { AuthActionTemplateInput } from "../../types/resend";

const EMAIL_STYLES = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  textColor: "#374151",
  headingColor: "#111827",
  mutedColor: "#6b7280",
  buttonBg: "#111827",
  buttonColor: "#ffffff",
  borderColor: "#e5e7eb",
  borderRadius: "8px",
} as const;

export function buildAuthActionTemplate(input: AuthActionTemplateInput): string {
  const introText = input.introText ?? "Please use the button below:";
  const footerNote = input.footerNote ?? "If you didn't request this, you can safely ignore this email.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${input.heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:${EMAIL_STYLES.fontFamily};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:${EMAIL_STYLES.borderRadius};box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid ${EMAIL_STYLES.borderColor};">
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:600;line-height:1.3;color:${EMAIL_STYLES.headingColor};">
                ${input.heading}
              </h1>
              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${EMAIL_STYLES.textColor};">
                ${introText}
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="border-radius:6px;background-color:${EMAIL_STYLES.buttonBg};">
                    <a href="${input.actionUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:${EMAIL_STYLES.buttonColor};text-decoration:none;">
                      ${input.actionText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px 0;font-size:13px;color:${EMAIL_STYLES.mutedColor};">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-size:13px;word-break:break-all;">
                <a href="${input.actionUrl}" style="color:#2563eb;text-decoration:none;">${input.actionUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid ${EMAIL_STYLES.borderColor};">
              <p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_STYLES.mutedColor};">
                ${footerNote}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
