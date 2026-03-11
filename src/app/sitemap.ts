import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://nz-election-tracker.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/polls`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/forecast`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sentiment`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/map`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/feed`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/roadmap`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
