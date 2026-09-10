# Moderation and trust

Two separate problems that get confused with each other.

## 1. Untrusted code

Games are arbitrary JavaScript from strangers. Handled structurally, not by review:

- Separate origin, `sandbox="allow-scripts"` **without** `allow-same-origin` → opaque
  origin, no cookies, no storage, no parent access.
- CSP with `connect-src 'none'` → the game cannot exfiltrate anything, because it cannot
  talk to the network at all.
- Upload validation rejects external references so the failure is loud at publish time.
- `postMessage` is the only channel, with a fixed schema and origin checks on both sides.

Residual risks we accept: a game can be annoying inside its own frame (spin the CPU, play
loud audio, render something offensive). Mitigated by a visible "report" button on every
play page and the ability to hide a version in one UPDATE.

**Not** relying on: reading the code before publishing. That doesn't scale past ~50 games
and gives false confidence.

## 2. Wrong answers

The harder problem, and the one that decides whether anyone trusts the site before an exam.
A game that confidently teaches you the wrong Krebs intermediate is worse than no game.

Layered, cheapest first:

1. **Report-a-question** — a report button *inside* the result screen, tied to a specific
   question, routed to the author. Most errors are honest typos and the author will fix
   them same-day.
2. **Accuracy as its own rating axis** — separates "fun but wrong" from "dry but correct",
   and accuracy is what ranks a course page.
3. **Cohort correction** — if 80% of players get question 7 "wrong", either the question is
   wrong or it's the most valuable question in the game. Flag it for the author either way;
   this falls out of the play data for free once plays are recorded per question.
4. **Verified contributors** — a tutor or high-reputation creator in the same course can
   mark a game "checked". Nothing automated.

## 3. Copyright

The thing that killed the note-sharing sites' reputation, and the most likely reason for a
university to send a letter.

- Upload requires an explicit "these are my own notes" attestation, stored per version.
- Publishing lecture slides verbatim is out of scope and against the rules — a game
  *derived from* your notes is fine, a game that *is* the slide deck is not.
- Takedown path documented and honoured fast; per-version storage prefixes make removal a
  single delete.
- Decide the content licence before launch, not after. See
  [06-open-questions.md](06-open-questions.md).

## 4. Cheating on leaderboards

Scores come from untrusted code, so they can be forged. See
[decisions/0003-scores-are-advisory.md](decisions/0003-scores-are-advisory.md). Short
version: keep leaderboards cohort-scoped and social rather than competitive, and don't
build anything of value on top of a self-reported number.
