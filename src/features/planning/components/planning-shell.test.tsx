import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PlanningShell } from "./planning-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: vi.fn() })
}));

describe("PlanningShell", () => {
  it("uses the standardized page header scale", () => {
    render(
      <PlanningShell
        title="Roadmap"
        eyebrow="Internal Licensing"
        description="Plan upcoming releases."
        activeSection="roadmap"
      >
        <div>Page content</div>
      </PlanningShell>
    );

    expect(screen.getByRole("banner")).toHaveClass("h-64", "md:h-60", "p-6", "md:p-8");
    expect(screen.getByRole("heading", { name: "Roadmap" })).toHaveClass("text-3xl", "md:text-5xl");
    expect(screen.getByRole("navigation", { name: "Planning sections" }).parentElement).toHaveClass("self-end");
  });
});
