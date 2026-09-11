import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  countGamesFor,
  getCoursesFor,
  getUniversity,
  universities,
} from "@/lib/data";

export function generateStaticParams() {
  return universities.map((u) => ({ university: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ university: string }>;
}): Promise<Metadata> {
  const { university } = await params;
  const uni = getUniversity(university);
  return { title: uni ? uni.name : "Not found" };
}

export default async function UniversityPage({
  params,
}: {
  params: Promise<{ university: string }>;
}) {
  const { university } = await params;
  const uni = getUniversity(university);
  if (!uni) notFound();

  const courses = getCoursesFor(uni.slug);
  const byFaculty = courses.reduce<Record<string, typeof courses>>((acc, c) => {
    (acc[c.faculty] ??= []).push(c);
    return acc;
  }, {});

  return (
    <>
      <nav className="flex items-center gap-2 pt-8 text-sm muted">
        <Link href="/" className="hover:text-[var(--fg)]">
          UniDojo
        </Link>
        <span>/</span>
        <span className="text-[var(--fg)]">{uni.short}</span>
      </nav>

      <header className="border-b rule py-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {uni.name}
        </h1>
        <p className="mt-2 muted">
          {courses.length} courses · verify with an @{uni.emailDomains[0]} address
          to publish
        </p>
      </header>

      <div className="mb-24 mt-10 flex flex-col gap-10">
        {Object.entries(byFaculty).map(([faculty, list]) => (
          <section key={faculty}>
            <h2 className="mb-4 text-[13px] font-medium uppercase tracking-[0.14em] muted">
              {faculty}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((c) => {
                const n = countGamesFor(c.slug);
                return (
                  <Link
                    key={c.slug}
                    href={`/u/${uni.slug}/${c.slug}`}
                    className="surface group flex items-center justify-between gap-4 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium tracking-wide muted">
                        {c.code}
                      </p>
                      <h3 className="truncate font-medium group-hover:text-[var(--accent)]">
                        {c.title}
                      </h3>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums muted">
                      {n === 0 ? "—" : `${n} game${n === 1 ? "" : "s"}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
