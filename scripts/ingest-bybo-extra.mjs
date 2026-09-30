import sharp from "sharp";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const upload = "C:/Users/walco/.cursor/projects/c-webproject-vexil-web/assets";
const out = "public/assets";
const files = await readdir(upload);
const find = (...parts) => {
  const hit = files.find((f) => parts.every((p) => f.toLowerCase().includes(p.toLowerCase())));
  if (!hit) throw new Error("No match: " + parts.join("+"));
  return join(upload, hit);
};

async function w(src, name) {
  const jpg = join(out, `${name}.jpg`);
  await sharp(src)
    .rotate()
    .resize({ width: 1200, height: 900, fit: "cover", position: "centre" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(jpg);
  await sharp(jpg).webp({ quality: 80 }).toFile(join(out, `${name}.webp`));
  console.log("OK", name);
}

const items = [
  [
    "trabajo-fachadas-18",
    ["WhatsApp_Image_2026-09-30_at_11.29.33__4_"],
    "BYBO Studios",
    "Fachada BYBO Studios con letras corpóreas y vinilo",
    "fachadas",
  ],
  [
    "trabajo-rotulos-13",
    ["WhatsApp_Image_2026-09-30_at_11.29.33__4_"],
    "BYBO Studios",
    "Letras corpóreas BYBO y banderola circular",
    "rotulos",
  ],
  [
    "trabajo-interiorismo-12",
    ["WhatsApp_Image_2026-09-30_at_11.29.33__2_"],
    "BYBO · Beyond your body",
    "Letras corpóreas Beyond your body en pared",
    "interiorismo-comercial",
  ],
  [
    "trabajo-rotulos-14",
    ["WhatsApp_Image_2026-09-30_at_11.29.33__2_"],
    "Beyond your body",
    "Letras corpóreas Beyond your body",
    "rotulos",
  ],
];

const byService = {};
for (const [name, parts, caption, alt, service] of items) {
  await w(find(...parts), name);
  (byService[service] ||= []).push({ img: `${name}.jpg`, alt, caption });
}

let src = await readFile("src/content.mjs", "utf8");
const servicesExport = src.indexOf("export const services");

function fmt(it) {
  return `{
                "img": ${JSON.stringify(it.img)},
                "alt": ${JSON.stringify(it.alt)},
                "caption": ${JSON.stringify(it.caption)}
          }`;
}

for (const [slug, list] of Object.entries(byService)) {
  const pathIdx = src.indexOf(`"slug": "${slug}"`, servicesExport);
  const win = src.slice(pathIdx, pathIdx + 20000);
  const worksKey = win.match(/"works"\s*:\s*\[/);
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
  const existing = src.slice(worksAbsStart, end + 1);
  const already = new Set([...existing.matchAll(/"img"\s*:\s*"([^"]+)"/g)].map((m) => m[1]));
  const toAdd = list.filter((it) => !already.has(it.img));
  if (!toAdd.length) {
    console.log("already", slug);
    continue;
  }
  const existingItems = [...existing.matchAll(/\{[\s\S]*?\}/g)].map((m) => m[0]);
  const newItems = [...existingItems, ...toAdd.map(fmt)];
  src =
    src.slice(0, worksAbsStart) +
    "[\n          " +
    newItems.join(",\n          ") +
    "\n    ]" +
    src.slice(end + 1);
  console.log("ADDED", slug, toAdd.length);
}

await writeFile("src/content.mjs", src);
