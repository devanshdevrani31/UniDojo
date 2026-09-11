# demo — UniDojo localhost demo

The full stack (`apps/web`, `apps/sandbox`) isn't scaffolded yet — this demo shows the
product's two core loops working end to end, using only Python (no Node required):

```
host     http://localhost:4173   browse + play + build shell (stands in for apps/web)
sandbox  http://127.0.0.1:4174   untrusted game bundles (stands in for apps/sandbox)
```

The two hostnames are **different origins**, so the browser enforces the same isolation as
the production two-domain design (see `docs/decisions/0001-two-origins.md`):

- the sandbox sends the exact CSP from `apps/sandbox/README` — `connect-src 'none'` means a
  hostile or buggy game cannot touch the network at all
- games run in a `sandbox="allow-scripts"` iframe; the host never renders game code inline
- host ↔ game communication is the version-1 `postMessage` protocol from
  `packages/schema/src/messages.ts`: `ready`/`init` → `progress`/`save` → `complete`

## Run it

```bash
python3 demo/server.py
```

Then open http://localhost:4173.

## Build a game (creator flow)

NotebookLM-style: drop course files (txt/md/pdf/png/jpg/webp, 12 MB each, max 8) into the
**Sources** column, or paste notes as text. Then pick:

- **Game type** — Surprise me · Quickfire quiz · Flashcards sprint · Match-up · Sort it · Spot the error
- **Vibe** — visual theme presets (Cyberdojo / Library / Retro arcade / Midnight / Campus green),
  injected into the generation prompt as a concrete palette + font direction
- **Length** — campaign size (up to 200 items) + daily-session minutes, and an **exam date** stored
  in your profile (per-browser = per-user). The pacing line adapts to *your* exam date — everyone's
  is different.

Generated games are **dojo campaigns**, not minute-long quizzes. The generator prompt enforces the
UniDojo learning method: an **XP economy** with levels, **spaced repetition** per item
(wrong → relearn now, correct → due in 1d → 3d → 7d), **daily sessions** that wrap with
"come back tomorrow", a **day streak**, and full state persistence via the `save`/`resume`
protocol messages — reload tomorrow and you're exactly where you left off.

**[Build my game]** runs the local `claude` CLI headless (`--model` defaults to your
subscription's model; force one with `UNIDOJO_MODEL=claude-opus-5 python3 demo/server.py`).
It assembles `prompts/make-a-game.md` + your options + your sources, lets the CLI read PDFs
and images directly, and expects one self-contained `index.html` back. The server then:

1. extracts the embedded `unidojo-manifest` and injects `university`/`course`/`sourceAttribution`
2. validates the bundle (Python port of `scripts/validate-bundle.mjs`: no external refs, no
   network calls, both JSON blocks present, `ready`/`complete` posted) — one automatic
   repair retry on failure, and hostile output never reaches `games/`
3. drops it in `demo/drafts/` — you get a **playable preview** in the same sandboxed iframe,
   and nothing is visible on the homepage until you hit **Publish**

Runtime state (`demo/uploads/`, `demo/work/`, `demo/jobs/`, `demo/drafts/`) is gitignored.

## Play

Pick a game on the homepage. **Practice** is untimed and autosaves your position (reload
mid-run to see `resume`); **Test** is scored and lands on the per-mode leaderboard, stored
in your browser (`localStorage` under `unidojo-demo:*`).

Drop any spec-conformant bundle (`game.json` + `index.html`) into `games/` and reload —
it appears on the homepage automatically.
