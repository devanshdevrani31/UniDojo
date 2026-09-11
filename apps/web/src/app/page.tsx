import Link from "next/link";
import { GameCard } from "@/components/GameCard";
import { FeaturedCard } from "@/components/FeaturedCard";
import {
  countGamesFor,
  getCoursesFor,
  getFeaturedGames,
  getPopularGames,
  getRecentGames,
  totalPlays,
  universities,
} from "@/lib/data";

export default function Home() {
  const featured = getFeaturedGames();
  const popular = getPopularGames(3);
  const recent = getRecentGames(3);

  return (
    <>
      <section className="py-20 sm:py-28">
        <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.16em] muted">
          Study games, made by your cohort
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Turn your lecture notes into a game.
          <br />
          <span style={{ color: "var(--accent)" }}>
            Let the rest of your year beat your score.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed muted">
          Note-sharing sites hand you a PDF you&apos;ll skim once. UniDojo hands you
          something you have to actually answer — built from real notes, by the
          people sitting the same exam.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/create"
            className="rounded-xl px-5 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Make a game from your notes
          </Link>
          <Link
            href={featured[0] ? `/g/${featured[0].slug}` : "/g/big-o-spot-the-error"}
            className="surface rounded-xl px-5 py-3 text-[15px] font-medium transition-colors hover:border-[var(--accent)]"
          >
            Play one first →
          </Link>
        </div>

        <p className="mt-5 text-sm muted">
          No coding. No account needed to play. About a minute to publish.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border rule"
        style={{ background: "var(--line)" }}>
        {[
          { n: totalPlays().toLocaleString("en-US"), l: "games played" },
          { n: universities.length.toString(), l: "universities" },
          { n: "4", l: "ways to publish" },
        ].map((s) => (
          <div key={s.l} className="px-5 py-6 text-center" style={{ background: "var(--bg-raised)" }}>
            <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {s.n}
            </p>
            <p className="mt-1 text-[13px] muted">{s.l}</p>
          </div>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="mt-14">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight">
              Start with these
            </h2>
            <p className="mt-1 text-sm muted">
              Full-course trainers, not single-topic quizzes. Both run for a whole
              exam&apos;s worth of material.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((g) => (
              <FeaturedCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}

      <Section title="Most played" href="/u/unimelb" linkLabel="Browse all">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((g) => (
            <GameCard key={g.slug} game={g} showCourse />
          ))}
        </div>
      </Section>

      <Section title="Just published">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((g) => (
            <GameCard key={g.slug} game={g} showCourse />
          ))}
        </div>
      </Section>

      <Section title="Universities">
        <div className="grid gap-4 sm:grid-cols-3">
          {universities.map((u) => {
            const cs = getCoursesFor(u.slug);
            const n = cs.reduce((acc, c) => acc + countGamesFor(c.slug), 0);
            return (
              <Link
                key={u.slug}
                href={`/u/${u.slug}`}
                className="surface rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <h3 className="font-semibold tracking-tight">{u.name}</h3>
                <p className="mt-1 text-sm muted">
                  {cs.length} {cs.length === 1 ? "course" : "courses"} · {n}{" "}
                  {n === 1 ? "game" : "games"}
                </p>
              </Link>
            );
          })}
        </div>
      </Section>

      <section className="my-24 surface rounded-3xl p-8 sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Making one takes about a minute
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed muted">
          You never touch code. Paste your notes and we&apos;ll build it — or hit one
          button, paste into Claude, and paste what it gives back. Both end up in the
          same place.
        </p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            ["Paste your notes", "Lecture notes, a reading, your own summary. Messy is fine."],
            ["Watch it build", "You get a playable game, not a wall of questions."],
            ["Play it, then publish", "Check it yourself first. Fix anything wrong in a form."],
          ].map(([t, d], i) => (
            <li key={t}>
              <span
                className="grid h-7 w-7 place-items-center rounded-full text-[13px] font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                {i + 1}
              </span>
              <h3 className="mt-3 font-medium">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed muted">{d}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/create"
          className="mt-8 inline-block rounded-xl px-5 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Try it with your notes
        </Link>
      </section>
    </>
  );
}

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {href && (
          <Link href={href} className="text-sm muted hover:text-[var(--fg)]">
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
