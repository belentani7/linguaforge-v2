import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [
  outputPath,
  manifestPath = `${outputPath}.manifest.json`,
  ...inputPaths
] = process.argv.slice(2);
if (!outputPath || inputPaths.length === 0)
  throw new Error(
    "Usage: node scripts/merge-content-batches.mjs <output-jsonl> [manifest-json] <input.jsonl> [...inputs]",
  );
const entries = [];
const byIdentity = new Map();
for (const inputPath of inputPaths) {
  const raw = (await readFile(inputPath, "utf8")).trim();
  for (const [lineIndex, line] of raw
    .split(/\r?\n/)
    .filter(Boolean)
    .entries()) {
    const entry = JSON.parse(line);
    const identity = [
      entry.sourceCode,
      entry.targetCode,
      entry.levelCode ?? entry.level,
      entry.topic,
      entry.sourceText,
      entry.targetText,
    ].join("\u0000");
    const provenance = [
      entry.license,
      entry.sourceUrl,
      entry.author,
      entry.attribution,
    ].join("\u0000");
    const existing = byIdentity.get(identity);
    if (existing && existing.provenance !== provenance)
      throw new Error(
        `Conflicting provenance for ${inputPath}:${lineIndex + 1}`,
      );
    if (existing) continue;
    byIdentity.set(identity, { provenance, inputPath });
    entries.push({ ...entry, levelCode: entry.levelCode ?? entry.level });
  }
}
const pairCounts = new Map();
const levelCounts = new Map();
const topicCounts = new Map();
for (const entry of entries) {
  const pair = `${entry.sourceCode}->${entry.targetCode}`;
  const level = `${pair}|${entry.levelCode}`;
  const topic = `${level}|${entry.topic}`;
  pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
  levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
  topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
}
await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });
await writeFile(
  outputPath,
  entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n",
  "utf8",
);
await writeFile(
  manifestPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      inputs: inputPaths,
      entries: entries.length,
      duplicatesRemoved: byIdentity.size - entries.length,
      pairCounts: Object.fromEntries(pairCounts),
      levelCounts: Object.fromEntries(levelCounts),
      topicCounts: Object.fromEntries(topicCounts),
      licenses: [...new Set(entries.map((entry) => entry.license))],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);
console.log(
  JSON.stringify(
    {
      outputPath,
      manifestPath,
      entries: entries.length,
      inputs: inputPaths.length,
    },
    null,
    2,
  ),
);
