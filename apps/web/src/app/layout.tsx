import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "UniDojo — play your way through the syllabus",
    template: "%s · UniDojo",
  },
  description:
    "Study games built by students, from their own lecture notes. Play them, rate them, make your own in about a minute.",
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-md text-[13px] font-bold text-white"
        style={{ background: "var(--accent)" }}
      >
        道
      </span>
      <span className="text-[15px]">UniDojo</span>
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="grain min-h-screen antialiased">
        <header className="sticky top-0 z-30 border-b rule backdrop-blur-md"
          style={{ background: "color-mix(in oklab, var(--bg) 82%, transparent)" }}>
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
            <Logo />
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/u/unimelb"
                className="rounded-lg px-3 py-1.5 muted transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--fg)]"
              >
                Browse
              </Link>
              <Link
                href="/create"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Make a game
              </Link>
            </nav>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-6xl px-5">{children}</main>

        <footer className="relative z-10 mt-24 border-t rule">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              UniDojo — early draft. Content is seed data; nothing here is real
              course material.
            </p>
            <a
              href="https://github.com/devanshdevrani31/UniDojo"
              className="underline underline-offset-4 hover:text-[var(--fg)]"
            >
              Source on GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
