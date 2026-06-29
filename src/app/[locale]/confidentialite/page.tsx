import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";
import { localizedPath, locales } from "@/i18n/routing";
import { LegalPage } from "@/modules/landing/components/legal-page";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: LocaleParams }) {
  await getLocaleFromParams(params);
  return { title: "Politique de confidentialité · Solo Speaker Studio" };
}

export default async function ConfidentialitePage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);

  return (
    <LegalPage locale={locale} title="Politique de confidentialité" updatedLabel="Dernière mise à jour : [date à compléter]">
      <div className="legal-note">
        <strong>À compléter et à faire valider.</strong> Ce modèle est conforme au RGPD (Règlement UE 2016/679) et à la loi « Informatique et Libertés ». Remplacez les champs entre crochets [ ] (durées de conservation, e-mail de contact, éventuel DPO) et faites-le relire par un professionnel du droit avant publication.
      </div>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est <strong>Madebysarre</strong>, éditeur de <strong>Solo Speaker Studio</strong> (coordonnées dans les <a href={localizedPath("/mentions-legales", locale)}>mentions légales</a>). Contact pour toute question relative aux données : [adresse e-mail]. [Le cas échéant, coordonnées du délégué à la protection des données (DPO).]
      </p>

      <h2>2. Données que nous collectons</h2>
      <ul>
        <li><strong>Compte</strong> : nom, adresse e-mail, mot de passe (stocké de façon chiffrée par notre prestataire d’authentification), préférences, rôle et type de prise de parole.</li>
        <li><strong>Contenus créés</strong> : prises de parole, sections, notes, et mémos vocaux (fichiers audio) que vous enregistrez.</li>
        <li><strong>Données d’usage de l’IA</strong> : textes envoyés à l’assistant et compteur d’utilisation (crédits).</li>
        <li><strong>Données de paiement</strong> : gérées par Stripe. Nous ne stockons pas vos numéros de carte ; nous conservons un identifiant client et le statut d’abonnement.</li>
        <li><strong>Données techniques et de mesure d’audience</strong> : pages vues, événements d’usage, type d’appareil, via PostHog (hébergé dans l’Union européenne).</li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>Fournir et faire fonctionner le service, gérer votre compte : <strong>exécution du contrat</strong> (art. 6.1.b).</li>
        <li>Traiter les paiements et abonnements : <strong>exécution du contrat</strong> et <strong>obligation légale</strong> (comptabilité).</li>
        <li>Améliorer le service, mesurer l’audience, prévenir les abus : <strong>intérêt légitime</strong> (art. 6.1.f).</li>
        <li>Transcription vocale et génération assistée par IA, à votre initiative : <strong>exécution du contrat</strong>.</li>
        <li>Communications et cookies non essentiels : <strong>consentement</strong> (art. 6.1.a), lorsqu’il est requis.</li>
      </ul>

      <h2>4. Sous-traitants et destinataires</h2>
      <p>Nous faisons appel à des prestataires (sous-traitants au sens du RGPD) qui n’accèdent à vos données que pour fournir leurs services :</p>
      <ul>
        <li><strong>Supabase</strong> : base de données, authentification, stockage (hébergement UE).</li>
        <li><strong>Vercel</strong> : hébergement de l’application (États-Unis).</li>
        <li><strong>OpenAI</strong> : assistant d’écriture et transcription (États-Unis).</li>
        <li><strong>Deepgram</strong> : transcription vocale en temps réel.</li>
        <li><strong>ElevenLabs</strong> : synthèse vocale (États-Unis).</li>
        <li><strong>Stripe</strong> : traitement des paiements.</li>
        <li><strong>PostHog</strong> : mesure d’audience (hébergement UE).</li>
      </ul>
      <p>Nous ne vendons pas vos données personnelles.</p>

      <h2>5. Transferts hors Union européenne</h2>
      <p>
        Certains prestataires sont situés hors de l’UE (notamment aux États-Unis). Ces transferts sont encadrés par des garanties appropriées : clauses contractuelles types de la Commission européenne et/ou adhésion au cadre <em>EU-U.S. Data Privacy Framework</em>, selon le prestataire.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li>Données de compte et contenus : pendant la durée de votre compte, puis supprimées sous [délai à préciser] après sa fermeture.</li>
        <li>Données de facturation : conservées [10 ans] au titre des obligations comptables.</li>
        <li>Données de mesure d’audience : [délai à préciser].</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, ainsi que du droit de définir des directives relatives au sort de vos données après votre décès. Vous pouvez exercer ces droits à [adresse e-mail]. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement des mots de passe, cloisonnement des accès par utilisateur, hébergement de la base dans l’UE) pour protéger vos données contre tout accès non autorisé.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Nous utilisons des cookies strictement nécessaires (authentification, sécurité) et des cookies de mesure d’audience. [Décrivez ici votre dispositif de recueil du consentement pour les cookies non essentiels.]
      </p>

      <h2>10. Mineurs</h2>
      <p>Le service n’est pas destiné aux personnes de moins de 15 ans sans le consentement du titulaire de l’autorité parentale.</p>

      <h2>11. Modifications</h2>
      <p>Nous pouvons mettre à jour la présente politique. La version applicable est celle publiée à la date de votre consultation ; les modifications substantielles vous seront signalées.</p>

      <h2>12. Contact</h2>
      <p>Pour toute question relative à vos données : [adresse e-mail].</p>
    </LegalPage>
  );
}
