#!/usr/bin/env node
/**
 * Copies the canonical bundles in games/ into apps/web/public/games/ so the dev server
 * and the deployed site serve exactly what the repo's reference bundles contain.
 *
 * Runs as part of apps/web's build. The output is committed too, so a build that skips
 * this step still has games to serve.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "games");
const dest = join(root, "apps", "web", "public", "games");

if (!existsSync(src)) {
  console.error(`no games/ directory at ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

const bundles = readdirSync(src, { withFileTypes: true }).filter((e) => e.isDirectory());
for (const b of bundles) {
  cpSync(join(src, b.name), join(dest, b.name), { recursive: true });
}

console.log(`synced ${bundles.length} bundle(s) → apps/web/public/games/`);
