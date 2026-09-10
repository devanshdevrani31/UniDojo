# Make a UniDojo game

The prompt students send to Claude (or ChatGPT, or Kimi). Rung 1 sends it server-side;
rung 2 puts it on the student's clipboard along with their notes. Keep it in sync with
`docs/02-game-contract.md` — if they drift, publishing starts failing and nobody knows why.

Design constraints on this prompt, which are easy to break by accident:

- **One file out.** The student copies a single code block. Two files means two copies means
  a lost contributor.
- **No instructions the student has to follow.** No "save this as index.html", no "create a
  folder". They paste, they copy, they're done.
- **Content in a labelled JSON block**, so our no-code editor can fix a wrong answer later.

Everything below the line is the prompt.

---

You are building a small study game for UniDojo, a site where university students play
games built from each other's lecture notes.

I'll give you my notes. Turn them into **one self-contained `index.html` file** that is
genuinely fun to play — not a quiz with a score at the end unless a quiz is truly the best
fit for this material. Consider: timed sorting, drag-to-match, a labelled diagram, a
build-the-sequence puzzle, a "spot the error" game, a dialogue where the player has to
answer to progress.

Reply with **one code block and nothing else that I need to act on.** I'm going to copy it
straight into UniDojo.

## Hard requirements

1. **One file.** All HTML, CSS and JavaScript inline. No frameworks, no build step.
2. **Put the questions in a JSON block, separate from the code.** Near the top of the file:

```html
<script type="application/json" id="unidojo-content">
{ "cards": [ { "front": "...", "back": "..." } ] }
</script>
```

   and read it with
   `const DATA = JSON.parse(document.getElementById('unidojo-content').textContent);`
   Use whatever shape suits your game — but **all** the material goes in there, and the code
   below reads from it. Never hardcode a question in the JavaScript. This is what lets
   someone fix a wrong answer later without touching code.

3. **No network access whatsoever.** No `fetch`, no CDN scripts, no Google Fonts, no
   external images. Use system fonts, CSS, emoji, or inline SVG. This is enforced — a game
   with an external reference is rejected at upload.
4. **It must work standalone.** Opening the file in a browser plays the game.
5. **Talk to the host** with `postMessage`, using exactly these messages:

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
If nothing sends `init` within 2 seconds (i.e. the file was opened directly), start anyway.

6. **Accuracy over cleverness.** Every fact must come from my notes. Do not invent
   plausible-sounding content to fill gaps. If my notes are thin on something, use less
   material rather than making it up — a wrong answer in a study game is worse than a short
   game.
7. Works on a phone. Keyboard accessible on desktop.
8. Playable in 3–8 minutes.

## Put the manifest in the file too

As a second JSON block, so I don't have to fill in a form:

```html
<script type="application/json" id="unidojo-manifest">
{
  "schemaVersion": 1,
  "title": "",
  "description": "",
  "topic": "",
  "tags": [],
  "estimatedMinutes": 5,
  "difficulty": "easy | medium | hard",
  "scoring": { "type": "points", "max": 100 },
  "modes": ["practice", "test"],
  "editable": true,
  "license": "CC-BY-4.0"
}
</script>
```

(Leave out `university` and `course` — UniDojo fills those in from what I picked.)

Before you finish, check: one file, both JSON blocks present, zero external references, no
question hardcoded in the JS, `ready` posted on load, `complete` posted at the end, and
every fact traceable to my notes.

My notes:

<paste notes here>
