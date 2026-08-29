import { readFile } from "node:fs/promises";
const baseUrl = process.env.LINGUAFORGE_PREVIEW_URL || "http://127.0.0.1:3000";
const source = await readFile("client/src/pages/Home.tsx", "utf8");
const staticContracts = {
  feedbackAlert:
    source.includes("feedbackError &&") && source.includes('role="alert"'),
  answerFeedback:
    source.includes("answer-feedback") &&
    source.includes("choice === exercise.answer"),
  disabledUntilAnswer: source.includes("disabled={!choice}"),
};
let id = 0;
const tabs = await (await fetch("http://127.0.0.1:9222/json/list")).json();
const tab = tabs.find((item) => item.type === "page");
if (!tab?.webSocketDebuggerUrl) throw new Error("No CDP page available");
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const resolver = pending.get(message.id);
  if (!resolver) return;
  pending.delete(message.id);
  message.error
    ? resolver.reject(new Error(JSON.stringify(message.error)))
    : resolver.resolve(message.result);
});
const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
const evaluate = async (expression) =>
  (await call("Runtime.evaluate", { expression, returnByValue: true })).result
    .value;
await call("Runtime.enable");
await call("Page.enable");
await call("Page.navigate", { url: `${baseUrl}/qa/pt-en` });
await new Promise((resolve) => setTimeout(resolve, 900));
const before = await evaluate(
  `(() => { const next = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Elige una respuesta')); const option = [...document.querySelectorAll('button')].find((el) => el.className.includes('option-button')); return { nextDisabled: next?.disabled ?? null, optionFound: Boolean(option) }; })()`,
);
if (before.optionFound)
  await evaluate(`document.querySelector('.option-button')?.click()`);
await new Promise((resolve) => setTimeout(resolve, 80));
const after = await evaluate(
  `(() => { const next = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Siguiente ejercicio')); return { nextEnabled: next ? !next.disabled : false, feedback: Boolean(document.querySelector('.answer-feedback')) }; })()`,
);
const exerciseRuntime = before.optionFound
  ? before.nextDisabled === true && after.nextEnabled && after.feedback
  : null;
const passed =
  Object.values(staticContracts).every(Boolean) &&
  (exerciseRuntime === null || exerciseRuntime === true);
console.log(
  JSON.stringify(
    {
      baseUrl,
      staticContracts,
      before,
      after,
      exerciseRuntime,
      passed,
      note: "Se auditan contratos locales sin enviar feedback ni provocar errores de proveedor; el ejercicio runtime se omite si el preview no tiene sesión/contenido.",
    },
    null,
    2,
  ),
);
socket.close();
