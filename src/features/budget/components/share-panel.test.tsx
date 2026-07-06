import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { SharePanel } from "./share-panel";

vi.mock("../budget-actions", () => ({
  addCollaborator: vi.fn(),
  removeCollaborator: vi.fn()
}));

describe("SharePanel", () => {
  it("starts collapsed by default", () => {
    render(
      <SharePanel
        allowedEmails={["matt.mussoline@augustineinstitute.org", "teammate@augustineinstitute.org"]}
        currentUserEmail="matt.mussoline@augustineinstitute.org"
      />
    );

    const panel = screen.getByText("Collaborators").closest("details");

    expect(panel).not.toHaveAttribute("open");
  });

  it("asks for confirmation before removing collaborator access", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <SharePanel
        allowedEmails={["matt.mussoline@augustineinstitute.org", "teammate@augustineinstitute.org"]}
        currentUserEmail="matt.mussoline@augustineinstitute.org"
      />
    );

    fireEvent.click(screen.getByText("Collaborators"));
    fireEvent.click(screen.getByRole("button", { name: "Remove teammate@augustineinstitute.org" }));

    expect(confirm).toHaveBeenCalledWith("Remove teammate@augustineinstitute.org from app access?");
  });
});
