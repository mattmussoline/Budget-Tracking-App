import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { internalSessionCookieName, verifyInternalSessionCookie } from "./internal-auth";

export async function getInternalSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(internalSessionCookieName)?.value;

  return verifyInternalSessionCookie(cookie, process.env.APP_PASSWORD);
}

export async function requireInternalSession() {
  const session = await getInternalSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}
