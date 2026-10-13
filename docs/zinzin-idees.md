# Zinzin — idées de jeux mises de côté

> 13/10/2026 : « Le Verre Invisible » (version Jenga liquide) et « Chut ! » (duel « ne ris pas » au micro) sont développés (src/components/games/verre, src/components/games/chut). Reste en réserve : le Détecteur de mensonge (version bluff ci-dessous).

Idées validées par le fondateur le 13/10/2026, à reprendre plus tard.

## Le Verre Invisible 🥛
Le téléphone se passe à plat comme un plateau, avec un « verre d'eau » virtuel qui suit l'inclinaison (gyroscope / DeviceMotion). Le liquide déborde si on penche trop : celui qui le renverse perd. Niveaux : verre de plus en plus plein, passages de plus en plus rapides. Très filmable.
- Technique : DeviceMotionEvent (permission iOS au tap), physique de liquide simple (vagues en SVG).

## Le Détecteur de mensonge 🫣 (version jeu de bluff, à faire)
Le joueur reçoit une question gênante, choisit EN SECRET vérité ou mensonge (✓/✗ caché), répond à voix haute pouce sur l'écran pendant que le polygraphe s'agite (il peut l'emballer exprès en appuyant plus fort pour semer le doute) ; la table vote « il ment / il dit vrai » ; points pour chaque joueur dupé, et pour ceux qui voient juste. Pouvoirs : Contre-interrogatoire, Joker vérité ; manche finale « Grand Déballage » (questions hot, points doublés).

Version initiale (trop simple) : le joueur garde le pouce sur l'écran et répond à voix haute à une question gênante pendant qu'une jauge « mensonge » s'agite en direct, puis verdict théâtral « MENSONGE ! » ou « Vérité » (aléatoire, assumé comme une blague), sons de polygraphe.
- Contenu : banque de questions (soft / soirée / coquin 18+ décoché).
- Rester clair dans les règles que la machine est « pour rire » (pas de fausse promesse de détection).

## Chut ! 🤫
Le micro mesure le bruit : tout le monde doit garder son sérieux en silence pendant qu'une carte drôle s'affiche ; le premier qui rit (bruit) fait sauter la jauge.
- Technique : getUserMedia + niveau sonore (rien n'est enregistré ni envoyé) ; ajouter NSMicrophoneUsageDescription dans Info.plist + mention dans la politique de confidentialité.

## Autres idées proposées (non retenues pour l'instant)
Qui a le tél ? (roulette des doigts), Le Procès, Qui a dit ça ?, Ça ou Rien, Le Mot Interdit (nom à changer), Blind Test Fredonné, Jeu de la semaine.
