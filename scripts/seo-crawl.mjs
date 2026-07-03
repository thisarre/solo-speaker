// Crawl every sitemap URL and print on-page SEO/GEO/AEO signals as JSON.
// Usage: node scripts/seo-crawl.mjs [baseUrl]  (default https://solospeaker.com)
const base = process.argv[2] ?? "https://solospeaker.com";

const sitemapXml = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const results = [];
for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (res.status !== 200) {
      results.push({ url, status: res.status, location: res.headers.get("location") });
      continue;
    }
    const html = await res.text();
    const pick = (re) => (html.match(re) || [])[1]?.trim();
    const count = (re) => (html.match(re) || []).length;

    const title = pick(/<title>([^<]*)<\/title>/i);
    const desc = pick(/<meta name="description" content="([^"]*)"/i);
    const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => {
        try {
          return JSON.parse(m[1]);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const schemaTypes = jsonLdBlocks.flatMap((b) => (b["@graph"] || [b]).map((n) => n["@type"])).flat();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    results.push({
      url: url.replace(base, ""),
      status: 200,
      titleLen: title?.length ?? 0,
      descLen: desc?.length ?? 0,
      canonical: !!pick(/<link rel="canonical" href="([^"]*)"/i),
      hreflang: count(/hreflang="/gi),
      h1: count(/<h1[\s>]/g),
      h2: count(/<h2[\s>]/g),
      words: text.split(" ").length,
      imgsNoAlt: count(/<img (?![^>]*alt="[^"]+")[^>]*>/g),
      ogImage: !!pick(/<meta property="og:image" content="([^"]*)"/i),
      schemaTypes: [...new Set(schemaTypes)],
      questionHeadings: count(/<h[23][^>]*>[^<]*\?/g),
      internalLinks: count(/href="\/(?!_next)[^"]*"/g)
    });
  } catch (error) {
    results.push({ url, status: "fetch-error", error: String(error) });
  }
}

const extras = {};
for (const path of ["/robots.txt", "/llms.txt"]) {
  const res = await fetch(`${base}${path}`).catch(() => null);
  extras[path] = res?.status ?? "fetch-error";
}

console.log(JSON.stringify({ pages: results, extras }, null, 1));
