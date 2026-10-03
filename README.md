# Muhammadov IELTS Reading

IELTS Reading practice platform built with Next.js and Supabase. The app
includes timed passages, answer checking, statistics, support tickets, admin
pages, and an AI reading coach that currently defaults to Gemini.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.local.example` to `.env.local` and fill in the required
   environment variables.
3. Start the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

`npm run build` also runs the reading-data prebuild check.

For the browser smoke test, keep the app running locally first:

```bash
npm run qa:public
```

The QA script expects the site at `http://localhost:3000` unless
`QA_BASE_URL` is set.

## Main routes

- `/` - landing page
- `/reading` and `/reading/[slug]` - passage list and reading test player
- `/review` - saved review queue
- `/statistics` - learner statistics
- `/privacy`, `/terms`, `/contact` - public legal and contact pages
- `/my-feedback` - learner support history
- `/admin/*` - admin dashboard, analytics, users, changelog, roadmap, support

## Project structure

- `src/app` - App Router pages, layouts, metadata, API routes
- `src/components` - UI for reading, auth, admin, AI, and shared elements
- `src/data/readingTests_new.js` - current reading passages and questions
- `src/lib/reading` - timer, outbox, legacy import, and review helpers
- `src/lib/supabase` - auth, repositories, services, and server helpers
- `supabase/migrations` - schema and RLS migrations
- `supabase/review` - rollout and verification SQL for production changes
- `scripts/check-reading-data.mjs` - validates passage/question integrity
- `scripts/qa-public-ui.mjs` - browser-based public route smoke test

## Content note

Do not casually change passage wording, question wording, answer keys, word
counts, or difficulty labels. Treat reading content as production data unless
an approved correction is required.
