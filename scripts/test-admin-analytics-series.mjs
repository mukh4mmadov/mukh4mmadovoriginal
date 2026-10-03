import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mapAdminReadingMetrics } from '../src/lib/reading/admin-analytics.mjs';

const mapped = mapAdminReadingMetrics({
  daily: [{ date: '2026-10-02', attempts: '2', seconds: '120' }],
  ai_usage_daily: [{ date: '2026-10-02', count: '1400' }],
  registrations_daily: [{ date: '2026-10-02', registrations: '3' }],
  question_types: [{ question_type: 'multiple-choice', exposures: '14', accuracy_percent: '86' }],
});

assert.deepEqual(mapped.aiUsage, [{ date: '2026-10-02', count: 1400 }]);
assert.deepEqual(mapped.attempts, [{ date: '2026-10-02', count: 2 }]);
assert.deepEqual(mapped.readingTime, [{ date: '2026-10-02', value: 120, timeValue: true }]);
assert.deepEqual(mapped.registrations, [{ date: '2026-10-02', count: 3 }]);
assert.deepEqual(mapped.questionTypes, [{ type: 'multiple-choice', count: 14, accuracy: 86 }]);
assert.deepEqual(mapAdminReadingMetrics({}).aiUsage, []);

const usersRepository = readFileSync('src/lib/supabase/repositories/users.repository.js', 'utf8');
const usersPage = readFileSync('src/app/admin/users/page.jsx', 'utf8');
const activityFeed = readFileSync('src/components/admin/ActivityFeed.jsx', 'utf8');
assert.match(usersRepository, /rpc\('get_admin_user_reading_metrics'\)/);
assert.doesNotMatch(usersRepository, /admin_user_statistics/);
assert.match(usersPage, /Saved Attempts/);
assert.match(usersPage, /Accuracy/);
assert.match(usersPage, /user\.average_score != null/);
assert.match(activityFeed, /This feed uses analytics events\. Saved reading attempts are tracked separately in Analytics\./);

console.log('PASS: admin chart series uses server-side AI counts without a browser event list');
console.log('PASS: admin user summaries use exact-attempt RPC and the activity feed labels its separate analytics source');
