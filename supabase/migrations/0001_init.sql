-- UniDojo initial schema. See docs/03-data-model.md.
-- Run with: supabase db reset  (or paste into the SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- universities
create table universities (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  country       text,
  email_domains text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------------- profiles
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,
  display_name  text not null,
  university_id uuid references universities(id),
  verified_at   timestamptz,
  bio           text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- -------------------------------------------------------------------- courses
create table courses (
  id            uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  code          text not null,
  title         text not null,
  slug          text not null,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  unique (university_id, slug)
);

-- ---------------------------------------------------------------------- games
create type game_status as enum ('draft', 'pending_review', 'published', 'hidden', 'removed');

create table games (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  course_id          uuid not null references courses(id) on delete cascade,
  author_id          uuid not null references profiles(id) on delete cascade,
  title              text not null,
  description        text,
  tags               text[] not null default '{}',
  current_version_id uuid,                          -- FK added after game_versions
  status             game_status not null default 'draft',
  forked_from_id     uuid references games(id),
  -- denormalised aggregates; recomputed on write, never aggregated on a course page read
  play_count         integer not null default 0,
  rating_accuracy    numeric(3,2),
  rating_fun         numeric(3,2),
  rating_count       integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Immutable. Insert-only: a new publish is a new row, never an update.
create table game_versions (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  storage_prefix text not null,
  manifest       jsonb not null,
  size_bytes     integer not null,
  published_by   uuid references profiles(id),
  created_at     timestamptz not null default now()
);

alter table games
  add constraint games_current_version_fk
  foreign key (current_version_id) references game_versions(id);

-- ---------------------------------------------------------------------- plays
create table plays (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  version_id  uuid not null references game_versions(id),
  user_id     uuid references profiles(id) on delete set null,  -- null = anonymous
  mode        text not null check (mode in ('practice', 'test')),
  score       numeric,
  max_score   numeric,
  duration_ms integer,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------------- ratings
-- Two axes on purpose: a game can be fun and wrong, which is worse than dull and right.
create table ratings (
  user_id    uuid not null references profiles(id) on delete cascade,
  game_id    uuid not null references games(id) on delete cascade,
  accuracy   smallint not null check (accuracy between 1 and 5),
  fun        smallint not null check (fun between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- -------------------------------------------------------------------- reports
create table reports (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  version_id  uuid references game_versions(id),
  reporter_id uuid references profiles(id) on delete set null,
  reason      text not null check (reason in ('wrong_answer','copyright','broken','inappropriate','spam')),
  detail      text,
  status      text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------- indexes
create index games_course_status_idx on games (course_id, status);
create index games_author_idx        on games (author_id);
create index game_versions_game_idx  on game_versions (game_id, created_at desc);
create index plays_game_idx          on plays (game_id, created_at desc);
create index plays_user_idx          on plays (user_id, created_at desc);
create index reports_open_idx        on reports (status, created_at desc);

-- ----------------------------------------------------------------------- RLS
-- Sketch only. Tighten before anything is public. See docs/03-data-model.md.
alter table games         enable row level security;
alter table game_versions enable row level security;
alter table plays         enable row level security;
alter table ratings       enable row level security;
alter table reports       enable row level security;
alter table profiles      enable row level security;

create policy "published games are public"
  on games for select using (status = 'published');

create policy "authors manage their games"
  on games for all using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "versions of published games are public"
  on game_versions for select
  using (exists (select 1 from games g where g.id = game_id and g.status = 'published'));

create policy "anyone can record a play"
  on plays for insert with check (true);

create policy "you can read your own plays"
  on plays for select using (user_id = auth.uid());

create policy "ratings are public"
  on ratings for select using (true);

-- You may only rate a game you have actually finished.
create policy "rate only what you completed"
  on ratings for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from plays p
      where p.game_id = ratings.game_id and p.user_id = auth.uid() and p.completed
    )
  );

create policy "profiles are public"
  on profiles for select using (true);

create policy "you manage your own profile"
  on profiles for update using (id = auth.uid()) with check (id = auth.uid());
