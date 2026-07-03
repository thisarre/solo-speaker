import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLandingMetadata,
  buildLandingJsonLd,
  landingFaq,
  landingMetadata,
  marketingSitemapEntries,
  privateRobotsDisallowRules
} from "./seo";

test("landing metadata targets AI speech coach search intent", () => {
  const frenchMetadata = buildLandingMetadata("fr");

  assert.equal(landingMetadata.title, "AI Speech Coach & Teleprompter | Solo Speaker Studio");
  assert.equal(
    landingMetadata.description,
    "Prepare, improve, rehearse and deliver better talks with Solo Speaker Studio, an AI-powered workspace for speakers, pastors, trainers and founders."
  );
  assert.equal(landingMetadata.alternates?.canonical, "/en");
  assert.equal(landingMetadata.alternates?.languages?.fr, "/fr");
  assert.equal(frenchMetadata.alternates?.canonical, "/fr");
  assert.equal(frenchMetadata.title, "Coach IA et prompteur pour discours | Solo Speaker Studio");
  assert.match(String(landingMetadata.keywords), /AI speech coach/);
});

test("landing JSON-LD exposes software, website and FAQ entities", () => {
  const graph = buildLandingJsonLd("en", "https://solo-speaker.com");

  assert.equal(graph["@context"], "https://schema.org");
  assert.ok(graph["@graph"].some((item) => item["@type"] === "SoftwareApplication" && item.name === "Solo Speaker Studio"));
  assert.ok(graph["@graph"].some((item) => item["@type"] === "WebSite"));
  const faqSchema = graph["@graph"].find((item) => item["@type"] === "FAQPage");
  assert.ok(faqSchema);
  assert.equal(faqSchema.mainEntity?.length, landingFaq.en.length);
});

test("SEO route helpers include public marketing pages and block private app sections", () => {
  assert.deepEqual(
    marketingSitemapEntries.map((entry) => entry.path),
    ["/", "/pricing", "/login", "/signup", "/use-cases/sermon-preparation", "/use-cases/public-speaking", "/use-cases/training-presentations", "/features/ai-speech-writer", "/features/teleprompter-mode", "/mentions-legales", "/cgv", "/confidentialite"]
  );
  assert.ok(privateRobotsDisallowRules.includes("/dashboard"));
  assert.ok(privateRobotsDisallowRules.includes("/settings"));
  assert.ok(privateRobotsDisallowRules.includes("/talks"));
});
