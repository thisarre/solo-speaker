import { getLocaleFromParams, type LocaleParams } from "@/i18n/server";
import { localizedPath, locales } from "@/i18n/routing";
import { LegalPage } from "@/modules/landing/components/legal-page";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: LocaleParams }) {
  await getLocaleFromParams(params);
  return { title: "Conditions générales de vente · Solo Speaker Studio" };
}

export default async function CgvPage({ params }: { params: LocaleParams }) {
  const locale = await getLocaleFromParams(params);
  const pricingHref = `${localizedPath("/", locale)}#pricing-preview`;

  return (
    <LegalPage locale={locale} title="Conditions générales de vente" updatedLabel="Dernière mise à jour : [date à compléter]">
      <div className="legal-note">
        <strong>À compléter et à faire valider.</strong> Ce modèle s’appuie sur le Code de la consommation et le Code civil français. Remplacez les champs entre crochets [ ] et faites-le relire par un professionnel du droit avant publication. Pour les ventes aux consommateurs (B2C), la désignation d’un médiateur de la consommation (article L612-1) est obligatoire.
      </div>

      <h2>Article 1 : Objet et champ d’application</h2>
      <p>
        Les présentes conditions générales de vente (« CGV ») régissent la souscription et l’utilisation du service en ligne <strong>Solo Speaker Studio</strong> (le « Service »), édité par <strong>Madebysarre</strong> (l’« Éditeur »), dont les coordonnées figurent dans les <a href={localizedPath("/mentions-legales", locale)}>mentions légales</a>. Toute souscription emporte acceptation pleine et entière des présentes CGV.
      </p>

      <h2>Article 2 : Définitions</h2>
      <ul>
        <li><strong>Client</strong> : toute personne physique ou morale souscrivant à un abonnement.</li>
        <li><strong>Consommateur</strong> : tout Client personne physique agissant à des fins n’entrant pas dans le cadre de son activité professionnelle.</li>
        <li><strong>Abonnement</strong> : formule payante mensuelle ou annuelle donnant accès au Service.</li>
        <li><strong>Compte</strong> : espace personnel du Client, accessible par identifiant et mot de passe.</li>
      </ul>

      <h2>Article 3 : Description du Service</h2>
      <p>
        Le Service propose des outils d’aide à la préparation, à la répétition et à la présentation de prises de parole : structuration en sections, assistance par intelligence artificielle, réécriture orale, mémos vocaux, mode prompteur, estimation de durée et export PDF. Les formules disponibles (Essai, Studio, Équipe) et leurs caractéristiques sont décrites sur la <a href={pricingHref}>page Tarifs</a>.
      </p>

      <h2>Article 4 : Compte et accès</h2>
      <p>
        L’accès au Service nécessite la création d’un Compte. Le Client garantit l’exactitude des informations fournies et est responsable de la confidentialité de ses identifiants ainsi que de toute activité réalisée depuis son Compte.
      </p>

      <h2>Article 5 : Prix</h2>
      <p>
        Les prix en vigueur sont indiqués sur la <a href={pricingHref}>page Tarifs</a>, en euros. [Préciser : prix hors taxes ou toutes taxes comprises, et le régime de TVA applicable.] L’Éditeur se réserve le droit de modifier ses prix ; le tarif applicable est celui en vigueur au jour de la souscription ou du renouvellement.
      </p>

      <h2>Article 6 : Commande et paiement</h2>
      <p>
        Le paiement s’effectue par carte bancaire via notre prestataire de paiement sécurisé <strong>Stripe</strong>. Aucune coordonnée bancaire complète n’est conservée par l’Éditeur. La commande est définitive après confirmation du paiement.
      </p>

      <h2>Article 7 : Durée, reconduction et résiliation</h2>
      <p>
        L’Abonnement est souscrit pour la période choisie (mensuelle ou annuelle) et se reconduit tacitement pour des périodes successives de même durée, sauf résiliation. Le Client peut résilier à tout moment depuis son espace ou en écrivant à [adresse e-mail] ; la résiliation prend effet à la fin de la période en cours, sans remboursement de la période entamée, sauf disposition légale impérative contraire. Conformément à l’article L215-1 du Code de la consommation, l’Éditeur informe le Client de la possibilité de ne pas reconduire l’Abonnement.
      </p>

      <h2>Article 8 : Essai gratuit</h2>
      <p>
        Le Service peut être proposé avec un essai gratuit limité à un nombre défini de prises de parole, sans limite de durée et sans carte bancaire, dans les limites décrites sur la page Tarifs. À l’issue de l’essai, l’accès aux fonctionnalités payantes nécessite la souscription d’un Abonnement.
      </p>

      <h2>Article 9 : Droit de rétractation</h2>
      <p>
        Conformément à l’article L221-18 du Code de la consommation, le Consommateur dispose d’un délai de 14 jours pour exercer son droit de rétractation, à compter de la conclusion du contrat, sans avoir à motiver sa décision.
      </p>
      <p>
        Toutefois, en application de l’article L221-28, 13° du Code de la consommation, le Consommateur reconnaît que la fourniture d’un contenu ou service numérique commence immédiatement après la souscription, avec son accord exprès et préalable et sa renonciation expresse à son droit de rétractation. [Mettre en place, lors de la souscription, une case à cocher recueillant ce consentement et cette renonciation.] À défaut, la rétractation peut être exercée à [adresse e-mail].
      </p>

      <h2>Article 10 : Obligations du Client</h2>
      <p>
        Le Client s’engage à utiliser le Service conformément à la loi et aux présentes CGV, à ne pas en perturber le fonctionnement, et à ne pas y publier de contenu illicite. L’Éditeur peut suspendre l’accès en cas de manquement grave.
      </p>

      <h2>Article 11 : Disponibilité et maintenance</h2>
      <p>
        L’Éditeur s’efforce d’assurer la disponibilité du Service mais ne saurait être tenu responsable des interruptions liées à la maintenance, à des cas de force majeure ou aux prestataires tiers. Le Service est fourni « en l’état ».
      </p>

      <h2>Article 12 : Responsabilité</h2>
      <p>
        Le Service est un outil d’aide ; le Client demeure seul responsable du contenu qu’il produit et de l’usage qu’il en fait. Dans les limites permises par la loi, la responsabilité de l’Éditeur est limitée aux dommages directs et plafonnée au montant payé par le Client au cours des douze derniers mois. Aucune disposition ne limite la responsabilité de l’Éditeur en cas de faute lourde, de dol ou d’atteinte aux droits du Consommateur garantis par la loi.
      </p>

      <h2>Article 13 : Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la [Politique de confidentialité], conformément au RGPD.
      </p>

      <h2>Article 14 : Propriété intellectuelle</h2>
      <p>
        L’Éditeur concède au Client un droit d’usage personnel, non exclusif et non cessible du Service pendant la durée de l’Abonnement. Les contenus créés par le Client lui appartiennent.
      </p>

      <h2>Article 15 : Réclamation et médiation de la consommation</h2>
      <p>
        Pour toute réclamation, le Client peut contacter [adresse e-mail]. Conformément aux articles L612-1 et suivants du Code de la consommation, le Consommateur peut recourir gratuitement à un médiateur de la consommation : [nom et coordonnées du médiateur à désigner]. Le Consommateur peut également utiliser la plateforme européenne de règlement en ligne des litiges (ec.europa.eu/consumers/odr).
      </p>

      <h2>Article 16 : Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont régies par le droit français. À défaut de résolution amiable, les litiges relèvent des juridictions compétentes dans les conditions prévues par la loi.
      </p>

      <h2>Article 17 : Modification des CGV</h2>
      <p>
        L’Éditeur peut modifier les présentes CGV ; la version applicable est celle en vigueur à la date de la souscription ou du renouvellement. Les Clients sont informés de toute modification substantielle.
      </p>
    </LegalPage>
  );
}
