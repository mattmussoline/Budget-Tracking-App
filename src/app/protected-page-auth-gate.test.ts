import { describe, expect, it, vi, beforeEach } from "vitest";

// Regression guard for the signed-out 500. These pages used to start the Supabase
// query and the session check together in one Promise.all. Promise.all settles on
// the FIRST rejection, so a failing Supabase call could beat the redirect and
// surface as a 500 instead of sending the visitor to /login.
//
// Here Supabase rejects immediately and the session check rejects a tick later.
// Under the old racing code the Supabase error won; the pages must now redirect.

const redirectError = () => {
  const error = new Error("NEXT_REDIRECT");
  (error as Error & { digest: string }).digest = "NEXT_REDIRECT;replace;/login;307;";
  return error;
};

const supabaseCalls: string[] = [];

vi.mock("@/lib/auth/internal-auth-server", () => ({
  requireInternalSession: vi.fn(async () => {
    await Promise.resolve();
    throw redirectError();
  })
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from(table: string) {
      supabaseCalls.push(table);
      const rejecting = Promise.reject(new Error("supabase fetch failed"));
      // Keep the rejection handled so an unawaited branch cannot crash the run.
      rejecting.catch(() => {});
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => rejecting,
        then: rejecting.then.bind(rejecting),
        catch: rejecting.catch.bind(rejecting)
      };
      return chain;
    }
  })
}));

const pages: [string, () => Promise<{ default: (props: never) => Promise<unknown> }>][] = [
  ["/dashboard", () => import("./dashboard/page")],
  ["/content-review", () => import("./content-review/page")],
  ["/roadmap", () => import("./roadmap/page")],
  ["/coproduction", () => import("./coproduction/page")]
];

describe("protected pages gate on the session before querying Supabase", () => {
  beforeEach(() => {
    supabaseCalls.length = 0;
  });

  it.each(pages)("%s redirects to /login when signed out, even if Supabase fails", async (_route, load) => {
    const { default: Page } = await load();

    const error = await Page({ searchParams: Promise.resolve({}) } as never).then(
      () => null,
      (thrown: unknown) => thrown
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error & { digest?: string }).digest).toMatch(/^NEXT_REDIRECT/);
    expect((error as Error).message).not.toBe("supabase fetch failed");
    // Signed out, the page must not have reached Supabase at all.
    expect(supabaseCalls).toEqual([]);
  });
});
