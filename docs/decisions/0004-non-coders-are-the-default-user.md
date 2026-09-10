# 0004 — Non-coders are the default publisher

**Status:** accepted. Amends [0002](0002-bring-your-own-bundle-first.md).

## Context

0002 chose "student generates a bundle with their own LLM and uploads it" as the v1
authoring path, on the grounds that it's cheap to build and is the differentiator. Both
still true.

But it assumed the publisher is comfortable saving a code block as `index.html` and finding
that file again. Most students are not. If publishing is only easy for people who code, the
content pool is capped at a fraction of a cohort and every non-technical course page stays
empty — which is most of the university.

Separately: "connect your Claude account" is not a thing that exists. There's no consumer
OAuth that lets a third-party site spend someone's Claude.ai or ChatGPT subscription. It
means an API key from a developer console with its own billing — a real wall for a casual
contributor.

## Decision

A four-rung ladder ([07-publishing-paths.md](../07-publishing-paths.md)), where both default
rungs are key-free:

1. **We make it** — paste notes on our site, we generate with our key, on a quota. No files,
   no code, no AI account.
2. **Make it in your own Claude** — one button copies the prompt and their notes to the
   clipboard and opens Claude (or ChatGPT, or Kimi); they paste, then paste the result back
   into a box on our site. This uses their existing *subscription* through the normal chat
   interface, so there is no console signup, no card, and no API key — and it costs us
   nothing. Two pastes, no file handling.
3. **Bring your own model** (API key or local base URL) is an upgrade offered *after*
   someone hits the quota — never a first-run requirement. Keys live in the user's browser
   and are never sent to our server.
4. Uploading a self-made bundle (0002's path) stays, as the power-user route.

And, cutting across all four: games **separate content from code** — a `content.json`
alongside `index.html` — so content can be edited through a form instead of a code editor.

## Consequences

- We pay for generation on rung 1. Bounded by a per-student quota; at current model prices a
  cohort's worth of games is a small bill, and it buys the entire non-technical half of the
  campus. Rung 2 is the pressure valve — it costs us nothing and is where quota-limited
  users go next, so the bill doesn't scale with the most enthusiastic contributors.
- Rung 2's paste box must be liberal in what it accepts (raw code, a full chat reply,
  markdown fences, prose around the code). Every rejection there is a lost contributor.
- The `content.json` convention is the load-bearing piece. It makes "fix the wrong answer"
  a 20-second form edit, makes fork-and-improve usable by non-coders, and hands us
  structured data later (server-side answer checking, per-question analytics) for free.
- We hold no API keys, so there is no key-breach surface. Cost: keys are per-browser, and
  providers that block browser calls can't be supported without a proxy.
- The roadmap changes — the paste-notes flow can't sit in Milestone 4 behind everything
  else. See [04-roadmap.md](../04-roadmap.md).
- 0002's kill criterion still applies and gets *more* important: if an LLM can't reliably
  one-shot a conforming bundle, rung 1 fails too, not just rung 3.
