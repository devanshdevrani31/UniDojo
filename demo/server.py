#!/usr/bin/env python3
"""UniDojo localhost demo server — two origins, zero dependencies (Python >= 3.9).

    host     http://localhost:4173   the site shell (stands in for apps/web)
    sandbox  http://127.0.0.1:4174   untrusted game code (stands in for apps/sandbox)

The two hostnames are different origins, so the browser enforces the same
same-origin isolation the production two-domain design relies on
(docs/decisions/0001-two-origins.md).

Creator flow ("Build a game"): uploads land in demo/uploads/, a background job
runs the local `claude` CLI (your Claude subscription, opus by default — no API
key needed) headless in demo/work/<jobId>/, the resulting bundle is validated
against a Python port of scripts/validate-bundle.mjs, lands as a DRAFT in
demo/drafts/<slug>/, and only moves into games/ when the user hits Publish.

Run:  python3 demo/server.py   — then open http://localhost:4173
"""
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import uuid
from datetime import date
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

REPO_ROOT = Path(__file__).resolve().parent.parent
DEMO_DIR = Path(__file__).resolve().parent
GAMES_DIR = REPO_ROOT / "games"
HOST_DIR = DEMO_DIR / "host"
UPLOADS_DIR = DEMO_DIR / "uploads"
WORK_DIR = DEMO_DIR / "work"
DRAFTS_DIR = DEMO_DIR / "drafts"
JOBS_DIR = DEMO_DIR / "jobs"
PROMPT_TEMPLATE = REPO_ROOT / "prompts" / "make-a-game.md"

HOST_PORT = 4173
SANDBOX_PORT = 4174
HOST_ORIGIN = f"http://localhost:{HOST_PORT}"
SANDBOX_ORIGIN = f"http://127.0.0.1:{SANDBOX_PORT}"

# --- creator flow constants ---------------------------------------------------
CLAUDE_BIN = os.environ.get("CLAUDE_BIN", str(Path.home() / ".local/bin/claude"))
# Default: no --model flag → the CLI uses whatever the subscription provides.
# Set UNIDOJO_MODEL to force one (e.g. claude-opus-5 — only if the plan grants it).
CLAUDE_MODEL = os.environ.get("UNIDOJO_MODEL", "")
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
MAX_UPLOADS_PER_JOB = 8
MAX_CONCURRENT_JOBS = 2
JOB_TIMEOUT_S = 600
MAX_TOTAL_BYTES = 5 * 1024 * 1024  # bundle cap, mirrors scripts/validate-bundle.mjs
MAX_INLINE_SOURCE_CHARS = 50_000

# Regexes kept byte-for-byte identical to scripts/validate-bundle.mjs
EXTERNAL_REF = re.compile(r"""\b(?:src|href)\s*=\s*["']?(?:https?:)?//""", re.I)
NETWORK_CALL = re.compile(
    r"\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\("
)
REQUIRED_MANIFEST_KEYS = [
    "schemaVersion", "title", "description", "university", "course", "entry",
    "estimatedMinutes", "difficulty", "scoring", "modes", "sourceAttribution",
    "license",
]
UPLOAD_EXTS = {".txt", ".md", ".markdown", ".pdf", ".png", ".jpg", ".jpeg", ".webp"}
TEXT_EXTS = {".txt", ".md", ".markdown"}

JOB_STAGES = ["queued", "reading", "drafting", "writing", "validating", "done"]


def clamp_int(v, lo, hi, default):
    try:
        return max(lo, min(hi, int(v)))
    except (TypeError, ValueError):
        return default


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", (title or "game").lower()).strip("-")[:40] or "game"


# --- job store ----------------------------------------------------------------
JOBS = {}
JOBS_LOCK = threading.Lock()
JOB_SEM = threading.BoundedSemaphore(MAX_CONCURRENT_JOBS)
PROCS = {}  # jobId -> subprocess.Popen (for cancel)


def persist_job(job):
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    tmp = JOBS_DIR / f"{job['id']}.json.tmp"
    tmp.write_text(json.dumps(job, indent=1))
    os.replace(tmp, JOBS_DIR / f"{job['id']}.json")


def set_stage(job, stage, **extra):
    with JOBS_LOCK:
        job["stage"] = stage
        job.update(extra)
        persist_job(job)


def load_template_body():
    text = PROMPT_TEMPLATE.read_text()
    parts = text.split("\n---\n")
    return parts[1] if len(parts) > 1 else text  # everything below the first --- line


def assemble_prompt(job, workdir):
    ui = UI_HINTS.get(job["options"].get("uiType", "surprise"), UI_HINTS["surprise"])
    theme = THEME_HINTS.get(job["options"].get("theme", "cyberdojo"), THEME_HINTS["cyberdojo"])
    opts = job["options"]
    prof = job["profile"]

    sources_md = []
    for path in sorted((workdir / "sources").iterdir()):
        if path.suffix.lower() in TEXT_EXTS:
            body = path.read_text(errors="replace")[:MAX_INLINE_SOURCE_CHARS]
            sources_md.append(f"=== source: {path.name} ===\n{body}")
        else:
            sources_md.append(
                f"=== source: {path.name} (file: sources/{path.name}) ===\n"
                "Read this PDF/image with the Read tool and use its content as source material."
            )

    exam_line = ""
    if prof.get("examDate"):
        try:
            days = (date.fromisoformat(prof["examDate"]) - date.today()).days
            exam_line = (
                f"- My exam is on {prof['examDate']} ({days} days away). Schedule the deck "
                f"so every item is mastered and reviewed at least twice BEFORE that date; "
                "pace new items accordingly and show how on-track I am."
            )
        except ValueError:
            pass
    else:
        exam_line = "- No exam date given — pace the campaign at a relaxed steady rate."

    body = load_template_body()
    # The template ends with '<paste notes here>' — replace it with the real payload.
    body = body.split("<paste notes here>")[0].rstrip()
    # The template's "3–8 minutes" rule is for single-run games; the dojo campaign
    # contract below replaces it (one DAILY SESSION is that long, not the game).
    body = body.replace(
        "Playable in 3–8 minutes.",
        f"One daily session is playable in roughly {opts['minutes']} minutes — the campaign "
        "span and learning-method rules below override any single-run framing.",
    )
    return f"""{body}

## How it should work — the UniDojo learning method (non-negotiable)

This is a dojo, not a quiz. The player EARNS XP and works through the material
over MANY DAYS. Build that in, visibly:

1. **XP economy.** Every correct recall awards XP (say 10 XP, harder items more).
   Show XP accumulating live during play; celebrate level-ups (e.g. every 100 XP)
   with a moment of delight (not a modal — keep the flow).
2. **Spaced repetition.** Every item carries a review schedule: wrong → relearn at
   the end of this session; correct → due again tomorrow → +3 days → +7 days.
   Items 'unlock' over real time (compare against a real timestamp, not a counter).
3. **Daily sessions.** One run is ONE SESSION: present today's due items plus a few
   new ones, then finish with 'complete' and a warm "come back tomorrow" — never dump
   the whole deck at once.
4. **Persistence across days is mandatory.** After every action, post
   'save' with the FULL state (per-item interval + next-due date, total XP, streak
   days, level). When the host's init message carries payload.resume, continue
   exactly from it — that is yesterday's player returning to continue their campaign.
5. **Streaks & status.** A persistent status strip shows level, total XP, and
   current day-streak. Losing a day resets the streak, never the items' mastery.

## Options I picked

- Game type: {ui['label']} — {ui['hint']}
- Visual theme: {theme['label']} — vibe: {theme['vibe']}
  Palette (apply as CSS custom properties, respect prefers-reduced-motion):
  background {theme['bg']}, panel {theme['panel']}, text {theme['fg']},
  muted {theme['muted']}, accent {theme['accent']}, accent2 {theme['accent2']}.
  Fonts: {theme['font']}.
- Campaign size: about {opts['items']} items TOTAL over the campaign,
  daily session ~{opts['minutes']} minutes long.
{exam_line}

## How to deliver (headless run — IMPORTANT)

You are running non-interactively inside a build pipeline. Do NOT print the game
in your reply. Use the Write tool to create out/index.html containing the
complete game, following every requirement above (one self-contained file,
unidojo-content block, unidojo-manifest block, ready/complete postMessage).
The unidojo-manifest block MUST NOT contain university, course, sourceAttribution
or entry — the pipeline injects those.

After writing the file, reply with one short sentence describing what you built.

My notes:

{chr(10).join(sources_md)}
"""


UI_HINTS = {
    "surprise": {"label": "Surprise me", "hint": "Choose the game format yourself — whatever fits the material best (timed sorting, drag-to-match, sequence puzzle, dialogue, …)."},
    "quickfire": {"label": "Quickfire quiz", "hint": "A quick-fire multiple-choice quiz: one question at a time, four options, answer with mouse or keys 1–4, instant feedback."},
    "flashcards": {"label": "Flashcards sprint", "hint": "A timed flashcard sprint: show a prompt, player recalls, then flips and self-grades; a timer bar per card keeps the pace."},
    "matchup": {"label": "Match-up", "hint": "A drag-to-match game: two columns (terms and definitions), player pairs them against the clock."},
    "sort": {"label": "Sort / sequence", "hint": "A sort/sequence puzzle: shuffle steps, events or items and have the player restore the correct order."},
    "spoterror": {"label": "Spot the error", "hint": "A spot-the-error game: present statements derived from the notes with deliberate mistakes; the player finds and fixes them."},
}
THEME_HINTS = {
    "cyberdojo": {"label": "Neon cyberdojo", "vibe": "glowing edges, dark neon, arcade energy",
                  "bg": "#0d0b1f", "panel": "#171233", "fg": "#eceafb", "muted": "#8b86b8",
                  "accent": "#a855f7", "accent2": "#22d3ee",
                  "font": "headings in ui-monospace/Menlo monospace, body in system-ui"},
    "library": {"label": "Paper library", "vibe": "warm paper, ink text, serif headings, highlighter accents, light mode",
                "bg": "#f6efe3", "panel": "#fffdf7", "fg": "#433422", "muted": "#8c7a62",
                "accent": "#b45309", "accent2": "#0f766e",
                "font": "headings in Georgia/serif, body in system-ui"},
    "arcade": {"label": "Retro arcade", "vibe": "8-bit energy, chunky borders, hard offset shadows, saturated colors",
               "bg": "#1a1a2e", "panel": "#241c46", "fg": "#f5f3ff", "muted": "#9d8fdb",
               "accent": "#ff6b35", "accent2": "#ffd23f",
               "font": "ui-monospace/Menlo, chunky 2px borders and 4px offset shadows instead of rounding"},
    "midnight": {"label": "Midnight minimal", "vibe": "calm, dark, focused, hairline strokes, no decoration",
                 "bg": "#0f1115", "panel": "#16181e", "fg": "#e6e8ee", "muted": "#878c98",
                 "accent": "#e6e8ee", "accent2": "#8ec1ff",
                 "font": "system-ui everywhere, generous whitespace"},
    "campus": {"label": "Campus green", "vibe": "fresh, botanical, dark green glass panels",
               "bg": "#0e1512", "panel": "#14201a", "fg": "#edf5f0", "muted": "#8ba396",
               "accent": "#4ade80", "accent2": "#a7f3d0",
               "font": "system-ui everywhere, rounded corners"},
}

MANIFEST_RE = [
    re.compile(r'<script[^>]+type=["\']application/json["\'][^>]*id=["\']unidojo-manifest["\'][^>]*>(.*?)</script>', re.S),
    re.compile(r'<script[^>]+id=["\']unidojo-manifest["\'][^>]*>(.*?)</script>', re.S),
]


def validate_bundle(html, manifest_json):
    """Python port of the load-bearing checks in scripts/validate-bundle.mjs.
    Returns a list of error strings (empty == OK)."""
    errs = []
    if len(html.encode()) + len(manifest_json.encode()) > MAX_TOTAL_BYTES:
        errs.append("bundle larger than 5 MB")
    for name, rx in (("external reference", EXTERNAL_REF), ("network call", NETWORK_CALL)):
        for ln, line in enumerate(html.splitlines(), 1):
            if rx.search(line):
                errs.append(f"{name} in index.html:{ln} — {line.strip()[:120]}")
                break
    if "unidojo-content" not in html:
        errs.append("missing the unidojo-content block (all material must live there)")
    if "unidojo-manifest" not in html:
        errs.append("missing the unidojo-manifest block")
    for sig in ("postMessage", "'ready'", "'complete'"):
        if sig not in html and sig.replace("'", '"') not in html:
            errs.append(f"game never posts {sig} — it would hang or not score")
    return errs


def extract_manifest(html):
    for rx in MANIFEST_RE:
        m = rx.search(html)
        if m:
            return json.loads(m.group(1))  # raises ValueError on bad json
    raise ValueError("no unidojo-manifest block found")


def run_claude(workdir):
    cmd = [
        CLAUDE_BIN, "-p", "--output-format", "text",
        "--permission-mode", "acceptEdits",
        "--allowedTools", "Read,Write,Edit,Glob",   # NO Bash — hard boundary
        "--mcp-config", '{"mcpServers": {}}', "--strict-mcp-config",
        "--max-turns", "30",
    ]
    if CLAUDE_MODEL:
        cmd += ["--model", CLAUDE_MODEL]
    env = dict(os.environ)
    # headless runs must not make analytics/session-title calls (custom gateways reject them)
    env["CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"] = "1"
    return subprocess.Popen(
        cmd, cwd=workdir, stdin=subprocess.PIPE, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )


def run_job(job):
    job_id = job["id"]
    workdir = WORK_DIR / job_id
    acquired = False
    try:
        set_stage(job, "queued")
        JOB_SEM.acquire()
        acquired = True
        set_stage(job, "reading", startedAt=time.time())
        srcdir = workdir / "sources"
        srcdir.mkdir(parents=True, exist_ok=True)
        (workdir / "out").mkdir(exist_ok=True)
        for uid in job["uploads"]:
            for f in (UPLOADS_DIR / uid).iterdir():
                shutil.copy2(f, srcdir / f.name)
        prompt = assemble_prompt(job, workdir)
        (workdir / "prompt.md").write_text(prompt)

        attempt_prompts = [prompt]
        errors = []
        for attempt in (0, 1):  # initial run + one auto-repair retry
            set_stage(job, "drafting")
            proc = run_claude(workdir)
            PROCS[job_id] = proc
            try:
                out, err = proc.communicate(input=attempt_prompts.pop(0), timeout=JOB_TIMEOUT_S)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.communicate()
                raise RuntimeError(f"claude timed out after {JOB_TIMEOUT_S // 60} min")
            finally:
                PROCS.pop(job_id, None)
            set_stage(job, "drafting", tail=(out or "")[-2000:])
            if proc.returncode != 0:
                raise RuntimeError(f"claude exited {proc.returncode}: {(err or '')[-1500:]}")

            set_stage(job, "writing")
            html_path = workdir / "out" / "index.html"
            if not html_path.exists():
                html_path = workdir / "index.html"
            errors = []
            manifest = None
            if not html_path.exists():
                errors.append("claude did not write index.html")
            else:
                html = html_path.read_text(errors="replace")
                try:
                    manifest = extract_manifest(html)
                except (ValueError, json.JSONDecodeError) as e:
                    errors.append(f"could not parse the unidojo-manifest block: {e}")

            if manifest is not None:
                # never trust model-provided identity fields — inject ours
                n = len(job["uploads"])
                manifest.update(
                    schemaVersion=1,
                    university=job["profile"]["university"],
                    course=job["profile"]["course"],
                    entry="index.html",
                    sourceAttribution=(
                        f"Generated for {job['profile'].get('displayName','a student')} from "
                        f"{n} uploaded source(s) on {date.today().isoformat()}."
                    ),
                )
                manifest.setdefault("tags", [])
                manifest.setdefault("modes", ["practice", "test"])
                manifest.setdefault("difficulty", "medium")
                manifest["title"] = (manifest.get("title") or "Untitled game")[:80]
                manifest["estimatedMinutes"] = clamp_int(
                    manifest.get("estimatedMinutes", job["options"]["minutes"]), 1, 60,
                    job["options"]["minutes"])
                manifest["license"] = manifest.get("license") or "CC-BY-4.0"
                missing = [k for k in REQUIRED_MANIFEST_KEYS if manifest.get(k) is None]
                if missing:
                    errors.append("manifest missing keys after injection: " + ", ".join(missing))
                else:
                    set_stage(job, "validating")
                    errors = validate_bundle(html, json.dumps(manifest))

            if not errors:
                with JOBS_LOCK:
                    base = slugify(manifest["title"])
                    slug, i = base, 1
                    while (GAMES_DIR / slug).exists() or (DRAFTS_DIR / slug).exists() \
                            or slug in RESERVED_SLUGS:
                        i += 1
                        slug = f"{base}-{i}"
                    RESERVED_SLUGS.add(slug)
                dest = DRAFTS_DIR / slug
                dest.mkdir(parents=True, exist_ok=True)
                (dest / "index.html").write_text(html)
                (dest / "game.json").write_text(json.dumps(manifest, indent=2))
                RESERVED_SLUGS.discard(slug)
                shutil.rmtree(workdir, ignore_errors=True)
                set_stage(job, "done", slug=slug, title=manifest["title"], manifest=manifest)
                return

            # auto-repair retry
            if attempt == 0:
                attempt_prompts.append(
                    "Your previous output did not pass UniDojo validation:\n"
                    + "\n".join(f"- {e}" for e in errors)
                    + "\nFix out/index.html (the Edit tool is fine) so it passes. "
                      "Keep every requirement from the original prompt."
                )
        raise RuntimeError("still failing validation after one repair attempt:\n- " + "\n- ".join(errors))

    except Exception as e:
        set_stage(job, "error", error=str(e))  # workdir kept for debugging
    finally:
        if acquired:
            JOB_SEM.release()


RESERVED_SLUGS = set()


# --- HTTP layer -----------------------------------------------------------------
class BaseHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".woff2": "font/woff2",
    }

    def log_message(self, fmt, *args):
        print("  %-7s %s" % (self.server.label, fmt % args))

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self, cap):
        length = int(self.headers.get("Content-Length") or 0)
        if length > cap:
            return None
        return self.rfile.read(min(length, cap + 1)) if length else self.rfile.read(0)


class SandboxHandler(BaseHandler):
    """Mirrors apps/sandbox/README: static bundle files, one strict CSP, nothing else.

    Serves games/ (published) at /<slug>/* and demo/drafts/ (preview-only) at
    /drafts/<slug>/*.
    """

    def end_headers(self):
        csp = "; ".join([
            "default-src 'none'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "media-src 'self' data:",
            "font-src 'self'",
            "connect-src 'none'",  # the load-bearing directive
            f"frame-ancestors {HOST_ORIGIN}",
        ])
        self.send_header("Content-Security-Policy", csp)
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def translate_path(self, path):
        path = path.split("?")[0]
        if path.startswith("/drafts/"):
            path = path[len("/drafts"):]
            base = str(DRAFTS_DIR)
        else:
            base = str(GAMES_DIR)
        import posixpath
        path = posixpath.normpath(path)
        words = [w for w in path.split("/") if w and w not in (os.curdir, os.pardir)]
        return base + "/" + "/".join(words) if words else base


class HostHandler(BaseHandler):
    """Stands in for apps/web: browse API, upload store, generator jobs, publish."""

    def do_GET(self):
        url = self.path.split("?")[0]
        if url == "/api/games":
            games = []
            for g in sorted(GAMES_DIR.iterdir()):
                manifest = g / "game.json"
                if not g.is_dir() or not manifest.exists():
                    continue
                try:
                    games.append({
                        "slug": g.name,
                        "manifest": json.loads(manifest.read_text()),
                        "sandboxUrl": f"{SANDBOX_ORIGIN}/{g.name}/",
                    })
                except json.JSONDecodeError:
                    pass
            return self.send_json(games)

        m = re.match(r"^/api/jobs/([a-f0-9]{8})$", url)
        if m:
            job = JOBS.get(m.group(1))
            if not job:
                return self.send_json({"error": "unknown job"}, 404)
            return self.send_json({
                "id": job["id"], "stage": job["stage"],
                "stageIndex": JOB_STAGES.index(job["stage"]) if job["stage"] in JOB_STAGES else -1,
                "stageTotal": len(JOB_STAGES),
                "elapsedS": round(time.time() - job.get("startedAt", time.time())),
                "tail": job.get("tail", ""),
                **{k: job[k] for k in ("slug", "title", "error", "manifest") if k in job},
            })

        super().do_GET()

    def do_POST(self):
        url = self.path.split("?")[0]
        query = parse_qs(urlparse(self.path).query)

        if url == "/api/upload":
            name = (query.get("name") or [""])[0]
            safe = re.sub(r"[^a-z0-9._-]", "-", Path(name).name.lower()).strip(".-")
            if not safe or "." not in safe:
                return self.send_json({"error": "bad filename"}, 400)
            if Path(safe).suffix not in UPLOAD_EXTS:
                return self.send_json({"error": f"file type not allowed: {Path(safe).suffix}"}, 415)
            body = self.read_body(MAX_UPLOAD_BYTES)
            if body is None or len(body) > MAX_UPLOAD_BYTES or not body:
                return self.send_json({"error": "file too large (12 MB max) or empty"}, 413)
            uid = uuid.uuid4().hex[:8]
            dest = UPLOADS_DIR / uid
            dest.mkdir(parents=True, exist_ok=True)
            (dest / safe).write_bytes(body)
            return self.send_json({
                "id": uid, "name": safe, "size": len(body),
                "kind": "text" if Path(safe).suffix in TEXT_EXTS else "file",
            })

        if url == "/api/jobs":
            try:
                payload = json.loads(self.read_body(64 * 1024) or b"{}")
            except json.JSONDecodeError:
                return self.send_json({"error": "bad JSON"}, 400)
            uploads = payload.get("uploads") or []
            if not (1 <= len(uploads) <= MAX_UPLOADS_PER_JOB):
                return self.send_json({"error": f"need 1–{MAX_UPLOADS_PER_JOB} sources"}, 400)
            for uid in uploads:
                if not re.fullmatch(r"[a-f0-9]{8}", str(uid)) or not (UPLOADS_DIR / str(uid)).is_dir():
                    return self.send_json({"error": f"unknown upload: {uid}"}, 400)
            prof = payload.get("profile") or {}
            opts = payload.get("options") or {}
            if not prof.get("university") or not prof.get("course"):
                return self.send_json({"error": "university and course are required"}, 400)
            job = {
                "id": uuid.uuid4().hex[:8],
                "stage": "queued",
                "uploads": uploads,
                "options": {
                    "uiType": opts.get("uiType", "surprise"),
                    "theme": opts.get("theme", "cyberdojo"),
                    "items": clamp_int(opts.get("items"), 5, 200, 30),
                    "minutes": clamp_int(opts.get("minutes"), 5, 25, 12),
                },
                "profile": {
                    "displayName": (prof.get("displayName") or "Demo Student")[:40],
                    "examDate": prof.get("examDate") or None,
                    "university": str(prof["university"])[:60],
                    "course": str(prof["course"])[:30],
                },
                "createdAt": time.time(),
                "tail": "",
            }
            with JOBS_LOCK:
                JOBS[job["id"]] = job
                persist_job(job)
            threading.Thread(target=run_job, args=(job,), daemon=True).start()
            return self.send_json({"id": job["id"]})

        m = re.match(r"^/api/jobs/([a-f0-9]{8})/cancel$", url)
        if m:
            proc = PROCS.get(m.group(1))
            if proc:
                proc.kill()
            job = JOBS.get(m.group(1))
            if job:
                set_stage(job, "error", error="cancelled")
            return self.send_json({"ok": True})

        m = re.match(r"^/api/games/([a-z0-9-]{1,60})/publish$", url)
        if m:
            src, dst = DRAFTS_DIR / m.group(1), GAMES_DIR / m.group(1)
            if not src.is_dir():
                return self.send_json({"error": "no such draft"}, 404)
            if dst.exists():
                return self.send_json({"error": "slug already published"}, 409)
            src.rename(dst)
            return self.send_json({"ok": True, "slug": m.group(1)})

        self.send_json({"error": "no such endpoint"}, 404)

    def do_DELETE(self):
        m = re.match(r"^/api/upload/([a-f0-9]{8})$", self.path.split("?")[0])
        if m:
            shutil.rmtree(UPLOADS_DIR / m.group(1), ignore_errors=True)
            return self.send_json({"ok": True})
        self.send_json({"error": "no such endpoint"}, 404)


def serve(label, handler_cls, root, port):
    httpd = ThreadingHTTPServer(("127.0.0.1", port), partial(handler_cls, directory=str(root)))
    httpd.label = label
    threading.Thread(target=httpd.serve_forever, daemon=True).start()


def sweep():
    while True:
        time.sleep(3600)
        for base, ttl in ((UPLOADS_DIR, 24 * 3600), (WORK_DIR, 48 * 3600)):
            for d in base.glob("*"):
                try:
                    if time.time() - d.stat().st_mtime > ttl:
                        shutil.rmtree(d, ignore_errors=True)
                except OSError:
                    pass


if __name__ == "__main__":
    for d in (UPLOADS_DIR, WORK_DIR, DRAFTS_DIR, JOBS_DIR):
        d.mkdir(parents=True, exist_ok=True)
    # crashed mid-job last run? mark them failed so the UI stops polling
    for f in JOBS_DIR.glob("*.json"):
        try:
            job = json.loads(f.read_text())
            if job.get("stage") not in ("done", "error"):
                job["stage"] = "error"
                job["error"] = "server restarted — try again"
                f.write_text(json.dumps(job, indent=1))
        except json.JSONDecodeError:
            pass
    if not Path(CLAUDE_BIN).exists():
        print(f"  ⚠ claude CLI not found at {CLAUDE_BIN} — game generation will fail")

    threading.Thread(target=sweep, daemon=True).start()
    serve("sandbox", SandboxHandler, GAMES_DIR, SANDBOX_PORT)
    serve("host", HostHandler, HOST_DIR, HOST_PORT)
    print(f"host     {HOST_ORIGIN}    ← open this one")
    print(f"sandbox  {SANDBOX_ORIGIN}  untrusted bundles, connect-src 'none'")
    print(f"creator  uses {os.path.basename(CLAUDE_BIN)} ({CLAUDE_MODEL or 'subscription default model'}) on your subscription")
    print("\nCtrl-C to stop")
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        sys.exit(0)
