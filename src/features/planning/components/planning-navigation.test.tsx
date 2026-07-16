import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanningNavigation } from "./planning-navigation";

const prefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch })
}));

describe("PlanningNavigation", () => {
  beforeEach(() => {
    prefetch.mockClear();
  });

  it("marks only the current section as the active page", () => {
    render(<PlanningNavigation activeSection="content-review" />);

    expect(screen.getByRole("link", { name: "Licensing Summary" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Roadmap" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Content Review" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Content Review" })).toHaveClass("bg-white", "text-blue-700");
  });

  it("keeps the navigation order consistent on every page", () => {
    render(<PlanningNavigation activeSection="dashboard" />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Roadmap",
      "Licensing Summary",
      "Content Review"
    ]);
  });

  it("warms the other planning pages before the user clicks them", () => {
    render(<PlanningNavigation activeSection="dashboard" />);

    expect(prefetch).toHaveBeenCalledWith("/roadmap");
    expect(prefetch).toHaveBeenCalledWith("/content-review");
    expect(prefetch).not.toHaveBeenCalledWith("/dashboard");
  });

  it("keeps demo navigation inside the public demo section", () => {
    render(<PlanningNavigation activeSection="dashboard" routePrefix="/demo" />);

    expect(screen.getByRole("link", { name: "Licensing Summary" })).toHaveAttribute("href", "/demo/dashboard");
    expect(screen.getByRole("link", { name: "Roadmap" })).toHaveAttribute("href", "/demo/roadmap");
    expect(screen.getByRole("link", { name: "Content Review" })).toHaveAttribute("href", "/demo/content-review");
    expect(prefetch).toHaveBeenCalledWith("/demo/roadmap");
    expect(prefetch).toHaveBeenCalledWith("/demo/content-review");
  });
});
