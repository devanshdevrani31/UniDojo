#!/usr/bin/env node
/**
 * Turns a standalone study app (e.g. a Claude artifact) into a UniDojo bundle.
 *
 *   node scripts/import-artifact.mjs <source.html> <slug>
 *
 * What it does, and deliberately nothing more — the author's game is their work, so the
 * edits are confined to what the contract actually requires:
 *
 *   1. strips the artifact host's outer <html><head>…<body> wrapper, keeping the document
 *   2. drops <link> tags that fetch fonts/stylesheets off-origin (the CSP blocks them
 *      anyway, and every one of these files already declares a system-font fallback)
 *   3. injects a <script id="unidojo-manifest"> block
 *   4. appends a host adapter that speaks the postMessage contract
 *
 * Per-game adapters live in ADAPTERS below, keyed by slug. Everything else is generic.
 * See docs/02-game-contract.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [src, slug] = process.argv.slice(2);
if (!src || !slug) {
  console.error("usage: import-artifact.mjs <source.html> <slug>");
  process.exit(2);
}

const MANIFESTS = {
  "bptm-exam-trainer": {
    schemaVersion: 1,
    title: "BPTM Exam Trainer",
    description:
      "Five drills, a reachability lab and an 18-minute endterm simulation. Petri-net answers aren't hardcoded — they're computed live from the formal firing rules.",
    topic: "Whole course · exam prep",
    tags: ["petri-nets", "bpmn", "cpee", "exam-sim"],
    estimatedMinutes: 20,
    difficulty: "hard",
    scoring: { type: "points", max: 100 },
    modes: ["practice", "test"],
    editable: false,
    license: "CC-BY-4.0",
  },
  "in2309-dependency-matrix": {
    schemaVersion: 1,
    title: "IN2309 Dependency Matrix",
    description:
      "Nineteen topics, weighted by how heavily each has actually been examined across four past papers. Learn it, drill it with spaced repetition, then sit a real paper against the clock.",
    topic: "Whole course · exam prep",
    tags: ["spaced-repetition", "drills", "exam-sim", "architecture"],
    estimatedMinutes: 25,
    difficulty: "medium",
    // An open-ended trainer with no single scored run — see docs/02-game-contract.md.
    scoring: { type: "none" },
    modes: ["practice"],
    editable: false,
    license: "CC-BY-4.0",
  },
};

/** Game-specific hooks, appended inside the adapter's IIFE. */
const ADAPTERS = {
  "bptm-exam-trainer": `
  // The trainer already tracks its own results; wrap the two places a run ends so the
  // host learns the score, without changing how any of it behaves.
  wrap('renderQ', function () {
    if (typeof M === 'object' && M && M.qs && M.qs.length) {
      post('progress', { done: Math.min(M.i, M.qs.length), total: M.qs.length });
    }
  });
  wrap('missionEnd', function () {
    if (typeof M !== 'object' || !M || !M.qs || !M.qs.length) return;
    post('complete', {
      score: Math.round((100 * M.right) / M.qs.length), max: 100, durationMs: 0,
      breakdown: { correct: M.right, total: M.qs.length, drill: M.mode },
    });
  });
  // bossEnd() guards itself with B.over and returns early on a second call, so check
  // that flag BEFORE the original runs or we'd report the same result twice.
  (function () {
    var orig = window.bossEnd;
    if (typeof orig !== 'function') return;
    window.bossEnd = function () {
      var already = typeof B === 'object' && B && B.over;
      var r = orig.apply(this, arguments);
      if (!already) {
        try {
          var right = B.answers.filter(function (a) { return a.ok; }).length;
          post('complete', {
            score: Math.round((100 * right) / B.qs.length), max: 100,
            durationMs: (18 * 60 - B.t) * 1000,
            breakdown: { correct: right, total: B.qs.length, mode: 'endterm' },
          });
        } catch (e) {}
      }
      return r;
    };
  })();`,

  "in2309-dependency-matrix": `
  // Drilling is open-ended (spaced repetition never "finishes"), so this reports how
  // much of the current pool has been seen and never sends a score. The manifest says
  // scoring.type = "none" to match.
  wrap('nextCard', function () {
    try {
      var qs = pool();
      if (!qs.length) return;
      var seen = qs.filter(function (q) { return S.seen[q.id]; }).length;
      post('progress', { done: seen, total: qs.length });
    } catch (e) {}
  });`,
};

const manifest = MANIFESTS[slug];
const extra = ADAPTERS[slug] ?? "";
if (!manifest) {
  console.error(`no manifest defined for slug "${slug}" — add one to import-artifact.mjs`);
  process.exit(2);
}

let html = readFileSync(src, "utf8");

// 1. Drop the artifact host's wrapper. The real document starts at the author's own
//    <meta charset> / <title>.
const wrapper = html.match(
  /^<!doctype html><html><head>[\s\S]*?<\/head><body>\s*/i,
);
if (wrapper) html = html.slice(wrapper[0].length);
html = html.replace(/\s*<\/body>\s*<\/html>\s*$/i, "\n");

// 2. Remove off-origin stylesheet/font links. Keep a note so the next reader knows why.
const links = html.match(/<link\b[^>]*href\s*=\s*["']?(?:https?:)?\/\/[^>]*>/gi) ?? [];
html = html.replace(/<link\b[^>]*href\s*=\s*["']?(?:https?:)?\/\/[^>]*>\s*/gi, "");
if (links.length) {
  html =
    `<!-- ${links.length} off-origin <link> tag(s) removed on import: games run with no ` +
    `network access, and this file's font stacks already fall back to system fonts. -->\n` +
    html;
}

// 3. Manifest block, first thing in the document.
const manifestBlock =
  `<script type="application/json" id="unidojo-manifest">\n` +
  JSON.stringify(manifest, null, 2) +
  `\n</script>\n`;

/**
 * Error trap, injected BEFORE the game's own code so it catches a throw during startup.
 * Without this a game that dies on load is just a white rectangle, which is the single
 * most confusing failure a player can hit.
 */
const errorTrap = `<script>
(function () {
  var sent = false;
  addEventListener('error', function (ev) {
    if (sent || parent === window) return;
    sent = true;
    var where = ev && ev.lineno ? ' (line ' + ev.lineno + ')' : '';
    parent.postMessage({ v: 1, type: 'error',
      payload: { message: String((ev && ev.message) || 'script error') + where } }, '*');
  });
})();
</script>
`;

// 4. Host adapter.
const adapter = `
<script>
/* ---------------------------------------------------------------------------
   UniDojo host adapter. Added on import; the game above is otherwise unchanged.
   Protocol: docs/02-game-contract.md

   Note: the frame is sandboxed without allow-modals, so alert()/confirm() calls
   in the game are ignored by the browser and their actions simply don't happen.
   That is deliberate — a modal from inside a game blocks the whole page.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';
  var V = 1;
  function post(type, payload) {
    if (parent !== window) parent.postMessage({ v: V, type: type, payload: payload }, '*');
  }
  /** Run \`after\` once the named global function has done its work. */
  function wrap(name, after) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var r = orig.apply(this, arguments);
      try { after(); } catch (e) {}
      return r;
    };
  }
${extra}
  // These trainers run their own modes, so 'init' carries nothing they need — they are
  // already on screen. Answering it is what tells the host we're alive.
  addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.v !== V || d.type !== 'init') return;
  });
  post('ready');
})();
</script>
`;

const out = `<!doctype html>\n${manifestBlock}${errorTrap}${html.trim()}\n${adapter}`;
const dir = join("games", slug);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "index.html"), out);

console.log(
  `${slug}: ${(out.length / 1024).toFixed(0)} KB` +
    (links.length ? `, ${links.length} external link(s) removed` : ""),
);
