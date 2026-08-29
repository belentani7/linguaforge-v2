const baseUrl = process.env.LINGUAFORGE_PREVIEW_URL ?? "http://127.0.0.1:3000";
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let nextId = 0;

async function connect() {
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
    if (resolver) {
      pending.delete(message.id);
      if (message.error)
        resolver.reject(new Error(JSON.stringify(message.error)));
      else resolver.resolve(message.result);
    }
  });
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  return { socket, call };
}

const { socket, call } = await connect();
await call("Runtime.enable");
await call("Page.enable");
const results = [];
for (const route of routes) {
  await call("Page.navigate", { url: `${baseUrl}${route}` });
  await sleep(1000);
  const before = await call("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => ({ route: location.pathname, title: document.title, interactive: [...document.querySelectorAll('button,a,input,select,textarea,[tabindex]:not([tabindex="-1"])')].map((el) => ({ tag: el.tagName.toLowerCase(), name: el.getAttribute('aria-label') || el.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 60) || el.getAttribute('placeholder') || (el.id && document.querySelector('label[for="' + el.id + '"]')?.innerText?.trim()) || '' })) }))()`,
  });
  const focusTrail = [];
  for (let index = 0; index < 40; index += 1) {
    await call("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    await call("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
    });
    const focused = await call("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => { const el = document.activeElement; if (!el || el === document.body) return null; return { tag: el.tagName.toLowerCase(), name: el.getAttribute('aria-label') || el.innerText?.trim().replace(/\\s+/g, ' ').slice(0, 60) || el.getAttribute('placeholder') || (el.id && document.querySelector('label[for="' + el.id + '"]')?.innerText?.trim()) || '' }; })()`,
    });
    if (!focused.result) break;
    focusTrail.push(focused.result.value);
  }
  const unnamed = before.result.value.interactive.filter((item) => !item.name);
  results.push({
    route,
    interactiveCount: before.result.value.interactive.length,
    unnamedInteractiveCount: unnamed.length,
    unnamed,
    focusCount: focusTrail.length,
    focusTrail,
  });
}
console.log(
  JSON.stringify(
    {
      baseUrl,
      routes: results,
      passed: results.every(
        (item) => item.unnamedInteractiveCount === 0 && item.focusCount > 0,
      ),
    },
    null,
    2,
  ),
);
socket.close();
