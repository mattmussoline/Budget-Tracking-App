"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSurface } from "@/components/ui/soft-surface";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseEnv) {
      setMessage("Supabase env vars are not configured yet. The dashboard is running in local demo mode.");
      return;
    }

    setIsSending(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    setIsSending(false);
    setMessage(error ? error.message : "Check your email for the sign-in link.");
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <SoftSurface className="w-full max-w-md p-8">
        <div className="mb-8 grid gap-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl soft-inset-deep">
            <Mail className="h-6 w-6 text-accent" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Licensing Budget</h1>
          <p className="text-muted">Sign in to manage fiscal-year content licensing spend.</p>
        </div>
        <form className="grid gap-5" onSubmit={signIn}>
          <SoftInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <SoftButton type="submit" variant="primary" disabled={isSending}>
            {isSending ? "Sending..." : "Send sign-in link"}
          </SoftButton>
          {message ? <p className="text-center text-sm font-medium text-muted">{message}</p> : null}
        </form>
      </SoftSurface>
    </main>
  );
}
