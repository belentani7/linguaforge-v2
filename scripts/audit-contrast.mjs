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
      message.error
        ? resolver.reject(new Error(JSON.stringify(message.error)))
        : resolver.resolve(message.result);
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
  await sleep(1100);
  const evaluated = await call("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
    const parse = (value) => { const match = value.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/); return match ? { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] } : null; };
    const luminance = ({r,g,b}) => { const c = [r,g,b].map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; };
    const ratio = (fg, bg) => { const a = luminance(fg), b = luminance(bg); return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05); };
    const visible = (el) => { const rect = el.getBoundingClientRect(); const style = getComputedStyle(el); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && (el.innerText || '').trim().length > 0; };
    const background = (el) => { let node = el; while (node) { const color = parse(getComputedStyle(node).backgroundColor); if (color && color.a > 0) return color; node = node.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
    const candidates = [...document.querySelectorAll('h1,h2,h3,h4,p,button,a,label,span,small,legend')].filter(visible).slice(0, 500);
    const findings = [];
    for (const el of candidates) { const style = getComputedStyle(el); const fg = parse(style.color); const bg = background(el); if (!fg || !bg) continue; const value = ratio(fg, bg); const size = parseFloat(style.fontSize); const large = size >= 24 || (size >= 18 && (style.fontWeight === '700' || style.fontWeight === 'bold')); const threshold = large ? 3 : 4.5; if (value + 0.01 < threshold) findings.push({ tag: el.tagName.toLowerCase(), text: el.innerText.trim().replace(/\\s+/g, ' ').slice(0, 80), ratio: Number(value.toFixed(2)), threshold, color: style.color, background: style.backgroundColor }); }
    return { route: location.pathname, checked: candidates.length, findings };
  })()`,
  });
  results.push(evaluated.result.value);
}
const failures = results.flatMap((result) =>
  result.findings.map((finding) => ({ route: result.route, ...finding })),
);
console.log(
  JSON.stringify(
    {
      baseUrl,
      routes: results,
      failureCount: failures.length,
      failures,
      passed: failures.length === 0,
    },
    null,
    2,
  ),
);
socket.close();
