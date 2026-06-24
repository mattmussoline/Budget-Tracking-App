import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ContentReviewDashboard } from "./content-review-dashboard";
import type { ContentReviewItem } from "../planning-types";

afterEach(cleanup);

const item: ContentReviewItem = {
  id: "review-1",
  title: "Aquinas 101",
  provider: "Thomistic Institute",
  genre: "Scripture",
  format: "Formation Series",
  reviewStatus: "approved",
  notes: "Strong formation fit.",
  proposedRateCents: 1200000,
  reviewLink: "https://example.com/review",
  comparableContent: "Symbolon"
};

describe("ContentReviewDashboard", () => {
  it("renders the compact decision queue and selected detail editor", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    expect(screen.getByRole("heading", { name: "Decision Queue" })).toBeVisible();
    expect(screen.getByLabelText("Detail Title")).toHaveValue("Aquinas 101");
    expect(screen.getByLabelText("Review Status")).toHaveValue("approved");
    expect(screen.getByLabelText("Proposed Rate")).toHaveValue("$12,000.00");
    expect(screen.getByLabelText("Genre")).toHaveValue("Scripture");
    expect(screen.getByLabelText("Format")).toHaveValue("Formation Series");
    expect(screen.getByLabelText("Review Link")).toHaveValue("https://example.com/review");
    expect(screen.getByLabelText("Comparable Content")).toHaveValue("Symbolon");
  });

  it("opens a blank unsaved draft from Add Content", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Add Content" }));

    expect(screen.getByRole("heading", { name: "New Content Review" })).toBeVisible();
    expect(screen.getByLabelText("Detail Title")).toHaveValue("");
  });

  it("offers the exact approved controlled options", () => {
    render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[item]} isDemo />);

    expect(screen.getByLabelText("Review Status")).toContainHTML("Not Started");
    expect(screen.getByLabelText("Genre")).toContainHTML("Christian Formation");
    expect(screen.getByLabelText("Format")).toContainHTML("Docu-Series");
    expect(screen.getByLabelText("Format")).toContainHTML("Ministry Resource");
  });
});
