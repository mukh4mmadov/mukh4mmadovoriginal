import test from "node:test";
import assert from "node:assert/strict";
import { mergeReviewQueue } from "./review-queue-sync.mjs";

const item = (id, updatedAt) => ({ id, updatedAt, questionText: id });

test("uploads local items the account does not have yet", () => {
  const result = mergeReviewQueue([item("a", "2026-01-02T00:00:00Z")], ["a"], []);
  assert.deepEqual(result.queue.map((entry) => entry.id), ["a"]);
  assert.deepEqual(result.reviewedIds, ["a"]);
  assert.deepEqual(result.toUpsert, [{ item_id: "a", data: item("a", "2026-01-02T00:00:00Z"), reviewed: true, removed_at: null }]);
});

test("adds account items from other devices with their reviewed flag", () => {
  const result = mergeReviewQueue([], [], [{ item_id: "b", data: item("b", "2026-01-01T00:00:00Z"), reviewed: true, removed_at: null }]);
  assert.deepEqual(result.queue.map((entry) => entry.id), ["b"]);
  assert.deepEqual(result.reviewedIds, ["b"]);
  assert.deepEqual(result.toUpsert, []);
});

test("an older local copy does not bring back an item removed on another device", () => {
  const result = mergeReviewQueue(
    [item("c", "2026-01-01T00:00:00Z")],
    [],
    [{ item_id: "c", data: item("c", "2026-01-01T00:00:00Z"), reviewed: false, removed_at: "2026-01-03T00:00:00Z" }],
  );
  assert.deepEqual(result.queue, []);
  assert.deepEqual(result.toUpsert, []);
});

test("missing the question again after removal puts it back", () => {
  const result = mergeReviewQueue(
    [item("c", "2026-01-05T00:00:00Z")],
    [],
    [{ item_id: "c", data: item("c", "2026-01-01T00:00:00Z"), reviewed: true, removed_at: "2026-01-03T00:00:00Z" }],
  );
  assert.deepEqual(result.queue.map((entry) => entry.id), ["c"]);
  assert.deepEqual(result.reviewedIds, []);
  assert.equal(result.toUpsert[0].removed_at, null);
});

test("the account's reviewed flag wins when the local copy is not newer", () => {
  const result = mergeReviewQueue(
    [item("d", "2026-01-01T00:00:00Z")],
    ["d"],
    [{ item_id: "d", data: item("d", "2026-01-01T00:00:00Z"), reviewed: false, removed_at: null }],
  );
  assert.deepEqual(result.reviewedIds, []);
  assert.deepEqual(result.toUpsert, []);
});

test("sorts the merged queue newest first", () => {
  const result = mergeReviewQueue(
    [item("old", "2026-01-01T00:00:00Z")],
    [],
    [{ item_id: "new", data: item("new", "2026-02-01T00:00:00Z"), reviewed: false, removed_at: null }],
  );
  assert.deepEqual(result.queue.map((entry) => entry.id), ["new", "old"]);
});
