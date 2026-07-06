import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getMessages } from "@/i18n/messages";
import { localizedPath, type Locale } from "@/i18n/routing";

export function LandingFooter({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const { common, footer, navigation } = messages;
  const home = localizedPath("/", locale);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-12 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] md:px-8">
        <div>
          <Link aria-label={common.appName} href={home}>
            <Logo />
          </Link>
          <p className="m-0 mt-4 max-w-xs text-[13.5px] leading-6 text-muted">{footer.tagline}</p>
        </div>

        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{footer.features}</p>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[13.5px] text-muted">
            <li><Link className="transition hover:text-foreground" href={localizedPath("/features/ai-speech-writer", locale)}>{footer.aiSpeechWriter}</Link></li>
            <li><Link className="transition hover:text-foreground" href={localizedPath("/features/teleprompter-mode", locale)}>{footer.teleprompterMode}</Link></li>
          </ul>
        </div>

        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{footer.useCases}</p>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[13.5px] text-muted">
            <li><Link className="transition hover:text-foreground" href={localizedPath("/use-cases/public-speaking", locale)}>{footer.publicSpeaking}</Link></li>
            <li><Link className="transition hover:text-foreground" href={localizedPath("/use-cases/sermon-preparation", locale)}>{footer.sermonPreparation}</Link></li>
            <li><Link className="transition hover:text-foreground" href={localizedPath("/use-cases/training-presentations", locale)}>{footer.trainingPresentations}</Link></li>
          </ul>
        </div>

        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{footer.product}</p>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[13.5px] text-muted">
            <li><a className="transition hover:text-foreground" href={`${home}#features`}>{navigation.features}</a></li>
            <li><a className="transition hover:text-foreground" href={`${home}#use-cases`}>{navigation.useCases}</a></li>
            <li><a className="transition hover:text-foreground" href={`${home}#pricing-preview`}>{navigation.pricing}</a></li>
          </ul>
        </div>

        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{footer.legal}</p>
          <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[13.5px] text-muted">
            <li><Link className="transition hover:text-foreground" href={localizedPath("/mentions-legales", locale)}>{footer.legalNotice}</Link></li>
            <li><Link className="transition hover:text-foreground" href={localizedPath("/cgv", locale)}>{footer.terms}</Link></li>
            <li><Link className="transition hover:text-foreground" href={localizedPath("/confidentialite", locale)}>{footer.privacy}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-2 px-5 py-5 text-[12.5px] text-faint md:flex-row md:items-center md:justify-between md:px-8">
          <span>© {year} Madebysarre. {footer.rights}</span>
          <span className="flex items-center gap-3">
            <span>{footer.poweredByAi}</span>
            <span>{common.appName}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
