# Contributing

Two people right now, so this is short and will change.

## Working agreement

- `main` is always deployable. Branch for everything: `feat/…`, `fix/…`, `docs/…`.
- PRs even for small things — they're the only record of *why* we did something.
- Anything that changes the game contract, the data model, or an origin boundary gets an
  ADR in `docs/decisions/` in the same PR. One page, the template is the existing three.
- Don't add a dependency without saying why in the PR description.

## Where to start

1. Read [docs/02-game-contract.md](docs/02-game-contract.md). Everything hangs off it.
2. Pick something from [docs/06-open-questions.md](docs/06-open-questions.md) and argue
   about it in an issue. Several of those change the data model, so they're worth more
   right now than code.
3. Milestone 0 in [docs/04-roadmap.md](docs/04-roadmap.md) is the first real work.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```

## Conventions

- TypeScript everywhere except inside game bundles, which are plain HTML/JS on purpose.
- Shared types go in `packages/schema` and are imported, never re-declared.
- Zod schema is the source of truth; TS types are derived with `z.infer`.
- No secrets in the repo. `.env.local` is gitignored; `.env.example` documents the keys.
