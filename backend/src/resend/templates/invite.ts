import { buildAuthActionTemplate } from "./base";

export function buildInviteTemplate(inviteUrl: string): string {
  return buildAuthActionTemplate({
    heading: "You're invited",
    actionText: "Accept invitation",
    actionUrl: inviteUrl,
    introText: "You've been invited to join. Click the button below to get started.",
    footerNote: "This invitation was sent to you by a team member.",
  });
}
