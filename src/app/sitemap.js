import readingTestsModule from "@/data/readingTests_new";
import listeningTests from "@/data/listeningTests";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://mukh4mmadovoriginal.vercel.app").replace(/\/$/, "");
const staticRoutes = ["/home", "/reading", "/readingmock", "/listening", "/roadmap", "/changelog", "/support", "/privacy", "/terms", "/contact"];

export default function sitemap() {
  const staticPages = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "/home" || route === "/reading" ? "weekly" : "monthly",
  }));
  const passagePages = (readingTestsModule?.readingTests || []).map((test) => ({
    url: `${siteUrl}/reading/${encodeURIComponent(test.slug)}`,
    changeFrequency: "monthly",
  }));
  const listeningPages = listeningTests.map((test) => ({
    url: `${siteUrl}/listening/${encodeURIComponent(test.slug)}`,
    changeFrequency: "monthly",
  }));

  return [...staticPages, ...passagePages, ...listeningPages];
}
