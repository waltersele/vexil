/**
 * Regenera héroes + galerías de trabajos en public/assets.
 * node scripts/refresh-service-photos.mjs
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uploadDir = "C:\\Users\\walco\\.cursor\\projects\\c-webproject-vexil-web\\assets";
const outDir = join(root, "public", "assets");
const files = (await readdir(uploadDir)).filter((f) => /\.jpe?g$/i.test(f));

function find(...parts) {
  const hit = files.find((f) => parts.every((p) => f.toLowerCase().includes(p.toLowerCase())));
  if (!hit) throw new Error(`No match for ${parts.join(" + ")}`);
  return join(uploadDir, hit);
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download ${res.status}: ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function writeImg(src, basename, { w = 1600, h = 1067 } = {}) {
  const jpg = join(outDir, `${basename}.jpg`);
  const webp = join(outDir, `${basename}.webp`);
  await sharp(src)
    .rotate()
    .resize({ width: w, height: h, fit: "cover", position: "centre" })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(jpg);
  await sharp(jpg).webp({ quality: 80 }).toFile(webp);
  console.log("OK", basename);
}

await mkdir(outDir, { recursive: true });
const tmp = join(root, "tmp-stock");
await mkdir(tmp, { recursive: true });

const map = {
  // Héroes
  "servicio-fachadas": find("WhatsApp_Image_2026-05-13_at_13.02.35__5_"), // Carnes La Mancha
  "servicio-rotulos": find("WhatsApp_Image_2026-05-13_at_13.02.35__7_"), // Nuestro Pequeño Mundo
  "servicio-impresion-digital": find("IMG_3395"), // Tapiceros Hnos. Simón
  "servicio-vehiculos": find("IMG_20220510_143344"), // La Ibense furgón
  "servicio-interiorismo-comercial": find("IMG-20200320-WA0065"), // La Ibense interior
  "servicio-corte": find("IMG_20220715_100618"), // Monolito Cauchos Karey
  "servicio-stands": find("1666034844356"), // Pared modular SeaDek / ocevan
  "servicio-iluminacion-decorativa": find("WhatsApp_Image_2026-09-30_at_11.29.33__3_"), // BYBO retroiluminado
  "servicio-senaletica": find("IMG_20220721_115009"), // Parking Visitas
};

// Trabajos (galería)
const works = {
  "trabajo-fachadas-01": find("WhatsApp_Image_2026-05-13_at_13.02.35__2_"), // Arfis
  "trabajo-fachadas-02": find("WhatsApp_Image_2026-09-30_at_11.29.31__5_"), // Chocolatela
  "trabajo-fachadas-03": find("WhatsApp_Image_2026-09-30_at_11.29.31__6_"), // La Jijonenca
  "trabajo-fachadas-04": find("WhatsApp_Image_2026-09-30_at_11.29.36__3_"), // Bryan Stepwise
  "trabajo-fachadas-05": find("WhatsApp_Image_2026-09-30_at_11.29.32__6_"), // BYBO fachada noche

  "trabajo-rotulos-01": find("IMG_20220715_100618"), // Monolito Karey
  "trabajo-rotulos-02": find("1666034844264"), // Vituco
  "trabajo-rotulos-03": find("WhatsApp_Image_2026-09-30_at_11.29.32__6_"), // BYBO corpóreas
  "trabajo-rotulos-04": find("IMG_20210311_130849"), // Detalle letra n

  "trabajo-impresion-01": find("IMG_3395"), // Tapiceros
  "trabajo-impresion-02": find("WhatsApp_Image_2026-09-30_at_11.29.31__3_"), // Mercat
  "trabajo-impresion-03": find("IMG_20221020_095013"), // Powerturbines
  "trabajo-impresion-04": find("adhesivos-desierto-monegros"),

  "trabajo-vehiculos-01": find("IMG_20220208_133551"), // Anja Home
  "trabajo-vehiculos-02": find("IMG_20220531_134831"), // Carmovil
  "trabajo-vehiculos-03": find("IMG_20200728_213910"), // SORT tráiler
  "trabajo-vehiculos-04": find("IMG_20210428_162201"), // Crazy Events
  "trabajo-vehiculos-05": find("WhatsApp_Image_2026-09-30_at_11.29.31"), // ASENDA — may match several

  "trabajo-interiorismo-01": find("WhatsApp_Image_2026-09-30_at_11.29.33__3_"), // BYBO interior if this is it — risk
  "trabajo-interiorismo-02": find("IMG-20200221-WA0049"), // Antonio Muñoz Más
  "trabajo-interiorismo-03": find("WhatsApp_Image_2026-09-30_at_11.29.36__4_"), // Artesanía
  "trabajo-interiorismo-04": find("1666034843535"), // Karey cristales branding

  "trabajo-laminas-01": find("IMG_20220718_130617"), // J.M. Garcia ácido
  "trabajo-laminas-02": find("WhatsApp_Image_2026-05-13_at_13.02.35__1_"), // Sheila Sanchez
  "trabajo-laminas-03": find("WhatsApp_Image_2026-09-30_at_11.12.46__1_"), // oficina ácido
  "trabajo-laminas-04": find("IMG-20200221-WA0048-b3d909ea"), // SeaDek puerta ácido (one of two)
  "trabajo-laminas-05": find("1666034843740"), // AZUL algas

  "trabajo-corte-01": find("1666034843981"), // We're Premium Foam Makers
  "trabajo-corte-02": find("IMG_20210311_130849"), // detalle letras
  "trabajo-corte-03": find("1666034844264"), // Vituco corpóreas
  "trabajo-corte-04": find("WhatsApp_Image_2026-05-13_at_13.02.35__2_"), // Arfis corpóreas

  "trabajo-stands-01": find("1666034844356"), // SeaDek pared modular
  "trabajo-stands-02": find("WhatsApp_Image_2026-04-28_at_14.22.10"), // Babolat
  "trabajo-stands-03": find("IMG_20210326_151626"), // Barriles evento

  "trabajo-iluminacion-01": find("WhatsApp_Image_2026-05-13_at_13.02.35__7_"), // NPM luminoso
  "trabajo-iluminacion-02": find("1666034844264"), // Vituco
  "trabajo-iluminacion-03": find("WhatsApp_Image_2026-09-30_at_11.29.32__6_"), // BYBO noche

  "trabajo-senaletica-01": find("WhatsApp_Image_2026-09-30_at_11.29.32__3_"), // Placa Cebrián
  "trabajo-senaletica-02": find("IMG_20221027_105259"), // Tourist Info / Mutxamel
};

// Fix ASENDA: prefer exact __ without conflicting
try {
  map; // noop
  const asenda = files.find((f) => /11\.29\.31-25fb/i.test(f)) || files.find((f) => /11\.29\.31(?!__)/i.test(f));
  if (asenda) works["trabajo-vehiculos-05"] = join(uploadDir, asenda);
} catch {}

for (const [name, src] of Object.entries(map)) {
  await writeImg(src, name);
}
for (const [name, src] of Object.entries(works)) {
  await writeImg(src, name, { w: 1200, h: 900 });
}

// Stock láminas solares (edificio / cristal, no coche)
const laminasUrl =
  "https://images.pexels.com/photos/21609805/pexels-photo-21609805.jpeg?auto=compress&cs=tinysrgb&w=1600";
const laminasRaw = join(tmp, "laminas-stock.jpg");
console.log("DL servicio-laminas-solares");
await download(laminasUrl, laminasRaw);
await writeImg(laminasRaw, "servicio-laminas-solares");

// Stock LED tiras como trabajo adicional de iluminación
const ledUrl =
  "https://images.pexels.com/photos/8108680/pexels-photo-8108680.jpeg?auto=compress&cs=tinysrgb&w=1600";
const ledRaw = join(tmp, "led-stock.jpg");
console.log("DL trabajo-iluminacion-04");
await download(ledUrl, ledRaw);
await writeImg(ledRaw, "trabajo-iluminacion-04", { w: 1200, h: 900 });

const manifest = { heroes: Object.keys(map), works: Object.keys(works), stock: ["servicio-laminas-solares", "trabajo-iluminacion-04"] };
await writeFile(join(root, "tmp-stock", "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Done", manifest.heroes.length, "heroes,", manifest.works.length + 1, "works");
