import assert from 'node:assert/strict';
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

console.log('PASS: admin chart series uses server-side AI counts without a browser event list');
