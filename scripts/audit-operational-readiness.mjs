import fs from "node:fs";
import path from "node:path";

const baseUrl = (
  process.env.LINGUAFORGE_PREVIEW_URL ?? "http://127.0.0.1:3000"
).replace(/\/$/, "");
const distRoot = path.resolve("dist");
const blockedGates = {
  email: process.env.LINGUAFORGE_EMAIL_ENABLED !== "true",
  payments: process.env.LINGUAFORGE_PAYMENTS_ENABLED !== "true",
  externalCron: process.env.LINGUAFORGE_EXTERNAL_CRON_ENABLED !== "true",
  externalAnalytics:
    process.env.LINGUAFORGE_ANALYTICS_EXTERNAL_ENABLED !== "true",
};

function bytesUnder(root) {
  if (!fs.existsSync(root)) return 0;
  const stat = fs.statSync(root);
  if (stat.isFile()) return stat.size;
  return fs
    .readdirSync(root)
    .reduce((sum, entry) => sum + bytesUnder(path.join(root, entry)), 0);
}

const timestamp = Date.now();
const healthUrl = `${baseUrl}/api/trpc/system.health?input=${encodeURIComponent(JSON.stringify({ json: { timestamp } }))}`;
let health = { ok: false, status: 0, error: "not requested" };
try {
  const response = await fetch(healthUrl);
  const body = await response.json();
  health = {
    ok: response.ok && body?.result?.data?.json?.ok === true,
    status: response.status,
  };
} catch (error) {
  health = {
    ok: false,
    status: 0,
    error: error instanceof Error ? error.message : String(error),
  };
}

const buildBytes = bytesUnder(distRoot);
const result = {
  baseUrl,
  health,
  build: {
    exists: fs.existsSync(distRoot),
    bytes: buildBytes,
    megabytes: Number((buildBytes / 1024 / 1024).toFixed(2)),
  },
  blockedGates,
  rollback: { checkpointRequired: true, publishIsManual: true },
  productionReadiness: false,
  notes: [
    "Este auditor valida preview/local y no sustituye tráfico representativo publicado.",
    "El presupuesto y los límites del proveedor deben revisarse con datos reales antes de activar integraciones.",
  ],
};
console.log(JSON.stringify(result, null, 2));
if (
  !health.ok ||
  !result.build.exists ||
  Object.values(blockedGates).some((value) => !value)
)
  process.exitCode = 1;
