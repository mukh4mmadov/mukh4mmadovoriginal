import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

// Server only: the stored test page for a Listening test.
export async function readListeningHtml(test) {
  const file = path.join(process.cwd(), "public", test.testDataPath.replace(/^\//, ""));
  return gunzipSync(await readFile(file)).toString("utf8");
}
