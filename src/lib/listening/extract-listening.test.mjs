import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { cleanQuestionHtml, extractListeningTest, listPartImages } from "./extract-listening.mjs";

const dataDir = new URL("../../../public/listening/data/", import.meta.url);

for (const file of readdirSync(dataDir).filter((name) => name.endsWith(".gz"))) {
  test(`${file}: four parts and an answer for all 40 questions`, () => {
    const html = gunzipSync(readFileSync(new URL(file, dataDir))).toString("utf8");
    const data = extractListeningTest(html);
    assert.ok(data, "format recognised");
    assert.deepEqual(data.parts.map((part) => part.number), [1, 2, 3, 4]);
    const numbers = Object.keys(data.questions).map(Number).sort((a, b) => a - b);
    assert.deepEqual(numbers, Array.from({ length: 40 }, (_, index) => index + 1));
    for (const [number, question] of Object.entries(data.questions)) {
      assert.ok(question.answers.length > 0, `question ${number} has an answer`);
      assert.ok(question.part >= 1 && question.part <= 4);
    }
    for (const part of data.parts) {
      assert.doesNotMatch(part.html, /<script|\son[a-z]+=|display\s*:\s*none/i);
    }
  });
}

test("cleaning removes scripts, handlers and hidden styles", () => {
  assert.equal(
    cleanQuestionHtml('<div style="display:none;" onclick="x()"><script>alert(1)</script><a href="javascript:x">a</a></div>'),
    '<div><a href="x">a</a></div>',
  );
  assert.equal(extractListeningTest("<html>nothing</html>"), null);
});

test("embedded pictures can be served as separate files", () => {
  const html = gunzipSync(readFileSync(new URL("campus-art-business.gz", dataDir))).toString("utf8");
  const images = listPartImages(extractListeningTest(html).parts);
  assert.ok(images.length >= 1 && images.every((image) => image.mime.startsWith("image/")));
  const linked = extractListeningTest(html, { imageSrc: (index) => `/img/${index}` });
  assert.doesNotMatch(linked.parts.map((part) => part.html).join(""), /data:image/);
  assert.match(linked.parts.map((part) => part.html).join(""), /src="\/img\/0"/);
});
