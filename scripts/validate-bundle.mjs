#!/usr/bin/env node
/**
 * Validates a game bundle directory against the contract in docs/02-game-contract.md.
 * Dependency-free on purpose so it runs anywhere, including CI before `npm install`.
 *
 *   node scripts/validate-bundle.mjs games/example-flashcards
 *
 * The upload API performs the same checks (via @unidojo/schema). Keep them in sync.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, sep } from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 50;
const ALLOWED = new Set([
  ".html", ".css", ".js", ".json", ".png", ".jpg", ".jpeg",
  ".webp", ".svg", ".mp3", ".ogg", ".woff2",
]);
const REQUIRED_MANIFEST_KEYS = [
  "schemaVersion", "title", "description", "university", "course",
  "entry", "estimatedMinutes", "difficulty", "scoring", "modes",
  "sourceAttribution", "license",
];
const NETWORK_CALL = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(/;

/**
 * Finds references that would make the browser LOAD something off-origin.
 *
 * A plain `<a href="https://…">` is deliberately allowed: it fetches nothing, and in the
 * sandboxed frame it can't navigate anywhere either. Authors put their own credit links
 * in games, and rejecting those would be wrong. What we block is anything that pulls a
 * resource in — scripts, stylesheets, fonts, images, media, frames.
 */
function externalResourceRefs(text) {
  const hits = [];

  // Tags whose src/href/srcset actually loads something.
  const TAG = /<\s*(script|link|img|iframe|frame|source|audio|video|track|embed|object|input|use|image)\b([^>]*)>/gi;
  for (const m of text.matchAll(TAG)) {
    const attrs = m[2];
    const url = attrs.match(
      /\b(?:src|srcset|href|data)\s*=\s*["']?((?:https?:)?\/\/[^"'\s>]+)/i,
    );
    if (url) {
      hits.push({ index: m.index, detail: `<${m[1].toLowerCase()}> loads ${url[1]}` });
    }
  }

  // CSS: @import and url() pointing off-origin.
  for (const m of text.matchAll(/@import\s+(?:url\()?["']?((?:https?:)?\/\/[^"')\s;]+)/gi)) {
    hits.push({ index: m.index, detail: `@import from ${m[1]}` });
  }
  for (const m of text.matchAll(/url\(\s*["']?((?:https?:)?\/\/[^"')\s]+)/gi)) {
    hits.push({ index: m.index, detail: `url() loads ${m[1]}` });
  }

  return hits;
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

const root = process.argv[2];
if (!root) {
  console.error("usage: validate-bundle.mjs <bundle-dir>");
  process.exit(2);
}

const errors = [];
const warnings = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

let files;
try {
  files = walk(root);
} catch {
  console.error(`cannot read bundle directory: ${root}`);
  process.exit(2);
}

/** Reads a <script type="application/json" id="..."> block out of an HTML string. */
function readJsonBlock(html, id) {
  const m = html.match(
    new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i"),
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

// --- manifest -------------------------------------------------------------
// Two equivalent forms: a game.json sidecar, or an inline <script id="unidojo-manifest">
// block. Generated games use the inline form so the student copies one thing.
let manifest = null;
let manifestSource = "game.json";

try {
  manifest = JSON.parse(readFileSync(join(root, "game.json"), "utf8"));
} catch {
  try {
    const entryHtml = readFileSync(join(root, "index.html"), "utf8");
    manifest = readJsonBlock(entryHtml, "unidojo-manifest");
    manifestSource = "index.html <script id=unidojo-manifest>";
  } catch {
    /* reported below */
  }
  if (!manifest) {
    errors.push(
      `no manifest: expected a game.json, or a <script type="application/json" ` +
        `id="unidojo-manifest"> block inside index.html`,
    );
  }
}

if (manifest) {
  // university/course come from what the student picked on the site, so an inline
  // manifest is not expected to carry them.
  const inline = manifestSource !== "game.json";
  const required = inline
    ? REQUIRED_MANIFEST_KEYS.filter(
        (k) => !["university", "course", "entry", "sourceAttribution"].includes(k),
      )
    : REQUIRED_MANIFEST_KEYS;

  for (const key of required) {
    if (manifest[key] === undefined) {
      errors.push(`${manifestSource}: missing required key "${key}"`);
    }
  }
  if (manifest.schemaVersion !== 1) {
    errors.push(`${manifestSource}: schemaVersion must be 1`);
  }
  const entry = manifest.entry ?? "index.html";
  try {
    statSync(join(root, entry));
  } catch {
    errors.push(`${manifestSource}: entry "${entry}" does not exist in the bundle`);
  }
}

// --- files ----------------------------------------------------------------
if (files.length > MAX_FILES) errors.push(`too many files: ${files.length} (max ${MAX_FILES})`);

let total = 0;
for (const f of files) {
  const rel = relative(root, f).split(sep).join("/");
  total += statSync(f).size;
  const ext = extname(f).toLowerCase();
  if (!ALLOWED.has(ext)) errors.push(`disallowed file type: ${rel}`);

  if ([".html", ".js", ".css"].includes(ext)) {
    const text = readFileSync(f, "utf8");
    for (const hit of externalResourceRefs(text)) {
      errors.push(
        `${rel}:${lineOf(text, hit.index)} ${hit.detail} — bundles must be self-contained`,
      );
    }
    if (NETWORK_CALL.test(text)) {
      const line = text.split("\n").findIndex((l) => NETWORK_CALL.test(l)) + 1;
      errors.push(`${rel}:${line} makes a network call — blocked by CSP at runtime`);
    }
  }
}
if (total > MAX_BYTES) {
  errors.push(`bundle too large: ${(total / 1048576).toFixed(2)} MB (max 5 MB)`);
}

// --- protocol -------------------------------------------------------------
const entryPath = join(root, manifest?.entry ?? "index.html");
try {
  const html = readFileSync(entryPath, "utf8");
  if (!/postMessage/.test(html)) {
    warnings.push(`${manifest?.entry ?? "index.html"}: no postMessage found — the game will never signal 'ready'`);
  }
  if (!/['"]complete['"]/.test(html)) {
    warnings.push(`${manifest?.entry ?? "index.html"}: no 'complete' message found — scores will never be recorded`);
  }

  // Content/code split — what makes the no-code editor possible.
  // See docs/02-game-contract.md and docs/07-publishing-paths.md.
  const inlineContent = /<script[^>]+id=["']unidojo-content["']/.test(html);
  let sidecarContent = true;
  try {
    statSync(join(root, "content.json"));
  } catch {
    sidecarContent = false;
  }

  if (manifest?.editable === true && !inlineContent && !sidecarContent) {
    errors.push(
      `game.json declares "editable": true but the bundle has no content.json and no ` +
        `<script id="unidojo-content"> block — there is nothing for the editor to edit`,
    );
  }
  if (!manifest?.editable && !inlineContent && !sidecarContent) {
    warnings.push(
      `no separate content — nobody will be able to fix a wrong answer without editing ` +
        `code. Move the questions into a <script type="application/json" ` +
        `id="unidojo-content"> block and set "editable": true`,
    );
  }
} catch {
  /* already reported above */
}

// --- report ---------------------------------------------------------------
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s). Bundle rejected.`);
  process.exit(1);
}
console.log(
  `OK — ${files.length} file(s), ${(total / 1024).toFixed(1)} KB` +
    (warnings.length ? `, ${warnings.length} warning(s)` : ""),
);
