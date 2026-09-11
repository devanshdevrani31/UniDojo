import type { Metadata } from "next";
import { MyGames } from "@/components/MyGames";

export const metadata: Metadata = { title: "Your games" };

export default function MyGamesPage() {
  return (
    <>
      <header className="pb-2 pt-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your games
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed muted">
          Saved in this browser for now. Once accounts land they&apos;ll live on your
          profile, under your name, on the course page.
        </p>
      </header>
      <MyGames />
      <div className="mb-24" />
    </>
  );
}
