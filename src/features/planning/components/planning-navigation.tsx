"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useEffect } from "react";
import { cn } from "@/components/ui/soft-surface";

export type PlanningSection = "dashboard" | "roadmap" | "content-review" | "coproduction";

type PlanningNavigationProps = {
  activeSection: PlanningSection;
  routePrefix?: "" | "/demo";
};

/**
 * Each section lists the path it has under every route prefix. A section with
 * no entry for a prefix has no page there and is left out of the navigation,
 * which is how Co-Production stays demo-only until the signed-in route exists
 * rather than offering a link that would 404.
 */
const planningSections = [
  { label: "Roadmap", section: "roadmap", paths: { "": "/roadmap", "/demo": "/demo/roadmap" } },
  { label: "Licensing Summary", section: "dashboard", paths: { "": "/dashboard", "/demo": "/demo/dashboard" } },
  { label: "Content Review", section: "content-review", paths: { "": "/content-review", "/demo": "/demo/content-review" } },
  { label: "Co-Production", section: "coproduction", paths: { "/demo": "/demo/coproduction" } }
] as const;

type PlanningRoute =
  | "/roadmap"
  | "/dashboard"
  | "/content-review"
  | "/demo/roadmap"
  | "/demo/dashboard"
  | "/demo/content-review"
  | "/demo/coproduction";

function sectionHref(section: (typeof planningSections)[number], routePrefix: "" | "/demo"): PlanningRoute | null {
  const paths: Partial<Record<"" | "/demo", PlanningRoute>> = section.paths;
  return paths[routePrefix] ?? null;
}

export function PlanningNavigation({ activeSection, routePrefix = "" }: PlanningNavigationProps) {
  const router = useRouter();

  useEffect(() => {
    for (const section of planningSections) {
      const href = sectionHref(section, routePrefix);
      if (href && section.section !== activeSection) router.prefetch(href);
    }
  }, [activeSection, routePrefix, router]);

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Planning sections">
      {planningSections.map((section) => {
        const href = sectionHref(section, routePrefix);
        if (!href) return null;

        const isActive = section.section === activeSection;

        return (
          <Link
            key={section.section}
            href={href}
            prefetch
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold transition",
              isActive ? "bg-panel text-augustine-blue" : "bg-formed-blue text-white hover:bg-white/20"
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
