import { buildAuthActionTemplate } from "./base";

export function buildInviteTemplate(inviteUrl: string): string {
  return buildAuthActionTemplate({
    heading: "You are invited",
    actionText: "Accept Invitation",
    actionUrl: inviteUrl,
    introText: "You have been invited to join. Click below to continue.",
  });
}
