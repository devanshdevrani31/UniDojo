/**
 * Client-safe bundle handling: pull a game out of whatever the student pasted, then
 * check it against the contract. Mirrors scripts/validate-bundle.mjs — keep them in step.
 *
 * The guiding rule here is **be liberal in what you accept**. People paste the code
 * block, the whole chat reply, markdown fences, or prose wrapped around the code. Every
 * rejection at this step is a lost contributor. See docs/07-publishing-paths.md.
 */

export interface Extracted {
  html: string;
  manifest: Record<string, unknown> | null;
  content: unknown | null;
}

export interface Issue {
  level: "error" | "warning";
  message: string;
}

const EXTERNAL_REF = /\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i;
const NETWORK_CALL = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(/;

/** Strip markdown fences and surrounding chat prose down to the HTML document. */
export function extractHtml(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  // Prefer a fenced block if there is one.
  const fenced = [...text.matchAll(/```(?:html|HTML)?\s*\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .filter((b) => /<html|<!doctype|<script|<body/i.test(b));
  const candidate = fenced.length
    ? fenced.reduce((a, b) => (b.length > a.length ? b : a))
    : text;

  // Trim anything before the document starts and after it ends.
  const start = candidate.search(/<!doctype html|<html|<meta charset|<!DOCTYPE/i);
  const sliced = start >= 0 ? candidate.slice(start) : candidate;

  if (!/<script|<body|<html/i.test(sliced)) return null;

  const endTag = sliced.toLowerCase().lastIndexOf("</html>");
  return (endTag >= 0 ? sliced.slice(0, endTag + 7) : sliced).trim();
}

function readJsonBlock(html: string, id: string): unknown | null {
  const re = new RegExp(
    `<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,
    "i",
  );
  const m = html.match(re);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

export function parseBundle(raw: string): Extracted | null {
  const html = extractHtml(raw);
  if (!html) return null;
  return {
    html,
    manifest: readJsonBlock(html, "unidojo-manifest") as Record<
      string,
      unknown
    > | null,
    content: readJsonBlock(html, "unidojo-content"),
  };
}

export function checkBundle(b: Extracted): Issue[] {
  const issues: Issue[] = [];
  const err = (message: string) => issues.push({ level: "error", message });
  const warn = (message: string) => issues.push({ level: "warning", message });

  const bytes = new TextEncoder().encode(b.html).length;
  if (bytes > 5 * 1024 * 1024) {
    err(`That's ${(bytes / 1048576).toFixed(1)} MB — games have to stay under 5 MB.`);
  }

  if (EXTERNAL_REF.test(b.html)) {
    err(
      "This game loads something from the internet (a font, an image, or a script). " +
        "Games have to be fully self-contained — ask for it again without external links.",
    );
  }
  if (NETWORK_CALL.test(b.html)) {
    err(
      "This game tries to make a network request, which is blocked when it runs here. " +
        "Ask for a version with no fetch calls.",
    );
  }
  if (!/postMessage/.test(b.html)) {
    err(
      "This doesn't look like a UniDojo game — it never signals that it's ready. " +
        "Make sure you copied the whole thing.",
    );
  }
  if (!/['"]complete['"]/.test(b.html)) {
    warn("No finish signal found, so scores won't be recorded.");
  }
  if (!b.content) {
    warn(
      "The questions aren't in a separate block, so they can't be fixed later without " +
        "editing code. Still fine to publish.",
    );
  }
  if (!b.manifest) {
    warn("No title block found — you'll need to fill in the details yourself.");
  }

  return issues;
}

export function manifestString(
  m: Record<string, unknown> | null,
  key: string,
  fallback = "",
): string {
  const v = m?.[key];
  return typeof v === "string" && v.trim() ? v : fallback;
}

/** Rough count of items in whatever shape the game's content took. */
export function countItems(content: unknown): number | null {
  if (!content || typeof content !== "object") return null;
  for (const v of Object.values(content as Record<string, unknown>)) {
    if (Array.isArray(v)) return v.length;
  }
  return null;
}
