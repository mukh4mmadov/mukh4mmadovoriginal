const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mukh4mmadovoriginal.vercel.app";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/complete-profile",
        "/forgot-password",
        "/my-feedback",
        "/profile",
        "/review",
        "/settings",
        "/statistics",
      ],
    },
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
