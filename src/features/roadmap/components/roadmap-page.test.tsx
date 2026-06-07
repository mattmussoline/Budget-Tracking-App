import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapPage } from "./roadmap-page";

describe("RoadmapPage", () => {
  it("shows category key labels inside the colored items", () => {
    render(<RoadmapPage />);

    const key = screen.getByLabelText("Roadmap category color key");

    for (const label of ["Adult", "Parish", "Kids", "In Discussion", "Strategic Need"]) {
      const labelElement = within(key).getByText(label);

      expect(labelElement.className).not.toContain("sr-only");
    }
  });
});
