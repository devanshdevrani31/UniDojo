# Architecture

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Web app | Next.js (App Router) + TypeScript | One deployable for pages + API routes. Server components keep the browse pages fast and cheap. |
| Styling | Tailwind | Fast, and we have no designer. |
| DB / Auth / Storage | Supabase (Postgres) | Postgres we can actually query, row-level security, magic-link auth, and S3-compatible storage for bundles — all on one free tier. Swappable later; it's just Postgres. |
| Hosting | Vercel | Free, and it's the Next.js path of least resistance. |
| Validation | Zod (in `packages/schema`) | One schema definition shared by the uploader, the API and the DB types. |

Deliberately **not** in v1: a queue, a background worker, Redis, a build pipeline,
Kubernetes, a mobile app, our own auth. Every one of those can be added when something
actually hurts.

## The two-origin rule

This is the single most important structural decision, and it is very hard to retrofit.

```
https://unidojo.app          →  apps/web      (trusted: your session, your cookies)
https://play-unidojo.app     →  apps/sandbox  (untrusted: runs student-written JS)
```

Game code is **arbitrary JavaScript written by strangers.** It must never execute on the
origin that holds the user's session cookie. So:

- `apps/sandbox` is a separate deployment on a **different registrable domain** (not a
  subdomain — cookies and `document.domain` games make subdomains leakier than they look).
- The web app embeds it as
  `<iframe sandbox="allow-scripts" src="https://play-unidojo.app/g/{id}/{version}">`.
  Note the **absence** of `allow-same-origin`: combined with a foreign origin this drops
  the frame into an opaque origin with no storage, no cookies, no access to the parent.
- The sandbox origin serves a strict CSP: `default-src 'none'; script-src 'unsafe-inline'
  'self'; img-src 'self' data:; style-src 'unsafe-inline' 'self'; connect-src 'none'`.
  `connect-src 'none'` is what stops a game phoning home with whatever it can scrape.
- The only channel between game and host is `postMessage`, with a fixed message schema.
  The frame is opaque-origin, so `event.origin` is the string `"null"` — the host identifies
  the frame by `event.source`, not by an origin string. See
  [02-game-contract.md](02-game-contract.md).
- The host hands the bundle to the frame as `srcdoc` with the policy inlined, rather than
  pointing `src` at it. See [ADR 0005](decisions/0005-bundles-run-as-srcdoc.md) for why,
  and for what that costs.

Everything a game needs — the questions, the images, the audio — ships inside the bundle.
A game that needs the network is a game we don't host.

## Request path

**Browsing** (`unidojo.app/uni/melbourne/comp20003`)
→ Next.js server component → Supabase read → HTML. Cacheable, no JS needed.

**Playing** (`unidojo.app/g/{slug}`)
→ page shell from `apps/web` → iframe to `play-unidojo.app/g/{id}/{version}`
→ CDN serves static bundle from Supabase Storage
→ game `postMessage`s score back to the shell
→ shell POSTs the result to `/api/plays` (the shell is trusted; the game is not).

**Scores are advisory, not authoritative.** The game reports its own score, and the game is
untrusted code — a determined student can post any number they like. That is fine for
"practice streaks" and misleading for "leaderboard". See
[decisions/0003-scores-are-advisory.md](decisions/0003-scores-are-advisory.md).

**Publishing**
→ upload zip/HTML to `/api/games/upload`
→ validate (`packages/schema` + `scripts/validate-bundle.ts`): size, file types, manifest
  shape, no external `src`/`href`, entry file present
→ store as an immutable `game_versions` row + a storage prefix
→ mark `published` (moderation gate, see [05](05-moderation-and-trust.md)).

Versions are immutable and content-addressed by version id. Republishing never mutates a
served bundle, which keeps the CDN honest and makes rollback a DB update.

## Monorepo

npm workspaces. Not Turborepo/Nx until the build is slow enough to be annoying.

```
apps/web  apps/sandbox  packages/schema  packages/game-sdk  packages/ui
```

`packages/schema` is the load-bearing one: the manifest shape lives there and is imported
by the uploader, the API, the sandbox, the validator CLI and the seed script. One source of
truth for what a game looks like.
