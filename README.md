# UniDojo

**Turn your lecture notes into a game. Let the rest of your cohort beat your high score.**

UniDojo is a place where university students publish small, playable study games built
from their own course notes — and where other students find, play, rate and remix them.

Think Studocu, but instead of downloading a PDF you *play* someone's revision.

---

## The problem

Note-sharing sites (Studocu, StudyDrive, Course Hero) are dead documents. You download a
PDF, skim it, feel productive, and remember nothing. The two things that actually move
exam grades — **retrieval practice** and **spaced repetition** — require *active* material,
and nobody has time to build that by hand.

Making active material used to be the hard part. It isn't anymore: an LLM can turn a
lecture transcript into a working quiz game in one prompt. What's missing is the place to
put it, the audience to play it, and a reason to make a good one instead of a lazy one.

## The product

Three loops, in order of importance:

1. **Play** — Browse by university → course → topic. Click a game, it runs instantly in the
   browser. No install, no account needed to play. Practice mode (untimed, answers shown)
   and Test mode (scored, leaderboard).
2. **Create** — Paste your notes, get a game, publish it under your name. Two supported
   paths (see below).
3. **Rate & rank** — Games get rated on *accuracy* and *fun* separately. Creators build a
   reputation per course. The best game for "COMP20003 Week 4" wins the slot, not the first
   one uploaded.

## How games get made

This was the main open question. The answer is **one runtime contract, two front doors.**

A game is a **self-contained folder** — an `index.html`, whatever assets it needs, and a
`game.json` manifest. That's it. It runs inside a sandboxed iframe on a separate origin,
with no network access. See [docs/02-game-contract.md](docs/02-game-contract.md).

Because the contract is that thin, we can accept games from anywhere:

| Path | How it works | Status |
| --- | --- | --- |
| **A. Bring your own** | Student pastes [our prompt](prompts/make-a-game.md) + their notes into Claude (or any LLM), gets an `index.html`, drags it onto UniDojo. Published in ~30 seconds. | **v1 — build this first** |
| **B. Build on site** | Pick a template (quiz / flashcards / matching / timeline / labelled diagram), paste notes, our server fills a JSON schema and renders it with a built-in engine. No code touched. | v2 |

**Recommendation: ship A first.** It is a fraction of the work of building an authoring UI,
it's the actual differentiator, and the security story is well-trodden (it's how CodePen
previews work — `sandbox="allow-scripts"` on a foreign origin, plus a strict CSP). Path B
is the safety net you add once you know from real data which five game shapes people
actually want. Building B first means guessing.

The Vercel analogy holds, but note we are **not** running a deploy pipeline. There is no
build step and no server per game — a bundle is static files in object storage served
behind a CDN. That is a large amount of complexity you get to not have.

## Why anyone contributes

Uploading is not intrinsically fun; this loop has to be designed, not assumed.

- **Attribution that's worth having** — a creator profile scoped to your degree, showing
  play counts per course. Screenshot-able, and it means something to the ~400 people in
  your cohort.
- **The slot is contested** — one course-week has one top-rated game. That's a leaderboard
  creators care about.
- **Remix** — fork someone's game, fix the three wrong answers, republish with lineage
  shown. Lowers the bar to contributing from "make a game" to "fix a game".
- **Cohort pressure** — a course page that says "12 of 340 students have contributed"
  works better than any points system.

## Status

Pre-code. This repo currently contains the architecture, the game contract, the data model
and the roadmap. Start at [docs/](docs/).

## Layout

```
UniDojo/
├── apps/
│   ├── web/            Next.js app — browse, play, upload, profiles (the whole site)
│   └── sandbox/        Static player served from a SEPARATE ORIGIN. Runs untrusted games.
├── packages/
│   ├── schema/         Zod schemas + TS types shared by everything (game.json, DB rows)
│   ├── game-sdk/       Tiny lib a game uses to talk to the host (score, progress, resume)
│   └── ui/             Shared React components
├── games/
│   └── example-flashcards/   Reference bundle. Also the contract's conformance test.
├── prompts/            The prompt students paste into Claude to generate a game
├── supabase/           SQL migrations + seed data
├── docs/               Read these first
└── scripts/            Dev/validation tooling (bundle validator, seeding)
```

## Getting started

Nothing to run yet. When there is:

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Open questions that need deciding are tracked in
[docs/06-open-questions.md](docs/06-open-questions.md) — that's the best place to start
arguing with us.
