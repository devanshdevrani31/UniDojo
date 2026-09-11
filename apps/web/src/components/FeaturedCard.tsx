import Link from "next/link";
import { getCourse, getUniversity } from "@/lib/data";
import type { Game } from "@/lib/types";

/**
 * The big card at the top of the home page.
 *
 * Deliberately does NOT lead with play counts or ratings: a featured game is usually a
 * new one, and a row of zeros next to a seeded game's "2,107 plays" reads as failure.
 * It sells the game on what it actually contains instead.
 */
export function FeaturedCard({ game }: { game: Game }) {
  const uni = getUniversity(game.universitySlug);
  const course = getCourse(game.universitySlug, game.courseSlug);

  return (
    <Link
      href={`/g/${game.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:p-7"
      style={{
        border: "1px solid color-mix(in oklab, var(--accent) 35%, var(--line))",
        background:
          "linear-gradient(160deg, color-mix(in oklab, var(--accent) 9%, var(--bg-raised)), var(--bg-raised) 55%)",
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wider">
        <span
          className="rounded-full px-2 py-0.5 text-white"
          style={{ background: "var(--accent)" }}
        >
          Featured
        </span>
        {uni && course && (
          <span className="muted">
            {uni.short} · {course.code}
          </span>
        )}
      </div>

      <h3 className="text-xl font-semibold leading-tight tracking-tight group-hover:text-[var(--accent)] sm:text-2xl">
        {game.title}
      </h3>

      <p className="mt-3 text-[15px] leading-relaxed muted">
        {game.pitch ?? game.description}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] muted">
        <span className="rounded-full border rule px-2 py-0.5">
          {game.estimatedMinutes} min
        </span>
        <span className="rounded-full border rule px-2 py-0.5">
          {game.difficulty}
        </span>
        {game.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full border rule px-2 py-0.5">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t rule pt-4">
        <span className="text-[13px] muted">
          by @{game.author.handle}
          {game.author.verified && " ✓"}
        </span>
        <span
          className="text-[14px] font-medium"
          style={{ color: "var(--accent)" }}
        >
          Play →
        </span>
      </div>
    </Link>
  );
}
