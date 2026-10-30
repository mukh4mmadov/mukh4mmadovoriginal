import listeningTests, { getListeningTest } from "@/data/listeningTests";
import { extractListeningTest, listPartImages } from "@/lib/listening/extract-listening.mjs";
import { readListeningHtml } from "@/lib/listening/load-listening";

export const dynamic = "force-static";

// Maps and plans from a test's questions, served as normal image files so
// the test page doesn't carry them inline.
export async function generateStaticParams() {
  const params = [];
  for (const test of listeningTests) {
    const data = extractListeningTest(await readListeningHtml(test));
    listPartImages(data?.parts || []).forEach((_, index) => params.push({ slug: test.slug, index: String(index) }));
  }
  return params;
}

export async function GET(_request, { params }) {
  const { slug, index } = await params;
  const test = getListeningTest(slug);
  if (!test) return new Response("Not found", { status: 404 });
  const data = extractListeningTest(await readListeningHtml(test));
  const image = listPartImages(data?.parts || [])[Number(index)];
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(image.base64, "base64"), {
    headers: { "Content-Type": image.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
