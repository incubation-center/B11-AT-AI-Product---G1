import { buildAuthActionTemplate } from "./base";

export function buildResetPasswordTemplate(resetUrl: string): string {
  return buildAuthActionTemplate({
    heading: "Reset your password",
    actionText: "Reset Password",
    actionUrl: resetUrl,
    introText: "Use the button below to set a new password. This link expires after a short time.",
    footerNote: "If you didn't request a password reset, you can safely ignore this email.",
  });
}
