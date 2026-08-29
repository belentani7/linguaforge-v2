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
await call("Runtime.enable");
await call("Page.enable");
await call("Page.navigate", { url: `${baseUrl}/profile` });
await sleep(1000);
const result = await evaluate(
  `(() => { const textarea = document.querySelector('#feedback-message'); const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Enviar feedback')); if (!textarea || !button) return { found: false }; const setValue = (value) => { const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; setter.call(textarea, value); textarea.dispatchEvent(new Event('input', { bubbles: true })); }; setValue('corto'); const shortDisabled = button.disabled; setValue('Comentario suficientemente largo'); const validEnabled = !button.disabled; return { found: true, shortDisabled, validEnabled, minLength: 8 }; })()`,
);
await sleep(120);
const finalState = await evaluate(
  `(() => { const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Enviar feedback')); return { disabled: button?.disabled ?? null, alertCount: document.querySelectorAll('[role="alert"]').length }; })()`,
);
const passed =
  result.found &&
  result.shortDisabled &&
  result.validEnabled &&
  finalState.disabled === false;
console.log(
  JSON.stringify(
    {
      baseUrl,
      result,
      finalState,
      passed,
      note: "La respuesta de error del proveedor no se fabrica ni se fuerza; se verifica el contrato de validación local.",
    },
    null,
    2,
  ),
);
socket.close();
