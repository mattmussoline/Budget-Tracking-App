import { describe, expect, it } from "vitest";
import { createInternalSessionCookie, verifyAppPassword, verifyInternalSessionCookie } from "./internal-auth";

describe("internal app auth", () => {
  it("accepts only the configured shared password", async () => {
    expect(await verifyAppPassword("open-sesame", "open-sesame")).toBe(true);
    expect(await verifyAppPassword("wrong", "open-sesame")).toBe(false);
  });

  it("creates a signed session cookie that can be verified", async () => {
    const cookie = await createInternalSessionCookie({
      email: "Matt.Mussoline@AugustineInstitute.org",
      secret: "shared-secret"
    });

    const session = await verifyInternalSessionCookie(cookie, "shared-secret");

    expect(session?.email).toBe("matt.mussoline@augustineinstitute.org");
    expect(session?.userId).toHaveLength(36);
  });

  it("rejects tampered session cookies", async () => {
    const cookie = await createInternalSessionCookie({
      email: "matt.mussoline@augustineinstitute.org",
      secret: "shared-secret"
    });

    await expect(verifyInternalSessionCookie(`${cookie.slice(0, -2)}xx`, "shared-secret")).resolves.toBeNull();
  });
});
