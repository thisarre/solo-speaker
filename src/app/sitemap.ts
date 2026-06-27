import type { MetadataRoute } from "next";
import { absoluteUrl, marketingSitemapEntries } from "@/modules/landing/seo";
import { getLocalizedPathAlternates, localizedPath, locales } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return marketingSitemapEntries.flatMap((entry) =>
    locales.map((locale) => ({
      alternates: {
        languages: Object.fromEntries(Object.entries(getLocalizedPathAlternates(entry.path)).map(([key, path]) => [key, absoluteUrl(path)]))
      },
      changeFrequency: entry.path === "/" ? "weekly" as const : "monthly" as const,
      lastModified: now,
      priority: entry.priority,
      url: absoluteUrl(localizedPath(entry.path, locale))
    }))
  );
}
