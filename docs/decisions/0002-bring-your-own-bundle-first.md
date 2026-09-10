# 0002 — Ship "bring your own bundle" before the on-site builder

**Status:** accepted, amended by [0004](0004-non-coders-are-the-default-user.md)

> **Amendment:** 0004 keeps this decision's reasoning but demotes upload from *the* v1 path
> to *a* v1 path. Uploading a file assumes file literacy most students don't have, so the
> default front doors became "we generate it" and "make it in your own Claude, paste it
> back". See [07-publishing-paths.md](../07-publishing-paths.md).

## Context
Two ways to get games: students generate them with an LLM and upload (A), or students use
an on-site template builder (B). B is more controlled and more consistent; A is far less
work and is the differentiator.

## Decision
Build A first. Build B only after real usage shows which game shapes matter.

## Consequences
- The game contract becomes the most important interface in the system — get it right.
- We host untrusted code from day one, which forces decision 0001 immediately.
- Quality varies more than with templates; leaned on ratings and moderation instead.
- The student's own LLM account pays for generation, not us.
- Risk: if LLMs can't reliably produce conforming bundles, the premise fails. Milestone 0
  exists specifically to test this in week one.
