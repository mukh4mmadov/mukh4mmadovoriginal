import { notFound } from "next/navigation";
import ListeningExam from "@/components/listening/ListeningExam";
import listeningTests, { getListeningTest } from "@/data/listeningTests";
import { extractListeningTest } from "@/lib/listening/extract-listening.mjs";
import { readListeningHtml } from "@/lib/listening/load-listening";

export function generateStaticParams() {
  return listeningTests.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const test = getListeningTest(slug);
  if (!test) return { title: "Listening Test Not Found" };
  const description = `Timed IELTS Listening practice test: ${test.title}. Four sections, 40 questions and built-in audio controls.`;
  return {
    title: test.title,
    description,
    alternates: { canonical: `/listening/${test.slug}` },
    openGraph: { title: `${test.title} | Mukh4mmadov IELTS`, description, url: `/listening/${test.slug}` },
  };
}

export default async function ListeningTestPage({ params }) {
  const { slug } = await params;
  const test = getListeningTest(slug);
  if (!test) notFound();
  let data;
  try {
    data = extractListeningTest(await readListeningHtml(test), { imageSrc: (index) => `/listening/${test.slug}/image/${index}` });
  } catch {
    notFound();
  }
  if (!data) notFound();
  return <ListeningExam test={test} data={data} />;
}

