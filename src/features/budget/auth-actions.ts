"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowedWorkEmail, normalizeWorkEmail } from "@/lib/auth/domain-access";
import { createInternalSessionCookie, internalSessionCookieName, verifyAppPassword } from "@/lib/auth/internal-auth";

export async function login(_previousState: string | null, formData: FormData) {
  const email = normalizeWorkEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!isAllowedWorkEmail(email) || !(await verifyAppPassword(password, process.env.APP_PASSWORD))) {
    return "Check the email and shared password.";
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: internalSessionCookieName,
    value: await createInternalSessionCookie({ email, secret: process.env.APP_PASSWORD! }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(internalSessionCookieName);
  redirect("/login");
}
