"use client";

import { useEffect, useState } from "react";
import { Chrome } from "lucide-react";
import { allowedEmailDomainText } from "@/lib/auth/domain-access";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftSurface } from "@/components/ui/soft-surface";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "domain") {
      setMessage(`Please sign in with ${allowedEmailDomainText()}.`);
    }
  }, []);

  async function signInWithGoogle() {
    if (!hasSupabaseEnv) {
      setMessage("Supabase env vars are not configured yet. The dashboard is running in local demo mode.");
      return;
    }

    setIsSending(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });

    setIsSending(false);
    if (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <SoftSurface className="w-full max-w-md p-8">
        <div className="mb-8 grid gap-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl soft-inset-deep">
            <Chrome className="h-6 w-6 text-accent" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Licensing Budget</h1>
          <p className="text-muted">Use an Augustine Google account to manage fiscal-year content licensing spend.</p>
        </div>
        <div className="grid gap-5">
          <SoftButton type="button" variant="primary" disabled={isSending} onClick={signInWithGoogle}>
            <Chrome className="h-5 w-5" aria-hidden="true" />
            {isSending ? "Opening Google..." : "Continue with Google"}
          </SoftButton>
          {message ? <p className="text-center text-sm font-medium text-muted">{message}</p> : null}
        </div>
      </SoftSurface>
    </main>
  );
}
