# Roadmap

Ordered by "what would make this fail", not by what's fun to build.

## Milestone 0 — Prove the contract (a weekend)

No accounts, no database, no upload.

- [ ] `apps/sandbox` serving a hardcoded bundle in a sandboxed iframe
- [ ] `postMessage` protocol working end to end: `ready → init → progress → complete`
- [ ] `games/example-flashcards` playable through it
- [ ] Generate a *second* game with Claude from real lecture notes and confirm it drops in
      with zero edits — do this by hand, exactly as a student would: copy the prompt, paste
      notes, copy the reply. That hand-run **is** rung 2; if it's awkward for you it will be
      impossible for a first-year.
- [ ] Confirm the model reliably emits the `content.json` / `index.html` split

**Kill criterion:** if an LLM can't reliably one-shot a game that satisfies the contract,
every authoring rung fails, not just the upload one. Find this out in week one, not month
three.

## Milestone 1 — Walking skeleton (2–3 weeks)

- [ ] Supabase project, migrations, seed with 2 universities / 5 courses
- [ ] Magic-link auth + university email verification
- [ ] Browse: home → university → course → game
- [ ] Play page: iframe + progress bar + result card
- [ ] Record plays (anonymous allowed)
- [ ] **Rung 4** — upload: drag a folder or `.html`, validate, store, publish
- [ ] **Rung 2** — paste box: "Make it in Claude" button (clipboard + open chat) and a
      textarea that accepts whatever comes back. Same validate/preview/publish tail as
      rung 4, so it's mostly free once upload exists — and it reaches an order of magnitude
      more people, so don't let it slip.
- [ ] Deploy both apps, two origins, CSP verified with a hostile test game

**Done when:** someone who has never opened a code editor can publish a game from their
phone, and you can see the play row.

## Milestone 2 — The social layer (2 weeks)

- [ ] Two-axis ratings, gated on a completed play
- [ ] Course page ranks by accuracy, ties broken by fun
- [ ] Creator profiles with per-course play counts
- [ ] Report flow + a minimal moderator queue
- [ ] Fork/remix with visible lineage

## Milestone 3 — Zero-friction contribution (2–3 weeks)

- [ ] **The no-code content editor.** A form over `content.json` — fix a wrong answer, edit
      a question, republish, never see HTML. This is the highest-leverage thing on the list
      after the contract itself: it makes correction and remixing available to everyone.
- [ ] **Rung 1** — server-side generation on our key, with a per-student quota. Notes in,
      game out, no AI account. Needs the quota and abuse story sorted first.
- [ ] File-drop notes: PDF / DOCX / photo of handwriting → text
- [ ] Clear validation errors ("line 14 loads a font from Google — inline it or drop it")
- [ ] Live preview before publishing, on every rung

## Milestone 4 — Power users

- [ ] **Rung 3** — bring your own model: Claude / OpenAI / Kimi keys, local Ollama URL.
      Offered at the quota wall. See [08-bring-your-own-model.md](08-bring-your-own-model.md).
- [ ] Template-based builder, *if and only if* the data shows which shapes people want.
      Build the top three and nothing else.

## First real test

One course. One cohort. Twenty games before an exam. If the students in that course use it
unprompted during swotvac, it works. If they don't, no amount of extra features fixes it —
go and ask them why in person.

The specific thing to watch: **what fraction of publishers wrote no code.** If it's near
zero, the ladder failed and everything above rung 3 is decoration.
