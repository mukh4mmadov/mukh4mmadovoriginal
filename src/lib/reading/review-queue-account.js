import { getReviewedQuestionIds, getReviewQueue, replaceReviewQueue } from "@/lib/reading/answer-review";
import { mergeReviewQueue } from "@/lib/reading/review-queue-sync.mjs";
import { reviewQueueRepository } from "@/lib/supabase/repositories/review-queue.repository";

// Merges this browser's review queue with the account copy and saves the
// result on both sides. Throws when the account copy can't be read (for
// example before migration 018 is applied); the local queue is unchanged then.
export async function syncReviewQueue(userId) {
  const rows = await reviewQueueRepository.listForUser(userId);
  const merged = mergeReviewQueue(getReviewQueue(userId), getReviewedQuestionIds(userId), rows);
  replaceReviewQueue(merged.queue, merged.reviewedIds, userId);
  await reviewQueueRepository.upsertMany(userId, merged.toUpsert);
  return merged;
}

export async function saveReviewItemsToAccount(userId, items) {
  const reviewed = new Set(getReviewedQuestionIds(userId));
  await reviewQueueRepository.upsertMany(userId, items.map((item) => ({
    item_id: item.id,
    data: item,
    reviewed: reviewed.has(item.id),
    removed_at: null,
  })));
}
