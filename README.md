# Muhammadov IELTS Reading

A personal IELTS Reading practice site: timed passages, exam-format
questions, a built-in highlighter, and instant band estimates.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## What's inside

- `/` — landing page
- `/reading` — list of all passages → `/reading/[slug]` for the test itself
- `src/data/readingTests.ts` — all passages live here. Add a new object to
  the array to add a new passage; it appears automatically on the list page
  and gets its own route. Currently ships with 3 original passages (Day 1–3)
  as a starting point — add up to 30 or more the same way.
- `src/components/reading/ReadingTestPlayer.tsx` — split-screen passage +
  question renderer (True/False/Not Given, Matching Headings, Sentence
  Completion, Multiple Choice)
- `src/components/reading/HighlightablePassage.tsx` — the built-in
  highlighter: click or drag across words to mark them in yellow, green, or
  pink, with an eraser tool
- `src/components/shared/BandGauge.tsx` — the animated band-score gauge
  shown after submitting
- `src/lib/bandScore.ts` — rough raw-score → band conversion for practice
  purposes

## Adding your own passages

Open `src/data/readingTests.ts` and copy one of the existing objects in the
`readingTests` array as a template — give it a new `slug` (used in the URL),
`title`, paragraphs, and question groups, matching one of the four
supported question types.

## A note on content

Passages here are original compositions written to match the format and
difficulty of the IELTS Academic Reading test — not copied from Cambridge
or any other publisher, since that content is copyrighted and can't be
reproduced here. Add your own licensed or personal material through the
data file above.
