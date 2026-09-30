# Live Release Verification Prompt — `71c4ee8`

Run with a browser-capable QA agent using the already-authorized admin browser session.

```text
You are the release-verification QA engineer for Muhammadov IELTS Reading. Verify the live deployment against Git commit `71c4ee8` on `main`, then retest the full user and admin experience. Begin at `/admin` using the browser's existing authorized session. Never request or enter credentials, bypass authentication, or reveal private data.

RELEASE GATES — CHECK THESE FIRST
1. Record the live URL and UTC time. Inspect the deployed commit/build marker if exposed. Compare it with `71c4ee8`. If the hosting UI exposes no marker, inspect deployed route/component behavior and repository contents. Do not claim source-to-production matching unless evidence supports it. The last QA report said the inspected `source/` checkout lacked Git metadata and did not match production.
2. Verify `supabase/migrations/009_admin_history_and_support.sql` and `010_admin_support_history_rpc.sql` are present in the deployment repository. Confirm with the operator or normal migration-status tooling whether migration 010 is applied to the same Supabase project as production. Do not apply migrations or query privileged credentials. If migration state is unknown, mark the populated Support Messages/RPC test blocked.
3. Check that the deployed build has Login metadata (`/login` canonical, sign-in title, noindex/nofollow), the Statistics-to-Login redirect, the offline Admin message, and the high-contrast focus rules. Clearly label each as live verified, source only, or blocked.

SAFETY AND DATA
- Use the signed-in admin session for read-only checks and a separate isolated browser context for signed-out/public checks. Do not expose real user names, messages, email addresses, or screenshots with personal data; redact evidence.
- Do not submit, create, edit, delete, export, reply, mark read, notify, or change settings on production. Write/persistence/realtime checks may run only with existing disposable staging accounts and cleanup instructions. Never use real production records as fixtures.
- Do not say a test passed if it was inaccessible, source/deployment identity is unknown, or its required migration is unapplied.

PRIORITY LIVE RETESTS
1. Support history: `/admin/users` → open a user → Support Messages. For an empty conversation, expect a clean “No support messages yet” state. If the tab fails, record the redacted RPC status/error and confirm migration 010 status. In a safe staging fixture, verify existing messages are ordered oldest to newest and only the selected user's records are returned.
2. AI history: inspect a user with no AI summary and no chat history. Expect successful empty states, no 406 in network logs, and no browser exception.
3. Focus behavior: open User Details, Feedback Details, Admin Support Chat, Changelog, Roadmap, Contact Developer, and Report an Issue by keyboard and pointer. Confirm focus enters each dialog, Tab remains inside, Escape closes, and focus returns to the exact opener. Check high-contrast visible rings in both themes on Contact Developer, Browse Passages, Report an Issue, theme controls, passage navigator, and admin controls.
4. Offline Admin: disable network, reload `/admin` and `/admin/issues`, and verify the explicit offline/retry state replaces an empty shell or endless spinner. Restore network, retry, and confirm admin access is rechecked before protected data appears.
5. Statistics redirect: in a signed-out isolated context, navigate to `/statistics`. Wait until navigation fully settles. Confirm final URL is `/login`, title/description/canonical/robots metadata belong to Login, no Statistics page content flashes after redirect, and no React/client exception occurs.
6. Public Open Graph: verify the passage, `/changelog`, and `/roadmap` each expose the shared social image plus correct route title, description, and canonical.

FULL PRODUCT CHECK
Test dark and light themes at 1440x900, 390x844, 375x812, and 320x740. Check horizontal overflow, clipping, contrast, keyboard focus, readable labels, touch control size, fixed panels, and client errors.

Admin read-only routes: `/admin`, `/admin/users`, `/admin/feedback`, `/admin/analytics`, `/admin/issues`, `/admin/changelog`, `/admin/roadmap`. Inspect navigation, dashboard count scope, user search/details/all tabs, support list/search/empty state, notification popover/empty state, filters, details, loading/retry/error states, and unsent create/edit form validation. Do not submit production forms or mutate records.

Signed-out and learner routes: Home, catalog, all published passages if feasible, Statistics, Review Queue, Changelog, Roadmap, login, signup, password recovery, Profile, Settings, and not-found. Verify protected boundaries do not reveal admin content. Inspect question types, timer, navigator, local draft/reload, highlighter, AI Coach, incomplete-submit choices, results/disclaimer/evidence, retry, review queue, daily/weekly recommendation, and support/report forms without sending production messages.

Persistence, server writes, and realtime: test result submission, account/settings persistence, AI persistence, support send/reply, notification read states, admin CRUD, and two-context realtime only in disposable/staging with cleanup instructions. Otherwise enumerate each blocked flow and its exact setup requirement.

SOURCE/FIX WORKFLOW
If the matching repository is available, verify Git branch/status before editing and preserve unrelated changes. Reproduce defects, make minimal fixes, run the documented build/lint/QA commands, and retest failures. Never edit an unrelated `source/` snapshot and attribute it to production. Do not deploy or apply database migrations in this QA run.

FINAL REPORT
Report deployment identity and migration 010 status first. Provide a table of passed/failed/fixed/blocked checks; exact outcomes for the six priority retests; role/route/theme/viewport coverage; persistence/realtime coverage; redacted reproducible evidence; files and commands checked; live-vs-source status; and remaining release blockers. Recommend up to five functional improvements ranked by impact/effort. State clearly if production writes or authenticated persistence were not tested. Never expose user data or secrets.
```
