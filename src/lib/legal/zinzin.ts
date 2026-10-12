/**
 * Textes légaux de l'app Zinzin (mentions légales, confidentialité, conditions).
 * Source unique : affichés dans l'app (zinzin/) ET sur le site (/zinzin/<doc>),
 * dont les URL publiques sont à renseigner dans App Store Connect / Play Console.
 *
 * ⚠️ Version provisoire : les champs entre crochets [À COMPLÉTER] doivent être
 * remplis (identité de l'éditeur, médiateur…) avant la publication sur les stores,
 * puis le tout relu par un professionnel.
 */

export const LEGAL_UPDATED_AT = "12 octobre 2026";

/** Infos éditeur : à compléter une fois le statut juridique créé. */
export const EDITOR = {
  name: "Sofian Zerkouni EI",
  status: "entrepreneur individuel inscrit au Registre national des entreprises",
  address: "8 rue Pastoret, 13006 Marseille, France",
  siret: "SIRET 109 518 910 00012",
  // Hypothèse : micro-entreprise en franchise en base de TVA (à confirmer)
  vat: "TVA non applicable, art. 293 B du CGI",
  email: "contact@zinzin.app",
  director: "Sofian Zerkouni",
  mediator: "[À COMPLÉTER : médiateur de la consommation (nom, site web)]",
};

export type LegalDocId = "mentions-legales" | "confidentialite" | "conditions";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDoc {
  id: LegalDocId;
  title: string;
  intro?: string;
  sections: LegalSection[];
}

const E = EDITOR;

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  "mentions-legales": {
    id: "mentions-legales",
    title: "Mentions légales",
    sections: [
      {
        title: "Éditeur",
        paragraphs: [
          `L'application Zinzin est éditée par ${E.name}, ${E.status}.`,
          `Adresse : ${E.address}. Immatriculation : ${E.siret}. ${E.vat}.`,
          `Contact : ${E.email}.`,
          `Directeur de la publication : ${E.director}.`,
        ],
      },
      {
        title: "Distribution et hébergement",
        paragraphs: [
          "L'application est distribuée par l'App Store d'Apple (Apple Distribution International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Irlande) et par Google Play (Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4, Irlande).",
          "Le contenu de l'application est intégré à l'application elle-même : il n'est pas hébergé sur un serveur.",
          "Les pages web d'information (dont ce document) sont hébergées par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.",
        ],
      },
      {
        title: "Propriété intellectuelle",
        paragraphs: [
          "L'application, son nom, ses personnages (les « blobs »), ses textes, questions, cartes, visuels, sons et son code sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou réutilisation sans autorisation écrite est interdite.",
          "Les mécaniques de certains jeux s'inspirent de jeux de société traditionnels du domaine public. Les noms et contenus de l'application sont originaux ; toute ressemblance avec des marques tierces serait fortuite. Pour toute réclamation : " + E.email + ".",
        ],
      },
      {
        title: "Santé",
        paragraphs: [
          "L'abus d'alcool est dangereux pour la santé, à consommer avec modération. La vente d'alcool est interdite aux mineurs. Ne prends jamais le volant après avoir bu.",
        ],
      },
    ],
  },

  confidentialite: {
    id: "confidentialite",
    title: "Politique de confidentialité",
    intro:
      "Zinzin est conçue pour collecter le moins de données possible : pas de compte, pas de publicité, pas de traceur. Les jeux fonctionnent entièrement sur ton téléphone, sans connexion à nos serveurs.",
    sections: [
      {
        title: "Responsable du traitement",
        paragraphs: [`${E.name}, ${E.address}. Contact : ${E.email}.`],
      },
      {
        title: "Ce qui reste sur ton téléphone (jamais transmis)",
        paragraphs: [
          "Les prénoms que tu saisis pour jouer, la dernière « bande » de joueurs et les prénoms récents (pour te les reproposer), tes réglages (sons, packs choisis…), la confirmation que tu as 18 ans et l'état de ton abonnement.",
          "Ces informations sont enregistrées uniquement dans le stockage local de l'application, sur ton appareil. Nous n'y avons pas accès et elles ne sont envoyées nulle part. Évite d'y saisir autre chose que des prénoms ou surnoms.",
          "Tu peux les effacer à tout moment en supprimant l'application (ou depuis les réglages de l'app quand l'option est disponible).",
        ],
      },
      {
        title: "Achats et abonnement",
        paragraphs: [
          "Les paiements sont traités exclusivement par Apple (App Store) ou Google (Google Play) : nous ne recevons jamais tes coordonnées bancaires, ni ton nom, ni ton adresse e-mail.",
          "Pour savoir si ton abonnement est actif sur tous tes appareils et permettre la restauration des achats, nous utilisons le service RevenueCat (RevenueCat, Inc., États-Unis), sous-traitant au sens du RGPD. Il reçoit : un identifiant anonyme généré par l'application, l'historique des achats Zinzin (produit, date, prix, pays, statut de renouvellement) et des informations techniques sur l'appareil (modèle, version du système et de l'app).",
          "Base légale : l'exécution du contrat d'abonnement (art. 6.1.b du RGPD). Durée : le temps de l'abonnement puis jusqu'à 3 ans, et les durées imposées par les obligations comptables et fiscales.",
          "RevenueCat est situé aux États-Unis : le transfert est encadré par les clauses contractuelles types de la Commission européenne et/ou le cadre de protection des données UE–États-Unis (Data Privacy Framework).",
        ],
      },
      {
        title: "Ce que nous ne faisons pas",
        paragraphs: [
          "Pas de publicité, pas de mesure d'audience, pas de pistage entre applis ou sites (aucune demande « App Tracking Transparency »), pas de revente de données, pas de cookies dans l'application.",
          "L'application n'accède ni à tes contacts, ni à ta position, ni à ton micro, ni à ta caméra. Certains jeux peuvent utiliser le capteur de mouvement du téléphone (ex. « Ne secoue pas la patate ») : la mesure est traitée instantanément sur l'appareil et n'est jamais enregistrée ni transmise. La voix du narrateur est générée par le système de ton téléphone.",
        ],
      },
      {
        title: "Mineurs",
        paragraphs: [
          "Zinzin est réservée aux personnes de 18 ans et plus. Nous ne collectons sciemment aucune donnée concernant des mineurs.",
        ],
      },
      {
        title: "Tes droits",
        paragraphs: [
          "Conformément au RGPD et à la loi Informatique et Libertés, tu disposes d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, ainsi que du droit de définir des directives sur le sort de tes données après ton décès.",
          `Pour les exercer : ${E.email}. Comme nous ne connaissons pas ton identité, indique-nous l'identifiant affiché dans les réglages de l'app (si disponible) ou la date et le type de ton achat.`,
          "Tu peux aussi introduire une réclamation auprès de la CNIL (www.cnil.fr).",
        ],
      },
      {
        title: "Modifications",
        paragraphs: [
          `Cette politique peut évoluer (nouvelles fonctionnalités, obligations légales). La date de mise à jour figure ci-dessous. Dernière mise à jour : ${LEGAL_UPDATED_AT}.`,
        ],
      },
    ],
  },

  conditions: {
    id: "conditions",
    title: "Conditions générales d'utilisation et de vente",
    sections: [
      {
        title: "1. Objet",
        paragraphs: [
          `Les présentes conditions encadrent l'utilisation de l'application Zinzin, éditée par ${E.name} (« nous »), et l'achat de l'abonnement Zinzin Premium. En utilisant l'application, tu les acceptes. Elles complètent les conditions de l'App Store ou de Google Play (pour Apple : le contrat de licence d'utilisation standard de l'utilisateur final, « EULA »).`,
        ],
      },
      {
        title: "2. Accès réservé aux adultes",
        paragraphs: [
          "Zinzin est réservée aux personnes majeures (18 ans et plus). Certains jeux contiennent des références à l'alcool et des contenus coquins (non explicites), signalés « 18+ ». En confirmant ton âge à l'ouverture, tu certifies être majeur.",
        ],
      },
      {
        title: "3. Le service",
        paragraphs: [
          "Zinzin propose des jeux d'ambiance qui se jouent à plusieurs sur un seul téléphone, sans connexion. Certains jeux sont gratuits ; les autres, les contenus 18+ et les nouveautés sont accessibles avec l'abonnement Zinzin Premium. Le catalogue peut évoluer (ajout, modification ou retrait de jeux).",
        ],
      },
      {
        title: "4. Abonnement Zinzin Premium",
        paragraphs: [
          "Formules proposées (prix TTC affichés dans l'application au moment de l'achat, susceptibles de varier selon le pays) : Pass soirée (7 jours), Mensuel, Annuel.",
          "Le paiement est prélevé sur ton compte Apple ou Google à la confirmation de l'achat. L'abonnement se renouvelle automatiquement pour la même durée, sauf résiliation au moins 24 heures avant la fin de la période en cours.",
          "Tu peux gérer ou résilier ton abonnement à tout moment depuis les réglages de ton compte Apple (Réglages › ton nom › Abonnements) ou Google Play (Paiements et abonnements). La résiliation prend effet à la fin de la période en cours ; la période entamée n'est pas remboursée, sauf décision d'Apple ou de Google.",
          "Les remboursements sont gérés par Apple (reportaproblem.apple.com) ou Google selon leurs propres règles.",
        ],
      },
      {
        title: "5. Droit de rétractation",
        paragraphs: [
          "L'abonnement donne accès immédiatement à un contenu numérique. En validant l'achat, tu demandes l'exécution immédiate du service et tu reconnais renoncer à ton droit de rétractation de 14 jours, conformément à l'article L221-28 13° du Code de la consommation.",
        ],
      },
      {
        title: "6. Jouer de façon responsable",
        paragraphs: [
          "Les « gorgées » proposées par certains jeux sont toujours facultatives : elles peuvent être remplacées par un gage, et se jouer avec de l'eau ou une boisson sans alcool. Personne n'est obligé de boire. L'abus d'alcool est dangereux pour la santé : à consommer avec modération. Ne conduis jamais après avoir bu.",
          "Les défis et gages doivent rester dans le respect de chacun : tout participant peut refuser un défi. Ne réalise jamais un défi dangereux, illégal ou qui met mal à l'aise quelqu'un. Chaque joueur reste responsable de ses actes et de sa consommation.",
          "Certains jeux (ex. « La Patate ») invitent à se passer le téléphone : fais-le avec précaution. Nous ne pouvons être tenus responsables de la casse d'un appareil.",
        ],
      },
      {
        title: "7. Responsabilité",
        paragraphs: [
          "L'application est fournie en l'état. Nous faisons notre possible pour qu'elle fonctionne correctement mais ne garantissons pas l'absence de bug. Notre responsabilité ne peut être engagée pour les dommages résultant d'une utilisation non conforme aux présentes conditions, ni pour le comportement des joueurs.",
          "Ces conditions ne limitent pas les droits que tu tiens des dispositions légales impératives applicables aux consommateurs, notamment la garantie légale de conformité des contenus numériques (articles L224-25-1 et suivants du Code de la consommation).",
        ],
      },
      {
        title: "8. Propriété intellectuelle",
        paragraphs: [
          "Nous t'accordons une licence personnelle, non exclusive et non transférable d'utilisation de l'application, à des fins privées et non commerciales. Il est interdit de copier, extraire ou revendre ses contenus (questions, cartes, personnages, sons, code).",
        ],
      },
      {
        title: "9. Données personnelles",
        paragraphs: ["Voir notre politique de confidentialité, accessible dans l'application et sur notre site."],
      },
      {
        title: "10. Litiges et médiation",
        paragraphs: [
          `Pour toute question ou réclamation : ${E.email}. En cas de litige non résolu, tu peux recourir gratuitement au médiateur de la consommation : ${E.mediator}.`,
          "Les présentes conditions sont soumises au droit français. À défaut d'accord amiable, les tribunaux compétents sont ceux prévus par la loi.",
        ],
      },
      {
        title: "11. Modifications",
        paragraphs: [`Nous pouvons faire évoluer ces conditions ; la version en vigueur est celle affichée dans l'application. Dernière mise à jour : ${LEGAL_UPDATED_AT}.`],
      },
    ],
  },
};
