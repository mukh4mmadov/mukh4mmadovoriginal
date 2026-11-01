import assert from "node:assert/strict";
import test from "node:test";
import {
  clearPendingInvite, getDeviceId, inviteLink, inviteReward, isFinalClaimResult,
  normalizeInviteCode, readPendingInvite, savePendingInvite, telegramShareLink,
} from "./invites.mjs";

const memoryStorage = () => {
  const data = new Map();
  return { getItem: (key) => (data.has(key) ? data.get(key) : null), setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) };
};

test("codes are 8 letters or digits, any case", () => {
  assert.equal(normalizeInviteCode(" hxasm2l6 "), "HXASM2L6");
  assert.equal(normalizeInviteCode("ABC"), null);
  assert.equal(normalizeInviteCode("ABCD-EFG"), null);
  assert.equal(normalizeInviteCode(undefined), null);
});

test("links and share text", () => {
  assert.equal(inviteLink("https://site.app/", "HXASM2L6"), "https://site.app/invite/HXASM2L6");
  assert.match(telegramShareLink("https://site.app/invite/HXASM2L6"), /^https:\/\/t\.me\/share\/url\?url=https%3A%2F%2Fsite\.app%2Finvite%2FHXASM2L6&text=/);
});

test("one free check for every three approved friends", () => {
  assert.deepEqual(inviteReward(0), { credits: 0, towardsNext: 0, needed: 3 });
  assert.deepEqual(inviteReward(2), { credits: 0, towardsNext: 2, needed: 1 });
  assert.deepEqual(inviteReward(3), { credits: 1, towardsNext: 0, needed: 3 });
  assert.deepEqual(inviteReward(7), { credits: 2, towardsNext: 1, needed: 2 });
  assert.deepEqual(inviteReward(-4), { credits: 0, towardsNext: 0, needed: 3 });
});

test("a pending invite is kept for 30 days", () => {
  const storage = memoryStorage();
  assert.equal(savePendingInvite(storage, "bad"), false);
  assert.equal(savePendingInvite(storage, "hxasm2l6", 1000), true);
  assert.equal(readPendingInvite(storage, 1000 + 86400000), "HXASM2L6");
  assert.equal(readPendingInvite(storage, 1000 + 31 * 86400000), null);
  clearPendingInvite(storage);
  assert.equal(readPendingInvite(storage, 1000), null);
});

test("the device id is created once and reused", () => {
  const storage = memoryStorage();
  const first = getDeviceId(storage, () => "11111111-2222-3333-4444-555555555555");
  assert.equal(first, "11111111-2222-3333-4444-555555555555");
  assert.equal(getDeviceId(storage, () => "other-other-other-other"), first);
  assert.equal(getDeviceId({ getItem() { throw new Error("blocked"); } }), null);
});

test("only known answers end the claim; others are retried", () => {
  assert.equal(isFinalClaimResult("joined"), true);
  assert.equal(isFinalClaimResult("same_device"), true);
  assert.equal(isFinalClaimResult("not_signed_in"), false);
  assert.equal(isFinalClaimResult(undefined), false);
});
