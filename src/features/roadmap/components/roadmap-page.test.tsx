import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapPage } from "./roadmap-page";

describe("RoadmapPage", () => {
  it("shows genre key labels inside the colored items", () => {
    render(<RoadmapPage />);

    const key = screen.getByLabelText("Roadmap color key");

    for (const label of ["Adults", "Kids / Teens/YA", "In Discussion", "Strategic Need", "Manual"]) {
      const labelElement = within(key).getByText(label);

      expect(labelElement.className).not.toContain("sr-only");
    }
  });
});
