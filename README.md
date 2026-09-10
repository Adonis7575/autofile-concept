# Autofile

A note-taking app on the Notability model — pages, ink, paper, audio — where the
filing happens on its own and shows you why.

**Live:** [autofile-concept.vercel.app](https://autofile-concept.vercel.app)

| | |
|---|---|
| [`/`](https://autofile-concept.vercel.app) · `index.html` | The app |
| [`/concept`](https://autofile-concept.vercel.app/concept) · `docs/concept-v2.md` | The product concept — what it is, what it refuses to be, and why |
| [`/spec`](https://autofile-concept.vercel.app/spec) · `docs/build-spec.md` | The implementation plan this was built from |
| `api/classify.js` | Serverless route: one Claude Haiku call with structured output |
| `scripts/verify.js` | Classifier accuracy and calibration, headless |
| `scripts/smoke.js` | Drives the whole UI in Chromium — 77 checks |
| `scripts/serve.js` | Local dev server (IndexedDB and `/api` need a real origin) |

```bash
npm install
npm run dev        # http://127.0.0.1:8099
npm run verify     # classifier accuracy + calibration
npm run smoke      # every button, tool, gesture, and the persistence paths
```

## Writing

Rich text — headings, bullets, checklists, quotes, inline code, highlight. Enter
inside a checklist makes the next item; an empty one drops you back to prose.

**Ink.** Pen, highlighter and eraser on a pressure-aware canvas over the text.
The eraser removes whole strokes rather than scrubbing pixels. Strokes are point
arrays, so they survive note switches and redraw crisply on resize.

**Paper.** Plain, ruled, grid or dotted, per note, on a slate or cream page.

**Audio.** Record while you write and every line and stroke gets a timestamp.
Play back and the line you were writing lights up; click any line to jump to that
moment. If the mic is unavailable the timeline still runs and says so.

## Filing

Every note is classified as you pause — subject, confidence, evidence. There are
three engines, in order:

1. **Your rules.** A learned rule short-circuits everything, costs nothing, and
   never leaves the browser.
2. **Claude Haiku,** via `/api/classify` — the real call from the spec, with
   tool-use structured output and the note delimited as untrusted data.
3. **The local classifier** — TF-IDF over your own notes plus entity evidence.
   It runs when there's no API key, when the call fails, and when you're offline.

The panel names which one decided, and the model and latency when it was Haiku.

**The policy layer is in code, shared by all three.** The model proposes a
destination; the client decides. A destination that isn't one of your real
subjects is dropped and the note goes to Inbox — which is what stops a pasted
"ignore previous instructions" from choosing where your note lands. There's a
test for exactly that.

## Storage

**Local-first.** Notes, ink, audio and rules are written to IndexedDB as you
type. Close the tab, kill the browser, go offline — it's all still there.

**Sync is optional.** Signed out, the app is complete and private to that
machine. Sign in with a one-time email link and everything syncs to Postgres and
follows you to another device. Writes queue while offline and drain on reconnect;
conflicts resolve last-write-wins on `updated_at`.

Ids are generated on the client, so a note created offline keeps its identity
when it syncs — no remapping on reconnect. Audio blobs live in IndexedDB and
upload to private object storage keyed by user id.

Every table has row-level security scoped to `auth.uid()`, granted only to
`authenticated`. The anon role has no policy at all, so a leaked publishable key
reads nothing.

`autofile_classifications` and `autofile_corrections` are append-only. Every
decision and every correction is recorded — that is the eval set from the spec,
and it is what lets you replay a prompt change against real history.

## Configuration

The app runs with no configuration at all — local classifier, local storage.

| Variable | Where | Effect if unset |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel project env | `/api/classify` returns 501 and the client silently uses the local classifier |

Supabase URL and publishable key are compiled into `index.html`. That is correct
for a publishable key: it identifies the project, and RLS does the enforcing.

## Measured (`npm run verify`)

```
leave-one-out over the seeded corpus, local classifier
accuracy   79%          inbox rate  17%          n = 29

calibration (predicted → actual)
  0.5   n=4    50%
  0.6   n=5   100%
  0.7   n=1   100%
  0.8   n=2   100%
  0.9   n=16   94%
```

Notes the local classifier calls 90% confident are right 94% of the time, so the
number on screen means roughly what it says. With a key configured the same
harness can be pointed at Haiku to compare the two on identical inputs.

Two misses are left in on purpose: `Archive` holds one note, so leave-one-out can
never place it, and "Marcus working style" files under `Projects/Acme Redesign`
because Marcus appears in three Acme notes — a defensible wrong answer, and the
best thing in the app to correct.

---

Donaghe Enterprises · MIT
