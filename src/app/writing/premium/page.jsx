import PremiumChecks from "@/components/writing/PremiumChecks";

export const metadata = {
  title: "My AI Premium Writing checks",
  description: "Your AI Premium IELTS Writing checks: payment status and detailed results.",
  robots: { index: false },
};

export default function WritingPremiumPage() {
  return <PremiumChecks />;
}
