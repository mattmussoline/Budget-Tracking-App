import { describe, expect, it } from "vitest";
import { getProviderColor, providerColorOptions } from "./provider-colors";

describe("provider colors", () => {
  it("offers enough automatic colors for a larger provider list", () => {
    expect(providerColorOptions).toHaveLength(22);
  });

  it("spreads common provider names across many colors", () => {
    const providers = [
      "Ignatius Press",
      "Herald Entertainment",
      "Augustine Institute",
      "Thomistic Institute",
      "Formed Now",
      "EWTN",
      "OSV",
      "Ascension",
      "Sophia Institute",
      "Word on Fire",
      "Catholic Answers",
      "Franciscan University",
      "St. Paul Center",
      "Ave Maria Press",
      "Loyola Press",
      "Paraclete Press",
      "Pauline Books",
      "Knights of Columbus"
    ];

    const uniqueColors = new Set(providers.map((provider) => getProviderColor(provider).key));

    expect(uniqueColors.size).toBeGreaterThanOrEqual(14);
  });
});
