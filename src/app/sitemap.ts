import type { MetadataRoute } from "next";

// TODO: update to custom domain once live
const BASE_URL = "https://torvionyx.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE_URL}/welcome`, lastModified, changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified, changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE_URL}/privacy-policy`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/terms`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/cookie-policy`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
}
