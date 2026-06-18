import { LockKeyhole } from "lucide-react";
import { SoftButton } from "@/components/ui/soft-button";
import { SoftInput } from "@/components/ui/soft-input";
import { SoftSurface } from "@/components/ui/soft-surface";
import { allowedEmailDomainText } from "@/lib/auth/domain-access";
import { loginWithPassword } from "@/features/budget/auth-actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function loginMessage(error: string | undefined) {
  if (error === "domain") {
    return `Use an email ending in ${allowedEmailDomainText()}.`;
  }
  if (error === "access") {
    return "That email has not been invited yet.";
  }
  if (error === "missing-password") {
    return "APP_PASSWORD is not configured on the server yet.";
  }
  if (error === "credentials") {
    return "Check the email and shared password.";
  }
  return "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const message = loginMessage((await searchParams)?.error);

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <SoftSurface className="w-full max-w-md p-8">
        <div className="mb-8 grid gap-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-blue-500">
            <LockKeyhole className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Licensing Budget</h1>
          <p className="text-muted">Enter your internal email and the shared app password.</p>
        </div>
        <form action={loginWithPassword} className="grid gap-5">
          <SoftInput label="Email" name="email" type="email" placeholder="name@augustineinstitute.org" required />
          <SoftInput label="Password" name="password" type="password" autoComplete="current-password" required />
          <SoftButton type="submit" variant="primary">
            Continue
          </SoftButton>
          {message ? <p className="text-center text-sm font-medium text-red-700">{message}</p> : null}
        </form>
      </SoftSurface>
    </main>
  );
}
