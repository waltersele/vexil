/**
 * Ingesta lote Oct 2026: vehículos nuevos + reemplazo interior La Ibense.
 * node scripts/ingest-batch-oct6.mjs
 */
import sharp from "sharp";
import { readdir } from "fs/promises";
import { join } from "path";

const upload = "C:/Users/walco/.cursor/projects/c-webproject-vexil-web/assets";
const out = "public/assets";
const files = await readdir(upload);

function find(...parts) {
  const hits = files.filter((f) => parts.every((p) => f.toLowerCase().includes(p.toLowerCase())));
  if (!hits.length) throw new Error(`No match: ${parts.join(" + ")}`);
  // Prefer the longest / most recent UUID-looking filename from this chat batch
  hits.sort((a, b) => b.length - a.length);
  return join(upload, hits[0]);
}

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

const jobs = [
  // Reemplazo interior La Ibense
  ["trabajo-interiorismo-03", ["11.29.33__7_"]],

  // Vehículos nuevos
  ["trabajo-vehiculos-17", ["IMG_20220510_143344"]],
  ["trabajo-vehiculos-18", ["1666034844318"]],
  ["trabajo-vehiculos-19", ["1666034843702"]],
  ["trabajo-vehiculos-20", ["IMG-20181005-WA0005"]],
  ["trabajo-vehiculos-21", ["IMG-20190822-WA0000"]],
  ["trabajo-vehiculos-22", ["11.29.34-"]],
  ["trabajo-vehiculos-23", ["IMG-20181017-WA0013"]],

  // Fachada Domani
  ["trabajo-fachadas-19", ["IMG_20220407_171428"]],

  // Interiores HM
  ["trabajo-interiorismo-13", ["IMG_20220916_113320"]],
  ["trabajo-interiorismo-14", ["IMG_20220916_114350"]],
  ["trabajo-interiorismo-15", ["IMG-20200320-WA0066"]],

  // Freezer La Ibense → impresión / stands
  ["trabajo-impresion-14", ["IMG-20190718-WA0023"]],

  // Corte BYBO en mesa + metacrilato BB
  ["trabajo-corte-08", ["IMG-20191211-WA0009"]],
  ["trabajo-corte-09", ["11.29.35__1_"]],
];

for (const [name, parts] of jobs) {
  try {
    await w(find(...parts), name);
  } catch (e) {
    console.warn("SKIP", name, e.message);
  }
}
