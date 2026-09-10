# Roadmap

Ordered by "what would make this fail", not by what's fun to build.

## Milestone 0 — Prove the contract (a weekend)

No accounts, no database, no upload.

- [ ] `apps/sandbox` serving a hardcoded bundle in a sandboxed iframe
- [ ] `postMessage` protocol working end to end: `ready → init → progress → complete`
- [ ] `games/example-flashcards` playable through it
- [ ] Generate a *second* game with Claude from real lecture notes and confirm it drops in
      with zero edits

**Kill criterion:** if an LLM can't reliably one-shot a game that satisfies the contract,
the whole "bring your own" premise is wrong and you should build Path B instead. Find this
out in week one, not month three.

## Milestone 1 — Walking skeleton (2–3 weeks)

- [ ] Supabase project, migrations, seed with 2 universities / 5 courses
- [ ] Magic-link auth + university email verification
- [ ] Upload: drag a folder or `.html`, validate, store, publish
- [ ] Browse: home → university → course → game
- [ ] Play page: iframe + progress bar + result card
- [ ] Record plays (anonymous allowed)
- [ ] Deploy both apps, two origins, CSP verified with a hostile test game

**Done when:** you can send someone a link, they play a game, and you can see the play row.

## Milestone 2 — The social layer (2 weeks)

- [ ] Two-axis ratings, gated on a completed play
- [ ] Course page ranks by accuracy, ties broken by fun
- [ ] Creator profiles with per-course play counts
- [ ] Report flow + a minimal moderator queue
- [ ] Fork/remix with visible lineage

## Milestone 3 — Make contributing frictionless (2 weeks)

- [ ] `prompts/make-a-game.md` polished, with a one-click copy button on the site
- [ ] Live preview before publishing — play your own bundle before it's public
- [ ] Clear validation errors ("line 14 loads a font from Google — inline it or drop it")
- [ ] Fork-and-fix in the browser for small corrections

## Milestone 4 — On-site builder (Path B)

Only after the data says which shapes people want. Build the top three templates and
nothing else.

## First real test

One course. One cohort. Twenty games before an exam. If the students in that course use it
unprompted during swotvac, it works. If they don't, no amount of extra features fixes it —
go and ask them why in person.
