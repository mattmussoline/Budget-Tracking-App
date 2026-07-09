import { describe, expect, it } from "vitest";
import { getProviderColor, getProviderColorMap } from "./provider-colors";

describe("provider colors", () => {
  it("assigns unique colors across a provider list when the palette has enough colors", () => {
    const providers = [
      "Ascension",
      "Augustine Institute",
      "Ave Maria Press",
      "Catholic Market",
      "EWTN",
      "Franciscan University",
      "Ignatius Press",
      "OSV"
    ];

    const colorMap = getProviderColorMap(providers);
    const colorKeys = providers.map((provider) => colorMap[provider].key);

    expect(new Set(colorKeys).size).toBe(providers.length);
  });

  it("respects saved provider color overrides before assigning open colors", () => {
    const colorMap = getProviderColorMap(["Ascension", "EWTN"], { Ascension: "blue" });

    expect(colorMap.Ascension).toBe(getProviderColor("Ascension", { Ascension: "blue" }));
    expect(colorMap.EWTN.key).not.toBe("blue");
  });
});
