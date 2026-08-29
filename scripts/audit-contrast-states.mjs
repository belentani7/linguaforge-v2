const routes = [
  "/",
  "/languages",
  "/practice",
  "/review",
  "/profile",
  "/lesson",
  "/exercise",
  "/review-session",
  "/404",
  "/qa/pt-en",
  "/qa-dark/dashboard",
  "/qa-dark/languages",
  "/qa-dark/profile",
  "/qa-dark/practice",
  "/qa-dark/review",
  "/qa-dark/lesson",
  "/qa-dark/exercise",
];
const baseUrl = process.env.LINGUAFORGE_PREVIEW_URL || "http://127.0.0.1:3000";
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
const evaluate = async (expression) =>
  (await call("Runtime.evaluate", { expression, returnByValue: true })).result
    .value;
const key = async (keyName, code, vk) => {
  const payload = {
    key: keyName,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  };
  await call("Input.dispatchKeyEvent", { type: "keyDown", ...payload });
  await call("Input.dispatchKeyEvent", { type: "keyUp", ...payload });
};
const ratio = (fg, bg) => {
  const linear = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = (color) => {
    const [r, g, b] = color.match(/\d+/g).map(Number).map(linear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(fg);
  const b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const collect = async (state, selector) =>
  evaluate(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const style = getComputedStyle(el); const rect = el.getBoundingClientRect(); const parent = getComputedStyle(el.parentElement); return { text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 70), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, state: ${JSON.stringify(state)}, color: style.color, background: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? parent.backgroundColor : style.backgroundColor }; })()`,
  );
await call("Runtime.enable");
await call("Page.enable");
const findings = [];
for (const route of routes) {
  await call("Page.navigate", { url: `${baseUrl}${route}` });
  await sleep(900);
  const selectors = await evaluate(
    `(() => [...document.querySelectorAll('button,a,[role=button],input,select,textarea')].filter((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; }).slice(0, 25).map((el) => { el.dataset.lfContrastAudit = '1'; return '[data-lf-contrast-audit="1"]'; }))()`,
  );
  for (const selector of selectors) {
    const states = [];
    const rest = await collect("rest", selector);
    if (rest) states.push(rest);
    await evaluate(
      `document.querySelector(${JSON.stringify(selector)})?.focus()`,
    );
    await sleep(30);
    const focus = await collect("focus", selector);
    if (focus) states.push(focus);
    const hover = rest;
    if (hover) {
      await call("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: hover.x,
        y: hover.y,
      });
      await sleep(30);
      const hovered = await collect("hover", selector);
      if (hovered) states.push(hovered);
      await call("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: hover.x,
        y: hover.y,
        button: "left",
        clickCount: 1,
      });
      await sleep(20);
      const active = await collect("active", selector);
      if (active) states.push(active);
      await call("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: hover.x,
        y: hover.y,
        button: "left",
        clickCount: 1,
      });
    }
    findings.push(
      ...states.map((state) => ({
        route,
        ...state,
        ratio: ratio(state.color, state.background),
      })),
    );
    await key("Tab", "Tab", 9);
  }
}
const failures = findings.filter((item) => item.ratio < 4.49);
console.log(
  JSON.stringify(
    {
      baseUrl,
      checked: findings.length,
      failureCount: failures.length,
      failures,
      passed: failures.length === 0,
      note: "El auditor simula estados CSS en controles visibles de 17 rutas; no cubre todos los estados de validación ni lectores de pantalla.",
    },
    null,
    2,
  ),
);
socket.close();
