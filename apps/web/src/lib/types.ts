export interface University {
  slug: string;
  name: string;
  short: string;
  country: string;
  emailDomains: string[];
}

export interface Course {
  slug: string;
  universitySlug: string;
  code: string;
  title: string;
  faculty: string;
}

export interface Game {
  slug: string;
  courseSlug: string;
  universitySlug: string;
  title: string;
  description: string;
  topic: string;
  tags: string[];
  author: Author;
  /** How it was published — see docs/07-publishing-paths.md */
  rung: 1 | 2 | 3 | 4;
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  editable: boolean;
  playCount: number;
  ratingAccuracy: number | null;
  ratingFun: number | null;
  ratingCount: number;
  publishedAt: string;
  /** Path under /public that serves the bundle's entry point. */
  bundlePath: string;
}

export interface Author {
  handle: string;
  displayName: string;
  universitySlug: string;
  verified: boolean;
}

export const RUNG_LABEL: Record<Game["rung"], string> = {
  1: "Made on UniDojo",
  2: "Made in Claude",
  3: "Own model",
  4: "Uploaded",
};
