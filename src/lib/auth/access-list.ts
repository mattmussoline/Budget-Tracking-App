import { isAllowedWorkEmail, normalizeWorkEmail } from "./domain-access";
import { verifyAppPassword } from "./internal-auth";

type AccessCheckOptions = {
  email: string;
  password: string;
  expectedPassword: string | undefined;
  isEmailOnAccessList: (email: string) => Promise<boolean>;
};

export async function canAccessInternalApp({
  email,
  password,
  expectedPassword,
  isEmailOnAccessList
}: AccessCheckOptions) {
  const normalizedEmail = normalizeWorkEmail(email);

  if (!isAllowedWorkEmail(normalizedEmail)) {
    return false;
  }

  if (!(await verifyAppPassword(password, expectedPassword))) {
    return false;
  }

  return isEmailOnAccessList(normalizedEmail);
}
