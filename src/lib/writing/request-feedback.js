// Asks the server's AI examiner to mark one response. Throws with a message
// that can be shown to the learner.
export async function requestWritingFeedback(taskSlug, essay, timeSpentSeconds) {
  const response = await fetch("/api/writing-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskSlug, essay, timeSpentSeconds }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.feedback) throw new Error(data.error || "Feedback could not be generated. Please try again.");
  return data;
}
