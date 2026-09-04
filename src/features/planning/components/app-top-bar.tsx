import type { ReactNode } from "react";
import { PlanningNavigation, type PlanningSection } from "./planning-navigation";

type AppTopBarProps = {
  activeSection: PlanningSection;
  routePrefix?: "" | "/demo";
  /** Fiscal-year controls, account chip, and anything else that sits on the right. */
  right?: ReactNode;
};

/**
 * The slim application bar from the Sanctuary design: wordmark, section tabs,
 * and account-level controls on one warm hairline row. It replaces the tall
 * navy hero that used to carry the same links, so the page title below it is
 * the first large thing on every screen.
 */
export function AppTopBar({ activeSection, routePrefix = "", right }: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-panel-warm">
      <div className="mx-auto flex min-h-[62px] max-w-[1600px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-2 md:px-10">
        <div className="flex min-w-0 flex-wrap items-center gap-x-7 gap-y-1">
          <span className="font-display text-xl">Licensing</span>
          <PlanningNavigation activeSection={activeSection} routePrefix={routePrefix} />
        </div>
        {right ? <div className="relative flex min-w-0 flex-wrap items-center justify-end gap-2.5">{right}</div> : null}
      </div>
    </header>
  );
}

/** The warm outlined pill the top bar uses for read-only chips such as the fiscal year. */
export function TopBarChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg border border-hairline bg-panel px-3 py-1.5 text-[13px] font-semibold text-foreground">
      {children}
    </span>
  );
}

/** The hairline rule that separates groups of top-bar controls. */
export function TopBarDivider() {
  return <span aria-hidden="true" className="hidden h-5 w-px bg-hairline sm:block" />;
}
