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
const key = async (keyName, code, vk, modifiers = 0) => {
  const payload = {
    key: keyName,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
    modifiers,
  };
  await call("Input.dispatchKeyEvent", { type: "rawKeyDown", ...payload });
  await call("Input.dispatchKeyEvent", { type: "keyUp", ...payload });
};
await call("Runtime.enable");
await call("Page.enable");
await call("Page.navigate", { url: `${baseUrl}/` });
await sleep(1000);
const forward = [];
for (let index = 0; index < 8; index += 1) {
  await key("Tab", "Tab", 9);
  forward.push(
    await evaluate(
      "document.activeElement?.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 80) || document.activeElement?.getAttribute('aria-label') || ''",
    ),
  );
}
const beforeReverse = forward[forward.length - 1];
await key("Tab", "Tab", 9, 8);
const afterReverse = await evaluate(
  "document.activeElement?.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 80) || document.activeElement?.getAttribute('aria-label') || ''",
);
await call("Page.navigate", { url: `${baseUrl}/languages` });
await sleep(1000);
const dialogFocus = await evaluate(
  `(() => { const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Hacer diagnóstico')); if (!button) return { found: false }; button.focus(); button.click(); return { found: true }; })()`,
);
await sleep(250);
const dialogOpened = await evaluate(
  "Boolean(document.querySelector('[role=dialog]'))",
);
if (dialogOpened) {
  await evaluate("document.querySelector('[role=dialog]')?.focus()");
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
  await sleep(180);
}
const dialogClosed = !(await evaluate(
  "Boolean(document.querySelector('[role=dialog]'))",
));
const returnedFocus = await evaluate(
  "document.activeElement?.textContent?.includes('Hacer diagnóstico') || false",
);
const passed = Boolean(
  beforeReverse &&
    afterReverse &&
    beforeReverse !== afterReverse &&
    dialogFocus.found &&
    dialogOpened &&
    dialogClosed &&
    returnedFocus,
);
console.log(
  JSON.stringify(
    {
      baseUrl,
      forwardTrail: forward,
      beforeReverse,
      afterReverse,
      dialogFocus,
      dialogOpened,
      dialogClosed,
      returnedFocus,
      passed,
    },
    null,
    2,
  ),
);
socket.close();
