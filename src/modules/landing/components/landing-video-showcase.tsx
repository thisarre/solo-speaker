import { Play } from "lucide-react";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";

type LandingVideoShowcaseProps = {
  landing: Messages["landing"];
  locale: Locale;
};

const videoAssets = {
  fr: [
    { poster: "/videos/solo-speaker-clarity-workflow-poster.jpg", src: "/videos/solo-speaker-clarity-workflow.mp4" },
    { poster: "/videos/solo-speaker-product-flow-poster.jpg", src: "/videos/solo-speaker-product-flow.mp4" }
  ],
  en: [
    { poster: "/videos/solo-speaker-clarity-workflow-en-poster.jpg", src: "/videos/solo-speaker-clarity-workflow-en.mp4" },
    { poster: "/videos/solo-speaker-product-flow-en-poster.jpg", src: "/videos/solo-speaker-product-flow-en.mp4" }
  ]
} as const;

export function LandingVideoShowcase({ landing, locale }: LandingVideoShowcaseProps) {
  const assets = videoAssets[locale] ?? videoAssets.fr;
  return (
    <section className="border-b border-line bg-[color-mix(in_oklab,var(--panel)_70%,var(--bg))] py-14 md:py-18" id="demo">
      <div className="mx-auto w-full max-w-[1480px] px-5 md:px-8">
        <div className="mb-7 grid gap-4 md:grid-cols-[minmax(0,.7fr)_minmax(280px,.35fr)] md:items-end" data-scroll-reveal>
          <div>
            <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{landing.videoDemoEyebrow}</p>
            <h2 className="m-0 mt-2 max-w-3xl text-[30px] font-bold leading-tight tracking-[0] md:text-[44px]">{landing.videoDemoTitle}</h2>
          </div>
          <p className="m-0 text-[14px] leading-7 text-muted">{landing.videoDemoBody}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
          {landing.videoDemos.map(([title, body], index) => {
            const asset = assets[index] ?? assets[0];

            return (
              <article className="overflow-hidden rounded-[8px] border border-line bg-surface shadow-[0_20px_70px_rgba(20,20,25,.08)]" data-scroll-reveal key={title}>
                <div className="relative border-b border-line bg-background">
                  <video
                    aria-label={title}
                    autoPlay
                    className="aspect-video w-full object-cover"
                    loop
                    muted
                    playsInline
                    poster={asset.poster}
                    preload="metadata"
                  >
                    <source src={asset.src} type="video/mp4" />
                  </video>
                  <div className="pointer-events-none absolute left-3 top-3 inline-flex size-8 items-center justify-center rounded-[8px] border border-white/28 bg-black/36 text-white shadow-[0_8px_24px_rgba(0,0,0,.18)] backdrop-blur">
                    <Play className="ml-0.5 size-3.5 fill-current" />
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="m-0 text-[17px] font-semibold tracking-[0]">{title}</h3>
                  <p className="m-0 mt-2 text-[13.5px] leading-6 text-muted">{body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
