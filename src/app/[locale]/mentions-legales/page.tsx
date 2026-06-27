import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";
import { locales } from "@/i18n/routing";
import { LegalPage } from "@/modules/landing/components/legal-page";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: LocaleParams }) {
  await getLocaleFromParams(params);
  return { title: "Mentions légales — Solo Speaker Studio" };
}

export default async function MentionsLegalesPage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);

  return (
    <LegalPage locale={locale} title="Mentions légales" updatedLabel="Dernière mise à jour : [date à compléter]">
      <div className="legal-note">
        <strong>À compléter et à faire valider.</strong> Ce document est un modèle conforme au droit français (loi n° 2004-575 du 21 juin 2004, dite LCEN). Remplacez les champs entre crochets [ ] par vos informations réelles et faites-le relire par un professionnel du droit avant publication.
      </div>

      <h2>1. Éditeur</h2>
      <p>
        Le site et l’application <strong>Solo Speaker Studio</strong> sont édités par <strong>Madebysarre</strong>,
        [forme juridique — par exemple : entreprise individuelle / micro-entreprise / SASU], représentée par [nom et prénom du représentant légal].
      </p>
      <ul>
        <li>Adresse du siège : [adresse postale complète]</li>
        <li>SIREN / SIRET : [numéro]</li>
        <li>[Si société] Capital social : [montant] € — immatriculée au RCS de [ville] sous le numéro [numéro]. [Si micro-entreprise] Dispensée d’immatriculation au registre du commerce et des sociétés (RCS) et au répertoire des métiers (RM).</li>
        <li>Numéro de TVA intracommunautaire : [numéro] — ou, le cas échéant, « TVA non applicable, article 293 B du CGI ».</li>
        <li>Contact : [adresse e-mail] — [numéro de téléphone]</li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>Le directeur de la publication est [nom et prénom du responsable].</p>

      <h2>3. Hébergement</h2>
      <p>Le service est hébergé par les prestataires suivants [à confirmer selon votre configuration réelle] :</p>
      <ul>
        <li><strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — vercel.com.</li>
        <li><strong>Supabase, Inc.</strong> (base de données, authentification, stockage) — supabase.com — hébergement des données dans l’Union européenne (région eu-west-1).</li>
      </ul>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        La marque, le logo, l’interface, les textes et le code du service sont la propriété exclusive de Madebysarre et sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est interdite. Les contenus que vous créez (prises de parole, notes, mémos) demeurent votre propriété.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Les traitements de données à caractère personnel réalisés via le service sont décrits dans la [Politique de confidentialité]. Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi « Informatique et Libertés », vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données, que vous pouvez exercer à [adresse e-mail]. Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).
      </p>

      <h2>6. Cookies et mesure d’audience</h2>
      <p>
        Le service utilise des cookies strictement nécessaires à son fonctionnement (notamment l’authentification) ainsi que des outils de mesure d’audience [PostHog]. [Décrivez ici votre dispositif de consentement aux cookies non essentiels, le cas échéant.]
      </p>

      <h2>7. Droit applicable</h2>
      <p>Les présentes mentions légales sont régies par le droit français. Pour toute question, écrivez à [adresse e-mail].</p>
    </LegalPage>
  );
}
