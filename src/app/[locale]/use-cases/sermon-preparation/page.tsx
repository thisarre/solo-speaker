import { buildSeoPageMetadata, SeoPageRoute } from "@/modules/landing/seo-page-route";
import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props) {
  return buildSeoPageMetadata(await getLocaleFromParams(params), "sermon-preparation");
}

export default async function LocalizedSermonPreparationPage({ params }: Props) {
  return <SeoPageRoute locale={await getLocaleFromParams(params)} pageKey="sermon-preparation" />;
}
