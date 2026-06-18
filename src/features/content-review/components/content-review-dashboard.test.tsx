import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentReviewDashboard } from "./content-review-dashboard";

describe("ContentReviewDashboard", () => {
  it("keeps the queue focused and moves approved or rejected content out of the decision queue", () => {
    render(<ContentReviewDashboard />);

    expect(screen.getByRole("heading", { name: "Content Review Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByText("Needs Review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs Decision").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ready for Roadmap").length).toBeGreaterThan(0);

    const queue = screen.getByRole("table", { name: "Content review queue" });
    expect(within(queue).getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
    expect(within(queue).getByRole("columnheader", { name: "Review Stage" })).toBeInTheDocument();
    expect(within(queue).getByRole("columnheader", { name: "Contract Status" })).toBeInTheDocument();
    expect(within(queue).queryByRole("columnheader", { name: "Provider" })).not.toBeInTheDocument();
    expect(within(queue).queryByRole("columnheader", { name: "Genre" })).not.toBeInTheDocument();
    expect(within(queue).queryByRole("columnheader", { name: "Format" })).not.toBeInTheDocument();
    expect(within(queue).queryByRole("columnheader", { name: "Audience" })).not.toBeInTheDocument();

    expect(within(queue).queryByText("Aquinas 101")).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("Approved content")).getByText("Aquinas 101")).toBeInTheDocument();
    expect(within(queue).getByText("Slugs and Bugs Christmas Special")).toBeInTheDocument();

    fireEvent.change(within(queue).getByLabelText("Review Stage for Slugs and Bugs Christmas Special"), { target: { value: "Approved" } });
    expect(within(queue).queryByText("Slugs and Bugs Christmas Special")).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("Approved content")).getByText("Slugs and Bugs Christmas Special")).toBeInTheDocument();

    fireEvent.click(within(queue).getByRole("button", { name: "Open Jesus Thirsts review details" }));

    const modal = screen.getByRole("dialog", { name: "Jesus Thirsts" });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByLabelText("Title")).toHaveValue("Jesus Thirsts");
    expect(within(modal).getByLabelText("Provider")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Genre")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Format")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Audience")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Release Date")).toBeInTheDocument();
    expect(within(modal).getByLabelText("Review Notes")).toBeInTheDocument();
    expect(within(modal).queryByText("Roadmap Lane")).not.toBeInTheDocument();
    expect(within(modal).queryByText("Placement")).not.toBeInTheDocument();
    expect(within(modal).queryByText("Collection")).not.toBeInTheDocument();

    fireEvent.change(within(modal).getByLabelText("Review Stage"), { target: { value: "Rejected" } });
    fireEvent.click(within(modal).getByRole("button", { name: "Save Changes" }));
    expect(within(queue).queryByText("Jesus Thirsts")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(within(queue).getByRole("button", { name: "Open The Rescue Project review details" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "The Rescue Project" })).getByRole("button", { name: "Delete Content" }));
    expect(screen.queryByText("The Rescue Project")).not.toBeInTheDocument();
  });
});
