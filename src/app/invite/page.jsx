import InviteFriends from "@/components/invites/InviteFriends";

export const metadata = {
  title: "Invite friends",
  description: "Invite friends to practise IELTS and earn free AI Premium Writing checks.",
  robots: { index: false },
};

export default function InvitePage() {
  return <InviteFriends />;
}
