const asList = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : []);

// The list columns are JSONB and may be null or malformed in older rows.
export function normalizeChangelogEntry(entry) {
  return {
    ...entry,
    features: asList(entry?.features),
    fixes: asList(entry?.fixes),
    breaking_changes: asList(entry?.breaking_changes),
  };
}
