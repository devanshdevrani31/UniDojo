import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PlaySurface } from "@/components/PlaySurface";
import { games, getCourse, getGame, getUniversity } from "@/lib/data";
import { RUNG_LABEL } from "@/lib/types";

export function generateStaticParams() {
  return games.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGame(slug);
  return g
    ? { title: g.title, description: g.description }
    : { title: "Not found" };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  const uni = getUniversity(game.universitySlug);
  const course = getCourse(game.universitySlug, game.courseSlug);

  return (
    <>
      <nav className="flex flex-wrap items-center gap-2 pt-8 text-sm muted">
        <Link href="/" className="hover:text-[var(--fg)]">
          UniDojo
        </Link>
        {uni && (
          <>
            <span>/</span>
            <Link href={`/u/${uni.slug}`} className="hover:text-[var(--fg)]">
              {uni.short}
            </Link>
          </>
        )}
        {uni && course && (
          <>
            <span>/</span>
            <Link
              href={`/u/${uni.slug}/${course.slug}`}
              className="hover:text-[var(--fg)]"
            >
              {course.code}
            </Link>
          </>
        )}
      </nav>

      <header className="py-7">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {game.title}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed muted">{game.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] muted">
          <span>
            by @{game.author.handle}
            {game.author.verified && " ✓"}
          </span>
          <Dot />
          <span>{game.topic}</span>
          <Dot />
          <span>{game.difficulty}</span>
          <Dot />
          <span>{game.playCount.toLocaleString("en-US")} plays</span>
          <Dot />
          <span className="rounded-full border rule px-2 py-0.5">
            {RUNG_LABEL[game.rung]}
          </span>
        </div>
      </header>

      <PlaySurface
        src={game.bundlePath}
        title={game.title}
        accuracy={game.ratingAccuracy}
        fun={game.ratingFun}
        ratingCount={game.ratingCount}
        editable={game.editable}
      />

      <div className="mb-24" />
    </>
  );
}

function Dot() {
  return <span aria-hidden>·</span>;
}
