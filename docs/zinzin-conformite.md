# Zinzin — conformité (RGPD, stores, légal)

Version provisoire du 12/10/2026, à relire par un pro avant la sortie. Les textes légaux sont dans `src/lib/legal/zinzin.ts` (une seule source) et apparaissent :
- dans l'app (Réglages › Conditions / Confidentialité) ;
- sur le site : `/zinzin/confidentialite`, `/zinzin/conditions`, `/zinzin/mentions-legales`.

## 1. Ce que fait l'app avec les données (vérifié dans le code)
| Donnée | Où | Transmise ? |
|---|---|---|
| Prénoms saisis, dernière bande, prénoms récents | localStorage du téléphone | Non |
| Réglages, confirmation 18+, état premium | localStorage | Non |
| Achats / abonnement | Apple ou Google + RevenueCat (SDK natif) | Oui : id anonyme, historique d'achat, pays, infos appareil |
| Capteur de mouvement (La Patate) | traité en direct | Non (jamais stocké) |
| Voix du narrateur (Loup-Garou) | synthèse vocale iOS | Non |

- **Aucune connexion réseau depuis l'interface :** le build de l'app contient une CSP `connect-src 'self'` (`zinzin/vite.config.ts`). Même par erreur, aucun jeu ne peut appeler un serveur.
- **Rien qui demande un consentement :** pas d'analytics, pas de pub, pas de cookies, pas d'ATT. Il n'y a donc pas de bannière de consentement à afficher.
- **Fichiers iOS :**
  - `ios/App/App/PrivacyInfo.xcprivacy` : tracking désactivé, seul l'historique d'achat est déclaré (non lié, pour le fonctionnement de l'app) ;
  - `ITSAppUsesNonExemptEncryption = false` dans Info.plist.

## 2. À remplir dans App Store Connect
- **App Privacy (« étiquette nutritionnelle ») :**
  - « Données collectées » : **Achats › Historique des achats**, utilisé pour le fonctionnement de l'app, non lié à l'identité, pas de pistage ;
  - ajouter **Identifiants › ID utilisateur** si RevenueCat est configuré avec un ID anonyme. Il est non lié à l'identité.
  - Tout le reste : non collecté.
- **URL :**
  - confidentialité : `https://<domaine>/zinzin/confidentialite` ;
  - conditions (EULA) : `https://<domaine>/zinzin/conditions`, ou l'EULA Apple standard plus un lien vers nos conditions dans la description.
- **Classification d'âge** (nouveau questionnaire Apple) :
  - Alcool/tabac/drogues : *fréquent* ;
  - Thèmes sexuels/nudité : *peu fréquent / léger* ;
  - Humour grossier : *fréquent* ;
  - Pas de contenu généré par les utilisateurs partagé, pas de chat, pas de jeux d'argent.
  - Résultat attendu : **18+**.
- **Abonnements :** obligatoirement dans un groupe d'abonnements, avec un nom et une description en français. La fiche de l'app doit mentionner « abonnement à renouvellement automatique » et donner les liens vers les conditions et la confidentialité. C'est déjà le cas dans le paywall.
- **Review notes :** « Jeux de soirée sur un seul téléphone, 100 % hors-ligne. Les gorgées sont toujours facultatives et remplaçables par un gage ou une boisson sans alcool (règle 1.4.3). »

## 3. Google Play Console
- **Data safety :** mêmes réponses (Achats › historique, non partagé, chiffré en transit, suppression possible sur demande).
- **Questionnaire IARC :** alcool, références sexuelles légères, humour grossier → PEGI 18.
- **Public cible :** 18+ uniquement, pas « conçu pour les enfants ».

## 4. Ce qu'il te reste à faire (obligatoire avant de vendre)
1. **Statut juridique :** EI existante (SIREN 109 518 910, APE 47.91B vente à distance), déjà renseignée dans `EDITOR`. **Ajouter l'activité** « édition / vente d'applications et de jeux mobiles » (ex. APE 58.21Z) via le guichet unique (formalites.entreprises.gouv.fr). Confirmer avec l'URSSAF ou un comptable le régime de cette activité et la franchise de TVA, que j'ai supposée (mention « art. 293 B »). L'adresse personnelle est publique dans les mentions légales ; une domiciliation est possible si tu préfères la masquer.
2. **Médiateur de la consommation :** obligatoire dès qu'on vend à des particuliers. Il faut adhérer à un médiateur (il en existe à quelques dizaines d'euros par an) puis remplir `EDITOR.mediator`.
3. **Adresse e-mail de contact :** créer `contact@…` sur ton domaine (remplacer `contact@zinzin.app` si tu n'as pas ce domaine).
4. **RevenueCat :** accepter leur DPA (accord de sous-traitance RGPD) dans le dashboard et créer un ID utilisateur anonyme (c'est le comportement par défaut).
5. **Marque :** vérifier « Zinzin » sur data.inpi.fr (classes 9 et 41), puis déposer.
6. **Relecture juridique :** faire relire les 3 textes par un juriste ou un avocat avant la sortie.

## 5. Contenu (règles appliquées dans les jeux)
- **Alcool :** jamais plus de 3 gorgées, toujours « ou un gage », eau et soft acceptés, mention modération, jamais de cul sec, de shot ou de peine doublée (règle App Store 1.4.3).
- **Interdits :** drogue, vraies personnes en contexte sexuel, sites ou marques X.
- **Packs coquins :** non explicites et **décochés par défaut**.
- **Marques et propriété intellectuelle :** noms de jeux originaux (L'Intrus, De 1 à 10, Le Curseur, Mots Espions, La Tournée…), aucun contenu copié d'un jeu existant.
- **Défis :** les CGU précisent qu'un défi peut toujours être refusé et que les défis dangereux sont exclus.

## 6. Pub TikTok (loi Évin)
- La loi Évin encadre la **publicité** pour l'alcool, pas l'app elle-même.
- Dans les carrousels, ne montre ni boisson alcoolisée, ni verre, ni « tu bois ». Mets en avant L'Intrus, La Patate, Pile Poil, le Test de pureté…
- Pas de ciblage des moins de 18 ans.
