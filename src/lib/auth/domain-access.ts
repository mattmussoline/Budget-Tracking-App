export const allowedEmailDomains = ["augustineinstitute.org", "augustine.edu"] as const;

export function normalizeWorkEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAllowedWorkEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const domain = normalizeWorkEmail(email).split("@").at(-1);
  return Boolean(domain && allowedEmailDomains.includes(domain as (typeof allowedEmailDomains)[number]));
}

export function allowedEmailDomainText() {
  return allowedEmailDomains.map((domain) => `@${domain}`).join(" or ");
}
