import { buildAuthActionTemplate } from "./base";

export function buildResetPasswordTemplate(resetUrl: string): string {
  return buildAuthActionTemplate({
    heading: "Reset your password",
    actionText: "Reset Password",
    actionUrl: resetUrl,
    introText: "Use this link to set a new password for your account.",
  });
}
