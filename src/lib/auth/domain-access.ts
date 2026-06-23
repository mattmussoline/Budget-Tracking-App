export const allowedEmailDomains = ["augustineinstitute.org", "augustine.edu"] as const;

export function normalizeWorkEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function isAllowedWorkEmail(email: string | null | undefined) {
  const normalizedEmail = normalizeWorkEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  const domain = normalizedEmail.split("@").at(-1);
  return Boolean(domain && allowedEmailDomains.includes(domain as (typeof allowedEmailDomains)[number]));
}

export function allowedEmailDomainText() {
  return allowedEmailDomains.map((domain) => `@${domain}`).join(" or ");
}
