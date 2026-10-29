import FullMockHub from "@/components/mock/FullMockHub";

export const metadata = {
  title: "Full IELTS Mock Test",
  description: "Take a full IELTS mock test: Listening, Reading and Writing in the exam-day order, with a band for each part and an estimated overall band.",
  alternates: { canonical: "/full-mock" },
};

export default function FullMockPage() {
  return <FullMockHub />;
}
