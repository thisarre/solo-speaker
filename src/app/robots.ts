import type { MetadataRoute } from "next";
import { absoluteUrl, privateRobotsDisallowRules } from "@/modules/landing/seo";
import { localizedPath, locales } from "@/i18n/routing";

export default function robots(): MetadataRoute.Robots {
  const localizedPrivateRules = privateRobotsDisallowRules.flatMap((rule) => [rule, ...locales.map((locale) => localizedPath(rule, locale))]);

  return {
    rules: [
      {
        allow: "/",
        disallow: localizedPrivateRules,
        userAgent: "*"
      },
      {
        allow: "/",
        disallow: localizedPrivateRules,
        userAgent: ["Googlebot", "Bingbot", "GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai"]
      }
    ],
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
