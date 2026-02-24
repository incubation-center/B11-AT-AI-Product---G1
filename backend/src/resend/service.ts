import { Resend } from "resend";
import { buildInviteTemplate, buildResetPasswordTemplate, buildVerifyEmailTemplate } from "./templates";
import { env } from "../env";

const resendApiKey = env.RESEND_API_KEY;
const resendFromEmail = env.RESEND_FROM_EMAIL;
const resend = new Resend(resendApiKey);

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: resendFromEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

export async function sendVerifyEmail(input: { to: string; verifyUrl: string }) {
  await sendEmail({
    to: input.to,
    subject: "Verify your email",
    html: buildVerifyEmailTemplate(input.verifyUrl),
  });
}

export async function sendResetPasswordEmail(input: { to: string; resetUrl: string }) {
  await sendEmail({
    to: input.to,
    subject: "Reset your password",
    html: buildResetPasswordTemplate(input.resetUrl),
  });
}

export async function sendInviteEmail(input: { to: string; inviteUrl: string }) {
  await sendEmail({
    to: input.to,
    subject: "You are invited",
    html: buildInviteTemplate(input.inviteUrl),
  });
}
