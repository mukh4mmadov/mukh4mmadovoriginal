# Reading attempt persistence review bundle

These files are for review and manual use in the Supabase SQL Editor. No SQL has been applied by the app build or by these scripts.

## Review and rollout order

1. Run `inspect-production.sql` read-only. Confirm the reported `reading_history`, `reading_progress`, `highlights`, and `profiles` columns, policies, grants, indexes, and function signatures match the assumptions in `migration.sql`. The migration's first `DO` block repeats the important preconditions and aborts before changing anything if they do not match.
2. Run `dry-run.sql` in the SQL Editor. It includes a transactional copy of the migration and test cases for anon, two learner accounts, and an admin account. It needs at least two non-guest non-admin profiles and one admin profile. It ends with a savepoint rollback check and a full `ROLLBACK`; expect `PASS` notices and matching baseline row counts. It changes no persistent data. It also verifies learners cannot update exact-attempt rows while legacy history rows remain updateable. If the project SQL Editor does not permit `SET LOCAL ROLE`, stop and do not run the migration; use a reviewed test environment or adapt the verification method first.
3. Immediately after a successful dry-run and before migration, run `rollback-proof.sql`. It confirms that the transactional dry-run left no new objects and prints the baseline row counts.
4. After reviewing the dry-run output, run `migration.sql` once. Expect the final `PASS: anon has no privileges on new table or functions` notice and `COMMIT` completion. The transaction is atomic. This migration now also installs the exact-attempt update guard.
   After applying it, run `NOTIFY pgrst, 'reload schema';` so PostgREST refreshes its schema cache. If the app reports `PGRST202` (function not found), run the notification again and retry after the cache refresh.
   If the SQL Editor does not display `NOTICE` lines, a successful dry-run means the script reached its end without an error; every failed check raises an exception. “Success. No rows returned” means the script completed its checks but its transaction/DO statements return no result rows.
5. For databases that already ran the earlier migration without the exact-attempt update guard, first run `exact-attempt-update-hardening-dry-run.sql`. It tests the trigger and verifies legacy updates remain available, then rolls back all changes. If it completes without an error, run `exact-attempt-update-hardening.sql` to commit only the trigger/function change; then reload the PostgREST schema cache.
6. Run `inspect-production.sql` again. Confirm the answer table has RLS, anon has no table grants on it, authenticated has only the intended `SELECT`/`INSERT` grants, the immutable-attempt trigger is enabled, and the RPC signatures and policies match. Do not run `rollback-proof.sql` after the migration; it is only a pre-migration proof.
7. Only after SQL verification, push the app commit series. Pushing `main` deploys immediately on Vercel. The app still works if the new RPCs are missing or unavailable: local progress is saved, the durable outbox keeps attempts for retry, and aggregate pages fall back to local totals or show “metrics unavailable.”

## Files

- `inspect-production.sql`: read-only schema, privileges, policy, trigger, function, and row-count inventory.
- `dry-run.sql`: transactional copy of the migration plus permission, idempotency, learner isolation, admin access, invalid input, duration clamp, and rollback checks. It ends with `ROLLBACK`.
- `migration.sql`: additive columns, exact per-question answer table, RLS, submit and aggregate RPCs, and anon privilege assertions.
- `rollback.sql`: refuses to run if any exact attempt or answer exists, then removes only objects this migration introduced.
- `rollback-proof.sql`: post-dry-run check that new objects are absent and displays existing row counts.
- `exact-attempt-update-hardening.sql`: follow-up transaction for databases that applied the earlier migration before the immutable-attempt trigger was added.
- `exact-attempt-update-hardening-dry-run.sql`: transactional test of the follow-up trigger, exact-row immutability, legacy-row compatibility, and helper-function grants.

## Existing local storage

The legacy migration service recognizes `reading-progress`, `reading-history`, `highlights`, `ai-conversation`, `saved-quote-ids`, `daily-missions-completed`, `user-xp`, `user-streak`, and `user-settings`. Sync helpers also read `sync-reading-progress`, `sync-reading-history`, `sync-highlights`, `sync-ai-conversations`, `sync-saved-quotes`, and `sync-daily-missions`; current search found no calls that write those sync keys. Completed per-passage progress is stored under `ielts_progress_${slug}` and its `attemptHistory`; active drafts use `ielts-reading-${slug}` and are never imported. Review queues use `ielts-reading-review-queue-v1:${userId}`. New unsent server attempts use `reading-attempt-outbox-v1:${userId}`.

The opt-in importer only sends legacy attempt rows with a UUID id and non-empty per-question `questionResults`. It skips aggregate-only passage scores, active drafts, invalid IDs, and attempts missing question details. Old attempts without per-attempt duration are imported with duration zero because the old saved record does not contain an exact duration. Valid historical completion timestamps are sent as the optional fifth RPC argument `p_completed_at`; missing or invalid timestamps use the database current time. The RPC clamps client-reported completion time to no later than now and no earlier than 400 days ago.

## Data and rollback notes

Selected answer text is stored in `reading_attempt_answers`. Learners can read and insert only answer rows belonging to their own `reading_history` parent. Admins can read all answer text through the admin policy/RPC path. An exact attempt is identified by `(user_id, attempt_key)` and retries return the existing id. Historical rows without `attempt_key` are excluded from exact metrics.

The migration adds rows for every submitted attempt and one row per question, so storage grows with use on the free plan. Review row growth and Supabase limits before launch. The rollback refuses to delete collected attempt data; if it refuses, preserve the data and revert the app first. To remove SQL objects after real attempts exist requires a separate data-retention decision and a reviewed export/archive plan. No default privileges are changed. A trigger blocks learners from updating any row with a non-null `attempt_key`; legacy rows remain updateable.

## Manual app checklist

- Submit a test online while signed in. Results render immediately; confirm it appears in `reading_history` with child answers after the outbox confirms.
- Submit while offline, then reconnect. Confirm one attempt appears and the account outbox entry is removed only after confirmation.
- Retry the same attempt key. Confirm there is one parent and one set of child answers.
- Disable/miss the RPC during app review. Confirm results still render, local progress remains, and outbox retry later succeeds after SQL becomes available.
- Complete attempts with answered and skipped questions. Confirm question exposures include every question, answered counts only selections, and accuracy is correct/total exposures.
- Compare Home Today across the Tashkent midnight boundary with Statistics All time. Confirm the shared formatter gives the same rounded duration.
- On an account with old detailed local attempts, accept import and verify stable IDs do not duplicate on retry. Check that active drafts and summary-only records are not imported.
- Choose “No thanks” and reload. Confirm the consent prompt does not reappear for that account.
- As learner A, verify own attempt/answers are visible; as learner B, verify A's are hidden; as anon, verify new table and RPC access is denied; as admin, verify the admin aggregate and charts.
- Confirm dashboard cards say “metrics unavailable” if the admin RPC is absent, and AI usage/activity feed continue using analytics events.
