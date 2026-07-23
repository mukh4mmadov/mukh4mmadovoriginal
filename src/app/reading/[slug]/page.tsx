import { notFound } from "next/navigation";
import { getReadingTest, readingTests } from "@/data/readingTests_new";
import ReadingTestPlayer from "@/components/reading/ReadingTestPlayer";

export function generateStaticParams() {
  return readingTests.map((t) => ({ slug: t.slug }));
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
