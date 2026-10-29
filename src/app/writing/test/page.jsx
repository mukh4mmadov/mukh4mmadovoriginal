import WritingTest from "@/components/writing/WritingTest";

export const metadata = {
  title: "Full IELTS Writing Test",
  description: "Take a full IELTS Academic Writing test: Task 1 and Task 2 in 60 minutes in the computer-delivered exam layout, with AI feedback and an estimated Writing band.",
  alternates: { canonical: "/writing/test" },
};

export default function WritingTestPage() {
  return <WritingTest />;
}
