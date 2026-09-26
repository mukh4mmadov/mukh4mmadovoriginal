# Browser study reminders setup

The reminder feature uses the browser Push API, a Supabase table for opt-in subscriptions, and one daily Vercel Cron invocation. Browser push delivery itself has no per-message provider charge. The Vercel Hobby scheduler runs once per day and can be delayed within its scheduled hour.

## Supabase

Run `supabase/migrations/005_push_reminders.sql` once in the Supabase SQL Editor. The migration creates the subscription table and restricts browser access to each signed-in user's own rows.

## VAPID keys

Generate an application key pair in a terminal with:

```text
npx web-push generate-vapid-keys
```

Keep the private key secret. Add these environment variables to Vercel:

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<generated public key>
VAPID_PRIVATE_KEY=<generated private key>
VAPID_SUBJECT=https://mukh4mmadovoriginal.vercel.app
CRON_SECRET=<a long random secret>
SUPABASE_SERVICE_ROLE_KEY=<Supabase secret key>
```

Only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is safe to expose to the browser. For `SUPABASE_SERVICE_ROLE_KEY`, use the Supabase secret key from Settings → API Keys; the environment variable keeps its existing name for this project. Keep the VAPID private key, cron secret, and Supabase secret key server-side. Apply the variables to Production and redeploy. Add them to Preview only if preview deployments should send real notifications.

## User opt-in

After deployment, a signed-in user can open Settings and press **Turn on** under Study reminders. The browser permission prompt is only requested from this button click. Users can turn reminders off from the same setting or block them in their browser.

The daily Vercel job checks for opted-in users who have not visited for at least 24 hours. Since Hobby Cron runs once daily, actual delivery can be later than the 24-hour mark. The schedule is configured for 13:00 UTC in `vercel.json`.
