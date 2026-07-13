import { describe, expect, it } from "vitest";
import { buildContentUploadDescription } from "./clickup";

describe("buildContentUploadDescription", () => {
  it("adds roadmap format and genre to the ClickUp description", () => {
    expect(buildContentUploadDescription({
      title: "Aquinas 101",
      provider: "Thomistic Institute",
      genre: "Scripture",
      format: "Formation Series",
      releaseDate: "2027-01-24"
    })).toContain("Genre: Scripture\nFormat: Formation Series");
  });
});
