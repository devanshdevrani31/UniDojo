# Publishing paths

**Requirement: a student who has never written a line of code must be able to publish a
game.** Not "could figure it out" — must find it obvious. If publishing is only comfortable
for people who code, the content pool is capped at maybe 5% of a cohort, and the site is
empty for every course that isn't computer science.

Everything below produces the same thing: a bundle that satisfies
[the game contract](02-game-contract.md). One runtime, four front doors.

## The ladder

| Rung | Who | What they do | Onboarding | Cost to us |
| --- | --- | --- | --- | --- |
| **1. We make it** | Everyone. The default. | Paste notes → preview → publish | None | We pay, quota'd |
| **2. Make it in your Claude** | Anyone with Claude / ChatGPT / Kimi open | One button → paste in Claude → copy result → paste back | None | Free |
| **3. Connect your model** | Heavy contributors | Paste an API key or a local URL, once | Real friction | Free |
| **4. Upload a bundle** | People who built it themselves | Drag in an `index.html` | Assumes file literacy | Free |

Rungs 1 and 2 are the front doors and are the only two that belong on a course page's empty
state. Rungs 3 and 4 are upgrades you offer *after* someone has published once and has a
reason to care.

Rung 4 is what [ADR 0002](decisions/0002-bring-your-own-bundle-first.md) called Path A —
still valuable, still the cheapest thing to build, but it is **not** the zero-friction path
and shouldn't be sold as one.

---

## Rung 1 — We make it

The default. No files, no code, no AI account, no key.

```
1. Which course is this for?     → dropdown, remembers last choice
2. Paste your notes              → textarea, or drop a PDF/DOCX/photo of handwriting
3. How should it feel?           → 4-5 picture cards: Quickfire · Match-up ·
                                   Sort it · Spot the error · Surprise me
4. [ Make my game ]              → ~30s, streaming, show it building
5. Play it right now             → full-size preview, before anyone else sees it
6. Fix anything wrong            → content editor, no code (see below)
7. [ Publish ]
```

Non-negotiables:

- **Never show code.** Not in a collapsed panel, not under "advanced". A code block on
  screen tells a non-coder this isn't for them. There's a "download the HTML" link for the
  curious; that's the whole escape hatch.
- **Preview before publish, always.** It's the quality gate *and* the reassurance.
- **Failure is recoverable in the UI** — a "try again" button and *make it easier / shorter
  / harder* nudges, never an error message with a stack trace.
- **No account until publish.** Let people build a game, then ask them to sign in to put
  their name on it.

Quota'd, because we're paying. When someone hits the quota, that's the moment to offer
rung 2 or 3 — not before.

---

## Rung 2 — Make it in your own Claude

The point of this rung: **it uses their Claude/ChatGPT/Kimi subscription, not developer API
billing.** No console signup, no credit card, no API key — the three things that make
rung 3 a wall. If they can chat with Claude, they can use this.

The whole flow is two pastes:

```
On UniDojo:
  [ Make it in Claude ↗ ]
     → copies the full prompt + their notes to the clipboard
     → opens claude.ai in a new tab
     → shows a small card: "Paste in Claude (Ctrl+V), then copy what it
        gives you and paste it back below."

  [ paste what Claude gave you .................................. ]
     → we detect the HTML, validate it, and show a live preview
     → [ Publish ]
```

Why clipboard-then-paste rather than anything cleverer:

- **Copy and paste is universal literacy.** Saving a code block as a `.html` file and
  finding it again is not. This is the entire difference between rung 2 and rung 4, and
  it's most of the addressable audience.
- **No file system, no downloads folder, no extensions.** Works identically on a locked-down
  library PC and a phone.
- **Nothing to install and nothing to authorise.** No OAuth, no key, no consent screen.

Design notes:

- **Put the notes on the clipboard, not in the URL.** A prefilled-chat URL parameter is
  tempting, but notes are long and URL length limits will silently truncate them — which
  fails as a *wrong game*, not as an error. Clipboard has no such limit. If you do add a
  prefill link as a nicety, ⚠️ verify the parameter and its length ceiling against the live
  site first, and keep clipboard as the path that actually carries the notes.
- **Accept a messy paste.** People will paste the code block, the whole chat reply, or a
  reply wrapped in prose. Strip markdown fences, find the `<!doctype`/`<html`, ignore the
  chatter. Be liberal here; every rejection is a lost contributor.
- **Accept a shared link too, as a bonus path.** If someone pastes a link to a published
  artifact/chat instead of code, try to fetch and extract it. ⚠️ Depends on that page's
  shape — verify before promising it in the UI, and always keep paste-the-code as the
  path that definitely works.
- **Same provider-agnostic button for ChatGPT and Kimi.** The prompt is plain English; it
  isn't Claude-specific. One button with a small "or use ChatGPT / Kimi" underneath.
- **Same preview and publish steps as rung 1.** Only the middle is different.

---

## Rung 3 — Connect your own model

API key or a local model URL. Genuinely useful for the ten students who make forty games,
and a wall for the four hundred who want to make one. Details, providers, and where keys
live: [08-bring-your-own-model.md](08-bring-your-own-model.md).

Offer it at the quota wall, never on the way in.

---

## Rung 4 — Upload a bundle

Drag in an `index.html` you built yourself — in Claude Code, in an editor, by hand. Full
control, no constraints beyond the contract. Cheapest rung for us to build, and the right
home for the most interesting games.

---

## Editing without code

This is the part that decides whether rungs 1 and 2 actually work, and it needs a contract
change.

The common repair is *"question 7 has the wrong answer."* If the game is one opaque blob of
HTML, fixing that means editing code — which puts a non-coder right back where they
started, and makes fork-and-improve useless to most of the site.

So: **games keep their content as data, separate from their code.**

```
my-game/
├── game.json        manifest
├── content.json     the questions, answers, pairs, labels — the actual material
└── index.html       the code that renders content.json
```

If a bundle ships a `content.json` and its manifest sets `"editable": true`, UniDojo can
offer a plain form editor — a list of questions with text boxes — and republish without
anyone seeing HTML. That one convention:

- makes "fix the wrong answer" a 20-second job for anybody
- makes fork-and-improve accessible to non-coders, which is where most contributions will
  come from
- gives us structured data later for free — server-side answer checking, per-question
  analytics, cross-game search — without having to rebuild authoring as templates
- costs nothing; it's a convention, not a runtime feature

Rungs 1 and 2 always produce it (the prompt asks for the split, so rung 4 usually gets it
too). A bundle without a `content.json` is still perfectly valid — it just can't use the
no-code editor.

## What this changes about the roadmap

[ADR 0002](decisions/0002-bring-your-own-bundle-first.md) said build upload first and defer
everything on-site. That was right when "easy" meant "easy for someone who already has
Claude open". With non-coders as a hard requirement, **rung 2 moves up next to rung 4** —
it's nearly the same build (a paste box instead of a file drop, plus a clipboard button) and
it reaches an order of magnitude more people. Rung 1 follows once there's a server to spend
money from. See [04-roadmap.md](04-roadmap.md).
