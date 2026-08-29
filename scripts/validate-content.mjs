import fs from "node:fs";

const input = process.argv[2];
if (!input) {
  console.error(
    "Usage: node scripts/validate-content.mjs <content.json|content.jsonl> [--pilot] [--min-count=1000]",
  );
  process.exit(1);
}

const args = new Set(process.argv.slice(3));
const minCountArg = process.argv
  .slice(3)
  .find((arg) => arg.startsWith("--min-count="));
const minCount = minCountArg
  ? Number.parseInt(minCountArg.split("=")[1], 10)
  : 1000;
if (!Number.isInteger(minCount) || minCount < 1)
  throw new Error("--min-count must be a positive integer");

const raw = fs.readFileSync(input, "utf8").trim();
if (!raw) throw new Error("Content file is empty");

let entries;
if (input.endsWith(".jsonl")) {
  entries = raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(
          `Line ${index + 1} is not valid JSON: ${error.message}`,
        );
      }
    });
} else {
  const parsed = JSON.parse(raw);
  entries = Array.isArray(parsed) ? parsed : parsed.entries;
}
if (!Array.isArray(entries))
  throw new Error(
    "Content file must contain an array or an object with an entries array",
  );

const levels = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const counts = new Map();
const levelCounts = new Map();
const topicCounts = new Map();
const duplicates = new Set();
const seen = new Set();

for (const [index, entry] of entries.entries()) {
  const levelCode = entry?.levelCode ?? entry?.level;
  const required = {
    sourceCode: entry?.sourceCode,
    targetCode: entry?.targetCode,
    levelCode,
    topic: entry?.topic,
    sourceText: entry?.sourceText,
    targetText: entry?.targetText,
    license: entry?.license,
    sourceUrl: entry?.sourceUrl,
  };
  for (const [field, value] of Object.entries(required)) {
    if (typeof value !== "string" || !value.trim())
      throw new Error(`Entry ${index + 1} is missing ${field}`);
  }
  if (!levels.has(levelCode))
    throw new Error(`Entry ${index + 1} has an invalid CEFR level`);
  if (entry.sourceCode === entry.targetCode)
    throw new Error(
      `Entry ${index + 1} must use distinct source/target languages`,
    );
  if (!/^https?:\/\//i.test(entry.sourceUrl))
    throw new Error(`Entry ${index + 1} must use an HTTP(S) sourceUrl`);

  const key = `${entry.sourceCode}->${entry.targetCode}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
  const levelKey = `${key}|${levelCode}`;
  levelCounts.set(levelKey, (levelCounts.get(levelKey) ?? 0) + 1);
  const topicKey = `${key}|${levelCode}|${entry.topic.trim()}`;
  topicCounts.set(topicKey, (topicCounts.get(topicKey) ?? 0) + 1);
  const duplicateKey = `${key}|${levelCode}|${entry.sourceText}|${entry.targetText}`;
  if (seen.has(duplicateKey)) duplicates.add(duplicateKey);
  seen.add(duplicateKey);
}

if (duplicates.size)
  throw new Error(`Duplicate entries detected: ${duplicates.size}`);
const belowThreshold = [...counts.entries()].filter(
  ([, count]) => count < minCount,
);
const result = {
  entries: entries.length,
  pairs: counts.size,
  counts: Object.fromEntries(counts),
  levelCounts: Object.fromEntries(levelCounts),
  topicCounts: Object.fromEntries(topicCounts),
  licenses: [...new Set(entries.map((entry) => entry.license))],
  belowThreshold,
  mode: args.has("--pilot") ? "pilot" : "production-readiness",
  minCount,
};
console.log(JSON.stringify(result, null, 2));
if (belowThreshold.length && !args.has("--pilot")) process.exitCode = 2;
