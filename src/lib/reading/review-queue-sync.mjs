// Merges the review queue kept in this browser with the copy saved to the
// learner's account. Account rows: { item_id, data, reviewed, removed_at }.

const time = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Returns the merged queue and reviewed IDs to keep locally, plus the rows
 * to upsert so the account catches up with newer local items.
 * - A local item newer than the account copy (or its removal) wins.
 * - Otherwise the account decides: its item and reviewed flag, or its removal.
 */
export function mergeReviewQueue(localItems = [], localReviewedIds = [], accountRows = []) {
  const reviewedLocally = new Set(localReviewedIds);
  const local = new Map(localItems.filter((item) => item?.id).map((item) => [item.id, item]));
  const account = new Map(accountRows.filter((row) => row?.item_id).map((row) => [row.item_id, row]));
  const queue = [];
  const reviewedIds = new Set();
  const toUpsert = [];

  for (const id of new Set([...local.keys(), ...account.keys()])) {
    const localItem = local.get(id);
    const row = account.get(id);
    const accountTime = row ? Math.max(time(row.data?.updatedAt), time(row.removed_at)) : 0;

    if (localItem && (!row || time(localItem.updatedAt) > accountTime)) {
      const reviewed = reviewedLocally.has(id);
      queue.push(localItem);
      if (reviewed) reviewedIds.add(id);
      toUpsert.push({ item_id: id, data: localItem, reviewed, removed_at: null });
    } else if (row && !row.removed_at && row.data) {
      queue.push(row.data);
      if (row.reviewed) reviewedIds.add(id);
    }
  }

  queue.sort((first, second) => time(second.updatedAt) - time(first.updatedAt));
  return { queue, reviewedIds: [...reviewedIds], toUpsert };
}
