import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PlanningShell } from "./planning-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch: vi.fn() })
}));

describe("PlanningShell", () => {
  it("puts the section links in the slim top bar, above the page title", () => {
    render(
      <PlanningShell title="Roadmap" description="Plan upcoming releases." activeSection="roadmap">
        <div>Page content</div>
      </PlanningShell>
    );

    const topBar = screen.getByRole("banner");

    expect(topBar).toContainElement(screen.getByRole("navigation", { name: "Planning sections" }));
    expect(topBar).not.toContainElement(screen.getByRole("heading", { name: "Roadmap" }));
    expect(screen.getByRole("heading", { name: "Roadmap" })).toHaveClass("font-display", "md:text-[2.5rem]");
  });

  it("renders top-bar controls and page actions in their own slots", () => {
    render(
      <PlanningShell
        title="Roadmap"
        description="Plan upcoming releases."
        activeSection="roadmap"
        topBarRight={<span>FY26</span>}
        actions={<button type="button">Add roadmap item</button>}
      >
        <div>Page content</div>
      </PlanningShell>
    );

    expect(screen.getByRole("banner")).toContainElement(screen.getByText("FY26"));
    expect(screen.getByRole("banner")).not.toContainElement(screen.getByRole("button", { name: "Add roadmap item" }));
  });

  it("leaves the page head to the child when no title is given", () => {
    render(
      <PlanningShell activeSection="roadmap">
        <h1>Content Review</h1>
      </PlanningShell>
    );

    expect(screen.getByRole("heading", { name: "Content Review" })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Planning sections" })).toBeVisible();
  });
});
