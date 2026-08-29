import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "client/src/index.css",
    description: "foco visible global",
    pattern: /:focus-visible/,
  },
  {
    file: "client/src/pages/Home.tsx",
    description: "diálogo de diagnóstico con nombre accesible",
    pattern:
      /role=["']dialog["'][\s\S]*aria-modal=["']true["'][\s\S]*aria-labelledby=/,
  },
  {
    file: "client/src/pages/Home.tsx",
    description: "controles de formulario etiquetados",
    pattern: /htmlFor=/,
  },
  {
    file: "client/src/components/DashboardLayout.tsx",
    description: "botón de navegación móvil con nombre accesible",
    pattern: /aria-label=/,
  },
  {
    file: "client/src/pages/NotFound.tsx",
    description: "ruta de salida semántica",
    pattern: /<Button[\s\S]*onClick=/,
  },
  {
    file: "client/src/pages/Home.tsx",
    view: "dashboard",
    description: "navegación principal con botones semánticos y foco global",
    pattern: /aria-label="Navegación principal"[\s\S]*<button[\s\S]*onClick=/,
  },
  {
    file: "client/src/pages/Home.tsx",
    view: "idiomas",
    description: "selectores origen/destino y tarjetas de idioma como botones",
    pattern:
      /pair-route[\s\S]*<Select[\s\S]*language-grid[\s\S]*<button type="button"/,
  },
  {
    file: "client/src/pages/Home.tsx",
    view: "práctica",
    description: "ejercicio con control de texto etiquetado y botón siguiente",
    pattern:
      /aria-label=\{exercise\.type === "fill_blank"[\s\S]*button-dark full-button/,
  },
  {
    file: "client/src/pages/Home.tsx",
    view: "repaso",
    description: "tarjeta SRS con botones de valoración",
    pattern:
      /function ReviewView[\s\S]*onReview\(card\.id, "again"\)[\s\S]*onReview\(card\.id, "easy"\)/,
  },
  {
    file: "client/src/pages/Home.tsx",
    view: "perfil",
    description: "fieldset de objetivos y controles etiquetados",
    pattern:
      /<fieldset className="target-language-options"[\s\S]*<legend>[\s\S]*htmlFor="feedback-message"/,
  },
];

const failures = [];
for (const check of checks) {
  const source = await readFile(check.file, "utf8");
  if (!check.pattern.test(source)) failures.push(check);
}

const result = {
  checked: checks.map(({ file, view, description }) => ({
    file,
    view,
    description,
  })),
  passed: failures.length === 0,
  failures: failures.map(({ file, view, description }) => ({
    file,
    view,
    description,
  })),
};

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
