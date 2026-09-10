import { z } from "zod";

/** postMessage protocol between the host page and a sandboxed game. Version 1. */
export const PROTOCOL_VERSION = 1 as const;

const envelope = <T extends z.ZodTypeAny>(type: string, payload: T) =>
  z.object({ v: z.literal(PROTOCOL_VERSION), type: z.literal(type), payload });

// Host -> game
export const initMessage = envelope(
  "init",
  z.object({
    mode: z.enum(["practice", "test"]),
    seed: z.number().int(),
    player: z.object({ displayName: z.string() }).nullable(),
    resume: z.record(z.unknown()).nullable(),
  }),
);
export const pauseMessage = envelope("pause", z.undefined());
export const resumeMessage = envelope("resume", z.undefined());

export const hostMessage = z.union([initMessage, pauseMessage, resumeMessage]);

// Game -> host
export const readyMessage = envelope("ready", z.undefined());
export const progressMessage = envelope(
  "progress",
  z.object({ done: z.number().int().min(0), total: z.number().int().positive() }),
);
export const saveMessage = envelope("save", z.object({ state: z.record(z.unknown()) }));
export const completeMessage = envelope(
  "complete",
  z.object({
    score: z.number().min(0),
    max: z.number().positive(),
    durationMs: z.number().int().min(0),
    breakdown: z.record(z.unknown()).optional(),
  }),
);
export const resizeMessage = envelope("resize", z.object({ height: z.number().positive() }));
export const errorMessage = envelope("error", z.object({ message: z.string().max(500) }));

export const gameMessage = z.union([
  readyMessage,
  progressMessage,
  saveMessage,
  completeMessage,
  resizeMessage,
  errorMessage,
]);

export type HostMessage = z.infer<typeof hostMessage>;
export type GameMessage = z.infer<typeof gameMessage>;
