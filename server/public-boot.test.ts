import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public boot contract", () => {
  it("keeps a root and a non-blank fallback for early production failures", async () => {
    const html = await readFile(
      resolve(process.cwd(), "client/index.html"),
      "utf8",
    );

    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain("data-lingua-forge-boot");
    expect(html).toContain("LinguaForge no pudo cargar");
    expect(html).toContain('window.addEventListener("error"');
    expect(html).toContain("unhandledrejection");
  });
});
