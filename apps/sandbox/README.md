# apps/sandbox

The untrusted-code player. Deployed to a **different registrable domain** from `apps/web`.
See [docs/decisions/0001-two-origins.md](../../docs/decisions/0001-two-origins.md).

Its entire job:

1. Serve `/g/{gameId}/{versionId}/*` — static bundle files from Supabase Storage.
2. Send every response with:
   ```
   Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline';
     style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:;
     font-src 'self'; connect-src 'none'; frame-ancestors https://unidojo.app
   X-Content-Type-Options: nosniff
   ```
3. Nothing else. No auth, no database, no user data. If this app ever needs a session,
   something has gone wrong architecturally.

`connect-src 'none'` is the load-bearing directive — it's what makes a hostile game unable
to exfiltrate anything it manages to read.
