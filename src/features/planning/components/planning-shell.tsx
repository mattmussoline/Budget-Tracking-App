import Link from "next/link";
import type { ReactNode } from "react";

type PlanningShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  fiscalYearLabel?: string;
  children: ReactNode;
};

export function PlanningShell({ title, eyebrow, description, fiscalYearLabel, children }: PlanningShellProps) {
  return (
    <main className="min-h-screen bg-white px-5 py-6 md:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="rounded-lg bg-blue-500 p-8 text-white md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-blue-100">{eyebrow}</p>
              <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">{title}</h1>
              {fiscalYearLabel ? <p className="mt-3 text-sm font-extrabold text-blue-100">{fiscalYearLabel}</p> : null}
            </div>
            <div className="grid max-w-xl gap-4">
              <p className="text-base font-semibold leading-7 text-blue-50">{description}</p>
              <nav className="flex flex-wrap gap-2" aria-label="Planning sections">
                <Link className="rounded-md bg-white px-3 py-2 text-sm font-extrabold text-blue-700" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="rounded-md bg-blue-400 px-3 py-2 text-sm font-extrabold text-white hover:bg-white/20" href="/roadmap">
                  Roadmap
                </Link>
                <Link className="rounded-md bg-blue-400 px-3 py-2 text-sm font-extrabold text-white hover:bg-white/20" href="/content-review">
                  Content Review
                </Link>
              </nav>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
