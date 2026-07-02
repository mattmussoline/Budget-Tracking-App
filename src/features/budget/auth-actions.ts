"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessInternalApp } from "@/lib/auth/access-list";
import { normalizeWorkEmail } from "@/lib/auth/domain-access";
import { createInternalSessionCookie, internalSessionCookieName } from "@/lib/auth/internal-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function login(_previousState: string | null, formData: FormData) {
  const email = normalizeWorkEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const admin = createSupabaseAdminClient();

  const canAccess = await canAccessInternalApp({
    email,
    password,
    expectedPassword: process.env.APP_PASSWORD,
    isEmailOnAccessList: async (normalizedEmail) => {
      if (!admin) {
        return false;
      }

      const { data, error } = await admin
        .from("app_access_invites")
        .select("email")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return Boolean(data);
    }
  });

  if (!canAccess) {
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
