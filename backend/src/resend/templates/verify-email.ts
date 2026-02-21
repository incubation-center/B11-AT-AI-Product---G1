import { buildAuthActionTemplate } from "./base";

export function buildVerifyEmailTemplate(verifyUrl: string): string {
  return buildAuthActionTemplate({
    heading: "Verify your email address",
    actionText: "Verify Email",
    actionUrl: verifyUrl,
    introText: "Confirm your email to finish setting up your account.",
    footerNote: "If you didn't create an account, you can safely ignore this email.",
  });
}
