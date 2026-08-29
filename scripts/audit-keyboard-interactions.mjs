const baseUrl = process.env.LINGUAFORGE_PREVIEW_URL ?? "http://127.0.0.1:3000";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
await call("Runtime.enable");
await call("Page.enable");
const evaluate = async (expression) =>
  (await call("Runtime.evaluate", { expression, returnByValue: true })).result
    .value;
const key = async (keyName, code, vk) => {
  const payload = {
    key: keyName,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
    ...(vk === 13 ? { text: "\\r", unmodifiedText: "\\r" } : {}),
  };
  await call("Input.dispatchKeyEvent", { type: "keyDown", ...payload });
  await call("Input.dispatchKeyEvent", { type: "keyUp", ...payload });
};
const focusText = (text) =>
  evaluate(
    `(() => { const wanted = ${JSON.stringify(text)}; const el = [...document.querySelectorAll('button,a,[role="button"]')].find((node) => node.textContent?.replace(/\\s+/g, ' ').trim().includes(wanted)); if (!el) return false; el.focus(); return document.activeElement === el; })()`,
  );
const bodyHas = (text) =>
  evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);
const results = [];
async function route(path) {
  await call("Page.navigate", { url: `${baseUrl}${path}` });
  await sleep(1800);
}
await route("/");
const dashboardFocused = await focusText("Continuar aprendiendo");
await key(" ", "Space", 32);
await sleep(600);
results.push({
  scenario: "dashboard Space → práctica",
  focused: dashboardFocused,
  active: await evaluate(
    "document.querySelector('.nav-item.active')?.textContent?.trim() || ''",
  ),
  body: (await evaluate("document.body.innerText"))?.slice(0, 240),
  passed: dashboardFocused && (await bodyHas("PRÁCTICA LIBRE")),
});
await route("/");
const dashboardEnterFocused = await focusText("Continuar aprendiendo");
await key("Enter", "Enter", 13);
await sleep(600);
results.push({
  scenario: "dashboard Enter → práctica",
  focused: dashboardEnterFocused,
  active: await evaluate(
    "document.querySelector('.nav-item.active')?.textContent?.trim() || ''",
  ),
  passed: dashboardEnterFocused && (await bodyHas("PRÁCTICA LIBRE")),
});
await route("/languages");
const diagnosticFocused = await focusText("Hacer diagnóstico");
await key(" ", "Space", 32);
await sleep(250);
const opened = await evaluate(
  "Boolean(document.querySelector('[role=dialog]'))",
);
await evaluate("document.querySelector('[role=dialog]')?.focus()");
await key("Escape", "Escape", 27);
await sleep(150);
const closed = !(await evaluate(
  "Boolean(document.querySelector('[role=dialog]'))",
));
results.push({
  scenario: "idiomas Space abre diagnóstico y Escape lo cierra",
  focused: diagnosticFocused,
  opened,
  closed,
  passed: diagnosticFocused && opened && closed,
});
await route("/languages");
const diagnosticEnterFocused = await focusText("Hacer diagnóstico");
await key("Enter", "Enter", 13);
await sleep(250);
const enterOpened = await evaluate(
  "Boolean(document.querySelector('[role=dialog]'))",
);
await evaluate("document.querySelector('[role=dialog]')?.focus()");
await key("Escape", "Escape", 27);
await sleep(150);
results.push({
  scenario: "idiomas Enter abre diagnóstico",
  focused: diagnosticEnterFocused,
  opened: enterOpened,
  passed: diagnosticEnterFocused && enterOpened,
});
await route("/practice");
const practiceFocused = await focusText("Comenzar");
await key(" ", "Space", 32);
await sleep(1800);
results.push({
  scenario: "práctica Space → ejercicio",
  focused: practiceFocused,
  active: await evaluate(
    "document.querySelector('.nav-item.active')?.textContent?.trim() || ''",
  ),
  heading: await evaluate(
    "document.querySelector('h1')?.textContent?.trim() || ''",
  ),
  body: (await evaluate("document.body.innerText"))?.slice(0, 420),
  passed:
    practiceFocused &&
    ((await bodyHas("Pregunta 3 de 10")) ||
      (await bodyHas("Completa:")) ||
      (await bodyHas("Aún no hay ejercicios importados."))),
});
await route("/review");
const reviewFocused = await focusText("Repasar ahora");
await key(" ", "Space", 32);
await sleep(600);
results.push({
  scenario: "repaso Space → sesión",
  focused: reviewFocused,
  active: await evaluate(
    "document.querySelector('.nav-item.active')?.textContent?.trim() || ''",
  ),
  body: (await evaluate("document.body.innerText"))?.slice(0, 240),
  passed: reviewFocused && (await bodyHas("No hay tarjetas pendientes")),
});
await route("/profile");
const checkboxState = await evaluate(
  "(() => { const el = document.querySelector('input[type=checkbox]'); if (!el) return null; el.focus(); return { before: el.checked, focused: document.activeElement === el }; })()",
);
await key(" ", "Space", 32);
await sleep(100);
const checkboxAfter = await evaluate(
  "document.querySelector('input[type=checkbox]')?.checked",
);
results.push({
  scenario: "perfil Space alterna objetivo",
  focused: checkboxState?.focused ?? false,
  changed: checkboxState ? checkboxState.before !== checkboxAfter : false,
  passed: Boolean(
    checkboxState?.focused && checkboxState.before !== checkboxAfter,
  ),
});
console.log(
  JSON.stringify(
    { baseUrl, results, passed: results.every((result) => result.passed) },
    null,
    2,
  ),
);
socket.close();
