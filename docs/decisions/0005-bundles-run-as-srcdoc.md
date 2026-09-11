# 0005 — Bundles run as `srcdoc`, not `src`

**Status:** accepted (first draft). Refines [0001](0001-two-origins.md).

## Context

0001 requires games to run in `<iframe sandbox="allow-scripts">` without
`allow-same-origin`, which gives the frame an opaque origin and no access to the user's
session.

Pointing that frame at a URL (`src="/games/…/index.html"`) turned out to render **blank** in
at least one embedder — the document loads (the `load` event fires, `contentWindow` exists)
but nothing paints and no script runs. Measured directly: the same file in the same sandbox
works via `srcdoc`, and works via `src` the moment `allow-same-origin` is added. Adding
`allow-same-origin` is exactly what we must not do.

## Decision

The host fetches the bundle and hands the document to the frame as `srcdoc`, with the CSP
injected as a `<meta http-equiv>` at the top of the document.

## Consequences

- Both security properties survive: opaque origin (no session access) and
  `connect-src 'none'` (no exfiltration). Verified by measurement, not assumption.
- **A bundle must be a single self-contained document.** Relative asset paths can't resolve
  from an opaque origin, so images, audio and fonts must be inline as `data:` URIs. The
  contract already required self-contained games with no external references, so this
  narrows the existing rule rather than contradicting it — but it does mean the multi-file
  bundle shape in 0001 is not supported today.
- The CSP *header* on `/games/*` (next.config.ts) still matters as defence in depth, for
  anyone who navigates to a bundle URL directly.
- The host does one extra fetch before the game can start. Same origin, cacheable, and
  it's what lets us inject the policy — acceptable.
- Revisit when the second origin lands. On a genuinely foreign origin, `src` may be the
  better shape again, and it would restore multi-file bundles.
