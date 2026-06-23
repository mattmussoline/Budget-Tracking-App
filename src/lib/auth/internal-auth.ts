import { normalizeWorkEmail } from "./domain-access";

export const internalSessionCookieName = "budget_app_session";
const sessionTtlMs = 12 * 60 * 60 * 1000;

export type InternalSession = {
  email: string;
  userId: string;
  expiresAt: number;
};

type CreateSessionOptions = {
  email: string;
  secret: string;
  now?: number;
};

export async function verifyAppPassword(candidate: string, expected: string | undefined) {
  if (!expected) {
    return false;
  }

  return timingSafeEqual(candidate, expected);
}

export async function createInternalSessionCookie({ email, secret, now = Date.now() }: CreateSessionOptions) {
  const normalizedEmail = normalizeWorkEmail(email);
  const payload: InternalSession = {
    email: normalizedEmail,
    userId: await deterministicUuidFromEmail(normalizedEmail),
    expiresAt: now + sessionTtlMs
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifyInternalSessionCookie(value: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!value || !secret) {
    return null;
  }

  const [encodedPayload, signature, extra] = value.split(".");
  if (!encodedPayload || !signature || extra) {
    return null;
  }

  const expectedSignature = await sign(encodedPayload, secret);
  if (!(await timingSafeEqual(signature, expectedSignature))) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(encodedPayload)) as InternalSession;
    if (!session.email || !session.userId || session.expiresAt <= now) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

async function deterministicUuidFromEmail(email: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  const bytes = [...new Uint8Array(digest)].slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return base64UrlEncodeBytes(new Uint8Array(signature));
}

async function timingSafeEqual(a: string, b: string) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (aBytes[index] ?? 0) ^ (bBytes[index] ?? 0);
  }

  return diff === 0;
}

function base64UrlEncode(value: string) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
