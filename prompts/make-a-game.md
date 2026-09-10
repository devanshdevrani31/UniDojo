# Make a UniDojo game

This is the prompt students paste into Claude (or any LLM) along with their notes. Keep it
in sync with `docs/02-game-contract.md` — if they drift, uploads start failing and nobody
knows why.

Everything below the line is the prompt.

---

You are building a small study game for UniDojo, a site where university students play
games built from each other's lecture notes.

I'll give you my notes. Turn them into **one self-contained `index.html` file** that is
genuinely fun to play — not a quiz with a score at the end unless a quiz is truly the best
fit for this material. Consider: timed sorting, drag-to-match, a labelled diagram, a
build-the-sequence puzzle, a "spot the error" game, a dialogue where the player has to
answer to progress.

## Hard requirements

1. **One file.** All HTML, CSS and JavaScript inline. No frameworks, no build step.
2. **No network access whatsoever.** No `fetch`, no CDN scripts, no Google Fonts, no
   external images. Use system fonts, CSS, emoji, or inline SVG. This is enforced — a game
   with an external reference is rejected at upload.
3. **It must work standalone.** Open the file in a browser and it plays. Test this.
4. **Talk to the host** with `postMessage`, using exactly these messages:

```js
const post = (type, payload) => parent.postMessage({ v: 1, type, payload }, '*');

post('ready');                                     // as soon as you can start — REQUIRED
post('progress', { done: 3, total: 10 });          // whenever progress changes
post('complete', { score: 80, max: 100, durationMs: 45000 });   // when finished
```

and listen for the start signal:

```js
addEventListener('message', e => {
  if (e.data?.v === 1 && e.data.type === 'init') {
    const { mode, seed } = e.data.payload;   // mode is 'practice' or 'test'
    startGame(seed);
  }
});
```

In `practice` mode, show the correct answer after a mistake. In `test` mode, don't.
If nothing sends `init` within 2 seconds (i.e. the file was opened directly), start anyway
so it's testable standalone.

5. **Accuracy over cleverness.** Every fact must come from my notes. Do not invent
   plausible-sounding content to fill gaps. If my notes are thin on something, use less
   material rather than making it up — a wrong answer in a study game is worse than a short
   game.
6. Works on a phone. Keyboard accessible on desktop.
7. Playable in 3–8 minutes.

## Also produce a `game.json`

```json
{
  "schemaVersion": 1,
  "title": "",
  "description": "",
  "university": "",
  "course": "",
  "topic": "",
  "tags": [],
  "entry": "index.html",
  "estimatedMinutes": 5,
  "difficulty": "easy | medium | hard",
  "scoring": { "type": "points", "max": 100 },
  "modes": ["practice", "test"],
  "sourceAttribution": "Built from my own notes for <course>, <topic>.",
  "license": "CC-BY-4.0"
}
```

Before you finish, check: one file, zero external references, `ready` posted on load,
`complete` posted at the end, and every fact traceable to my notes.

My notes:

<paste notes here>
