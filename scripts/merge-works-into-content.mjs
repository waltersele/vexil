/**
 * Appends tmp-works-manifest.json entries into each service's works[] in content.mjs
 */
import { readFile, writeFile } from "fs/promises";

const contentPath = "src/content.mjs";
const manifest = JSON.parse(await readFile("tmp-works-manifest.json", "utf8"));
let src = await readFile(contentPath, "utf8");

// content.mjs exports services as objects with "path": "slug" and "works": [...]
for (const [slug, items] of Object.entries(manifest)) {
  if (!items.length) continue;

  // Locate the service object by its slug field, then find its works array closing
  const pathMarker = `"slug": "${slug}"`;
  // Prefer the services export entry (appears after navServices)
  const servicesExport = src.indexOf("export const services");
  let pathIdx = src.indexOf(pathMarker, servicesExport >= 0 ? servicesExport : 0);
  if (pathIdx < 0) {
    console.warn("SKIP service not found:", slug);
    continue;
  }

  // Find works array start after this slug (within ~8k chars should be enough)
  const window = src.slice(pathIdx, pathIdx + 12000);
  const worksKey = window.match(/"works"\s*:\s*\[/);
  if (!worksKey) {
    console.warn("SKIP no works array:", slug);
    continue;
  }
  const worksAbsStart = pathIdx + worksKey.index + worksKey[0].length - 1; // at '['

  // Walk brackets to find matching ]
  let depth = 0;
  let end = -1;
  for (let i = worksAbsStart; i < src.length; i++) {
    const ch = src[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) {
    console.warn("SKIP unclosed works:", slug);
    continue;
  }

  const existing = src.slice(worksAbsStart, end + 1);
  const already = new Set(
    [...existing.matchAll(/"img"\s*:\s*"([^"]+)"/g)].map((m) => m[1])
  );
  const toAdd = items.filter((it) => !already.has(it.img));
  if (!toAdd.length) {
    console.log("OK (already)", slug);
    continue;
  }

  const insert = toAdd
    .map(
      (it) => `
          {
                "img": ${JSON.stringify(it.img)},
                "alt": ${JSON.stringify(it.alt)},
                "caption": ${JSON.stringify(it.caption)}
          }`
    )
    .join(",");

  // Insert before closing ]
  const beforeClose = src.slice(worksAbsStart, end).trimEnd();
  const needsComma = !beforeClose.endsWith(",") && beforeClose !== "[";
  const replacement =
    beforeClose + (needsComma ? "," : "") + insert + "\n    ]";

  src = src.slice(0, worksAbsStart) + replacement + src.slice(end + 1);
  console.log("ADDED", slug, toAdd.length);
}

await writeFile(contentPath, src);
console.log("Wrote", contentPath);
