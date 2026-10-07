import { Client } from "basic-ftp";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function env(name, { required = false } = {}) {
  const v = process.env[name]?.trim();
  if (required && !v) {
    console.error(`Falta ${name}. Copia .env.example a .env y rellena los datos FTP.`);
    process.exit(1);
  }
  return v;
}

function asBool(v, fallback = false) {
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

loadEnv();

if (!existsSync(publicDir)) {
  console.error("No existe public/. Ejecuta antes: npm run build");
  process.exit(1);
}

const host = env("FTP_HOST", { required: true });
const user = env("FTP_USER", { required: true });
const password = env("FTP_PASSWORD", { required: true });
const remoteRoot = env("FTP_REMOTE", { required: true }) || "/";
const port = Number(env("FTP_PORT") || "21");
const secure = asBool(env("FTP_SECURE"), true);

const client = new Client(60_000);
client.ftp.verbose = asBool(env("FTP_VERBOSE"));

console.log(`Subiendo public/ → ${host}:${port}${remoteRoot} (${secure ? "FTPS" : "FTP"})…`);

try {
  await client.access({ host, user, password, port, secure, secureOptions: { rejectUnauthorized: false } });
  await client.ensureDir(remoteRoot);
  await client.cd(remoteRoot);
  await client.uploadFromDir(publicDir);
  console.log("Listo. Sitio subido por FTP.");
} catch (err) {
  console.error("Error FTP:", err.message || err);
  process.exit(1);
} finally {
  client.close();
}
