# Autofile

A note-taking app on the Notability model — pages, ink, paper, audio — where the
filing happens on its own and shows you why.

**Live:** [autofile-concept.vercel.app](https://autofile-concept.vercel.app)

| | |
|---|---|
| [`/`](https://autofile-concept.vercel.app) · `index.html` | The app. Open it in a browser. No server, no API key, no build |
| [`/concept`](https://autofile-concept.vercel.app/concept) · `docs/concept-v2.md` | The product concept — what it is, what it refuses to be, and why |
| [`/spec`](https://autofile-concept.vercel.app/spec) · `docs/build-spec.md` | How to build it for real: schema, pipeline, eval harness, six-week plan |
| `scripts/verify.js` | Runs the classifier headlessly — accuracy and calibration |
| `scripts/smoke.js` | Drives the whole UI in headless Chromium — 63 checks |
| `scripts/build-site.js` | Renders the markdown docs into the committed HTML pages |

## Running it

```bash
open index.html            # the app needs nothing

npm install
npm run verify             # classifier accuracy + calibration
npm run smoke              # every button, tool, and gesture
npm run build:site         # rebuild concept.html / spec.html after editing docs
```

## What it does

**Writing surface.** Rich text with headings, bullets, checklists, quotes, inline
code and highlight. Enter inside a checklist makes the next item; an empty one
drops you back to prose.

**Ink.** Pen, highlighter and eraser on a pressure-aware canvas layered over the
text. Five colours, three widths. The eraser removes whole strokes rather than
scrubbing pixels, so nothing is left half-deleted. Strokes are stored as point
arrays, which is why they survive switching notes and redraw crisply on resize.

**Paper.** Plain, ruled, grid or dotted, per note, on a slate or cream page.

**Audio, tied to what you wrote.** Record while you write and every line and
stroke gets a timestamp. Play back and the line you were writing lights up;
click any line to jump to that moment. Marks show on the scrubber. If the mic
is unavailable the timeline still runs and says so rather than pretending.

**Filing, which is the point.** Every note is classified as you pause — subject,
confidence, evidence. Low confidence goes to Inbox rather than into a folder you
would never check. "Why here?" shows the reasoning and the runners-up. Move a
note and it offers to make that a standing rule, which you can delete from the
rail. Subjects rename in place by double-clicking.

## What's real and what isn't

**Real:** the ink engine, the audio timeline, the editor, the decision cascade,
the confidence tiers, the Inbox fallback, the evidence list, the rules loop, undo
on every destructive action, and the destination validation that stops a pasted
"ignore previous instructions" from choosing a folder.

**Simulated:** the classifier. In place of one Claude Haiku call it runs TF-IDF
cosine similarity over your own corpus plus keyword and entity evidence — same
output shape, same policy layer, no network. The gap between the two is the
honest argument for spending $0.003 a note.

**In memory only.** Nothing persists across a refresh. That is one Postgres table
away in the real build (`docs/build-spec.md` §2) and deliberately out of scope here.

## Measured (`npm run verify`)

```
leave-one-out over the seeded corpus
accuracy   79%          inbox rate  17%          n = 29

calibration (predicted → actual)
  0.5   n=4    50%
  0.6   n=5   100%
  0.7   n=1   100%
  0.8   n=2   100%
  0.9   n=16   94%
```

Read the 0.9 row: notes the demo calls 90% confident are right 94% of the time,
so the number on screen means roughly what it says. That is the property the
whole transparency story rests on, and the metric to defend when a real model
replaces this one.

Two misses are left in on purpose: `Archive` holds one note, so leave-one-out can
never place it, and "Marcus working style" files under `Projects/Acme Redesign`
because Marcus appears in three Acme notes — a defensible wrong answer, and the
best thing in the app to correct.

## The 90-second demo

1. **New note.** Type a couple of lines about a client. Watch the stamp under the
   title fill in a subject and a confidence a moment after you stop.
2. **Why here?** Four pieces of evidence, the runners-up, and the raw decision
   object underneath.
3. **Pen.** Draw over the text. Switch to the highlighter, then erase a stroke.
   Change the paper to grid, or flip the page to cream.
4. **Record.** Write two lines while it runs, stop, then press play and click the
   first line — the audio jumps to the moment you wrote it.
5. **Move a note** and keep "always file notes mentioning X here". Write another
   note naming X and it goes straight there. Then delete the rule from the rail.

Step 5 is the thesis. Step 4 is the one people remember.

---

Donaghe Enterprises · MIT
