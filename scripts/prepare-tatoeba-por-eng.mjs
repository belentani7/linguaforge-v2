import fs from "node:fs";

const inputPath = process.argv[2] ?? "/tmp/tatoeba-por-50.json";
const outputPath = process.argv[3] ?? "content/tatoeba-por-eng-a1.jsonl";
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const selected = [];
const seen = new Set();
for (const sentence of payload.data ?? []) {
  if (
    sentence.lang !== "por" ||
    sentence.is_unapproved ||
    sentence.license !== "CC BY 2.0 FR"
  )
    continue;
  const translation = (sentence.translations ?? []).find(
    (item) =>
      item.lang === "eng" &&
      !item.is_unapproved &&
      item.is_direct &&
      item.license === "CC BY 2.0 FR",
  );
  if (!translation || seen.has(sentence.id)) continue;
  const sourceText = sentence.text?.trim();
  const targetText = translation.text?.trim();
  if (
    !sourceText ||
    !targetText ||
    sourceText.length > 80 ||
    targetText.length > 120
  )
    continue;
  seen.add(sentence.id);
  selected.push({
    sourceCode: "pt",
    targetCode: "en",
    levelCode: "A1",
    topic: "vida cotidiana",
    sourceText,
    targetText,
    exampleSource: sourceText,
    exampleTarget: targetText,
    license: "CC BY 2.0 FR",
    sourceUrl: `https://tatoeba.org/en/sentences/show/${sentence.id}`,
    author: sentence.owner,
    attribution: `Tatoeba sentence ${sentence.id} by ${sentence.owner}`,
    importedAt: "2026-08-15",
  });
  if (selected.length === 5) break;
}
if (selected.length < 5)
  throw new Error(
    `Only ${selected.length} qualifying Portuguese-English pairs found`,
  );
fs.writeFileSync(
  outputPath,
  selected.map((item) => JSON.stringify(item)).join("\n") + "\n",
);
console.log(
  JSON.stringify(
    {
      outputPath,
      count: selected.length,
      ids: selected.map((item) => item.sourceUrl.split("/").pop()),
    },
    null,
    2,
  ),
);
