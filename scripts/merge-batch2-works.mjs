/**
 * Merge tmp-batch2-manifest.json into content.mjs works arrays.
 */
import { readFile, writeFile } from "fs/promises";

const manifest = JSON.parse(await readFile("tmp-batch2-manifest.json", "utf8"));
let src = await readFile("src/content.mjs", "utf8");
const servicesExport = src.indexOf("export const services");

function fmt(it) {
  return `{
                "img": ${JSON.stringify(it.img)},
                "alt": ${JSON.stringify(it.alt)},
                "caption": ${JSON.stringify(it.caption)}
          }`;
}

for (const [slug, items] of Object.entries(manifest)) {
  if (!items.length) continue;
  const pathMarker = `"slug": "${slug}"`;
  const pathIdx = src.indexOf(pathMarker, servicesExport >= 0 ? servicesExport : 0);
  if (pathIdx < 0) {
    console.warn("SKIP not found", slug);
    continue;
  }
  const win = src.slice(pathIdx, pathIdx + 16000);
  const worksKey = win.match(/"works"\s*:\s*\[/);
  if (!worksKey) {
    console.warn("SKIP no works", slug);
    continue;
  }
  const worksAbsStart = pathIdx + worksKey.index + worksKey[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = worksAbsStart; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) {
    console.warn("SKIP unclosed", slug);
    continue;
  }

  const existing = src.slice(worksAbsStart, end + 1);
  const already = new Set([...existing.matchAll(/"img"\s*:\s*"([^"]+)"/g)].map((m) => m[1]));
  let toAdd = items.filter((it) => !already.has(it.img));
  if (!toAdd.length) {
    console.log("OK already", slug);
    continue;
  }

  // Rebuild works list: for rotulos, put Karey nave first
  const existingItems = [...existing.matchAll(/\{[\s\S]*?\}/g)].map((m) => m[0]);
  let newItems;
  if (slug === "rotulos" && toAdd.some((it) => it.img === "trabajo-rotulos-10.jpg")) {
    const karey = toAdd.find((it) => it.img === "trabajo-rotulos-10.jpg");
    const rest = toAdd.filter((it) => it.img !== "trabajo-rotulos-10.jpg");
    newItems = [fmt(karey), ...existingItems, ...rest.map(fmt)];
  } else if (slug === "fachadas" && toAdd.some((it) => it.img === "trabajo-fachadas-14.jpg")) {
    const karey = toAdd.find((it) => it.img === "trabajo-fachadas-14.jpg");
    const rest = toAdd.filter((it) => it.img !== "trabajo-fachadas-14.jpg");
    newItems = [fmt(karey), ...existingItems, ...rest.map(fmt)];
  } else {
    newItems = [...existingItems, ...toAdd.map(fmt)];
  }

  src =
    src.slice(0, worksAbsStart) +
    "[\n          " +
    newItems.join(",\n          ") +
    "\n    ]" +
    src.slice(end + 1);
  console.log("ADDED", slug, toAdd.length);
}

await writeFile("src/content.mjs", src);

// sanity import
const mod = await import("../src/content.mjs?" + Date.now());
for (const [k, s] of Object.entries(mod.services)) {
  console.log(k, s.works?.length || 0);
}
