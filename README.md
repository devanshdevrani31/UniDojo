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

**One runtime contract, four front doors — and you must never need to code to use it.**

A game is a **self-contained folder** — an `index.html`, a `content.json` holding the
actual questions, and a `game.json` manifest. It runs inside a sandboxed iframe on a
separate origin with no network access. See
[docs/02-game-contract.md](docs/02-game-contract.md).

Because the contract is that thin, we can accept games from anywhere:

| Rung | How it works | Onboarding |
| --- | --- | --- |
| **1. We make it** | Paste your notes on the site, pick a vibe, preview, publish. We call the model on our key, on a quota. | Nothing to set up |
| **2. Make it in your Claude** | One button copies the prompt + your notes and opens Claude. Paste. Copy what it gives you. Paste it back. Done. | Nothing to set up |
| **3. Connect your model** | Your own Claude / OpenAI / Kimi key, or a local Ollama URL. No quota. Keys stay in your browser. | An API key |
| **4. Upload a bundle** | Drag in an `index.html` you built yourself. | Assumes file literacy |

Rungs 1 and 2 are the front doors; 3 and 4 are upgrades offered after someone's published
once. **Rung 2 is the interesting one** — it uses the student's existing Claude
*subscription* through the normal chat window, so there's no developer console, no credit
card, and no API key, and it costs us nothing. "Ask Claude to build it for me" turns out to
be two paste operations, not an integration.

Full reasoning: [docs/07-publishing-paths.md](docs/07-publishing-paths.md).

Two things that make this work:

- **Content is separate from code** (`content.json`), so fixing a wrong answer is a form
  edit, not a code edit — which is also what makes fork-and-improve usable by non-coders.
- **We are not running a deploy pipeline.** The Vercel analogy holds for the feel, not the
  machinery: no build step, no server per game, just static files in object storage behind a
  CDN. That's a large amount of complexity you get to not have.

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
