# 0003 — Self-reported scores are advisory

**Status:** accepted

## Context
The game computes the score, and the game is untrusted code running on the player's own
machine. Any score it reports can be forged by anyone who opens devtools.

## Decision
Treat scores as advisory. Record them, show them, use them for personal progress — but
build nothing of value on top of them.

## Consequences
- Leaderboards are cohort-scoped and social ("your course this week"), not competitive
  ladders, and carry no prizes or reputation weight.
- Creator reputation comes from *ratings and play counts*, which are much harder to fake
  meaningfully, not from player scores.
- If a verifiable score is ever genuinely needed, it requires moving answer-checking
  server-side — which means structured game data, which means Path B. Note the coupling:
  "we want real leaderboards" and "we want an on-site builder" are the same project.
