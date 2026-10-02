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
