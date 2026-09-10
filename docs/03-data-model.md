# Data model

Postgres. The real schema lives in `supabase/migrations/`; this is the map.

## Core entities

```
universities ──< courses ──< games ──< game_versions
                              │  │
       profiles ──────────────┘  ├──< plays
           │                     ├──< ratings
           └──< profiles.university_id
                                 ├──< comments
                                 └──< reports
```

### `universities`
`id, slug, name, country, email_domains text[]`

`email_domains` drives verification: a magic link to `@student.unimelb.edu.au` proves
enrolment better than any form. Unverified users can play and rate; only verified users can
publish to their university's courses.

### `courses`
`id, university_id, code, title, slug, created_by`

Student-created, not scraped — no course catalogue API is worth the integration. Duplicates
("COMP20003" vs "Comp 20003") get merged by moderators; the `code` is normalised on write.

### `games`
`id, slug, course_id, author_id, title, description, tags text[], current_version_id,
status, play_count, rating_accuracy, rating_fun, forked_from_id, created_at`

`status`: `draft | pending_review | published | hidden | removed`.
`forked_from_id` powers remix lineage.
The two rating columns are **denormalised aggregates** — recomputed on write, not on read.
Course pages are the hottest query and must not aggregate.

### `game_versions`
`id, game_id, storage_prefix, manifest jsonb, size_bytes, created_at, published_by`

**Immutable.** Never updated, only inserted. `games.current_version_id` is the pointer, so
rollback is one UPDATE and the CDN never has to be purged.

### `plays`
`id, game_id, version_id, user_id (nullable), mode, score, max_score, duration_ms,
completed, created_at`

Anonymous plays allowed (`user_id` null) — requiring signup to play kills the top of the
funnel. Rate-limited by IP.

### `ratings`
`user_id, game_id, accuracy smallint(1-5), fun smallint(1-5), created_at` — PK `(user_id, game_id)`

**Two axes on purpose.** A game can be a joy and factually wrong; that combination is
actively dangerous before an exam, and a single star rating hides it. Accuracy is what
surfaces a game on a course page; fun is what breaks ties.

Constraint: you can only rate a game you have a completed `play` for.

### `reports`
`id, game_id, version_id, reporter_id, reason, detail, status`

`reason`: `wrong_answer | copyright | broken | inappropriate | spam`.
`wrong_answer` is the common case and is the one that needs to reach the author fast.

### `profiles`
`id (= auth.users.id), handle, display_name, university_id, verified_at, bio, avatar_url`

## Access rules (RLS sketch)

| Table | Read | Write |
| --- | --- | --- |
| `games` | anyone, where `status = 'published'` | author, or moderator |
| `game_versions` | anyone, if parent published | insert: verified author only |
| `plays` | own rows; aggregates via view | insert: anyone (rate-limited) |
| `ratings` | anyone | own row, and only with a completed play |
| `reports` | reporter + moderators | insert: anyone signed in |

Aggregates (leaderboards, play counts) go through `SECURITY DEFINER` views so nobody reads
raw `plays`.

## Things deliberately absent in v1

Follows, DMs, notifications, collections/playlists, XP, badges, streaks. Each is a plausible
retention feature and each one is a reason not to ship. Revisit after the core loop has
real users.
