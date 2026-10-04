import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
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
  const compressedPath = path.join(process.cwd(), "public", test.testDataPath.replace(/^\//, ""));
  let sourceHtml;
  try {
    sourceHtml = gunzipSync(await readFile(compressedPath)).toString("utf8");
  } catch {
    notFound();
  }
  const html = prepareListeningHtml(sourceHtml, test);
  return <ListeningTestExperience test={test} html={html} />;
}
