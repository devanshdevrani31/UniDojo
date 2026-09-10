import { z } from "zod";

/**
 * The canonical definition of a game.json manifest.
 * If this file and docs/02-game-contract.md disagree, this file wins.
 */
export const scoringSchema = z.object({
  type: z.enum(["points", "percent", "time", "none"]),
  max: z.number().positive().optional(),
});

export const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().min(3).max(80),
  description: z.string().max(400),
  university: z.string().min(1),
  course: z.string().min(1),
  topic: z.string().max(120).optional(),
  tags: z.array(z.string().max(24)).max(8).default([]),
  entry: z.string().default("index.html"),
  estimatedMinutes: z.number().int().min(1).max(60),
  difficulty: z.enum(["easy", "medium", "hard"]),
  scoring: scoringSchema,
  modes: z.array(z.enum(["practice", "test"])).min(1),
  /**
   * True iff every piece of the game's material lives in content.json and editing that
   * file is safe. Gates the no-code content editor — see docs/07-publishing-paths.md.
   */
  editable: z.boolean().default(false),
  sourceAttribution: z.string().min(1),
  license: z.string().min(1),
});

export type Manifest = z.infer<typeof manifestSchema>;
