// CSV export for admin tables. Values are quoted, and cells that start with
// a formula character are prefixed so spreadsheets don't run them.
const cell = (value) => {
  if (value == null) return "";
  let text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function toCsv(rows, columns) {
  const header = columns.map((column) => cell(column.label)).join(",");
  const lines = rows.map((row) => columns.map((column) => cell(column.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}

export function downloadCsv(filename, rows, columns) {
  // A byte-order mark makes Excel read the file as UTF-8.
  const blob = new Blob(["﻿" + toCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
