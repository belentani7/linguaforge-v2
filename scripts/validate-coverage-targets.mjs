import { readFile } from "node:fs/promises";
const manifest = JSON.parse(
  await readFile("content/coverage-targets.json", "utf8"),
);
const languageCodes = manifest.languages.map(({ code }) => code);
const expectedPairs = new Set(
  languageCodes.flatMap((source) =>
    languageCodes
      .filter((target) => target !== source)
      .map((target) => `${source}->${target}`),
  ),
);
const actualPairs = new Set(manifest.pairs);
const failures = [];
if (languageCodes.length !== 10)
  failures.push(`expected 10 languages, got ${languageCodes.length}`);
if (actualPairs.size !== 90)
  failures.push(`expected 90 unique pairs, got ${actualPairs.size}`);
for (const pair of expectedPairs)
  if (!actualPairs.has(pair)) failures.push(`missing pair ${pair}`);
for (const pair of actualPairs)
  if (!expectedPairs.has(pair)) failures.push(`unexpected pair ${pair}`);
if (
  !Number.isInteger(manifest.perPairMinimum) ||
  manifest.perPairMinimum < 1000
)
  failures.push("perPairMinimum must be at least 1000");
if (manifest.levels.length !== 6) failures.push("six CEFR levels required");
if (manifest.topics.length < 3) failures.push("at least three topics required");
console.log(
  JSON.stringify(
    {
      languages: languageCodes.length,
      pairs: actualPairs.size,
      perPairMinimum: manifest.perPairMinimum,
      levels: manifest.levels,
      topics: manifest.topics.length,
      failures,
      passed: failures.length === 0,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
