"use client";

import { useActionState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { allowedEmailDomainText } from "@/lib/auth/domain-access";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { login } from "@/features/budget/auth-actions";

export default function LoginPage() {
  const [message, formAction, isPending] = useActionState(login, null);

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between gap-10 bg-augustine-blue p-12 text-white lg:flex xl:p-16">
        <span className="font-display text-2xl">Licensing</span>
        <div className="grid max-w-lg gap-5">
          <h1 className="font-display text-5xl leading-[1.06] xl:text-6xl">
            Every title, rate, and quarter in one place.
          </h1>
          <p className="text-base leading-7 text-soft-slate">
            The licensing budget, content roadmap, and review queue for Formed &mdash; kept current by the
            people who actually make the decisions.
          </p>
        </div>
        <p className="text-sm text-soft-slate/70">Augustine Institute &middot; Internal tool</p>
      </div>

      <div className="grid place-items-center bg-parchment px-6 py-12">
        <div className="grid w-full max-w-md gap-7">
          <div className="grid gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-soft bg-formed-blue-soft">
              <KeyRound className="h-5 w-5 text-formed-blue" aria-hidden="true" />
            </span>
            <h2 className="font-display text-4xl leading-[1.1]">Sign in</h2>
            <p className="text-sm text-muted">Use your Augustine email and the shared internal password.</p>
          </div>

          <form action={formAction} className="grid gap-4">
            <SoftInput
              label="Work email"
              name="email"
              type="email"
              surface="white"
              placeholder={`name${allowedEmailDomainText().split(" or ")[0]}`}
              autoComplete="email"
              required
            />
            <SoftInput
              label="Shared password"
              name="password"
              type="password"
              surface="white"
              autoComplete="current-password"
              required
            />
            <SoftButton type="submit" variant="primary" className="mt-1" disabled={isPending}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Signing in..." : "Sign in"}
            </SoftButton>
            {message ? <p className="text-center text-sm font-medium text-danger">{message}</p> : null}
          </form>

          <p className="text-sm leading-6 text-faint">
            Only <span className="font-semibold text-muted">{allowedEmailDomainText()}</span> addresses can sign in.
          </p>
        </div>
      </div>
    </main>
  );
}
