import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentReviewDashboard } from "./content-review-dashboard";

describe("ContentReviewDashboard", () => {
  it("shows the review queue summary and opens a centered edit modal for a selected item", () => {
    render(<ContentReviewDashboard />);

    expect(screen.getByRole("heading", { name: "Content Review Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByText("Needs Review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs Decision").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ready for Roadmap").length).toBeGreaterThan(0);

    const queue = screen.getByRole("table", { name: "Content review queue" });
    expect(within(queue).getByText("Aquinas 101")).toBeInTheDocument();
    expect(within(queue).getByLabelText("Provider for Aquinas 101")).toHaveValue("Thomistic Institute");

    fireEvent.change(within(queue).getByLabelText("Provider for Aquinas 101"), { target: { value: "Other" } });
    expect(within(queue).getByLabelText("Provider for Aquinas 101")).toHaveValue("Other");

    fireEvent.click(within(queue).getByRole("button", { name: "Open Aquinas 101 review details" }));

    const modal = screen.getByRole("dialog", { name: "Aquinas 101" });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByLabelText("Title")).toHaveValue("Aquinas 101");
    expect(within(modal).getByLabelText("Release Date")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Review Notes")).toBeInTheDocument();
    expect(within(modal).queryByText("Roadmap Lane")).not.toBeInTheDocument();
    expect(within(modal).queryByText("Placement")).not.toBeInTheDocument();
    expect(within(modal).queryByText("Collection")).not.toBeInTheDocument();
  });
});
