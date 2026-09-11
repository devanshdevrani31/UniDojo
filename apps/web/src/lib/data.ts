import type { Author, Course, Game, University } from "./types";

/**
 * Seed content for the first draft.
 *
 * Everything here is read through the accessor functions at the bottom of this file.
 * When Supabase lands (Milestone 1), replace the bodies of those functions with queries
 * and nothing above them needs to change. See docs/03-data-model.md.
 */

export const universities: University[] = [
  {
    slug: "unimelb",
    name: "University of Melbourne",
    short: "Melbourne",
    country: "AU",
    emailDomains: ["student.unimelb.edu.au"],
  },
  {
    slug: "monash",
    name: "Monash University",
    short: "Monash",
    country: "AU",
    emailDomains: ["student.monash.edu"],
  },
  {
    slug: "tum",
    name: "Technical University of Munich",
    short: "TUM",
    country: "DE",
    emailDomains: ["tum.de"],
  },
];

export const courses: Course[] = [
  {
    slug: "biom20001",
    universitySlug: "unimelb",
    code: "BIOM20001",
    title: "Molecular and Cellular Biomedicine",
    faculty: "Biomedicine",
  },
  {
    slug: "laws10001",
    universitySlug: "unimelb",
    code: "LAWS10001",
    title: "Principles of Contract Law",
    faculty: "Law",
  },
  {
    slug: "comp20003",
    universitySlug: "unimelb",
    code: "COMP20003",
    title: "Algorithms and Data Structures",
    faculty: "Engineering",
  },
  {
    slug: "eco1010",
    universitySlug: "monash",
    code: "ECO1010",
    title: "Introductory Microeconomics",
    faculty: "Business",
  },
  {
    slug: "ma0001",
    universitySlug: "tum",
    code: "MA0001",
    title: "Linear Algebra I",
    faculty: "Mathematics",
  },
  {
    slug: "in2309",
    universitySlug: "tum",
    code: "IN2309",
    title: "Advanced Software Engineering",
    faculty: "Informatics",
  },
  {
    slug: "bptm",
    universitySlug: "tum",
    code: "BPTM",
    // TODO: confirm the official course title — this expansion of the acronym is a guess.
    title: "Business Process and Technology Management",
    faculty: "Informatics",
  },
];

const authors: Record<string, Author> = {
  priya: {
    handle: "priya",
    displayName: "Priya",
    universitySlug: "unimelb",
    verified: true,
  },
  sam: {
    handle: "sam",
    displayName: "Sam",
    universitySlug: "unimelb",
    verified: true,
  },
  jonas: {
    handle: "jonas",
    displayName: "Jonas",
    universitySlug: "tum",
    verified: true,
  },
  devansh: {
    handle: "devansh",
    displayName: "Devansh Devrani",
    universitySlug: "tum",
    verified: true,
  },
};

export const games: Game[] = [
  {
    slug: "cell-biology-flashcard-sprint",
    courseSlug: "biom20001",
    universitySlug: "unimelb",
    title: "Cell Biology Flashcard Sprint",
    description:
      "Ten organelles, one at a time. Say what it does before you flip — no typing, just honesty.",
    topic: "Week 6 — Organelles",
    tags: ["flashcards", "recall"],
    author: authors.priya,
    rung: 2,
    estimatedMinutes: 4,
    difficulty: "easy",
    editable: true,
    playCount: 1284,
    ratingAccuracy: 4.8,
    ratingFun: 4.1,
    ratingCount: 96,
    publishedAt: "2026-08-14",
    bundlePath: "/games/example-flashcards/index.html",
  },
  {
    slug: "offer-and-acceptance-match-up",
    courseSlug: "laws10001",
    universitySlug: "unimelb",
    title: "Offer & Acceptance Match-Up",
    description:
      "Match each case to the principle it established. Get it wrong and you'll see why before you move on.",
    topic: "Week 2 — Formation",
    tags: ["match-up", "cases"],
    author: authors.sam,
    rung: 2,
    estimatedMinutes: 6,
    difficulty: "medium",
    editable: true,
    playCount: 843,
    ratingAccuracy: 4.6,
    ratingFun: 4.5,
    ratingCount: 71,
    publishedAt: "2026-08-21",
    bundlePath: "/games/contract-law-match-up/index.html",
  },
  {
    slug: "big-o-spot-the-error",
    courseSlug: "comp20003",
    universitySlug: "unimelb",
    title: "Big-O: Spot the Error",
    description:
      "Six complexity claims. Three are wrong. Find them before the timer does.",
    topic: "Week 4 — Complexity",
    tags: ["spot-the-error", "timed"],
    author: authors.sam,
    rung: 4,
    estimatedMinutes: 5,
    difficulty: "hard",
    editable: true,
    playCount: 2107,
    ratingAccuracy: 4.9,
    ratingFun: 4.7,
    ratingCount: 188,
    publishedAt: "2026-09-01",
    bundlePath: "/games/big-o-spot-the-error/index.html",
  },
  {
    slug: "bptm-exam-trainer",
    courseSlug: "bptm",
    universitySlug: "tum",
    title: "BPTM Exam Trainer",
    description:
      "Five drills, a reachability lab and an 18-minute endterm simulation. The Petri-net answers aren't hardcoded — they're computed live from the formal firing rules.",
    topic: "Whole course · exam prep",
    tags: ["petri-nets", "bpmn", "cpee", "exam-sim"],
    author: authors.devansh,
    rung: 4,
    estimatedMinutes: 20,
    difficulty: "hard",
    editable: false,
    playCount: 0,
    ratingAccuracy: null,
    ratingFun: null,
    ratingCount: 0,
    publishedAt: "2026-09-11",
    bundlePath: "/games/bptm-exam-trainer/index.html",
  },
  {
    slug: "in2309-dependency-matrix",
    courseSlug: "in2309",
    universitySlug: "tum",
    title: "IN2309 Dependency Matrix",
    description:
      "Nineteen topics, weighted by how heavily each has actually been examined across four past papers. Learn it, drill it with spaced repetition, then sit a real paper against the clock.",
    topic: "Whole course · exam prep",
    tags: ["spaced-repetition", "drills", "exam-sim", "architecture"],
    author: authors.devansh,
    rung: 4,
    estimatedMinutes: 25,
    difficulty: "medium",
    editable: false,
    playCount: 0,
    ratingAccuracy: null,
    ratingFun: null,
    ratingCount: 0,
    publishedAt: "2026-09-11",
    bundlePath: "/games/in2309-dependency-matrix/index.html",
  },
];

/** Games published from the browser in this draft are kept per-visitor in localStorage. */
export const LOCAL_GAMES_KEY = "unidojo:drafts:v1";

// --- Accessors. Swap these bodies for Supabase queries; callers stay unchanged. ------

export function getUniversity(slug: string): University | undefined {
  return universities.find((u) => u.slug === slug);
}

export function getCourse(
  universitySlug: string,
  courseSlug: string,
): Course | undefined {
  return courses.find(
    (c) => c.universitySlug === universitySlug && c.slug === courseSlug,
  );
}

export function getCoursesFor(universitySlug: string): Course[] {
  return courses.filter((c) => c.universitySlug === universitySlug);
}

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

/** Course pages rank by accuracy, ties broken by fun. See docs/03-data-model.md. */
export function getGamesFor(courseSlug: string): Game[] {
  return games
    .filter((g) => g.courseSlug === courseSlug)
    .sort(
      (a, b) =>
        (b.ratingAccuracy ?? 0) - (a.ratingAccuracy ?? 0) ||
        (b.ratingFun ?? 0) - (a.ratingFun ?? 0),
    );
}

export function getPopularGames(limit = 6): Game[] {
  return [...games].sort((a, b) => b.playCount - a.playCount).slice(0, limit);
}

export function getRecentGames(limit = 6): Game[] {
  return [...games]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function countGamesFor(courseSlug: string): number {
  return games.filter((g) => g.courseSlug === courseSlug).length;
}

export function totalPlays(): number {
  return games.reduce((n, g) => n + g.playCount, 0);
}
