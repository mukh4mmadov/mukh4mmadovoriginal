import { notFound } from "next/navigation";
import InviteLanding from "@/components/invites/InviteLanding";
import { normalizeInviteCode } from "@/lib/invites/invites.mjs";

export const metadata = {
  title: "You're invited to practise IELTS",
  description: "Free IELTS practice: real exam-style Listening, Reading and Writing tests with AI feedback.",
  robots: { index: false },
};

export default async function InviteCodePage({ params }) {
  const { code } = await params;
  const normalized = normalizeInviteCode(code);
  if (!normalized) notFound();
  return <InviteLanding code={normalized} />;
}
