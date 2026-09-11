"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Host side of the game contract. See docs/02-game-contract.md.
 *
 * SECURITY: `sandbox="allow-scripts"` WITHOUT `allow-same-origin` is deliberate and
 * load-bearing — it drops the frame into an opaque origin, so the game cannot read this
 * page's cookies, storage, or DOM. Do not add allow-same-origin.
 *
 * Bundles are handed to the frame as `srcdoc` rather than pointed at by `src`. A
 * URL-loaded document in an opaque-origin sandbox renders blank in some embedders, and
 * srcdoc is well-defined everywhere. It also means the served CSP header doesn't apply
 * to the frame, so we inline the equivalent policy below — `connect-src 'none'` is the
 * directive that stops a hostile game exfiltrating anything it reads.
 *
 * Cost of this approach: a bundle must be a single self-contained document, since
 * relative asset paths can't resolve from an opaque origin. The contract already
 * requires self-contained games, so assets belong inline as data: URIs.
 */

const V = 1;

const FRAME_CSP =
  "default-src 'none'; " +
  "script-src 'unsafe-inline'; " +
  "style-src 'unsafe-inline'; " +
  "img-src data:; " +
  "media-src data:; " +
  "font-src data:; " +
  "connect-src 'none'; " +
  "form-action 'none'; " +
  "base-uri 'none'";

/** Inject the policy as the first thing in <head> so it covers everything after it. */
function withPolicy(html: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">`;
  const headOpen = html.match(/<head[^>]*>/i);
  if (headOpen) {
    const at = html.indexOf(headOpen[0]) + headOpen[0].length;
    return html.slice(0, at) + meta + html.slice(at);
  }
  // No explicit <head> (the common shape for these one-file games) — sit it right
  // after the doctype, before any script or style the document declares.
  const doctype = html.match(/<!doctype html>/i);
  if (doctype) {
    const at = html.indexOf(doctype[0]) + doctype[0].length;
    return html.slice(0, at) + meta + html.slice(at);
  }
  return meta + html;
}

type Mode = "practice" | "test";

interface Result {
  score: number;
  max: number;
  durationMs: number;
}

export function GameFrame({
  src,
  srcDoc,
  title,
  mode,
  minHeight = 520,
  onComplete,
}: {
  /** URL of a published bundle. Exactly one of src / srcDoc. */
  src?: string;
  /** Raw HTML, for previewing something the student just pasted. */
  srcDoc?: string;
  title: string;
  mode: Mode;
  minHeight?: number;
  onComplete?: (r: Result) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState(minHeight);
  const [html, setHtml] = useState<string | null>(
    srcDoc ? withPolicy(srcDoc) : null,
  );

  const post = useCallback((type: string, payload?: unknown) => {
    frameRef.current?.contentWindow?.postMessage({ v: V, type, payload }, "*");
  }, []);

  // Published bundles come from a URL; pull the document in and run it as srcdoc.
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setHtml(withPolicy(text));
      })
      .catch(() => {
        if (!cancelled) setError("This game couldn't be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (srcDoc) setHtml(withPolicy(srcDoc));
  }, [srcDoc]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // The frame is sandboxed into an opaque origin, so e.origin is "null".
      // Identity check is by source window, not by origin string.
      if (e.source !== frameRef.current?.contentWindow) return;

      const data = e.data as { v?: number; type?: string; payload?: unknown };
      if (!data || data.v !== V || typeof data.type !== "string") return;

      switch (data.type) {
        case "ready": {
          setReady(true);
          post("init", {
            mode,
            seed: Math.floor(Math.random() * 1_000_000),
            player: null,
            resume: null,
          });
          break;
        }
        case "progress": {
          const p = data.payload as { done: number; total: number };
          if (typeof p?.done === "number" && typeof p?.total === "number") {
            setProgress(p);
          }
          break;
        }
        case "complete": {
          const r = data.payload as Result;
          if (typeof r?.score === "number" && typeof r?.max === "number") {
            setResult(r);
            onComplete?.(r);
          }
          break;
        }
        case "resize": {
          const h = (data.payload as { height: number })?.height;
          if (typeof h === "number" && h > 120 && h < 2000) setHeight(h);
          break;
        }
        case "error": {
          const m = (data.payload as { message: string })?.message;
          setError(typeof m === "string" ? m.slice(0, 300) : "The game reported an error.");
          break;
        }
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mode, onComplete, post]);

  // A game that never signals ready gets a real message, not a white box. The clock
  // starts when the document is actually in the frame, not when the component mounts.
  useEffect(() => {
    if (html === null) return;
    const t = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(t);
  }, [html]);

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="surface overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-4 border-b rule px-4 py-2.5 text-[13px]">
        <span className="flex items-center gap-2 muted">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: ready ? "#3fae6b" : "var(--fg-muted)" }}
          />
          {ready ? (mode === "test" ? "Test — scored" : "Practice") : "Loading…"}
        </span>
        {progress && (
          <span className="tabular-nums muted">
            {progress.done} / {progress.total}
          </span>
        )}
      </div>

      <div className="h-0.5 w-full" style={{ background: "var(--line)" }}>
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: "var(--accent)" }}
        />
      </div>

      {error ? (
        <div className="p-10 text-center">
          <p className="font-medium">This game hit an error.</p>
          <p className="mt-1 text-sm muted">{error}</p>
        </div>
      ) : !ready && timedOut ? (
        <div className="p-10 text-center">
          <p className="font-medium">This game didn&apos;t start.</p>
          <p className="mx-auto mt-1 max-w-sm text-sm muted">
            It never signalled that it was ready. That usually means it&apos;s broken —
            reporting it tells the author.
          </p>
        </div>
      ) : html === null ? (
        <div className="p-10 text-center text-sm muted">Loading the game…</div>
      ) : (
        <iframe
          ref={frameRef}
          srcDoc={html}
          title={title}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="w-full border-0 bg-white"
          style={{ height, colorScheme: "light" }}
        />
      )}

      {result && (
        <div
          className="flex flex-col items-center gap-1 border-t rule px-4 py-6 text-center"
          style={{ background: "color-mix(in oklab, var(--accent) 7%, transparent)" }}
        >
          <p className="text-3xl font-semibold tabular-nums tracking-tight">
            {Math.round((result.score / result.max) * 100)}%
          </p>
          <p className="text-sm muted">
            {result.score} of {result.max} · {Math.round(result.durationMs / 1000)}s
          </p>
        </div>
      )}
    </div>
  );
}
