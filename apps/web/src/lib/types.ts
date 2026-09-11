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
  /**
   * Which modes the game genuinely honours from `init` — mirrors `modes` in its
   * manifest. Only offer the player a choice the game actually acts on: a toggle that
   * restarts a run and changes nothing is worse than no toggle.
   */
  modes: ("practice" | "test")[];
  editable: boolean;
  playCount: number;
  ratingAccuracy: number | null;
  ratingFun: number | null;
  ratingCount: number;
  publishedAt: string;
  /** Path under /public that serves the bundle's entry point. */
  bundlePath: string;
  /**
   * Pinned to the top of the home page. A brand-new game has no play count and no
   * ratings, so it loses every ranked list on the site — featuring is how something
   * good gets its first audience. Curated by hand for now.
   */
  featured?: boolean;
  /** One line on why it's worth your time. Shown only on featured cards. */
  pitch?: string;
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
