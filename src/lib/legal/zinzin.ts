/**
 * Textes légaux de l'app Zinzin (mentions légales, confidentialité, conditions).
 * Source unique : affichés dans l'app (zinzin/) ET sur le site (/zinzin/<doc>),
 * dont les URL publiques sont à renseigner dans App Store Connect / Play Console.
 * Le site affiche toujours LEGAL_DOCS (français) ; l'app affiche getLegalDocs(langue).
 * Les versions EN / ES sont des traductions de confort : la version française fait foi.
 *
 * ⚠️ Version provisoire : à faire relire par un professionnel avant la publication.
 * Reste à faire : désigner un médiateur de la consommation (EDITOR.mediator).
 */

import type { I18n, Lang } from "@/lib/i18n";

export const LEGAL_UPDATED_AT = "14 octobre 2026";

/** Date de mise à jour, écrite dans chaque langue. */
export const LEGAL_UPDATED_AT_I18N: I18n<string> = {
  fr: LEGAL_UPDATED_AT,
  en: "October 14, 2026",
  es: "14 de octubre de 2026",
};

export function getLegalUpdatedAt(lang: Lang): string {
  return LEGAL_UPDATED_AT_I18N[lang] ?? LEGAL_UPDATED_AT;
}

/** Infos éditeur : à compléter une fois le statut juridique créé. */
export const EDITOR = {
  name: "Sofian Zerkouni EI",
  status: "entrepreneur individuel (nom commercial : Safiri), immatriculé au RCS de Marseille sous le n° 109 518 910",
  address: "8 rue Pastoret, 13006 Marseille, France",
  siret: "SIRET 109 518 910 00012",
  // Hypothèse : micro-entreprise en franchise en base de TVA (à confirmer)
  vat: "TVA non applicable, art. 293 B du CGI",
  email: "contact@zinzin-app.com",
  director: "Sofian Zerkouni",
  /** Médiateur de la consommation : vide tant qu'aucun n'est désigné (la clause s'adapte). */
  mediator: "",
};

/** Adresse qui reçoit les idées des joueurs (bouton « Propose ton idée » des jeux). */
export const IDEAS_EMAIL = EDITOR.email;

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
          "Le bouton « Partager mon résultat » crée une image (prénoms et scores affichés à l'écran) sur ton téléphone ; elle ne part que vers l'appli que tu choisis dans la feuille de partage, jamais vers nous.",
          "Les sons de tes persos (« Ma bande ») : si tu choisis d'en enregistrer un, le micro n'est utilisé que pendant que tu maintiens le bouton, après ton autorisation. Chaque enregistrement (5 secondes maximum) reste dans le stockage de l'application, sur ton téléphone. Il ne quitte ton téléphone que si tu envoies toi-même ta bande (bouton « Envoyer ma bande »), sous forme de fichier, par l'appli et au destinataire que tu choisis dans la feuille de partage. Rien n'est envoyé automatiquement : Zinzin ne reçoit aucun enregistrement et n'y a pas accès.",
          "Une bande reçue (fichier « .zinzin ») n'est lue que sur ton téléphone, quand tu l'ouvres ; elle n'est ajoutée à ta bande que si tu le choisis, avec la mention de son expéditeur. Tu peux couper ses voix ou supprimer ses persos à tout moment.",
          "Tu peux tout effacer à tout moment : un son ou un perso depuis « Ma bande », ou toutes tes données avec « Effacer mes données » dans les réglages de l'app (ou en supprimant l'application).",
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
          "Si tu nous proposes une idée (bouton « Propose ton idée ») ou nous écris, le message part depuis ton application mail : nous recevons alors ton adresse e-mail et ton message, utilisés uniquement pour te lire et te répondre, puis supprimés au plus tard 3 ans après le dernier échange. Base légale : notre intérêt légitime à améliorer l'app. Les idées retenues peuvent être intégrées au jeu, sans mention de ton nom.",
          "L'application n'accède ni à tes contacts, ni à ta position, ni à ta caméra. Certains jeux utilisent les capteurs de mouvement du téléphone (ex. « Le Verre Invisible », « Ne secoue pas la patate ») : la mesure est traitée instantanément sur l'appareil et n'est jamais enregistrée ni transmise. Le jeu « Chut ! » utilise le micro, uniquement pendant une manche et après ton autorisation, pour mesurer le niveau sonore en direct : aucun son n'est enregistré, conservé ni envoyé, et tu peux jouer sans micro (arbitre humain). En dehors de ce jeu, le micro ne sert qu'à enregistrer le son de tes persos, uniquement quand tu le demandes (voir plus haut). La voix du narrateur est générée par le système de ton téléphone.",
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
          `Les présentes conditions encadrent l'utilisation de l'application Zinzin, éditée par ${E.name} (« nous »), et l'achat de l'abonnement Zinzin+. En utilisant l'application, tu les acceptes. Elles complètent les conditions de l'App Store ou de Google Play (pour Apple : le contrat de licence d'utilisation standard de l'utilisateur final, « EULA »).`,
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
          "Zinzin propose des jeux d'ambiance qui se jouent à plusieurs sur un seul téléphone, sans connexion. Certains jeux sont jouables gratuitement, dans une version découverte au contenu limité ; les autres jeux, l'intégralité des contenus (dont les contenus 18+) et les nouveautés sont accessibles avec l'abonnement Zinzin+. Le catalogue peut évoluer (ajout, modification ou retrait de jeux).",
        ],
      },
      {
        title: "4. Abonnement Zinzin+",
        paragraphs: [
          "Formules proposées (prix TTC affichés dans l'application au moment de l'achat, susceptibles de varier selon le pays) : Pass soirée (7 jours), Mensuel, Annuel.",
          "Essai gratuit : la formule Annuel peut être proposée avec un essai gratuit de 3 jours, réservé aux personnes qui n'en ont pas déjà bénéficié (éligibilité vérifiée par Apple ou Google). Rien n'est prélevé pendant l'essai ; à son terme, il se convertit automatiquement en abonnement annuel payant au prix affiché, sauf résiliation au moins 24 heures avant la fin de l'essai. Si tu résilies pendant l'essai, tu gardes l'accès jusqu'à sa fin et rien ne t'est facturé.",
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
          "Sons et bandes partagés : tu es seul responsable de ce que tu enregistres et de ce que tu envoies. N'enregistre et ne partage la voix de personne sans son accord, et rien d'injurieux, de haineux, de harcelant, d'obscène ou d'illégal ; respecte les autres. Une bande reçue affiche son expéditeur : tu peux couper ses voix ou la supprimer à tout moment. Zinzin n'héberge ni ne transmet aucun de ces contenus.",
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
          "Les achats sont encaissés par Apple (App Store) ou Google (Google Play) : toute demande liée au paiement ou au remboursement se fait d'abord auprès d'eux (reportaproblem.apple.com, ou Google Play › Paiements et abonnements).",
          `Pour toute autre question ou réclamation sur l'application : ${E.email}. Nous nous engageons à répondre sous 15 jours et à rechercher une solution amiable.`,
          ...(E.mediator
            ? [`En cas de litige non résolu, tu peux recourir gratuitement au médiateur de la consommation : ${E.mediator}.`]
            : []),
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

/* ───────── Traductions (confort) : la version française fait foi ───────── */

/** Mentions éditeur traduites (le reste d'EDITOR ne dépend pas de la langue). */
const EDITOR_TR: Record<"en" | "es", { status: string; vat: string }> = {
  en: {
    status: "sole trader (trade name: Safiri), registered with the Marseille Trade and Companies Register (RCS) under no. 109 518 910",
    vat: "VAT not applicable, article 293 B of the French General Tax Code (CGI)",
  },
  es: {
    status: "empresario individual (nombre comercial: Safiri), inscrito en el Registro Mercantil (RCS) de Marsella con el n.º 109 518 910",
    vat: "IVA no aplicable, artículo 293 B del Código General de Impuestos francés (CGI)",
  },
};

const PREVAILS: I18n<string> = {
  fr: "",
  en: "This translation is provided for convenience; the French version prevails.",
  es: "Esta traducción se ofrece a título informativo; prevalece la versión francesa.",
};

const DOCS_EN: Record<LegalDocId, LegalDoc> = {
  "mentions-legales": {
    id: "mentions-legales",
    title: "Legal notice",
    intro: PREVAILS.en,
    sections: [
      {
        title: "Publisher",
        paragraphs: [
          `The Zinzin app is published by ${E.name}, ${EDITOR_TR.en.status}.`,
          `Address: ${E.address}. Registration: ${E.siret}. ${EDITOR_TR.en.vat}.`,
          `Contact: ${E.email}.`,
          `Publication director: ${E.director}.`,
        ],
      },
      {
        title: "Distribution and hosting",
        paragraphs: [
          "The app is distributed through Apple's App Store (Apple Distribution International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Ireland) and Google Play (Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4, Ireland).",
          "The app's content is built into the app itself: it is not hosted on a server.",
          "The informational web pages (including this document) are hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States.",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "The app, its name, its characters (the \"blobs\"), its texts, questions, cards, visuals, sounds and code are protected by intellectual property law. Any reproduction or reuse without written permission is prohibited.",
          "The mechanics of some games are inspired by traditional public-domain party games. The app's names and content are original; any resemblance to third-party trademarks is coincidental. For any claim: " + E.email + ".",
        ],
      },
      {
        title: "Health",
        paragraphs: [
          "Alcohol abuse is dangerous for your health: drink in moderation. The sale of alcohol to minors is prohibited. Never drive after drinking.",
        ],
      },
    ],
  },

  confidentialite: {
    id: "confidentialite",
    title: "Privacy policy",
    intro:
      PREVAILS.en + " Zinzin is designed to collect as little data as possible: no account, no ads, no trackers. The games run entirely on your phone, without connecting to our servers.",
    sections: [
      {
        title: "Data controller",
        paragraphs: [`${E.name}, ${E.address}. Contact: ${E.email}.`],
      },
      {
        title: "What stays on your phone (never sent)",
        paragraphs: [
          "The names you enter to play, your last \"crew\" of players and recent names (so we can suggest them again), your settings (sounds, chosen packs, language…), the confirmation that you are 18 or older and your subscription status.",
          "This information is stored only in the app's local storage, on your device. We have no access to it and it is not sent anywhere. Please don't enter anything other than first names or nicknames.",
          "The \"Share my result\" button creates an image (names and scores shown on screen) on your phone; it only goes to the app you pick in the share sheet, never to us.",
          "Your characters' sounds (\"My crew\"): if you choose to record one, the microphone is only used while you hold the button, after you allow it. Each recording (5 seconds maximum) stays in the app's storage, on your phone. It only leaves your phone if you send your crew yourself (\"Send my crew\" button), as a file, through the app and to the person you pick in the share sheet. Nothing is sent automatically: Zinzin receives no recordings and has no access to them.",
          "A crew you receive (a \".zinzin\" file) is only read on your phone, when you open it; it is only added to your crew if you choose so, showing who sent it. You can mute its voices or delete its characters at any time.",
          "You can erase everything at any time: a sound or a character from \"My crew\", or all your data with \"Erase my data\" in the app's settings (or by deleting the app).",
        ],
      },
      {
        title: "Purchases and subscription",
        paragraphs: [
          "Payments are handled exclusively by Apple (App Store) or Google (Google Play): we never receive your bank details, your name or your email address.",
          "To check whether your subscription is active on all your devices and to allow purchases to be restored, we use the RevenueCat service (RevenueCat, Inc., United States), a processor within the meaning of the GDPR. It receives: an anonymous identifier generated by the app, your Zinzin purchase history (product, date, price, country, renewal status) and technical information about the device (model, operating system and app version).",
          "Legal basis: performance of the subscription contract (art. 6.1.b GDPR). Retention: for the duration of the subscription and then up to 3 years, plus any periods required by accounting and tax obligations.",
          "RevenueCat is located in the United States: the transfer is governed by the European Commission's standard contractual clauses and/or the EU–US Data Privacy Framework.",
        ],
      },
      {
        title: "What we don't do",
        paragraphs: [
          "No advertising, no audience measurement, no tracking across apps or websites (no \"App Tracking Transparency\" request), no selling of data, no cookies in the app.",
          "If you suggest an idea (\"Suggest an idea\" button) or write to us, the message is sent from your email app: we then receive your email address and your message, used only to read and reply to you, and deleted no later than 3 years after our last exchange. Legal basis: our legitimate interest in improving the app. Ideas we keep may be added to the game, without mentioning your name.",
          "The app does not access your contacts, location or camera. Some games use the phone's motion sensors (e.g. \"The Invisible Glass\", \"Don't shake the potato\"): the reading is processed instantly on the device and is never stored or sent. The game \"Shh!\" uses the microphone, only during a round and after you allow it, to measure the sound level live: no audio is recorded, kept or sent, and you can play without the microphone (human referee). Apart from this game, the microphone is only used to record your characters' sounds, only when you ask (see above). The narrator's voice is generated by your phone's system.",
        ],
      },
      {
        title: "Minors",
        paragraphs: [
          "Zinzin is intended for people aged 18 and over. We do not knowingly collect any data about minors.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "Under the GDPR and the French Data Protection Act, you have the right to access, rectify, erase, restrict, object to and port your data, as well as the right to set instructions for what happens to your data after your death.",
          `To exercise them: ${E.email}. As we don't know your identity, please give us the identifier shown in the app's settings (if available) or the date and type of your purchase.`,
          "You can also lodge a complaint with the CNIL, the French data protection authority (www.cnil.fr), or with your local data protection authority.",
        ],
      },
      {
        title: "Changes",
        paragraphs: [
          `This policy may change (new features, legal obligations). The update date is shown below. Last updated: ${LEGAL_UPDATED_AT_I18N.en}.`,
        ],
      },
    ],
  },

  conditions: {
    id: "conditions",
    title: "Terms of use and sale",
    intro: PREVAILS.en,
    sections: [
      {
        title: "1. Purpose",
        paragraphs: [
          `These terms govern the use of the Zinzin app, published by ${E.name} ("we"), and the purchase of the Zinzin+ subscription. By using the app, you accept them. They supplement the terms of the App Store or Google Play (for Apple: the standard end user licence agreement, "EULA").`,
        ],
      },
      {
        title: "2. Adults only",
        paragraphs: [
          "Zinzin is reserved for adults (18 and over). Some games contain references to alcohol and naughty (non-explicit) content, labelled \"18+\". By confirming your age when you open the app, you certify that you are an adult.",
        ],
      },
      {
        title: "3. The service",
        paragraphs: [
          "Zinzin offers party games played together on a single phone, with no connection. Some games can be played for free, in a discovery version with limited content; the other games, all content (including 18+ content) and new releases are available with the Zinzin+ subscription. The catalogue may change (games added, modified or removed).",
        ],
      },
      {
        title: "4. Zinzin+ subscription",
        paragraphs: [
          "Plans offered (prices including tax shown in the app at the time of purchase, which may vary by country): Party Pass (7 days), Monthly, Yearly.",
          "Free trial: the Yearly plan may be offered with a 3-day free trial, available only to people who have not already had one (eligibility checked by Apple or Google). Nothing is charged during the trial; when it ends, it automatically converts into a paid yearly subscription at the price shown, unless cancelled at least 24 hours before the end of the trial. If you cancel during the trial, you keep access until it ends and are not charged.",
          "Payment is charged to your Apple or Google account when the purchase is confirmed. The subscription renews automatically for the same period unless cancelled at least 24 hours before the end of the current period.",
          "You can manage or cancel your subscription at any time from your Apple account settings (Settings › your name › Subscriptions) or Google Play (Payments & subscriptions). Cancellation takes effect at the end of the current period; the period already started is not refunded, unless Apple or Google decides otherwise.",
          "Refunds are handled by Apple (reportaproblem.apple.com) or Google according to their own rules.",
        ],
      },
      {
        title: "5. Right of withdrawal",
        paragraphs: [
          "The subscription gives immediate access to digital content. By confirming the purchase, you request immediate performance of the service and acknowledge that you waive your 14-day right of withdrawal, in accordance with article L221-28 13° of the French Consumer Code.",
        ],
      },
      {
        title: "6. Play responsibly",
        paragraphs: [
          "The \"sips\" suggested by some games are always optional: they can be replaced by a dare, and played with water or a non-alcoholic drink. Nobody has to drink. Alcohol abuse is dangerous for your health: drink in moderation. Never drive after drinking.",
          "Challenges and dares must respect everyone: any participant can refuse a dare. Never do a dare that is dangerous, illegal or makes someone uncomfortable. Each player remains responsible for their own actions and consumption.",
          "Some games (e.g. \"Hot Potato\") involve passing the phone around: do it carefully. We cannot be held responsible for a broken device.",
          "Shared sounds and crews: you alone are responsible for what you record and what you send. Don't record or share anyone's voice without their consent, and nothing insulting, hateful, harassing, obscene or illegal; respect others. A crew you receive shows who sent it: you can mute its voices or delete it at any time. Zinzin neither hosts nor transmits any of this content.",
        ],
      },
      {
        title: "7. Liability",
        paragraphs: [
          "The app is provided as is. We do our best to make it work properly but cannot guarantee it is bug-free. We cannot be held liable for damage resulting from use that does not comply with these terms, or for the behaviour of players.",
          "These terms do not limit the rights you have under mandatory consumer protection laws, in particular the legal guarantee of conformity for digital content (articles L224-25-1 et seq. of the French Consumer Code).",
        ],
      },
      {
        title: "8. Intellectual property",
        paragraphs: [
          "We grant you a personal, non-exclusive and non-transferable licence to use the app for private, non-commercial purposes. Copying, extracting or reselling its content (questions, cards, characters, sounds, code) is prohibited.",
        ],
      },
      {
        title: "9. Personal data",
        paragraphs: ["See our privacy policy, available in the app and on our website."],
      },
      {
        title: "10. Disputes and mediation",
        paragraphs: [
          "Purchases are collected by Apple (App Store) or Google (Google Play): any request about payment or refunds must first be made to them (reportaproblem.apple.com, or Google Play › Payments & subscriptions).",
          `For any other question or complaint about the app: ${E.email}. We undertake to reply within 15 days and to seek an amicable solution.`,
          ...(E.mediator
            ? [`If a dispute remains unresolved, you can use the consumer mediator free of charge: ${E.mediator}.`]
            : []),
          "These terms are governed by French law. Failing an amicable agreement, the competent courts are those provided for by law.",
        ],
      },
      {
        title: "11. Changes",
        paragraphs: [`We may update these terms; the version in force is the one shown in the app. Last updated: ${LEGAL_UPDATED_AT_I18N.en}.`],
      },
    ],
  },
};

const DOCS_ES: Record<LegalDocId, LegalDoc> = {
  "mentions-legales": {
    id: "mentions-legales",
    title: "Aviso legal",
    intro: PREVAILS.es,
    sections: [
      {
        title: "Editor",
        paragraphs: [
          `La aplicación Zinzin es editada por ${E.name}, ${EDITOR_TR.es.status}.`,
          `Dirección: ${E.address}. Registro: ${E.siret}. ${EDITOR_TR.es.vat}.`,
          `Contacto: ${E.email}.`,
          `Director de la publicación: ${E.director}.`,
        ],
      },
      {
        title: "Distribución y alojamiento",
        paragraphs: [
          "La aplicación se distribuye a través del App Store de Apple (Apple Distribution International Ltd., Hollyhill Industrial Estate, Hollyhill, Cork, Irlanda) y de Google Play (Google Ireland Ltd., Gordon House, Barrow Street, Dublín 4, Irlanda).",
          "El contenido de la aplicación está integrado en la propia aplicación: no está alojado en ningún servidor.",
          "Las páginas web informativas (incluido este documento) están alojadas por Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, Estados Unidos.",
        ],
      },
      {
        title: "Propiedad intelectual",
        paragraphs: [
          "La aplicación, su nombre, sus personajes (los «blobs»), sus textos, preguntas, cartas, imágenes, sonidos y código están protegidos por el derecho de propiedad intelectual. Queda prohibida cualquier reproducción o reutilización sin autorización por escrito.",
          "Las mecánicas de algunos juegos se inspiran en juegos de mesa tradicionales de dominio público. Los nombres y contenidos de la aplicación son originales; cualquier parecido con marcas de terceros sería fortuito. Para cualquier reclamación: " + E.email + ".",
        ],
      },
      {
        title: "Salud",
        paragraphs: [
          "El abuso de alcohol es peligroso para la salud: consúmelo con moderación. Está prohibida la venta de alcohol a menores. No conduzcas nunca después de haber bebido.",
        ],
      },
    ],
  },

  confidentialite: {
    id: "confidentialite",
    title: "Política de privacidad",
    intro:
      PREVAILS.es + " Zinzin está diseñada para recoger los menos datos posibles: sin cuenta, sin publicidad, sin rastreadores. Los juegos funcionan íntegramente en tu móvil, sin conexión a nuestros servidores.",
    sections: [
      {
        title: "Responsable del tratamiento",
        paragraphs: [`${E.name}, ${E.address}. Contacto: ${E.email}.`],
      },
      {
        title: "Lo que se queda en tu móvil (nunca se envía)",
        paragraphs: [
          "Los nombres que escribes para jugar, tu último «grupo» de jugadores y los nombres recientes (para volver a proponértelos), tus ajustes (sonidos, packs elegidos, idioma…), la confirmación de que tienes 18 años o más y el estado de tu suscripción.",
          "Esta información se guarda únicamente en el almacenamiento local de la aplicación, en tu dispositivo. No tenemos acceso a ella y no se envía a ningún sitio. Evita escribir algo que no sean nombres o apodos.",
          "El botón «Compartir mi resultado» crea una imagen (nombres y puntuaciones que se ven en pantalla) en tu móvil; solo se envía a la app que elijas en el menú de compartir, nunca a nosotros.",
          "Los sonidos de tus personajes («Mi grupo»): si decides grabar uno, el micrófono solo se usa mientras mantienes pulsado el botón, y con tu permiso. Cada grabación (5 segundos como máximo) se queda en el almacenamiento de la aplicación, en tu móvil. Solo sale de tu móvil si tú mismo envías tu grupo (botón «Enviar mi grupo»), como archivo, por la app y a la persona que elijas en el menú de compartir. No se envía nada automáticamente: Zinzin no recibe ninguna grabación ni tiene acceso a ellas.",
          "Un grupo que recibes (archivo «.zinzin») solo se lee en tu móvil, cuando lo abres; solo se añade a tu grupo si tú lo decides, indicando quién lo envió. Puedes silenciar sus voces o borrar sus personajes en cualquier momento.",
          "Puedes borrarlo todo en cualquier momento: un sonido o un personaje desde «Mi grupo», o todos tus datos con «Borrar mis datos» en los ajustes de la app (o eliminando la aplicación).",
        ],
      },
      {
        title: "Compras y suscripción",
        paragraphs: [
          "Los pagos los gestionan exclusivamente Apple (App Store) o Google (Google Play): nunca recibimos tus datos bancarios, ni tu nombre, ni tu dirección de correo electrónico.",
          "Para saber si tu suscripción está activa en todos tus dispositivos y permitir la restauración de compras, utilizamos el servicio RevenueCat (RevenueCat, Inc., Estados Unidos), encargado del tratamiento en el sentido del RGPD. Recibe: un identificador anónimo generado por la aplicación, el historial de compras de Zinzin (producto, fecha, precio, país, estado de renovación) e información técnica sobre el dispositivo (modelo, versión del sistema y de la app).",
          "Base jurídica: la ejecución del contrato de suscripción (art. 6.1.b del RGPD). Plazo de conservación: mientras dure la suscripción y después hasta 3 años, además de los plazos impuestos por las obligaciones contables y fiscales.",
          "RevenueCat está situado en Estados Unidos: la transferencia se rige por las cláusulas contractuales tipo de la Comisión Europea y/o el Marco de Privacidad de Datos UE–EE. UU. (Data Privacy Framework).",
        ],
      },
      {
        title: "Lo que no hacemos",
        paragraphs: [
          "Sin publicidad, sin medición de audiencia, sin rastreo entre apps o sitios web (ninguna solicitud de «App Tracking Transparency»), sin venta de datos, sin cookies en la aplicación.",
          "Si nos propones una idea (botón «Propón una idea») o nos escribes, el mensaje sale desde tu aplicación de correo: entonces recibimos tu dirección de correo y tu mensaje, que solo usamos para leerte y responderte, y que se eliminan como máximo 3 años después del último intercambio. Base jurídica: nuestro interés legítimo en mejorar la app. Las ideas seleccionadas pueden incorporarse al juego, sin mencionar tu nombre.",
          "La aplicación no accede a tus contactos, ni a tu ubicación, ni a tu cámara. Algunos juegos usan los sensores de movimiento del móvil (p. ej. «El Vaso Invisible», «No agites la patata»): la medición se procesa al instante en el dispositivo y nunca se guarda ni se envía. El juego «¡Chis!» usa el micrófono, solo durante una ronda y con tu permiso, para medir el nivel de ruido en directo: no se graba, guarda ni envía ningún sonido, y puedes jugar sin micrófono (árbitro humano). Fuera de ese juego, el micrófono solo sirve para grabar el sonido de tus personajes, únicamente cuando tú lo pides (ver más arriba). La voz del narrador la genera el sistema de tu móvil.",
        ],
      },
      {
        title: "Menores",
        paragraphs: [
          "Zinzin está reservada a personas de 18 años o más. No recogemos conscientemente ningún dato de menores.",
        ],
      },
      {
        title: "Tus derechos",
        paragraphs: [
          "De conformidad con el RGPD y la ley francesa de Informática y Libertades, tienes derecho de acceso, rectificación, supresión, limitación, oposición y portabilidad, así como derecho a definir instrucciones sobre el destino de tus datos después de tu fallecimiento.",
          `Para ejercerlos: ${E.email}. Como no conocemos tu identidad, indícanos el identificador que aparece en los ajustes de la app (si está disponible) o la fecha y el tipo de tu compra.`,
          "También puedes presentar una reclamación ante la CNIL, la autoridad francesa de protección de datos (www.cnil.fr), o ante la autoridad de protección de datos de tu país.",
        ],
      },
      {
        title: "Cambios",
        paragraphs: [
          `Esta política puede cambiar (nuevas funciones, obligaciones legales). La fecha de actualización figura a continuación. Última actualización: ${LEGAL_UPDATED_AT_I18N.es}.`,
        ],
      },
    ],
  },

  conditions: {
    id: "conditions",
    title: "Condiciones generales de uso y de venta",
    intro: PREVAILS.es,
    sections: [
      {
        title: "1. Objeto",
        paragraphs: [
          `Estas condiciones regulan el uso de la aplicación Zinzin, editada por ${E.name} («nosotros»), y la compra de la suscripción Zinzin+. Al usar la aplicación, las aceptas. Completan las condiciones del App Store o de Google Play (en el caso de Apple: el contrato de licencia estándar para el usuario final, «EULA»).`,
        ],
      },
      {
        title: "2. Acceso reservado a adultos",
        paragraphs: [
          "Zinzin está reservada a personas mayores de edad (18 años o más). Algunos juegos contienen referencias al alcohol y contenidos pícaros (no explícitos), señalados como «18+». Al confirmar tu edad al abrir la app, certificas que eres mayor de edad.",
        ],
      },
      {
        title: "3. El servicio",
        paragraphs: [
          "Zinzin ofrece juegos de fiesta que se juegan en grupo con un solo móvil, sin conexión. Algunos juegos se pueden jugar gratis, en una versión de descubrimiento con contenido limitado; los demás juegos, todo el contenido (incluidos los contenidos 18+) y las novedades están disponibles con la suscripción Zinzin+. El catálogo puede cambiar (juegos añadidos, modificados o retirados).",
        ],
      },
      {
        title: "4. Suscripción Zinzin+",
        paragraphs: [
          "Planes disponibles (precios con impuestos incluidos mostrados en la aplicación en el momento de la compra, que pueden variar según el país): Pase fiesta (7 días), Mensual, Anual.",
          "Prueba gratuita: el plan Anual puede ofrecerse con una prueba gratuita de 3 días, reservada a quienes no la hayan disfrutado ya (Apple o Google comprueban la elegibilidad). No se cobra nada durante la prueba; al terminar, se convierte automáticamente en una suscripción anual de pago al precio indicado, salvo que la canceles al menos 24 horas antes del final de la prueba. Si cancelas durante la prueba, conservas el acceso hasta que termine y no se te cobra nada.",
          "El pago se carga en tu cuenta de Apple o Google al confirmar la compra. La suscripción se renueva automáticamente por el mismo periodo, salvo que la canceles al menos 24 horas antes del final del periodo en curso.",
          "Puedes gestionar o cancelar tu suscripción en cualquier momento desde los ajustes de tu cuenta de Apple (Ajustes › tu nombre › Suscripciones) o de Google Play (Pagos y suscripciones). La cancelación surte efecto al final del periodo en curso; el periodo iniciado no se reembolsa, salvo decisión de Apple o Google.",
          "Los reembolsos los gestiona Apple (reportaproblem.apple.com) o Google según sus propias normas.",
        ],
      },
      {
        title: "5. Derecho de desistimiento",
        paragraphs: [
          "La suscripción da acceso inmediato a un contenido digital. Al confirmar la compra, solicitas la ejecución inmediata del servicio y reconoces que renuncias a tu derecho de desistimiento de 14 días, de conformidad con el artículo L221-28 13° del Código de Consumo francés.",
        ],
      },
      {
        title: "6. Jugar de forma responsable",
        paragraphs: [
          "Los «tragos» que proponen algunos juegos son siempre opcionales: pueden sustituirse por un reto y jugarse con agua o una bebida sin alcohol. Nadie está obligado a beber. El abuso de alcohol es peligroso para la salud: consúmelo con moderación. No conduzcas nunca después de haber bebido.",
          "Los desafíos y retos deben respetar a todo el mundo: cualquier participante puede negarse a hacer un reto. No hagas nunca un reto peligroso, ilegal o que incomode a alguien. Cada jugador es responsable de sus actos y de su consumo.",
          "Algunos juegos (p. ej. «La Patata Caliente») consisten en pasarse el móvil: hazlo con cuidado. No nos hacemos responsables de la rotura de un dispositivo.",
          "Sonidos y grupos compartidos: eres el único responsable de lo que grabas y de lo que envías. No grabes ni compartas la voz de nadie sin su consentimiento, ni nada insultante, de odio, acosador, obsceno o ilegal; respeta a los demás. Un grupo recibido indica quién lo envió: puedes silenciar sus voces o borrarlo en cualquier momento. Zinzin no aloja ni transmite ninguno de estos contenidos.",
        ],
      },
      {
        title: "7. Responsabilidad",
        paragraphs: [
          "La aplicación se ofrece tal cual. Hacemos todo lo posible para que funcione correctamente, pero no garantizamos la ausencia de errores. No seremos responsables de los daños derivados de un uso no conforme a estas condiciones, ni del comportamiento de los jugadores.",
          "Estas condiciones no limitan los derechos que te otorgan las disposiciones legales imperativas aplicables a los consumidores, en particular la garantía legal de conformidad de los contenidos digitales (artículos L224-25-1 y siguientes del Código de Consumo francés).",
        ],
      },
      {
        title: "8. Propiedad intelectual",
        paragraphs: [
          "Te concedemos una licencia personal, no exclusiva e intransferible para usar la aplicación con fines privados y no comerciales. Queda prohibido copiar, extraer o revender sus contenidos (preguntas, cartas, personajes, sonidos, código).",
        ],
      },
      {
        title: "9. Datos personales",
        paragraphs: ["Consulta nuestra política de privacidad, disponible en la aplicación y en nuestra web."],
      },
      {
        title: "10. Litigios y mediación",
        paragraphs: [
          "Las compras las cobra Apple (App Store) o Google (Google Play): cualquier solicitud relacionada con el pago o el reembolso debe hacerse primero ante ellos (reportaproblem.apple.com, o Google Play › Pagos y suscripciones).",
          `Para cualquier otra pregunta o reclamación sobre la aplicación: ${E.email}. Nos comprometemos a responder en un plazo de 15 días y a buscar una solución amistosa.`,
          ...(E.mediator
            ? [`En caso de litigio no resuelto, puedes recurrir gratuitamente al mediador de consumo: ${E.mediator}.`]
            : []),
          "Estas condiciones se rigen por el derecho francés. A falta de acuerdo amistoso, serán competentes los tribunales previstos por la ley.",
        ],
      },
      {
        title: "11. Cambios",
        paragraphs: [`Podemos modificar estas condiciones; la versión vigente es la que se muestra en la aplicación. Última actualización: ${LEGAL_UPDATED_AT_I18N.es}.`],
      },
    ],
  },
};

/** Textes légaux dans la langue de l'app (le français fait foi ; le site garde LEGAL_DOCS). */
export function getLegalDocs(lang: Lang): Record<LegalDocId, LegalDoc> {
  return lang === "en" ? DOCS_EN : lang === "es" ? DOCS_ES : LEGAL_DOCS;
}
