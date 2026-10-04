import { notFound } from "next/navigation";
import ListeningTestExperience from "@/components/listening/ListeningTestExperience";
import listeningTests, { getListeningTest } from "@/data/listeningTests";
import { getListeningMarkup } from "@/data/listeningTestMarkup";
import { prepareListeningHtml } from "@/lib/listening/prepare-listening-html.mjs";

export function generateStaticParams() {
  return listeningTests.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const test = getListeningTest(slug);
  return test ? { title: test.title, description: `Timed IELTS Listening practice: ${test.title}.` } : {};
}

export default async function ListeningTestPage({ params }) {
  const { slug } = await params;
  const test = getListeningTest(slug);
  if (!test) notFound();
  const sourceHtml = getListeningMarkup(test.slug);
  if (!sourceHtml) notFound();
  const html = prepareListeningHtml(sourceHtml, test);
  return <ListeningTestExperience test={test} html={html} />;
}
