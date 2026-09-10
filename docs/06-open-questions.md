# Open questions

Unresolved. Each one needs a human decision; none of them block Milestone 0.

### 1. Content licence
What licence do uploaded games carry? CC-BY-SA keeps everything remixable and forces
attribution — which fits the fork/remix loop — but means nobody can ever build a paid
product on top. CC-BY is friendlier and gives up the copyleft. Whatever you pick, it must
be in the Terms *before* the first upload; changing it retroactively is not possible without
asking every contributor.

### 2. Repository licence
The code in this repo. MIT if you want contributors and don't mind clones; AGPL if you want
a hosted-service moat. Currently **unset on purpose** — pick before making the repo public.

### 3. Anonymous play — how anonymous?
Playing without an account is right for the funnel, but it means anonymous plays inflate
counts and can't be rate-limited well. Fingerprint? IP bucket? Accept the noise?

### 4. Course taxonomy across universities
"Organic Chemistry 1" exists at 200 universities with 200 course codes. Keep courses
strictly per-university (simple, but fragments the content and every course page starts
empty) or add a cross-university subject layer (more useful, much more taxonomy work)?
This changes the data model, so decide before Milestone 1.

### 5. Which university first?
Launching everywhere at once means every course page is empty everywhere. One campus, one
faculty, one exam period is the only version of this that reaches critical mass. Which one
do you two actually have access to?

### 6. LLM cost, if Path B happens
On-site generation means we pay per game. Bring-your-own means the student pays (they use
their own Claude account) — a real strategic advantage of Path A that's easy to overlook.

### 7. Name and domain
`unidojo.app` / `unidojo.com` availability unchecked. The sandbox needs a **second
registrable domain**, not a subdomain — budget for two.
