import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { demoCoproductionOpportunities } from "../demo-coproduction";
import { CoproductionSlate } from "./coproduction-slate";

beforeAll(() => {
  // jsdom does not implement the dialog methods the modal calls.
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
    };
  }
});

afterEach(cleanup);

function renderSlate() {
  return render(<CoproductionSlate opportunities={demoCoproductionOpportunities} isDemo />);
}

describe("CoproductionSlate", () => {
  it("opens the slate with every opportunity as a card and nothing expanded", () => {
    renderSlate();

    expect(screen.getAllByRole("button", { name: /^Open details for/ })).toHaveLength(demoCoproductionOpportunities.length);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the reserve figure as the likelihood-weighted total, not the asking total", () => {
    renderSlate();

    // Asking total across the six live titles is $3.33M; weighted it is $1.43M.
    expect(screen.getByText("$3.33M")).toBeInTheDocument();
    expect(screen.getByText("$1.43M")).toBeInTheDocument();
  });

  it("explains the reserve figure when the info button is opened", () => {
    renderSlate();

    expect(screen.queryByText(/Expected cost, not committed cost/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "How the reserve figure is calculated" }));

    expect(screen.getByText(/Expected cost, not committed cost/)).toBeInTheDocument();
  });

  it("opens one opportunity as a pop-out carrying its grade and reasoning", () => {
    renderSlate();

    fireEvent.click(screen.getByRole("button", { name: "Open details for Table of Kings" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Table of Kings" })).toBeInTheDocument();
    // The partner shows in both the pop-out header and the metadata panel.
    expect(within(dialog).getAllByText("Sycamore Studios").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("90.8", { exact: false })).toBeInTheDocument();
    expect(within(dialog).getByText(/Two weeks on one stage with no location risk/)).toBeInTheDocument();
  });

  it("keeps update logging read-only on the demo page", () => {
    renderSlate();

    fireEvent.click(screen.getByRole("button", { name: "Open details for The Well" }));

    expect(screen.getByRole("textbox", { name: "Log an update on The Well" })).toBeDisabled();
  });

  it("reveals the grading standard behind a sub-score on request", () => {
    renderSlate();

    fireEvent.click(screen.getByRole("button", { name: "Open details for The Well" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByText(/Lands on a named fiscal-year pillar/)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "What we evaluate for Mission fit" }));

    expect(within(dialog).getByText(/Lands on a named fiscal-year pillar/)).toBeInTheDocument();
  });

  it("closes the pop-out and leaves the slate behind it intact", () => {
    renderSlate();

    fireEvent.click(screen.getByRole("button", { name: "Open details for The Well" }));
    fireEvent.click(screen.getByRole("button", { name: "Close The Well" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Open details for/ })).toHaveLength(demoCoproductionOpportunities.length);
  });

  it("narrows the slate to one stage", () => {
    renderSlate();

    fireEvent.click(screen.getByRole("button", { name: /^Negotiating/ }));

    expect(screen.getAllByRole("button", { name: /^Open details for/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Open details for The Well" })).toBeInTheDocument();
  });

  it("searches by partner as well as title", () => {
    renderSlate();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search opportunities" }), { target: { value: "kestrel" } });

    expect(screen.getAllByRole("button", { name: /^Open details for/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Open details for The Ninth Hour" })).toBeInTheDocument();
  });

  it("says so plainly when a filter matches nothing", () => {
    renderSlate();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search opportunities" }), { target: { value: "no such title" } });

    expect(screen.getByText(/Nothing matches that filter/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Open details for/ })).toHaveLength(0);
  });
});
