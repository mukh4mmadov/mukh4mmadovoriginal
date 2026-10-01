export function ticketNeedsReply(ticket) {
  if (!ticket || ticket.status === "resolved") return false;
  const lastMessage = [...(ticket.messages || [])]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .at(-1);
  return lastMessage?.sender_type === "learner";
}
