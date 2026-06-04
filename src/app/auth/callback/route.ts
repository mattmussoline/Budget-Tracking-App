import { NextResponse } from "next/server";
import { isAllowedWorkEmail } from "@/lib/auth/domain-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!next.startsWith("/")) {
    next = "/dashboard";
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getUser();

      if (!isAllowedWorkEmail(data.user?.email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=domain", requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
