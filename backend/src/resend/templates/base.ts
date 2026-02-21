export type AuthActionTemplateInput = {
  heading: string;
  actionText: string;
  actionUrl: string;
  introText?: string;
};

export function buildAuthActionTemplate(input: AuthActionTemplateInput): string {
  const introText = input.introText ?? "Please use the button below:";
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;">
      <h2>${input.heading}</h2>
      <p>${introText}</p>
      <p>
        <a href="${input.actionUrl}" style="background:#111827;color:#ffffff;padding:10px 14px;text-decoration:none;border-radius:6px;">
          ${input.actionText}
        </a>
      </p>
      <p>If the button does not work, open this URL:</p>
      <p>${input.actionUrl}</p>
    </div>
  `;
}
