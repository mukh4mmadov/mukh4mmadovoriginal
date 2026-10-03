import { readFileSync } from 'node:fs';

const migrationPath = 'supabase/review/reading_attempts/migration.sql';
const dryRunPath = 'supabase/review/reading_attempts/dry-run.sql';
const startMarker = 'DO $preconditions$';
const endMarker = '$verify$;';

function extractDdl(path) {
  const source = readFileSync(path, 'utf8');
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Could not find DDL boundaries in ${path}`);
  return source.slice(start, end + endMarker.length);
}

function extractAdminMetricsFunction(path) {
  const source = readFileSync(path, 'utf8');
  const startMarker = 'CREATE OR REPLACE FUNCTION public.get_admin_reading_metrics(p_days integer DEFAULT 30)';
  const start = source.indexOf(startMarker);
  const end = source.indexOf('$function$;', start);
  if (start < 0 || end < 0) throw new Error(`Could not find admin metrics function in ${path}`);
  return source.slice(start, end + '$function$;'.length);
}

function extractSubmitAttemptFunction(path) {
  const source = readFileSync(path, 'utf8');
  const startMarker = 'CREATE OR REPLACE FUNCTION public.submit_reading_attempt(';
  const start = source.indexOf(startMarker);
  const end = source.indexOf('$function$;', start);
  if (start < 0 || end < 0) throw new Error(`Could not find submit attempt function in ${path}`);
  return source.slice(start, end + '$function$;'.length);
}

function extractAdminUserMetricsFunction(path) {
  const source = readFileSync(path, 'utf8');
  const startMarker = 'CREATE OR REPLACE FUNCTION public.get_admin_user_reading_metrics()';
  const start = source.indexOf(startMarker);
  const end = source.indexOf('$function$;', start);
  if (start < 0 || end < 0) throw new Error(`Could not find admin user metrics function in ${path}`);
  return source.slice(start, end + '$function$;'.length);
}

const migrationDdl = extractDdl(migrationPath);
const dryRunDdl = extractDdl(dryRunPath);
if (migrationDdl !== dryRunDdl) {
  const migrationLines = migrationDdl.split('\n');
  const dryRunLines = dryRunDdl.split('\n');
  const max = Math.max(migrationLines.length, dryRunLines.length);
  for (let index = 0; index < max; index += 1) {
    if (migrationLines[index] !== dryRunLines[index]) {
      console.error(`DDL differs at line ${index + 1}:`);
      console.error(`migration: ${migrationLines[index] ?? '<missing>'}`);
      console.error(`dry-run:   ${dryRunLines[index] ?? '<missing>'}`);
      process.exitCode = 1;
      break;
    }
  }
} else {
  console.log('--- migration DDL');
  console.log('+++ dry-run DDL');
  console.log('(empty)');
  console.log('PASS: migration.sql and dry-run.sql DDL are identical.');
}

const adminSources = [
  ['migration.sql', extractAdminMetricsFunction(migrationPath)],
  ['dry-run.sql', extractAdminMetricsFunction(dryRunPath)],
  ['admin-ai-metrics-followup.sql', extractAdminMetricsFunction('supabase/review/reading_attempts/admin-ai-metrics-followup.sql')],
  ['admin-ai-metrics-followup-dry-run.sql', extractAdminMetricsFunction('supabase/review/reading_attempts/admin-ai-metrics-followup-dry-run.sql')],
];
const reference = adminSources[0][1];
for (const [name, functionDdl] of adminSources.slice(1)) {
  if (functionDdl !== reference) {
    console.error(`FAIL: get_admin_reading_metrics DDL differs in ${name}.`);
    process.exitCode = 1;
  }
}
if (process.exitCode !== 1) {
  console.log('PASS: admin metrics function matches in migration, dry-run, and both follow-up SQL files.');
}

const submitSources = [
  ['migration.sql', extractSubmitAttemptFunction(migrationPath)],
  ['selected-answer-limit-dry-run.sql', extractSubmitAttemptFunction('supabase/review/reading_attempts/selected-answer-limit-dry-run.sql')],
  ['selected-answer-limit-fix.sql', extractSubmitAttemptFunction('supabase/review/reading_attempts/selected-answer-limit-fix.sql')],
];
const submitReference = submitSources[0][1];
for (const [name, functionDdl] of submitSources.slice(1)) {
  if (functionDdl !== submitReference) {
    console.error(`FAIL: submit_reading_attempt DDL differs in ${name}.`);
    process.exitCode = 1;
  }
}
if (process.exitCode !== 1) {
  console.log('PASS: selected-answer repair function matches the canonical migration in its dry-run and apply scripts.');
}

const userMetricsSources = [
  ['migration.sql', extractAdminUserMetricsFunction(migrationPath)],
  ['dry-run.sql', extractAdminUserMetricsFunction(dryRunPath)],
  ['admin-user-metrics-followup.sql', extractAdminUserMetricsFunction('supabase/review/reading_attempts/admin-user-metrics-followup.sql')],
  ['admin-user-metrics-followup-dry-run.sql', extractAdminUserMetricsFunction('supabase/review/reading_attempts/admin-user-metrics-followup-dry-run.sql')],
];
const userMetricsReference = userMetricsSources[0][1];
for (const [name, functionDdl] of userMetricsSources.slice(1)) {
  if (functionDdl !== userMetricsReference) {
    console.error(`FAIL: get_admin_user_reading_metrics DDL differs in ${name}.`);
    process.exitCode = 1;
  }
}
for (const [description, requiredMarker] of [
  ['admin-only guard', 'is_admin_user'],
  ['exact-attempt filter', 'attempt_key IS NOT NULL'],
  ['question-weighted accuracy', 'sum(h.correct_count) / nullif(sum(h.question_count), 0)'],
]) {
  if (!userMetricsReference.includes(requiredMarker)) {
    console.error(`FAIL: per-user metrics RPC is missing its ${description}.`);
    process.exitCode = 1;
  }
}
if (process.exitCode !== 1) {
  console.log('PASS: admin per-user metrics function matches in migration, dry-run, and follow-up SQL files.');
}
