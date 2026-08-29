import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [
  inputPath,
  outputPath = "content/tatoeba-batch.jsonl",
  sourceCode = "es",
  targetCode = "en",
  levelCode = "A1",
  topic = "vida cotidiana",
] = process.argv.slice(2);
if (!inputPath)
  throw new Error(
    "Usage: node scripts/prepare-tatoeba-batch.mjs <api-json> [output-jsonl] [source-code] [target-code] [level-code] [topic]",
  );
if (!/^[a-z]{2,3}$/.test(sourceCode) || !/^[a-z]{2,3}$/.test(targetCode))
  throw new Error(
    "source-code and target-code must be ISO-like lowercase codes",
  );
if (!/^[ABC][12]$/.test(levelCode))
  throw new Error("level-code must be A1, A2, B1, B2, C1 or C2");

const rawInput = await readFile(inputPath, "utf8");
let parsedInput;
try {
  parsedInput = JSON.parse(rawInput);
} catch {
  parsedInput = rawInput
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
const sentences = Array.isArray(parsedInput)
  ? parsedInput
  : (parsedInput.results ?? []);
const rows = [];
const seen = new Set();
for (const sentence of sentences) {
  const normalizedInput =
    typeof sentence.sourceText === "string" &&
    typeof sentence.targetText === "string";
  const translation = normalizedInput
    ? sentence
    : sentence.translations
        ?.flat()
        ?.find((item) => item.lang === targetCode && item.isDirect);
  const license = sentence.license;
  if (!translation || license !== "CC BY 2.0 FR") continue;
  if (sentence.audios?.length || translation.audios?.length) continue;
  const sourceText = String(
    normalizedInput ? sentence.sourceText : (sentence.text ?? ""),
  ).trim();
  const targetText = String(
    normalizedInput ? sentence.targetText : (translation.text ?? ""),
  ).trim();
  const key = `${sourceText}\u0000${targetText}`;
  if (!sourceText || !targetText || seen.has(key)) continue;
  seen.add(key);
  rows.push({
    sourceCode,
    targetCode,
    levelCode,
    topic,
    sourceText,
    targetText,
    exampleSource: sourceText,
    exampleTarget: targetText,
    license,
    sourceUrl:
      sentence.sourceUrl ??
      `https://tatoeba.org/en/sentences/show/${sentence.id}`,
    author: sentence.author ?? sentence.user?.username ?? "unknown",
    attribution:
      sentence.attribution ??
      `Tatoeba sentence ${sentence.id} by ${sentence.user?.username ?? "unknown"}`,
    importedAt: new Date().toISOString().slice(0, 10),
  });
}
if (rows.length === 0)
  throw new Error("No eligible CC BY 2.0 FR direct text translations found");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
  "utf8",
);
console.log(
  JSON.stringify(
    {
      outputPath,
      count: rows.length,
      sourceCode,
      targetCode,
      levelCode,
      topic,
      license: "CC BY 2.0 FR",
      audioExcluded: true,
      duplicatesRemoved: true,
    },
    null,
    2,
  ),
);
