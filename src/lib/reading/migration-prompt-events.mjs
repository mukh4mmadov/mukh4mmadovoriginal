export const OPEN_MIGRATION_PROMPT_EVENT = 'open-local-migration-prompt';

export function requestOpenMigrationPrompt() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_MIGRATION_PROMPT_EVENT));
  }
}
