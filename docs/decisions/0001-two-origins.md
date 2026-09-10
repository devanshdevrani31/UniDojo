# 0001 — Games run on a separate origin

**Status:** accepted

## Context
Games are arbitrary JS from unverified students. The web app holds session cookies.

## Decision
Serve game bundles from a different registrable domain, embedded with
`sandbox="allow-scripts"` and no `allow-same-origin`, under a CSP with `connect-src 'none'`.
The only channel is `postMessage`.

## Consequences
- A malicious game cannot reach the user's session, storage, or the network.
- We need a second domain and a second (tiny) deployment.
- Games cannot fetch anything at runtime — everything ships in the bundle. This is a real
  constraint on what games can be, and we accept it.
- Retrofitting this later would mean re-auditing every published game. Do it from day one.
