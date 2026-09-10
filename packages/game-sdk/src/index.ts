/**
 * Optional convenience wrapper around the postMessage protocol.
 *
 * Using this is NOT required, and games should never depend on it being available —
 * the one-file, no-build path is the primary way games are authored. This exists for
 * people building games in a real project with a bundler.
 */
type Mode = "practice" | "test";

export interface GameInit {
  mode: Mode;
  seed: number;
  player: { displayName: string } | null;
  resume: Record<string, unknown> | null;
}

const V = 1;
const post = (type: string, payload?: unknown) =>
  parent !== window && parent.postMessage({ v: V, type, payload }, "*");

export function connect(onInit: (init: GameInit) => void, fallbackAfterMs = 2000) {
  let started = false;
  const begin = (init: GameInit) => {
    if (started) return;
    started = true;
    onInit(init);
  };

  addEventListener("message", (e: MessageEvent) => {
    const d = e.data;
    if (!d || d.v !== V || d.type !== "init") return;
    begin(d.payload as GameInit);
  });

  post("ready");

  // Standalone fallback so the bundle is playable by opening the file directly.
  setTimeout(
    () => begin({ mode: "practice", seed: 1, player: null, resume: null }),
    fallbackAfterMs,
  );
}

export const progress = (done: number, total: number) => post("progress", { done, total });
export const save = (state: Record<string, unknown>) => post("save", { state });
export const resize = (height: number) => post("resize", { height });
export const fail = (message: string) => post("error", { message });
export const complete = (
  score: number,
  max: number,
  durationMs: number,
  breakdown?: Record<string, unknown>,
) => post("complete", { score, max, durationMs, breakdown });
