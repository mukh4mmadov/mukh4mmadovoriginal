import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getReadingTest, readingTests } from "@/data/readingTests_new";
import ReadingTestPlayer from "@/components/reading/ReadingTestPlayer";

export function generateStaticParams() {
  return readingTests.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const test = getReadingTest(slug);
  if (!test) {
    return {
      title: "Reading Test Not Found",
      description: "The requested IELTS reading passage could not be found.",
    };
  }

  const passage = test.passages[0];
  const questionCount = passage.questionGroups.reduce(
    (sum, g) => sum + g.questions.length,
    0,
  );

  return {
    title: `${test.title} | Muhammadov IELTS Reading`,
    description: `Practice the IELTS Academic Reading passage "${test.title}" with ${questionCount} questions. Timed at 20 minutes, exam-format questions with instant band estimate.`,
    openGraph: {
      title: `${test.title} | Muhammadov IELTS Reading`,
      description: `Practice IELTS Academic Reading: ${test.title}. ${questionCount} exam-format questions, 20-minute timer, built-in highlighter.`,
      type: "article",
    },
  };
}

export default async function ReadingTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = getReadingTest(slug);
  if (!test) notFound();

  return <ReadingTestPlayer passage={test.passages[0]} />;
}
