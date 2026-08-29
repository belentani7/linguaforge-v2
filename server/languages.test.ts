import { describe, expect, it } from "vitest";
import {
  buildBidirectionalPaths,
  CEFR_LEVELS,
  LANGUAGE_CATALOG,
} from "../shared/languages";

describe("language catalog", () => {
  it("contains the ten supported languages with stable ISO metadata", () => {
    expect(LANGUAGE_CATALOG).toHaveLength(10);
    expect(LANGUAGE_CATALOG.map((language) => language.code)).toEqual([
      "es",
      "en",
      "zh",
      "hi",
      "ar",
      "pt",
      "bn",
      "ru",
      "ja",
      "fr",
    ]);
    expect(
      new Set(LANGUAGE_CATALOG.map((language) => language.iso639_2)).size,
    ).toBe(10);
  });

  it("creates every non-self direction exactly once", () => {
    const paths = buildBidirectionalPaths();
    expect(paths).toHaveLength(90);
    expect(
      paths.some(
        (path) => path.sourceLanguage === "pt" && path.targetLanguage === "es",
      ),
    ).toBe(true);
    expect(
      paths.some(
        (path) => path.sourceLanguage === "es" && path.targetLanguage === "pt",
      ),
    ).toBe(true);
    expect(
      paths.some((path) => path.sourceLanguage === path.targetLanguage),
    ).toBe(false);
  });

  it("keeps the six CEFR levels in progression order", () => {
    expect(CEFR_LEVELS.map((level) => level.code)).toEqual([
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
      "C2",
    ]);
    expect(CEFR_LEVELS.map((level) => level.sortOrder)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });
});
