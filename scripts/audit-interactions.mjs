import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = join(process.cwd(), "client", "src");
const findings = [];
const interactiveEvent =
  /\bon(?:Click|KeyDown|MouseDown|PointerDown|KeyUp|Change|Submit)=/;
const semanticElement =
  /<(?:button|a|form|input|textarea|Button|Select|SelectTrigger|SelectContent|SelectItem|Link|SidebarMenuButton|DropdownMenuItem|DropdownMenuTrigger|DialogClose|Textarea|Input|Checkbox|Switch|TabsTrigger|AccordionTrigger|MenubarItem|Toggle|PaginationPrevious|PaginationLink|PaginationNext|label)\b|\brole=["'](?:button|link|form|group|tab|separator|menuitem|checkbox|switch|combobox|dialog)["']/;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!entry.isFile() || !path.endsWith(".tsx")) continue;

    const lines = (await readFile(path, "utf8")).split("\n");
    lines.forEach((line, index) => {
      if (!interactiveEvent.test(line)) return;
      const context = lines
        .slice(Math.max(0, index - 20), Math.min(lines.length, index + 3))
        .join(" ");
      if (!semanticElement.test(context)) {
        findings.push({
          file: relative(process.cwd(), path),
          line: index + 1,
          source: line.trim(),
        });
      }
    });
  }
}

await walk(root);
console.log(
  JSON.stringify(
    {
      checkedRoot: root,
      eventTypes: [
        "onClick",
        "onKeyDown",
        "onMouseDown",
        "onPointerDown",
        "onKeyUp",
        "onChange",
        "onSubmit",
      ],
      findings,
    },
    null,
    2,
  ),
);
if (findings.length > 0) process.exitCode = 1;
