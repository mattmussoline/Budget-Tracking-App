import type { ReactNode } from "react";
import { AppTopBar } from "./app-top-bar";
import type { PlanningSection } from "./planning-navigation";

type PlanningShellProps = {
  /**
   * Pages whose action buttons live in client state (Roadmap, Content Review)
   * leave these off and render {@link PageHead} themselves as their first child.
   */
  title?: string;
  description?: string;
  activeSection: PlanningSection;
  routePrefix?: "" | "/demo";
  /** Buttons that belong to the page itself, shown beside the page title. */
  actions?: ReactNode;
  /** Account-level controls for the top bar, such as the fiscal-year switcher. */
  topBarRight?: ReactNode;
  children: ReactNode;
};

export function PlanningShell({
  title,
  description,
  activeSection,
  routePrefix = "",
  actions,
  topBarRight,
  children
}: PlanningShellProps) {
  return (
    <div className="min-h-screen bg-parchment">
      <AppTopBar activeSection={activeSection} routePrefix={routePrefix} right={topBarRight} />
      <main className="mx-auto grid min-w-0 max-w-[1600px] gap-5 px-5 pb-12 pt-8 md:px-10">
        {title ? <PageHead title={title} description={description ?? ""} actions={actions} /> : null}
        {children}
      </main>
    </div>
  );
}

/**
 * The Sanctuary page head: a serif title with its one-line explanation on the
 * left, and the page's own actions baseline-aligned on the right.
 */
export function PageHead({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
      <div className="grid min-w-0 max-w-3xl gap-1.5">
        <h1 className="font-display text-3xl leading-[1.05] md:text-[2.5rem]">{title}</h1>
        <p className="text-sm text-muted [text-wrap:pretty]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
