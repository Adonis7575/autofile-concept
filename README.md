# Autofile

An AI note-taking app that files notes for you — and shows its work.

**Live:** [autofile-concept.vercel.app](https://autofile-concept.vercel.app)

Three artifacts, in the order they were made.

| | |
|---|---|
| [`/`](https://autofile-concept.vercel.app) · `index.html` | A working demo. Open it in a browser. No server, no API key |
| [`/concept`](https://autofile-concept.vercel.app/concept) · `docs/concept-v2.md` | The product concept — what it is, what it refuses to be, and why |
| [`/spec`](https://autofile-concept.vercel.app/spec) · `docs/build-spec.md` | How to build it: schema, pipeline, eval harness, six-week plan |
| `scripts/verify.js` | Runs the demo's classifier headlessly and reports accuracy and calibration |
| `scripts/smoke.js` | Playwright pass over the UI |
| `scripts/build-site.js` | Renders the two markdown docs into the committed HTML pages |

## Running it

```bash
open index.html            # that's it — the demo needs nothing

npm install
npm run verify             # accuracy + calibration report
npm run smoke              # UI walkthrough in headless Chromium
npm run build:site         # rebuild concept.html / spec.html after editing the docs
```

## What's real and what isn't

The prototype ships with 29 seeded notes across ten folders, so there is an actual corpus to organize — an empty auto-organizer can't demonstrate anything.

**Real:** the decision cascade, the confidence tiers and their thresholds, the Inbox fallback, the "Why?" evidence list, the alternatives, the correction-becomes-a-rule loop, the undo ledger, the destination validation that blocks prompt injection. Every one of these is what the [build spec](https://autofile-concept.vercel.app/spec) specifies.

**Simulated:** the classifier itself. In place of one Claude Haiku call, the page runs TF-IDF cosine similarity over the corpus plus keyword and entity evidence — same output shape, same policy layer, no network. The gap between the two is the honest argument for spending $0.003 a note.

## Measured (leave-one-out over the seeded corpus, `npm run verify`)

```
accuracy   79%          inbox rate  17%          n = 29

calibration (predicted → actual)
  0.5   n=4    50%
  0.6   n=5   100%
  0.7   n=1   100%
  0.8   n=2   100%
  0.9   n=16   94%
```

Read the 0.9 row: notes the demo calls 90% confident are right 94% of the time, so the number shown to the user means roughly what it says. That is the property the whole transparency story depends on — and it is the metric to defend when the real model replaces this one.

Weights were tuned against this corpus, which is exactly the overfitting the real pipeline avoids by not having weights to tune. Two known misses are left in on purpose: `Archive` holds one note, so leave-one-out can never place it, and "Marcus working style" files under `Projects/Acme Redesign` because Marcus appears in three Acme notes — a defensible wrong answer, and the best thing in the demo to correct.

## The 60-second demo

1. **try: Client meeting** → filed in `Projects/DataFlow Integration` at 0.96. Open **Why?** — four pieces of evidence and the decision object underneath.
2. **try: Ambiguous idea** → confidence 0.57, so it lands in **Inbox** rather than a folder you'd never check. Three candidates, one click each.
3. Open **People → Marcus working style**, hit **Change ▾ → People**, and take the default: *always file notes mentioning "Marcus Reyes" here*. The rule appears in the left rail. Write anything mentioning Marcus and it goes straight there.

Step 3 is the product. Nobody else's demo shows the correction sticking.

---

Donaghe Enterprises · MIT
