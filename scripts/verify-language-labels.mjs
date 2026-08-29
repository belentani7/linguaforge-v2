import { readFile } from "node:fs/promises";

const file = "client/src/pages/Home.tsx";
const source = await readFile(file, "utf8");
const forbidden = [
  /ESPAÑOL\s*·\s*A2/,
  /actual de\s*\{?["']español["']\}?/i,
  /actual de español/i,
];
const failures = forbidden
  .filter((pattern) => pattern.test(source))
  .map((pattern) => pattern.toString());

const result = {
  file,
  checked: ["diagnostic language copy", "review language badge"],
  passed: failures.length === 0,
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
