import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it } from "vitest";
import { PlanningNavigation } from "./planning-navigation";

describe("PlanningNavigation", () => {
  it("marks only the current section as the active page", () => {
    render(<PlanningNavigation activeSection="content-review" />);

    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Roadmap" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Content Review" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Content Review" })).toHaveClass("bg-white", "text-blue-700");
  });

  it("keeps the navigation order consistent on every page", () => {
    render(<PlanningNavigation activeSection="dashboard" />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Roadmap",
      "Content Review"
    ]);
  });
});
