import Image from "next/image";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/messages";
import { defaultLocale } from "@/i18n/routing";
import { getLogoAssets } from "./logo-assets";

export function Logo({ compact = false, label = getMessages(defaultLocale).common.brandShort }: { compact?: boolean; label?: string }) {
  const assets = getLogoAssets();

  return (
    <div
      aria-label={label}
      className={cn(
        "solo-logo relative block shrink-0 overflow-hidden",
        compact ? "size-8 lg:h-9 lg:w-[132px]" : "h-9 w-[132px] sm:w-[148px]"
      )}
      data-compact={compact ? "true" : undefined}
      role="img"
      title={label}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="solo-logo-icon size-full object-contain object-left"
        height={64}
        src={assets.favicon}
        width={64}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="solo-logo-full solo-logo-full-light size-full object-contain object-left"
        height={120}
        src={assets.lightLogo}
        width={360}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="solo-logo-full solo-logo-full-dark size-full object-contain object-left"
        height={120}
        src={assets.darkLogo}
        width={360}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
