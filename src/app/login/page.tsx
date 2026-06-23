"use client";

import { useActionState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { allowedEmailDomainText } from "@/lib/auth/domain-access";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSurface } from "@/components/ui/soft-surface";
import { login } from "@/features/budget/auth-actions";

export default function LoginPage() {
  const [message, formAction, isPending] = useActionState(login, null);

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <SoftSurface className="w-full max-w-md p-8">
        <div className="mb-8 grid gap-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl soft-inset-deep">
            <KeyRound className="h-6 w-6 text-accent" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Licensing Budget</h1>
          <p className="text-muted">Use your Augustine email and the shared internal password.</p>
        </div>
        <form action={formAction} className="grid gap-5">
          <SoftInput
            label="Work email"
            name="email"
            type="email"
            placeholder={`name${allowedEmailDomainText().split(" or ")[0]}`}
            autoComplete="email"
            required
          />
          <SoftInput label="Shared password" name="password" type="password" autoComplete="current-password" required />
          <SoftButton type="submit" variant="primary" disabled={isPending}>
            <Mail className="h-5 w-5" aria-hidden="true" />
            {isPending ? "Signing in..." : "Sign in"}
          </SoftButton>
          {message ? <p className="text-center text-sm font-medium text-muted">{message}</p> : null}
        </form>
      </SoftSurface>
    </main>
  );
}
