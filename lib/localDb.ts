import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
// Vercel has a read-only filesystem except /tmp.
// Reads always come from bundled data/; writes go to /tmp (session-scoped only).
const TMP_DIR = "/tmp/portfolio-data";

function ensureTmp() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
}

export function readJson<T>(filename: string): T {
  // Prefer /tmp copy (written at runtime) over the bundled file
  const tmpFile = path.join(TMP_DIR, filename);
  const srcFile = path.join(DATA_DIR, filename);
  const file = fs.existsSync(tmpFile) ? tmpFile : srcFile;
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

export function writeJson(filename: string, data: unknown): void {
  // On Vercel the data/ dir is read-only — write to /tmp instead.
  // Changes persist for the lifetime of the serverless instance only.
  ensureTmp();
  const file = path.join(TMP_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}
