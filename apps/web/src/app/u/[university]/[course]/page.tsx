import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GameCard } from "@/components/GameCard";
import { courses, getCourse, getGamesFor, getUniversity } from "@/lib/data";

export function generateStaticParams() {
  return courses.map((c) => ({
    university: c.universitySlug,
    course: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ university: string; course: string }>;
}): Promise<Metadata> {
  const { university, course } = await params;
  const c = getCourse(university, course);
  return { title: c ? `${c.code} — ${c.title}` : "Not found" };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ university: string; course: string }>;
}) {
  const { university, course } = await params;
  const uni = getUniversity(university);
  const c = getCourse(university, course);
  if (!uni || !c) notFound();

  const list = getGamesFor(c.slug);

  return (
    <>
      <nav className="flex flex-wrap items-center gap-2 pt-8 text-sm muted">
        <Link href="/" className="hover:text-[var(--fg)]">
          UniDojo
        </Link>
        <span>/</span>
        <Link href={`/u/${uni.slug}`} className="hover:text-[var(--fg)]">
          {uni.short}
        </Link>
        <span>/</span>
        <span className="text-[var(--fg)]">{c.code}</span>
      </nav>

      <header className="flex flex-col gap-5 border-b rule py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium tracking-wide muted">{c.code}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.title}
          </h1>
          <p className="mt-2 text-sm muted">
            Ranked by accuracy. Ties broken by which one is more fun.
          </p>
        </div>
        <Link
          href="/create"
          className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Add a game to {c.code}
        </Link>
      </header>

      {list.length > 0 ? (
        <div className="mb-24 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      ) : (
        <EmptyCourse code={c.code} />
      )}
    </>
  );
}

/**
 * The empty state is the most important screen on the site — most course pages start
 * here, and it's the only thing standing between a cold start and no content at all.
 * So it sells the two key-free paths rather than apologising.
 */
function EmptyCourse({ code }: { code: string }) {
  return (
    <div className="surface my-10 mb-24 rounded-3xl p-8 text-center sm:p-14">
      <p className="text-4xl">🥋</p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">
        Nobody has made one for {code} yet
      </h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed muted">
        Be first. Paste your notes and you&apos;ll have a playable game in about a
        minute — no coding, and you can play it yourself before anyone else sees it.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/create"
          className="rounded-xl px-5 py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)" }}
        >
          Make the first one
        </Link>
        <Link
          href="/g/cell-biology-flashcard-sprint"
          className="rounded-xl border rule px-5 py-3 text-[15px] font-medium transition-colors hover:border-[var(--accent)]"
        >
          See an example
        </Link>
      </div>
    </div>
  );
}
