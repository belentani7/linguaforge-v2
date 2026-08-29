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
let nextId = 0;
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
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await call("Runtime.evaluate", { expression, returnByValue: true })).result
    .value;
await call("Runtime.enable");
await call("Page.enable");
const results = [];
for (const route of routes) {
  await call("Page.navigate", { url: `${baseUrl}${route}` });
  await sleep(1100);
  const result = await evaluate(`(() => {
    const visible = (el) => { const rect = el.getBoundingClientRect(); const style = getComputedStyle(el); return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"; };
    const controls = [...document.querySelectorAll("button,a,input,select,textarea,[role=button]")].filter((el) => visible(el) && !el.disabled).slice(0, 80);
    const focusChecks = controls.map((el) => { el.focus(); const style = getComputedStyle(el); return { tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("name") || "").trim().replace(/\\s+/g, " ").slice(0, 80), focused: document.activeElement === el, focusVisible: style.outlineStyle !== "none" || style.outlineWidth !== "0px" || style.boxShadow !== "none" }; });
    const disabled = [...document.querySelectorAll("button:disabled,input:disabled,select:disabled,textarea:disabled")].filter(visible).map((el) => ({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 80), disabled: el.disabled === true }));
    return { route: location.pathname, controlCount: controls.length, focusFailures: focusChecks.filter((item) => !item.focused || !item.focusVisible), disabledFailures: disabled.filter((item) => !item.disabled), checkedDisabled: disabled.length };
  })()`);
  results.push(result);
}
await call("Page.navigate", { url: `${baseUrl}/languages` });
await sleep(1100);
const dialogStart = await evaluate(
  `(() => { const button = [...document.querySelectorAll("button")].find((el) => el.textContent?.includes("Hacer diagnóstico")); if (!button) return { found: false }; button.focus(); button.click(); return { found: true }; })()`,
);
await sleep(250);
const dialog = {
  ...dialogStart,
  opened: await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`),
};
const dialogFocused = await evaluate(
  `(() => { const dialog = document.querySelector('[role="dialog"]'); if (!dialog) return false; dialog.focus(); return true; })()`,
);
if (dialogFocused) {
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  });
  await call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  });
}
await sleep(150);
const closed = !(await evaluate(
  `Boolean(document.querySelector('[role="dialog"]'))`,
));
const failures = results.flatMap((result) =>
  [...result.focusFailures, ...result.disabledFailures].map((failure) => ({
    route: result.route,
    ...failure,
  })),
);
if (dialog.found && !dialog.opened)
  failures.push({
    route: "/languages",
    state: "dialog-open",
    message: "diagnostic dialog did not open",
  });
if (dialog.opened && !closed)
  failures.push({
    route: "/languages",
    state: "dialog-close",
    message: "diagnostic dialog did not close",
  });
console.log(
  JSON.stringify(
    {
      baseUrl,
      routes: results,
      dialog,
      closed,
      failureCount: failures.length,
      failures,
      passed: failures.length === 0,
    },
    null,
    2,
  ),
);
socket.close();
