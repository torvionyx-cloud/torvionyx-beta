import type { MetadataRoute } from "next";

// TODO: update to custom domain once live
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/welcome", "/pricing", "/privacy-policy", "/terms", "/cookie-policy"],
      disallow: ["/dashboard", "/sign-in", "/sign-up", "/api", "/p"],
    },
    sitemap: "https://torvionyx.vercel.app/sitemap.xml",
  };
}
