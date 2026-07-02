import Link from "next/link";
import React from "react";
import { cn } from "@/components/ui/soft-surface";

export type PlanningSection = "dashboard" | "roadmap" | "content-review";

type PlanningNavigationProps = {
  activeSection: PlanningSection;
};

const planningSections = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/roadmap", label: "Roadmap", section: "roadmap" },
  { href: "/content-review", label: "Content Review", section: "content-review" }
] as const;

export function PlanningNavigation({ activeSection }: PlanningNavigationProps) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Planning sections">
      {planningSections.map(({ href, label, section }) => {
        const isActive = section === activeSection;

        return (
          <Link
            key={section}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-extrabold transition",
              isActive ? "bg-white text-blue-700" : "bg-blue-400 text-white hover:bg-white/20"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
