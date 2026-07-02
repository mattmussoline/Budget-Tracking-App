import { describe, expect, it } from "vitest";
import { canAccessInternalApp } from "./access-list";

describe("internal app access list", () => {
  it("requires an allowed email, shared password, and access-list membership", async () => {
    const invitedEmails = new Set(["matt.mussoline@augustineinstitute.org"]);

    await expect(
      canAccessInternalApp({
        email: "matt.mussoline@augustineinstitute.org",
        password: "open-sesame",
        expectedPassword: "open-sesame",
        isEmailOnAccessList: async (email) => invitedEmails.has(email)
      })
    ).resolves.toBe(true);

    await expect(
      canAccessInternalApp({
        email: "other.person@augustineinstitute.org",
        password: "open-sesame",
        expectedPassword: "open-sesame",
        isEmailOnAccessList: async (email) => invitedEmails.has(email)
      })
    ).resolves.toBe(false);

    await expect(
      canAccessInternalApp({
        email: "matt.mussoline@gmail.com",
        password: "open-sesame",
        expectedPassword: "open-sesame",
        isEmailOnAccessList: async (email) => invitedEmails.has(email)
      })
    ).resolves.toBe(false);

    await expect(
      canAccessInternalApp({
        email: "matt.mussoline@augustineinstitute.org",
        password: "wrong",
        expectedPassword: "open-sesame",
        isEmailOnAccessList: async (email) => invitedEmails.has(email)
      })
    ).resolves.toBe(false);
  });
});
