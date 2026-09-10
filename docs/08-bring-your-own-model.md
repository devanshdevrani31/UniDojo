# Bring your own model

Letting students connect their own Claude, OpenAI/Codex, Kimi, or local model, so heavy
contributors aren't limited by our quota and we aren't paying for their iteration.

## First, the thing that doesn't work

**You cannot "connect your Claude account" the way you connect Google or GitHub.**

There is no consumer OAuth flow that lets a third-party website spend someone's Claude.ai
or ChatGPT *subscription*. Those subscriptions are for the provider's own apps. Programmatic
access is a separate product — an API key from a developer console, with its own billing.

So "connect your account" in practice means: *go to console.anthropic.com, sign up for API
billing, put in a card, create a key, copy it, paste it here.* That is not a low-friction
step. It's fine for the ten students who make forty games; it is a wall for the four hundred
who want to make one.

**This is exactly why the two default paths avoid keys entirely** — see
[07-publishing-paths.md](07-publishing-paths.md):

- **Rung 1**: we generate on our key, on a quota. Nothing to connect.
- **Rung 2**: the student uses their *own Claude/ChatGPT/Kimi subscription* through the
  normal chat interface, via a clipboard handoff. No console, no card, no key — and it
  costs us nothing. For "I want Claude to make it for me", this is the answer, not an API
  key.

Bring-your-own-model is the upgrade you offer someone *after* they've hit the rung-1 quota
and found rung 2's two-paste loop tedious — at the moment they have a reason to care.
Never on the way in.

(Local models are the exception: connecting Ollama needs no account, no card, no key. It's
just a URL. For the subset of students already running a local model, this is genuinely
one click.)

## Providers worth supporting

| Provider | How | Notes |
| --- | --- | --- |
| **Anthropic (Claude)** | API key | Native API. Recommended default. |
| **OpenAI (GPT / Codex)** | API key | OpenAI-compatible. |
| **Moonshot (Kimi)** | API key | OpenAI-compatible endpoint — same client code as OpenAI, different base URL. |
| **Local (Ollama / LM Studio)** | Base URL, no key | `http://localhost:11434` / `:1234`. Free, private, no signup. |
| **Anything else OpenAI-compatible** | Base URL + key | Together, Groq, OpenRouter, a uni-provided endpoint. Falls out for free. |

Design implication: build **one OpenAI-compatible adapter plus one Anthropic adapter**, and
let everything else be a base URL. Don't write a bespoke integration per vendor.

## Where the key lives

The important decision, and the one with legal consequences.

**Keep keys in the browser. Never send them to our server.**

Store in IndexedDB on the client, call the provider directly from the page. Then:

- We never hold a credential that can spend someone's money → no encryption-at-rest design,
  no key-rotation policy, no breach that drains student wallets, no liability
- Nothing to leak, because there's nothing there
- Cost is between the student and their provider

The tradeoff is CORS: browser-to-provider calls only work where the provider allows them.

- **Anthropic** supports direct browser calls, but requires an explicit opt-in header
  acknowledging the risk (the SDK gates it behind a "dangerously allow browser" flag too).
  ⚠️ **Verify the exact header name and current behaviour against the live API docs before
  building** — don't take a name from memory, this doc included.
- **Local models** need the server configured to allow our origin (`OLLAMA_ORIGINS` for
  Ollama). Also: an HTTPS page calling `http://localhost` is allowed (localhost counts as a
  trustworthy origin), but Chrome's private-network rules add a preflight. **Test this on
  day one of building rung 2** — it's the kind of thing that either works instantly or eats
  a day.
- **Providers that block browser calls** need a server proxy, and a proxy means the key
  transits our infrastructure. If a provider needs that, either skip it or make the tradeoff
  explicit in the UI ("your key is sent to UniDojo to reach this provider").

Never put a key in a URL, a query string, or a log line.

## Model defaults

Game generation is a short, structured, one-shot task — the cheap tier is the right
default, and users can override.

Current Anthropic model IDs and list prices (input / output per million tokens):

| Model | ID | $/1M in | $/1M out |
| --- | --- | --- | --- |
| Claude Opus 5 | `claude-opus-5` | $5.00 | $25.00 |
| Claude Sonnet 5 | `claude-sonnet-5` | $2.00 | $10.00 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1.00 | $5.00 |

Rough per-game cost: notes in are usually a few thousand tokens, a game out is maybe
4–8K tokens. On Haiku that's well under a cent; on Opus, a few cents. Even at Opus
prices, a 3-games-per-week quota for a thousand students is a small monthly bill — which is
the real argument for making rung 1 the default rather than pushing people to bring keys.

Prices change. Check current rates before you put a quota number in the UI.

## UI shape

Settings → **Your AI model**

```
◉ Use UniDojo's       3 of 5 games left this week    ← default, nothing to configure
○ Claude              [ api key ................ ]
○ OpenAI              [ api key ................ ]
○ Kimi                [ api key ................ ]
○ Local model         [ http://localhost:11434  ]  [ Test connection ]
```

- Default is always "use ours". Never make the first-run experience a key prompt.
- `Test connection` before saving — a key that silently fails at generation time is worse
  than no key.
- Say plainly, next to the field: *stored in this browser only, never sent to UniDojo.*
  It's true, it's the reassuring answer, and it's a differentiator.
- Keys are per-browser, not per-account (that's the cost of not storing them server-side).
  Say so, so nobody is surprised on their laptop.

## Not now

Team/uni-provided keys, per-course budgets, a marketplace of model presets. All plausible,
none load-bearing. Ship the quota and one key field.
