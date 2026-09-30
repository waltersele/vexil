/**
 * Ingiere fotos aún no usadas como trabajos.
 * node scripts/ingest-remaining-works.mjs
 */
import sharp from "sharp";
import { readdir, writeFile } from "fs/promises";
import { join } from "path";

const upload = "C:/Users/walco/.cursor/projects/c-webproject-vexil-web/assets";
const out = "public/assets";
const root = join(out, "..", "..");
const files = await readdir(upload);
const find = (...parts) => {
  const hit = files.find((f) => parts.every((p) => f.toLowerCase().includes(p.toLowerCase())));
  if (!hit) throw new Error(`No match: ${parts.join(" + ")}`);
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

/** [filenameBase, finderParts[], caption, alt, serviceKey] */
const items = [
  ["trabajo-fachadas-08", ["1666034843721"], "Firmand", "Fachada Firmand con rótulo de agencia", "fachadas"],
  ["trabajo-fachadas-09", ["WhatsApp_Image_2026-05-13_at_13.02.35__5_"], "Carnes La Mancha", "Fachada Carnes La Mancha con paneles y rótulos", "fachadas"],
  ["trabajo-fachadas-10", ["1666034843963"], "Kikora", "Fachada Kikora con vinilos y rótulo", "fachadas"],
  ["trabajo-fachadas-11", ["IMG_20230920_135343"], "Arco Iris", "Fachada Arco Iris parque infantil", "fachadas"],
  ["trabajo-fachadas-12", ["WhatsApp_Image_2026-05-13_at_13.02.36"], "Shui", "Fachada Shui con rótulos y vinilo", "fachadas"],

  ["trabajo-rotulos-06", ["WhatsApp_Image_2026-09-30_at_11.29.31__6_"], "La Jijonenca", "Letras corpóreas La Jijonenca en fachada", "rotulos"],
  ["trabajo-rotulos-08", ["WhatsApp_Image_2026-05-13_at_13.02.35__2_"], "Arfis", "Letras corpóreas y banderola Arfis", "rotulos"],

  ["trabajo-impresion-06", ["WhatsApp_Image_2026-09-30_at_11.29.31__4_"], "Clínicas UME", "Cartel rígido Clínicas UME", "impresion-digital"],
  ["trabajo-impresion-07", ["adhesivos-ef35a2a0"], "Adhesivos Tierras de Baeza", "Pegatinas Tierras de Baeza", "impresion-digital"],
  ["trabajo-impresion-08", ["IMG-20200221-WA0049"], "Antonio Muñoz Más", "Panel impreso Antonio Muñoz Más", "impresion-digital"],
  ["trabajo-impresion-04", ["adhesivos-desierto-monegros"], "Desierto de Monegros", "Adhesivos Desierto de Monegros", "impresion-digital"],

  ["trabajo-vehiculos-06", ["IMG_20210428_171452"], "Domani Cars", "Smart Domani Cars rotulada", "vehiculos"],
  ["trabajo-vehiculos-07", ["WhatsApp_Image_2026-09-30_at_11.29.30"], "Karting Alacant", "Kart Karting Alacant con vinilos", "vehiculos"],
  ["trabajo-vehiculos-08", ["1666034843795"], "Boats & Sun", "Embarcación Boats & Sun rotulada", "vehiculos"],
  ["trabajo-vehiculos-09", ["IMG-20181010-WA0005"], "Audeca", "Vehículo Audeca rotulado", "vehiculos"],

  ["trabajo-interiorismo-07", ["WhatsApp_Image_2026-09-30_at_11.29.33__3_"], "BYBO · recepción", "Recepción BYBO con panel retroiluminado", "interiorismo-comercial"],
  ["trabajo-interiorismo-08", ["WhatsApp_Image_2026-09-30_at_11.29.36__4_"], "Artesanía", "Vinilo de pared Artesanía", "interiorismo-comercial"],
  ["trabajo-interiorismo-09", ["IMG-20200221-WA0049"], "Antonio Muñoz Más", "Rótulo interior Antonio Muñoz Más", "interiorismo-comercial"],

  ["trabajo-laminas-06", ["WhatsApp_Image_2026-05-13_at_13.02.35__6_"], "Privacidad en oficina", "Puerta con vinilo ácido", "laminas-solares"],

  ["trabajo-corte-06", ["WhatsApp_Image_2026-09-30_at_11.29.36__3_"], "Bryan Stepwise", "Letras corpóreas Bryan Stepwise", "corte"],
  ["trabajo-corte-07", ["c5247b3d"], "N.uñas", "Letras corpóreas N.uñas", "corte"],

  ["trabajo-stands-04", ["WhatsApp_Image_2026-09-30_at_11.29.31__3_"], "Mercat · evento", "Cartelería de evento Mercat", "stands"],

  ["trabajo-iluminacion-05", ["WhatsApp_Image_2026-09-30_at_11.29.33__3_"], "BYBO · LED", "Panel BYBO con retroiluminación LED", "iluminacion-decorativa"],

  ["trabajo-senaletica-03", ["IMG_20230616_100720"], "Directorio / placa", "Placa o directorio de señalética", "senaletica"],
];

const byService = {};
for (const [name, parts, caption, alt, service] of items) {
  try {
    await w(find(...parts), name);
    (byService[service] ||= []).push({
      img: `${name}.jpg`,
      alt,
      caption,
    });
  } catch (e) {
    console.warn("SKIP", name, e.message);
  }
}

await writeFile(join(root, "tmp-works-manifest.json"), JSON.stringify(byService, null, 2));
console.log("Services", Object.keys(byService).map((k) => `${k}:${byService[k].length}`).join(", "));
