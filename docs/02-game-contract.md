# The game contract

Everything else is negotiable. This is the thing to get right, because it's the interface
between us and every contributor, and changing it later breaks every game ever published.

**Design goal: a game should be one HTML file that an LLM can produce in one shot, and that
still works if you open it directly in a browser with no UniDojo at all.**

## A bundle

```
my-game/
├── game.json      required — the manifest
├── index.html     required — the entry point
└── ...            optional — images, audio, css, js (all relative paths)
```

Rules, enforced at upload by `scripts/validate-bundle.ts`:

| Rule | Limit | Why |
| --- | --- | --- |
| Total size | 5 MB | Keeps storage free and load instant. |
| File count | 50 | Ditto. |
| Allowed types | html, css, js, json, png, jpg, webp, svg, mp3, ogg, woff2 | No executables, no PDFs pretending to be games. |
| External references | **none** | No `<script src="https://...">`, no CDN fonts, no `fetch`. The CSP blocks it anyway; we reject at upload so failure is loud, not silent. |
| Must post `ready` | within 10 s | A game that never signals ready shows a "this game is broken" state instead of a white box. |
| Deterministic given a seed | strongly encouraged | Lets us replay and compare attempts fairly. |

## `game.json`

```json
{
  "schemaVersion": 1,
  "title": "Krebs Cycle Speedrun",
  "description": "Drag each intermediate into place before the timer runs out.",
  "university": "unimelb",
  "course": "BIOM20001",
  "topic": "Week 6 — Cellular Respiration",
  "tags": ["biochem", "drag-and-drop", "timed"],
  "entry": "index.html",
  "estimatedMinutes": 6,
  "difficulty": "medium",
  "scoring": { "type": "points", "max": 100 },
  "modes": ["practice", "test"],
  "sourceAttribution": "Built from my own BIOM20001 lecture notes, Week 6.",
  "license": "CC-BY-4.0"
}
```

`scoring.type` is one of `points` | `percent` | `time` | `none`. `none` means the game is
exploratory (a simulation, a diagram explorer) and won't appear on leaderboards.

Canonical Zod definition: `packages/schema/src/manifest.ts`. The JSON above and that file
must never disagree — the file wins.

## The postMessage protocol

Version 1. All messages are `{ v: 1, type: string, payload?: object }`. The host ignores
anything that doesn't match; the game should too.

### Host → game

| type | payload | when |
| --- | --- | --- |
| `init` | `{ mode: "practice"\|"test", seed: number, player: { displayName } \| null, resume: object \| null }` | once, after the game posts `ready` |
| `pause` | — | user navigated away / opened a dialog |
| `resume` | — | |

### Game → host

| type | payload | when |
| --- | --- | --- |
| `ready` | — | as soon as the game can accept `init`. **Required.** |
| `progress` | `{ done: number, total: number }` | whenever it changes — drives the host's progress bar |
| `save` | `{ state: object }` | opaque blob; handed back as `resume` on next `init`. Max 32 KB. |
| `complete` | `{ score: number, max: number, durationMs: number, breakdown?: object }` | game finished |
| `resize` | `{ height: number }` | host resizes the iframe |
| `error` | `{ message: string }` | game gave up; host shows a report link |

Both sides validate `event.origin` against the expected origin and drop everything else.

### Minimum viable game

```html
<!doctype html>
<meta charset="utf-8">
<title>Two-question quiz</title>
<body>
  <p id="q"></p>
  <button data-i="0">Mitochondria</button>
  <button data-i="1">Ribosome</button>
<script>
  const post = (type, payload) => parent.postMessage({ v: 1, type, payload }, '*');
  const Q = [{ text: 'Site of oxidative phosphorylation?', answer: 0 }];
  let score = 0, i = 0;
  const render = () => q.textContent = Q[i].text;

  addEventListener('message', e => { if (e.data?.type === 'init') render(); });
  document.body.onclick = e => {
    if (!e.target.dataset.i) return;
    if (+e.target.dataset.i === Q[i].answer) score++;
    if (++i >= Q.length) post('complete', { score, max: Q.length, durationMs: 0 });
    else { post('progress', { done: i, total: Q.length }); render(); }
  };
  post('ready');
</script>
```

That runs standalone in a browser *and* on UniDojo. That property is what keeps the
"generate it with Claude and drag it in" flow to 30 seconds — the student can check their
game works before they ever visit our site.

`packages/game-sdk` wraps this in ~40 lines of typed helpers for anyone who wants them, but
using the SDK is **optional by design**. Requiring a build step or an npm install would
kill the one-shot-LLM path, which is the whole point.

## Versioning

`schemaVersion` is in the manifest and `v` is in every message. When v2 lands, the sandbox
keeps a v1 adapter. Published games never break — that's the promise that makes people
willing to publish.

## Reference implementation

[`games/example-flashcards/`](../../games/example-flashcards/) is a working bundle. It's
also the conformance test: CI plays it headlessly and asserts the message sequence.
