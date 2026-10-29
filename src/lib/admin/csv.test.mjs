import assert from "node:assert/strict";
import test from "node:test";
import { toCsv } from "./csv.mjs";

test("CSV quotes special characters and neutralises formulas", () => {
  const csv = toCsv(
    [{ name: 'Ali "A", B', note: "=HYPERLINK(\"x\")", n: 7, data: { a: 1 } }, { name: null, note: "line\nbreak", n: 0, data: null }],
    [{ label: "Name", value: (r) => r.name }, { label: "Note", value: (r) => r.note }, { label: "N", value: (r) => r.n }, { label: "Data", value: (r) => r.data }],
  );
  assert.equal(csv, 'Name,Note,N,Data\r\n"Ali ""A"", B","\'=HYPERLINK(""x"")",7,"{""a"":1}"\r\n,"line\nbreak",0,');
});
