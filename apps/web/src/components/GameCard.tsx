import Link from "next/link";
import { RUNG_LABEL, type Game } from "@/lib/types";
import { getCourse } from "@/lib/data";

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">unrated</span>;
  return (
    <span className="tabular-nums">
      {value.toFixed(1)}
      <span className="muted"> / 5</span>
    </span>
  );
}

export function GameCard({ game, showCourse = false }: { game: Game; showCourse?: boolean }) {
  const course = getCourse(game.universitySlug, game.courseSlug);

  return (
    <Link
      href={`/g/${game.slug}`}
      className="group surface flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {showCourse && course && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider muted">
              {course.code}
            </p>
          )}
          <h3 className="text-[17px] font-semibold leading-snug tracking-tight group-hover:text-[var(--accent)]">
            {game.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full border rule px-2 py-0.5 text-[11px] muted">
          {game.estimatedMinutes} min
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed muted">
        {game.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <span title="Accuracy — is it correct?">
          <span className="muted">Accurate </span>
          <Stars value={game.ratingAccuracy} />
        </span>
        <span title="Fun — is it worth playing?">
          <span className="muted">Fun </span>
          <Stars value={game.ratingFun} />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t rule pt-3 text-[12px] muted">
        <span>
          by @{game.author.handle}
          {game.author.verified && (
            <span title="Verified student" className="ml-1">
              ✓
            </span>
          )}
        </span>
        <span>{game.playCount.toLocaleString("en-US")} plays</span>
      </div>

      <span className="sr-only">{RUNG_LABEL[game.rung]}</span>
    </Link>
  );
}
