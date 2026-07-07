import Image from "next/image";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/messages";
import { defaultLocale } from "@/i18n/routing";
import { getLogoAssets } from "./logo-assets";

export function Logo({ compact = false, iconOnly = false, label = getMessages(defaultLocale).common.brandShort }: { compact?: boolean; iconOnly?: boolean; label?: string }) {
  const assets = getLogoAssets();

  return (
    <div
      className={cn(
        "solo-logo relative block shrink-0 overflow-hidden",
        iconOnly ? "size-8" : compact ? "size-8 lg:h-9 lg:w-[132px]" : "h-9 w-[132px] sm:w-[148px]"
      )}
      data-compact={compact && !iconOnly ? "true" : undefined}
      data-icon-only={iconOnly ? "true" : undefined}
      title={label}
    >
      <Image
        alt={label}
        className="solo-logo-icon size-full object-contain object-left"
        height={64}
        src={assets.favicon}
        width={64}
      />
      <Image
        alt={label}
        className="solo-logo-full solo-logo-full-light size-full object-contain object-left"
        height={120}
        src={assets.lightLogo}
        width={360}
      />
      <Image
        alt={label}
        className="solo-logo-full solo-logo-full-dark size-full object-contain object-left"
        height={120}
        src={assets.darkLogo}
        width={360}
      />
    </div>
  );
}
