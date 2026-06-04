export const allowedEmailDomains = ["augustineinstitute.org", "augustine.edu"] as const;

export function isAllowedWorkEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const domain = email.split("@").at(-1)?.toLowerCase();
  return Boolean(domain && allowedEmailDomains.includes(domain as (typeof allowedEmailDomains)[number]));
}

export function allowedEmailDomainText() {
  return allowedEmailDomains.map((domain) => `@${domain}`).join(" or ");
}
