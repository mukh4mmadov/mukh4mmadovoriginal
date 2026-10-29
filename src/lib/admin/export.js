import { downloadCsv } from "@/lib/admin/csv.mjs";

// Downloads every row a query returns (not just the visible page) as CSV.
export async function exportQuery(filename, query, columns) {
  const { data, error } = await query.limit(10000);
  if (error) throw error;
  downloadCsv(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, data || [], columns);
}
