// `priority` is stored as text ("low" | "medium" | "high"), so ordering it in
// SQL sorts alphabetically. Rank it here instead.
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function sortRoadmapItems(items) {
  return [...(items || [])].sort((a, b) =>
    (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3)
    || String(a.target_date || "9999").localeCompare(String(b.target_date || "9999"))
    || String(a.title || "").localeCompare(String(b.title || "")));
}
