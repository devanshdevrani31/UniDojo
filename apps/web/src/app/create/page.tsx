import type { Metadata } from "next";
import { CreateFlow } from "@/components/CreateFlow";
import { courses, universities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Make a game",
  description: "Turn your lecture notes into a playable study game. No coding.",
};

export default function CreatePage() {
  const options = courses.map((c) => ({
    value: c.slug,
    label: `${c.code} — ${c.title}`,
    group: universities.find((u) => u.slug === c.universitySlug)?.name ?? "",
  }));

  return (
    <>
      <header className="pb-2 pt-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Make a game from your notes
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed muted">
          Paste your notes, get something playable. You&apos;ll see it and play it
          yourself before anyone else does.
        </p>
      </header>

      <CreateFlow courses={options} />
      <div className="mb-24" />
    </>
  );
}
