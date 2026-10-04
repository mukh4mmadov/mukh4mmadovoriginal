import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ListeningTestExperience from "@/components/listening/ListeningTestExperience";
import listeningTests, { getListeningTest } from "@/data/listeningTests";
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
  const htmlPath = path.join(process.cwd(), "public", test.testPath.replace(/^\//, ""));
  const sourceHtml = await readFile(htmlPath, "utf8");
  const html = prepareListeningHtml(sourceHtml, test);
  return <ListeningTestExperience test={test} html={html} />;
}
