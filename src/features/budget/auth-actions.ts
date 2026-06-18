"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { allowedEmailDomainText, isAllowedWorkEmail, normalizeWorkEmail } from "@/lib/auth/domain-access";
import {
  canAccessApp,
  createInternalSessionToken,
  getSessionCookieOptions,
  internalAdminEmail,
  internalSessionCookieName,
  requireInternalSession,
  verifyAppPassword
} from "@/lib/auth/internal-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const inviteSchema = z.object({
  email: z.string().email()
});

function redirectWithError(error: string): never {
  redirect(`/login?error=${encodeURIComponent(error)}`);
}

export async function loginWithPassword(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWithError("credentials");
  }

  const email = normalizeWorkEmail(parsed.data.email);
  if (!isAllowedWorkEmail(email)) {
    redirectWithError("domain");
  }

  if (!(await verifyAppPassword(parsed.data.password))) {
    redirectWithError(process.env.APP_PASSWORD ? "credentials" : "missing-password");
  }

  if (!(await canAccessApp(email))) {
    redirectWithError("access");
  }

  const cookieStore = await cookies();
  cookieStore.set(internalSessionCookieName, await createInternalSessionToken(email), getSessionCookieOptions());
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(internalSessionCookieName);
  redirect("/login");
}

export async function inviteInternalUser(formData: FormData) {
  const session = await requireInternalSession();
  if (session.email !== internalAdminEmail) {
    throw new Error("Only Matt can invite users right now.");
  }

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error("Enter a valid email address.");
  }

  const email = normalizeWorkEmail(parsed.data.email);
  if (!isAllowedWorkEmail(email)) {
    throw new Error(`Invited users must use ${allowedEmailDomainText()} email addresses.`);
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service-role environment variables are required to save invites.");
  }

  const { error } = await admin.from("app_access_invites").upsert({
    email,
    invited_by_email: session.email
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard");
}
