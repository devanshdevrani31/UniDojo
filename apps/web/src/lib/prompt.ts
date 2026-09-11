/**
 * The prompt handed to the student's own Claude/ChatGPT/Kimi (rung 2), and the same one
 * the server will send on rung 1.
 *
 * Canonical copy lives in prompts/make-a-game.md — keep them in step. The constraints
 * that matter: one file out, no instructions the student has to act on, and content in a
 * labelled JSON block so the no-code editor can fix a wrong answer later.
 */
export function buildPrompt(notes: string, courseLabel: string): string {
  return `You are building a small study game for UniDojo, a site where university students play games built from each other's lecture notes.

Below are my notes for ${courseLabel || "my course"}. Turn them into **one self-contained index.html file** that is genuinely fun to play — not a quiz with a score at the end unless a quiz is truly the best fit. Consider: timed sorting, drag-to-match, a labelled diagram, build-the-sequence, spot-the-error.

Reply with ONE code block and nothing I need to act on. I'm going to copy it straight into UniDojo.

HARD REQUIREMENTS

1. One file. All HTML, CSS and JavaScript inline. No frameworks, no build step.

2. Put the questions in a JSON block, separate from the code. Near the top of the file:

<script type="application/json" id="unidojo-content">
{ "cards": [ { "front": "...", "back": "..." } ] }
</script>

   Read it with:
   const DATA = JSON.parse(document.getElementById('unidojo-content').textContent);

   Use whatever shape suits your game, but ALL the material goes in there and the code reads from it. Never hardcode a question in the JavaScript — this is what lets someone fix a wrong answer later without touching code.

3. No network access at all. No fetch, no CDN scripts, no Google Fonts, no external images. Use system fonts, CSS, emoji, or inline SVG. A game with an external reference is rejected on upload.

4. It must work standalone — opening the file in a browser plays the game.

5. Talk to the host with postMessage:

const post = (type, payload) => parent.postMessage({ v: 1, type, payload }, '*');
post('ready');                                   // as soon as you can start — REQUIRED
post('progress', { done: 3, total: 10 });        // whenever progress changes
post('complete', { score: 80, max: 100, durationMs: 45000 });  // when finished

   and listen for the start signal:

addEventListener('message', e => {
  if (e.data?.v === 1 && e.data.type === 'init') {
    const { mode, seed } = e.data.payload;   // 'practice' or 'test'
    startGame(seed);
  }
});

   In practice mode show the correct answer after a mistake; in test mode don't. If nothing sends 'init' within 2 seconds, start anyway.

6. Accuracy over cleverness. Every fact must come from my notes. Do not invent plausible-sounding content to fill gaps — use less material rather than making it up. A wrong answer in a study game is worse than a short game.

7. Works on a phone. Keyboard accessible on desktop. Playable in 3–8 minutes.

8. Add a second JSON block so I don't have to fill in a form:

<script type="application/json" id="unidojo-manifest">
{ "schemaVersion": 1, "title": "", "description": "", "topic": "", "tags": [],
  "estimatedMinutes": 5, "difficulty": "easy | medium | hard",
  "scoring": { "type": "points", "max": 100 }, "modes": ["practice", "test"],
  "editable": true, "license": "CC-BY-4.0" }
</script>

Before finishing, check: one file, both JSON blocks present, zero external references, no question hardcoded in the JS, 'ready' posted on load, 'complete' posted at the end, every fact traceable to my notes.

MY NOTES:

${notes}`;
}
