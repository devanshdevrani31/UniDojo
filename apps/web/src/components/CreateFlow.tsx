"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameFrame } from "./GameFrame";
import { buildPrompt } from "@/lib/prompt";
import {
  checkBundle,
  countItems,
  manifestString,
  parseBundle,
  type Extracted,
  type Issue,
} from "@/lib/bundle";
import { LOCAL_GAMES_KEY } from "@/lib/data";

interface CourseOption {
  value: string;
  label: string;
  group: string;
}

type Step = "notes" | "paste" | "preview" | "done";

export function CreateFlow({ courses }: { courses: CourseOption[] }) {
  const [step, setStep] = useState<Step>("notes");
  const [courseSlug, setCourseSlug] = useState(courses[0]?.value ?? "");
  const [notes, setNotes] = useState("");
  const [pasted, setPasted] = useState("");
  const [copied, setCopied] = useState(false);
  const [bundle, setBundle] = useState<Extracted | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [parseFailed, setParseFailed] = useState(false);

  const courseLabel = useMemo(
    () => courses.find((c) => c.value === courseSlug)?.label ?? "",
    [courses, courseSlug],
  );

  const groups = useMemo(() => {
    const m = new Map<string, CourseOption[]>();
    for (const c of courses) {
      const list = m.get(c.group) ?? [];
      list.push(c);
      m.set(c.group, list);
    }
    return [...m.entries()];
  }, [courses]);

  async function handoffToClaude() {
    const prompt = buildPrompt(notes, courseLabel);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure context, permissions). Don't dead-end —
      // the textarea fallback below lets them copy it by hand.
      setCopied(false);
    }
    window.open("https://claude.ai/new", "_blank", "noopener,noreferrer");
    setStep("paste");
  }

  function handlePaste(text: string) {
    setPasted(text);
    setParseFailed(false);
    if (text.trim().length < 40) return;

    const parsed = parseBundle(text);
    if (!parsed) {
      setBundle(null);
      setParseFailed(true);
      return;
    }
    setBundle(parsed);
    setIssues(checkBundle(parsed));
    setStep("preview");
  }

  function publish() {
    if (!bundle) return;
    try {
      const existing = JSON.parse(
        localStorage.getItem(LOCAL_GAMES_KEY) ?? "[]",
      ) as unknown[];
      existing.unshift({
        id: `local-${Date.now()}`,
        courseSlug,
        title: manifestString(bundle.manifest, "title", "Untitled game"),
        description: manifestString(bundle.manifest, "description"),
        html: bundle.html,
        publishedAt: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(existing.slice(0, 20)));
    } catch {
      // Storage can be unavailable (private mode). The draft still published visually;
      // nothing here is the source of truth once Supabase lands.
    }
    setStep("done");
  }

  const blocking = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-6">
        {/* ---------------------------------------------------------------- step 1 */}
        <Panel n={1} title="What's it for?" active={step === "notes"}>
          <select
            value={courseSlug}
            onChange={(e) => setCourseSlug(e.target.value)}
            className="w-full rounded-xl border rule bg-transparent px-3 py-2.5 text-[15px]"
          >
            {groups.map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <label className="mt-5 block text-sm font-medium">Paste your notes</label>
          <p className="mb-2 text-[13px] muted">
            Lecture notes, a reading, your own summary. Messy is fine — it only uses
            what&apos;s actually there.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={10}
            placeholder="Paste your notes here…"
            className="w-full resize-y rounded-xl border rule bg-transparent p-3 font-mono text-[13px] leading-relaxed"
          />
          <p className="mt-1.5 text-right text-[12px] tabular-nums muted">
            {notes.trim() ? `${notes.trim().split(/\s+/).length} words` : "empty"}
          </p>
        </Panel>

        {/* ---------------------------------------------------------------- step 2 */}
        <Panel n={2} title="Build it" active={step === "notes" || step === "paste"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border rule p-4 opacity-60">
              <h4 className="font-medium">We build it for you</h4>
              <p className="mt-1 text-[13px] leading-relaxed muted">
                Nothing to set up — but it needs a server to call the model, which this
                draft doesn&apos;t have yet.
              </p>
              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-lg border rule px-3 py-2 text-sm font-medium"
              >
                Coming in Milestone 3
              </button>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                border: "1px solid var(--accent)",
                background: "color-mix(in oklab, var(--accent) 6%, transparent)",
              }}
            >
              <h4 className="font-medium">Make it in your Claude</h4>
              <p className="mt-1 text-[13px] leading-relaxed muted">
                Uses your own Claude — no key, no card. We copy everything; you just
                paste, then paste back.
              </p>
              <button
                onClick={handoffToClaude}
                disabled={!notes.trim()}
                className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Copy &amp; open Claude ↗
              </button>
            </div>
          </div>

          {step === "paste" && (
            <div className="mt-5 rounded-xl border rule p-4">
              <p className="text-sm font-medium">
                {copied
                  ? "Copied. Paste it into Claude (Ctrl+V), then copy what it gives back."
                  : "Couldn't copy automatically — select the prompt below and copy it."}
              </p>
              {!copied && (
                <textarea
                  readOnly
                  rows={5}
                  value={buildPrompt(notes, courseLabel)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="mt-2 w-full resize-y rounded-lg border rule bg-transparent p-2 font-mono text-[11px]"
                />
              )}
            </div>
          )}
        </Panel>

        {/* ---------------------------------------------------------------- step 3 */}
        <Panel
          n={3}
          title="Paste what Claude gave you"
          active={step === "paste" || step === "preview"}
        >
          <textarea
            value={pasted}
            onChange={(e) => handlePaste(e.target.value)}
            rows={6}
            placeholder="Paste the whole reply — code block, chat text and all. We'll find the game."
            className="w-full resize-y rounded-xl border rule bg-transparent p-3 font-mono text-[13px]"
          />

          {parseFailed && (
            <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[13px]">
              Couldn&apos;t find a game in that. Make sure you copied the whole code
              block — it should start with{" "}
              <code className="font-mono">&lt;!doctype html&gt;</code>.
            </p>
          )}

          {bundle && (
            <div className="mt-4 flex flex-col gap-2">
              {blocking.map((i, n) => (
                <Note key={n} tone="error" text={i.message} />
              ))}
              {warnings.map((i, n) => (
                <Note key={n} tone="warn" text={i.message} />
              ))}
              {blocking.length === 0 && warnings.length === 0 && (
                <Note tone="ok" text="Looks good. Play it before you publish." />
              )}
            </div>
          )}
        </Panel>

        {/* ---------------------------------------------------------------- step 4 */}
        {bundle && step !== "done" && (
          <Panel n={4} title="Play it yourself first" active>
            <GameFrame
              key={bundle.html.length}
              srcDoc={bundle.html}
              title="Preview"
              mode="practice"
              minHeight={460}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={publish}
                disabled={blocking.length > 0}
                className="rounded-xl px-5 py-2.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                Publish to {courseLabel.split(" — ")[0]}
              </button>
              {blocking.length > 0 && (
                <span className="text-[13px] muted">
                  Fix the problem above first — ask Claude again and re-paste.
                </span>
              )}
            </div>
          </Panel>
        )}

        {step === "done" && (
          <div className="surface rounded-2xl p-8 text-center">
            <p className="text-4xl">🥋</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Published</h2>
            <p className="mx-auto mt-2 max-w-md leading-relaxed muted">
              In this draft it&apos;s saved in your browser rather than to a real
              account — the database lands in Milestone 1.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/my-games"
                className="rounded-xl px-5 py-2.5 font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                See your games
              </Link>
              <button
                onClick={() => {
                  setStep("notes");
                  setPasted("");
                  setBundle(null);
                  setNotes("");
                }}
                className="rounded-xl border rule px-5 py-2.5 font-medium"
              >
                Make another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- aside */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        {bundle && (
          <div className="surface rounded-2xl p-4 text-sm">
            <h3 className="font-medium">What you made</h3>
            <dl className="mt-2 flex flex-col gap-1.5 text-[13px]">
              <Meta
                k="Title"
                v={manifestString(bundle.manifest, "title", "—")}
              />
              <Meta
                k="Questions"
                v={countItems(bundle.content)?.toString() ?? "—"}
              />
              <Meta
                k="Editable later"
                v={bundle.content ? "yes" : "no — content is in the code"}
              />
              <Meta k="Size" v={`${Math.round(bundle.html.length / 1024)} KB`} />
            </dl>
          </div>
        )}

        <div className="surface rounded-2xl p-4 text-[13px] leading-relaxed">
          <h3 className="font-medium">Why two pastes?</h3>
          <p className="mt-1.5 muted">
            There&apos;s no way for a website to use your Claude subscription directly —
            that would mean an API key and a credit card. Copy-and-paste skips all of
            that, and costs you nothing extra.
          </p>
        </div>

        <div className="surface rounded-2xl p-4 text-[13px] leading-relaxed">
          <h3 className="font-medium">Use your own notes</h3>
          <p className="mt-1.5 muted">
            Your own summaries and notes are fine. Uploading a lecturer&apos;s slides
            verbatim isn&apos;t — that&apos;s their copyright, and it&apos;s what got
            the note-sharing sites in trouble.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Panel({
  n,
  title,
  active,
  children,
}: {
  n: number;
  title: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="surface rounded-2xl p-5 transition-opacity sm:p-6"
      style={{ opacity: active ? 1 : 0.55 }}
    >
      <h3 className="mb-4 flex items-center gap-2.5 font-semibold tracking-tight">
        <span
          className="grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold text-white"
          style={{ background: active ? "var(--accent)" : "var(--fg-muted)" }}
        >
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Note({ tone, text }: { tone: "error" | "warn" | "ok"; text: string }) {
  const style = {
    error: { border: "#e2483d", bg: "rgba(226,72,61,0.08)", icon: "✕" },
    warn: { border: "#d19a2a", bg: "rgba(209,154,42,0.08)", icon: "!" },
    ok: { border: "#3fae6b", bg: "rgba(63,174,107,0.08)", icon: "✓" },
  }[tone];

  return (
    <p
      className="flex items-start gap-2 rounded-lg p-3 text-[13px] leading-relaxed"
      style={{ border: `1px solid ${style.border}55`, background: style.bg }}
    >
      <span aria-hidden className="mt-px font-bold" style={{ color: style.border }}>
        {style.icon}
      </span>
      <span>{text}</span>
    </p>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="muted">{k}</dt>
      <dd className="truncate text-right font-medium">{v}</dd>
    </div>
  );
}
