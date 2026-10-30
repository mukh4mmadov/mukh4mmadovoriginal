import assert from "node:assert/strict";
import test from "node:test";
import { formatUzs, getPack, packSaving, PREMIUM_PACKS, premiumEssays, premiumPrice, telegramLink, telegramMessage } from "./premium.mjs";
import { parsePremiumFeedback, parseWritingFeedback } from "./writing-feedback.mjs";

const criterion = (band) => ({ band, comment: "A detailed comment. ".repeat(60) });
const premiumJson = {
  summary: "Clear essay.",
  criteria: { task: criterion(6.5), coherence: criterion(6), lexical: criterion(6), grammar: criterion(5.5) },
  strengths: ["a", "b", "c", "d", "e", "f"],
  improvements: ["x"],
  corrections: Array.from({ length: 45 }, (_, index) => ({ original: `error ${index}`, improved: `fix ${index}`, reason: "r" })),
  rewrite: "First paragraph\nstill first.\n\n\nSecond   paragraph.",
  studyPlan: ["1. Plan", "2. Linkers", "3. Articles", "4. Extra"],
};

test("premium feedback keeps more detail, the rewrite and the study plan", () => {
  const feedback = parsePremiumFeedback("```json\n" + JSON.stringify(premiumJson) + "\n```");
  assert.equal(feedback.premium, true);
  assert.equal(feedback.overall, 6);
  assert.equal(feedback.corrections.length, 40);
  assert.equal(feedback.strengths.length, 5);
  assert.ok(feedback.comments.task.length > 700 && feedback.comments.task.length <= 1600);
  assert.equal(feedback.rewrite, "First paragraph still first.\n\nSecond paragraph.");
  assert.deepEqual(feedback.studyPlan, ["1. Plan", "2. Linkers", "3. Articles"]);
});

test("premium feedback needs valid bands, like the free check", () => {
  assert.equal(parsePremiumFeedback("not json"), null);
  assert.equal(parsePremiumFeedback(JSON.stringify({ ...premiumJson, criteria: { task: criterion(6) } })), null);
  // The free check keeps its smaller limits.
  assert.equal(parseWritingFeedback(JSON.stringify(premiumJson)).corrections.length, 5);
});

test("price, Telegram link and the essays sent for a premium check", () => {
  assert.equal(premiumPrice(2), 10000);
  assert.equal(formatUzs(5000), "5,000 UZS");
  assert.equal(telegramLink("@someone"), "https://t.me/someone");
  assert.match(telegramMessage("AB12CD", 5000), /AB12CD.*5,000 UZS/);
  const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);
  const tasks = [{ slug: "one", task: 1 }, { slug: "two", task: 2 }];
  const essays = premiumEssays(tasks, { one: "short answer", two: "word ".repeat(60) }, countWords);
  assert.deepEqual(essays.map((item) => [item.taskSlug, item.taskNumber, item.wordCount]), [["two", 2, 60]]);
});

test("bundles cost less than single checks and name themselves in the Telegram message", () => {
  assert.deepEqual(PREMIUM_PACKS.map((pack) => [pack.id, pack.credits, pack.price, packSaving(pack)]), [["pack5", 5, 20000, 5000], ["pack10", 10, 35000, 15000]]);
  assert.equal(getPack("pack10").credits, 10);
  assert.equal(getPack("nope"), null);
  assert.match(telegramMessage("ABC123", 20000, "an AI Premium bundle of 5 checks"), /bundle of 5 checks.*ABC123.*20,000 UZS/);
});
