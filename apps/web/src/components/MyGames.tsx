"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameFrame } from "./GameFrame";
import { LOCAL_GAMES_KEY } from "@/lib/data";

interface LocalGame {
  id: string;
  courseSlug: string;
  title: string;
  description: string;
  html: string;
  publishedAt: string;
}

export function MyGames() {
  const [list, setList] = useState<LocalGame[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_GAMES_KEY);
      setList(raw ? (JSON.parse(raw) as LocalGame[]) : []);
    } catch {
      setList([]);
    }
  }, []);

  function remove(id: string) {
    const next = (list ?? []).filter((g) => g.id !== id);
    setList(next);
    try {
      localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the UI is still consistent for this session */
    }
  }

  if (list === null) {
    return <p className="mt-10 text-sm muted">Loading…</p>;
  }

  if (list.length === 0) {
    return (
      <div className="surface mt-10 rounded-3xl p-12 text-center">
        <p className="text-4xl">📝</p>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          Nothing here yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed muted">
          Make one from your notes — it takes about a minute and you never touch code.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-block rounded-xl px-5 py-2.5 font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          Make a game
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      {list.map((g) => (
        <div key={g.id} className="surface rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold tracking-tight">{g.title}</h3>
              <p className="mt-1 text-sm muted">
                {g.courseSlug.toUpperCase()} ·{" "}
                {new Date(g.publishedAt).toLocaleDateString()}
              </p>
              {g.description && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed muted">
                  {g.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2 text-sm">
              <button
                onClick={() => setOpen(open === g.id ? null : g.id)}
                className="rounded-lg px-3 py-1.5 font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                {open === g.id ? "Close" : "Play"}
              </button>
              <button
                onClick={() => remove(g.id)}
                className="rounded-lg border rule px-3 py-1.5 muted transition-colors hover:text-[var(--fg)]"
              >
                Delete
              </button>
            </div>
          </div>

          {open === g.id && (
            <div className="mt-4">
              <GameFrame
                srcDoc={g.html}
                title={g.title}
                mode="practice"
                minHeight={460}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
