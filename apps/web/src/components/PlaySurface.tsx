"use client";

import { useCallback, useState } from "react";
import { GameFrame } from "./GameFrame";

type Mode = "practice" | "test";

export function PlaySurface({
  src,
  title,
  accuracy,
  fun,
  ratingCount,
  editable,
}: {
  src: string;
  title: string;
  accuracy: number | null;
  fun: number | null;
  ratingCount: number;
  editable: boolean;
}) {
  const [mode, setMode] = useState<Mode>("practice");
  const [finished, setFinished] = useState(false);
  const [run, setRun] = useState(0);

  // Ratings are gated on a completed play — see docs/03-data-model.md.
  const onComplete = useCallback(() => setFinished(true), []);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setFinished(false);
    setRun((n) => n + 1); // remount the frame so the game restarts cleanly
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-3 flex items-center gap-1 text-sm">
          {(["practice", "test"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="rounded-lg px-3 py-1.5 font-medium capitalize transition-colors"
              style={
                mode === m
                  ? { background: "var(--accent)", color: "#fff" }
                  : { color: "var(--fg-muted)" }
              }
            >
              {m}
            </button>
          ))}
          <span className="ml-2 text-[13px] muted">
            {mode === "practice"
              ? "Answers shown when you slip."
              : "No answers. Scored."}
          </span>
        </div>

        <GameFrame
          key={`${mode}-${run}`}
          src={src}
          title={title}
          mode={mode}
          onComplete={onComplete}
        />
      </div>

      <aside className="flex flex-col gap-4">
        <RatingBox
          accuracy={accuracy}
          fun={fun}
          ratingCount={ratingCount}
          unlocked={finished}
        />

        <div className="surface rounded-2xl p-4 text-sm">
          <h3 className="font-medium">Something wrong?</h3>
          <p className="mt-1 leading-relaxed muted">
            {editable
              ? "This game's questions are editable — a wrong answer can be fixed in a form, no code."
              : "Report it and it goes straight to the author."}
          </p>
          <button
            className="mt-3 w-full rounded-lg border rule px-3 py-2 font-medium transition-colors hover:border-[var(--accent)]"
            onClick={() => alert("Report flow lands in Milestone 2.")}
          >
            Report a wrong answer
          </button>
        </div>

        <div className="surface rounded-2xl p-4 text-[13px] leading-relaxed muted">
          <h3 className="font-medium text-[var(--fg)]">Sandboxed</h3>
          <p className="mt-1">
            This game is student-written code. It runs with no network access and no
            way to reach your session.
          </p>
        </div>
      </aside>
    </div>
  );
}

function RatingBox({
  accuracy,
  fun,
  ratingCount,
  unlocked,
}: {
  accuracy: number | null;
  fun: number | null;
  ratingCount: number;
  unlocked: boolean;
}) {
  const [given, setGiven] = useState<{ a: number; f: number }>({ a: 0, f: 0 });

  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium">Ratings</h3>
        <span className="text-[12px] muted">{ratingCount} ratings</span>
      </div>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <Row label="Accurate" value={accuracy} hint="Is the content correct?" />
        <Row label="Fun" value={fun} hint="Is it worth playing?" />
      </dl>

      <div className="mt-4 border-t rule pt-3">
        {unlocked ? (
          <>
            <p className="text-[13px] font-medium">Your turn — how was it?</p>
            <Picker
              label="Accurate"
              value={given.a}
              onChange={(a) => setGiven((g) => ({ ...g, a }))}
            />
            <Picker
              label="Fun"
              value={given.f}
              onChange={(f) => setGiven((g) => ({ ...g, f }))}
            />
          </>
        ) : (
          <p className="text-[13px] muted">
            Finish a run to rate it. Ratings only count from people who played.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint: string;
}) {
  return (
    <div title={hint}>
      <div className="flex items-baseline justify-between">
        <dt className="muted">{label}</dt>
        <dd className="tabular-nums font-medium">
          {value === null ? "—" : value.toFixed(1)}
        </dd>
      </div>
      <div className="mt-1 h-1 rounded-full" style={{ background: "var(--line)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${((value ?? 0) / 5) * 100}%`,
            background: "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

function Picker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-between">
      <span className="text-[13px] muted">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            aria-label={`${label} ${n} of 5`}
            onClick={() => onChange(n)}
            className="h-6 w-6 rounded text-[13px] tabular-nums transition-colors"
            style={
              n <= value
                ? { background: "var(--accent)", color: "#fff" }
                : { border: "1px solid var(--line)", color: "var(--fg-muted)" }
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
