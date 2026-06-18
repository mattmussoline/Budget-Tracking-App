import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAllowedWorkEmail, normalizeWorkEmail } from "./domain-access";

export const internalAdminEmail = "matt.mussoline@augustineinstitute.org";
export const internalSessionCookieName = "budget_app_session";

const sessionMaxAgeSeconds = 60 * 60 * 12;

type InternalSessionPayload = {
  email: string;
  exp: number;
};

export type InternalSession = {
  email: string;
  isAdmin: boolean;
};

function getSessionSecret() {
  return process.env.APP_PASSWORD ?? "";
}

function base64UrlEncode(bytes: Uint8Array) {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export async function verifyAppPassword(password: string) {
  const configuredPassword = process.env.APP_PASSWORD;
  if (!configuredPassword) {
    return false;
  }

  const submittedHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  const configuredHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(configuredPassword));

  return constantTimeEqual(base64UrlEncode(new Uint8Array(submittedHash)), base64UrlEncode(new Uint8Array(configuredHash)));
}

export async function createInternalSessionToken(email: string) {
  const normalizedEmail = normalizeWorkEmail(email);
  const payload: InternalSessionPayload = {
    email: normalizedEmail,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds
  };
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifyInternalSessionToken(token: string | undefined) {
  if (!token || !getSessionSecret()) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await sign(encodedPayload);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as InternalSessionPayload;
    if (!isAllowedWorkEmail(payload.email) || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: normalizeWorkEmail(payload.email),
      isAdmin: normalizeWorkEmail(payload.email) === internalAdminEmail
    } satisfies InternalSession;
  } catch {
    return null;
  }
}

export async function getInternalSession() {
  const cookieStore = await cookies();
  return verifyInternalSessionToken(cookieStore.get(internalSessionCookieName)?.value);
}

export async function requireInternalSession() {
  const session = await getInternalSession();
  if (!session) {
    redirect("/login");
  }

  if (!(await canAccessApp(session.email))) {
    redirect("/login?error=access");
  }

  return session;
}

export function internalUserIdFromEmail(email: string) {
  const hash = createHash("sha256").update(normalizeWorkEmail(email)).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${(
    Number.parseInt(hash.slice(16, 18), 16) & 0x3f |
    0x80
  )
    .toString(16)
    .padStart(2, "0")}${hash.slice(18, 20)}-${hash.slice(20, 32)}`;
}

export async function canAccessApp(email: string) {
  const normalizedEmail = normalizeWorkEmail(email);
  if (normalizedEmail === internalAdminEmail) {
    return true;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return false;
  }

  const { data, error } = await admin.from("app_access_invites").select("email").eq("email", normalizedEmail).maybeSingle();
  return !error && Boolean(data);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionMaxAgeSeconds
  };
}
