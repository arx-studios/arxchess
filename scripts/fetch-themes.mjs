// Downloads every chess.com board and piece set listed by
// https://github.com/GiorgioMegrelli/chess.com-boards-and-pieces into public/themes,
// and writes lib/themes/catalog.json for the app. Personal use only — this is
// chess.com's artwork. Re-running skips files that already exist.
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const THEMES = path.join(ROOT, "public", "themes");
const CONFIG_URL =
  "https://raw.githubusercontent.com/GiorgioMegrelli/chess.com-boards-and-pieces/v2.x/default-config.json";

const BOARD_SIZE = 200; // px per square -> 1600px board
const BOARD_THUMB_PX = 240; // Settings preview, resized locally (the newer asset host only serves full size)
const PIECE_SIZE = 300;

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const exists = (p) => access(p).then(() => true, () => false);

async function download(url, dest) {
  if (await exists(dest)) return "skip";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return "ok";
    } catch (err) {
      if (attempt === 3) throw new Error(`${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function runAll(jobs, concurrency = 8) {
  const failures = [];
  let done = 0;
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const job = queue.shift();
        try {
          await download(job.url, job.dest);
        } catch (err) {
          failures.push(err.message);
        }
        if (++done % 50 === 0) console.log(`  ${done}/${jobs.length}`);
      }
    }),
  );
  return failures;
}

const config = await (await fetch(CONFIG_URL)).json();
const templates = config.common["url-templates"];
const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

const jobs = [];
const catalog = { boards: [], pieces: [] };

const seenBoards = new Set();
for (const [collection, meta] of Object.entries(config.boards.collections)) {
  let id = slugify(meta.readable_name);
  if (seenBoards.has(id)) id = `${id}-${slugify(collection)}`;
  seenBoards.add(id);
  const template = templates[meta["url-template"]];
  const ext = template.endsWith(".jpg") ? "jpg" : "png";
  catalog.boards.push({ id, name: meta.readable_name, file: `${id}.${ext}` });
  jobs.push({ url: fill(template, { collection, size: BOARD_SIZE }), dest: path.join(THEMES, "boards", `${id}.${ext}`) });
}

const pieceNames = config.pieces.names.split(";");
const seenPieces = new Set();
for (const [collection, meta] of Object.entries(config.pieces.collections)) {
  let id = slugify(meta.readable_name);
  if (seenPieces.has(id)) id = `${id}-${slugify(collection)}`;
  seenPieces.add(id);
  const template = templates[meta["url-template"]];
  catalog.pieces.push({ id, name: meta.readable_name });
  for (const name of pieceNames) {
    jobs.push({
      url: fill(template, { collection, size: PIECE_SIZE, name }),
      dest: path.join(THEMES, "pieces", id, `${name}.png`),
    });
  }
}

console.log(`${catalog.boards.length} boards, ${catalog.pieces.length} piece sets, ${jobs.length} files`);
const failures = await runAll(jobs);

await mkdir(path.join(THEMES, "boards", "thumbs"), { recursive: true });
// Mean color of the middle half of one square, so neighbouring squares don't blend in.
async function squareColor(src, col) {
  const { width } = await sharp(src).metadata();
  const sq = Math.floor(width / 8);
  const { data, info } = await sharp(src)
    .extract({ left: col * sq + Math.floor(sq / 4), top: Math.floor(sq / 4), width: Math.floor(sq / 2), height: Math.floor(sq / 2) })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sums = [0, 0, 0];
  for (let i = 0; i < data.length; i += info.channels) for (let c = 0; c < 3; c++) sums[c] += data[i + c];
  const n = data.length / info.channels;
  return "#" + sums.map((s) => Math.round(s / n).toString(16).padStart(2, "0")).join("");
}
for (const b of catalog.boards) {
  const src = path.join(THEMES, "boards", b.file);
  if (!(await exists(src))) continue;
  await sharp(src).resize(BOARD_THUMB_PX).toFile(path.join(THEMES, "boards", "thumbs", b.file));
  // a8 is a light square and b8 a dark one; used for the in-square coordinates.
  b.light = await squareColor(src, 0);
  b.dark = await squareColor(src, 1);
}

// Drop anything that didn't fully download so the app never offers a broken theme.
if (failures.length) {
  console.log(`${failures.length} failed:`);
  for (const f of failures) console.log("  " + f);
}
const missing = async (p) => !(await exists(p));
catalog.boards = (
  await Promise.all(
    catalog.boards.map(async (b) =>
      (await missing(path.join(THEMES, "boards", b.file))) || (await missing(path.join(THEMES, "boards", "thumbs", b.file)))
        ? null
        : b,
    ),
  )
).filter(Boolean);
catalog.pieces = (
  await Promise.all(
    catalog.pieces.map(async (p) => {
      for (const name of pieceNames) if (await missing(path.join(THEMES, "pieces", p.id, `${name}.png`))) return null;
      return p;
    }),
  )
).filter(Boolean);

await mkdir(path.join(ROOT, "lib", "themes"), { recursive: true });
await writeFile(path.join(ROOT, "lib", "themes", "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
console.log(`catalog: ${catalog.boards.length} boards, ${catalog.pieces.length} piece sets`);
