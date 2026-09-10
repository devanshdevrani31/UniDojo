# apps/web

The site: browse, play, upload, profiles. Next.js App Router + TypeScript + Tailwind.

Not scaffolded yet. When starting Milestone 1:

```bash
npx create-next-app@latest apps/web --typescript --tailwind --app --eslint --src-dir --no-import-alias
```

Then delete the boilerplate homepage and wire up `@unidojo/schema`.

Planned routes:

```
/                              home — featured + recently published
/u/[university]                courses at a university
/u/[university]/[course]       games for a course, ranked by accuracy
/g/[slug]                      play page (hosts the sandbox iframe)
/upload                        drag-and-drop publish flow
/@[handle]                     creator profile
/api/games/upload              POST — validate + store a bundle
/api/plays                     POST — record a play (called by the host shell, not the game)
/api/ratings                   POST — rate a game you've completed
```

**This app must never render game code inline.** Games only ever appear inside an iframe
pointed at `NEXT_PUBLIC_SANDBOX_ORIGIN`.
