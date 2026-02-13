# AF Games - Documentation Projet Complet

> Hub de jeux multijoueur en temps réel, jouable dans le navigateur.
> Dernière MAJ : 12 février 2026

---

## Stack Technique

| Couche | Techno | Version |
|--------|--------|---------|
| Frontend | Next.js (App Router) | 16.1.6 |
| React | React 19 | 19.2.3 |
| CSS | Tailwind CSS 4 + shadcn/ui | ^4 |
| 3D (Motion Tennis) | Three.js + React Three Fiber + Drei | 0.182 / 9.5 / 10.7 |
| State | Zustand | 5.0 |
| Multiplayer temps réel | PartyKit (WebSocket) | 0.0.115 |
| Auth (prévu) | next-auth v5 beta | 5.0.0-beta.30 |
| QR Code | react-qr-code | 2.0 |
| Déploiement frontend | Vercel | - |
| Déploiement WebSocket | PartyKit Cloud | - |

---

## URLs de Production

| Service | URL |
|---------|-----|
| Site web | https://af-games-brown.vercel.app |
| PartyKit WebSocket | wss://af-games.rayanesabi.partykit.dev |
| GitHub | https://github.com/rayanesabi/AF-Games (privé) |

---

## Setup sur un Nouveau PC

```bash
# 1. Cloner le repo
git clone https://github.com/rayanesabi/AF-Games.git
cd AF-Games

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env.local à la racine
cat > .env.local << 'EOF'
AUTH_SECRET=your-secret-here-change-in-production
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=
NEXT_PUBLIC_PARTYKIT_HOST=af-games.rayanesabi.partykit.dev
EOF

# 4. Dev local
npm run dev          # Next.js sur http://localhost:3000
npm run party:dev    # PartyKit sur ws://localhost:1999

# 5. Build production
npm run build

# 6. Déployer
npx partykit deploy          # Déploie le serveur WebSocket
npx vercel --prod             # Déploie le frontend
```

> **Note** : Pour le dev local, changer `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999` dans `.env.local`

---

## Architecture du Projet

```
AF-Games/
├── party/                          # Serveur PartyKit (WebSocket)
│   ├── lobby.ts                    # Gestion des salles (rooms)
│   ├── game.ts                     # Router de jeux (reçoit les messages, les dispatch au bon jeu)
│   ├── stats.ts                    # Serveur de stats globales (points, leaderboard)
│   ├── shared/
│   │   ├── types.ts                # Types partagés (Player, LobbyState, GameRanking)
│   │   └── scoring.ts              # Calcul des scores
│   └── games/
│       ├── base-game.ts            # Classe abstraite BaseGame (tous les jeux héritent)
│       ├── bomb-party.ts           # Serveur Bomb Party
│       ├── speed-quiz.ts           # Serveur Speed Quiz
│       ├── word-chain.ts           # ...
│       ├── reaction-time.ts
│       ├── motion-tennis.ts        # Serveur Motion Tennis (physique balle, IA bot, 60Hz tick)
│       └── ... (19 jeux total)
│
├── src/
│   ├── app/
│   │   ├── page.tsx                # Page d'accueil
│   │   ├── room/[code]/            # Lobby d'une salle
│   │   │   └── game/[gameId]/      # Vue de jeu
│   │   └── controller/[code]/      # Page manette téléphone (Motion Tennis)
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── game-shell.tsx      # Shell commun (score overlay, game over, points globaux)
│   │   │   ├── scoreboard.tsx      # Tableau des scores
│   │   │   └── round-result.tsx    # Résultat d'une manche
│   │   ├── lobby/
│   │   │   ├── game-card.tsx       # Carte de jeu (avec règles)
│   │   │   └── ready-check.tsx     # Système de prêt
│   │   └── games/
│   │       ├── bomb-party/         # 1 dossier par jeu côté client
│   │       ├── motion-tennis/      # 7 fichiers (game, court, ball, player, sounds, store, swing-detector)
│   │       └── ... (19 jeux)
│   │
│   └── lib/
│       ├── games/
│       │   ├── registry.ts         # Registre de TOUS les jeux (GameMeta[])
│       │   └── types.ts            # Types (GameMeta, GameProps, SessionScore)
│       ├── party/
│       │   ├── use-game.ts         # Hook React pour la connexion WebSocket au jeu
│       │   └── message-types.ts    # Types des messages client/serveur
│       └── stores/
│           ├── game-store.ts       # Zustand store pour l'état du jeu
│           └── global-points.ts    # Système de points globaux (localStorage + serveur PartyKit)
│
├── package.json
├── partykit.json                   # Config PartyKit (lobby, game, stats)
├── tsconfig.json                   # TypeScript strict, alias @/* -> ./src/*
└── .env.local                      # Variables d'environnement
```

---

## Comment ça Marche (Flow Complet)

### 1. Créer une salle
- L'utilisateur entre son nom sur la page d'accueil
- Il clique "Créer une salle" → génère un code 4 lettres (ex: RVST)
- URL: `/room/RVST` → connexion WebSocket au lobby PartyKit

### 2. Choisir un jeu
- Le lobby affiche la liste des 19 jeux par catégories
- L'hôte sélectionne un jeu → tous les joueurs voient la sélection
- Bouton "Lancer la partie" → Ready Check → Le jeu démarre

### 3. Pendant le jeu
- Le `game-shell.tsx` encapsule chaque jeu (score, game over, points)
- Le `GameServer` (party/game.ts) route les messages WebSocket vers le bon jeu
- Chaque jeu a son propre serveur (party/games/xxx.ts) et client (components/games/xxx/)

### 4. Fin de partie
- Le serveur broadcast `game-over` avec les rankings
- Le `game-shell.tsx` affiche le classement + les points gagnés
- Les points sont sauvegardés (localStorage + PartyKit stats server)
- Retour au lobby pour relancer

### Communication WebSocket

```
Client → Serveur:
  { type: "game-join",   payload: { playerId, name } }      → Rejoindre
  { type: "game-action", payload: { action: "...", ... } }   → Action de jeu

Serveur → Client:
  { type: "game-state",  payload: { ... } }    → État complet du jeu
  { type: "game-update", payload: { ... } }    → Mise à jour partielle (événement)
  { type: "game-over",   payload: { rankings } }  → Fin de partie
```

---

## Les 19 Jeux

### Mots
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Bomb Party 💣 | Trouve un mot avec la syllabe imposée avant l'explosion | 2-8 | bomb-party.ts |
| Chaîne de mots 🔗 | Mot commençant par la dernière lettre du précédent | 2-8 | word-chain.ts |

### Culture
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Speed Quiz ⚡ | Quiz de culture G, réponds le plus vite | 2-8 | speed-quiz.ts |
| Roast Quiz 🔥 | Quiz avec malus à infliger (flou, tremblement, etc.) | 2-8 | roast-quiz.ts |

### Rapidité
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Réflexes 🎯 | Clique au bon moment (rouge=attends, vert=clique) | 2-8 | reaction-time.ts |
| Split Second ⏱️ | Micro-défis de 3s style WarioWare | 2-8 | split-second.ts |
| King of the Hill 👑 | Reste sur la colline, les autres t'attaquent | 2-8 | king-hill.ts |

### Bluff / Social
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Loup-Garou 🐺 | Village vs Loups, nuit/jour, votes | 4-8 | loup-garou.ts |
| Undercover 🕶️ | Qui a le mot différent ? | 3-8 | undercover.ts |
| L'Infiltré 🕵️ | Un joueur ne connaît pas le mot secret | 3-8 | infiltre.ts |
| La Taupe 🐀 | Missions coop, un joueur sabote en secret | 3-8 | la-taupe.ts |
| Black Market 🏴‍☠️ | Marché noir : vends, bluffe, inspecte | 3-8 | black-market.ts |

### Stratégie
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Noms de Code 🔍 | 2 équipes, indices pour trouver les mots | 4-8 | code-names.ts |
| Enchère de l'Ombre 🏛️ | Enchères sur objets mystérieux (bonus/malus) | 2-8 | enchere.ts |
| Roulette Russe 🔫 | Paris sur bang/safe, items spéciaux | 2-8 | roulette.ts |

### Cartes
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Uno 🃏 | Le classique, cartes spéciales, UNO ! | 2-8 | uno.ts |
| Poker ♠️ | Texas Hold'em complet | 2-8 | poker.ts |

### Party
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Blind Control 🎮 | Tout le monde contrôle le même perso | 2-8 | blind-control.ts |

### Sport
| Jeu | Description | Joueurs | Fichier serveur |
|-----|-------------|---------|-----------------|
| Motion Tennis 🎾 | Tennis 3D Wii Sports, téléphone = raquette | 1-2 | motion-tennis.ts |

---

## Motion Tennis - Architecture Détaillée

Le jeu le plus complexe du projet. Clone de Wii Sports Tennis en 3D dans le navigateur.

### Fichiers (7 fichiers client + 1 serveur)

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `party/games/motion-tennis.ts` | Serveur : physique balle, IA bot, scoring, 60Hz tick | ~810 |
| `motion-tennis-game.tsx` | Client principal : Canvas 3D, UI overlays, events | ~460 |
| `tennis-court.tsx` | Court 3D : terrain, lignes, filet, tribunes, spectateurs | ~180 |
| `tennis-player.tsx` | Personnage Mii : idle, course, swing animations | ~220 |
| `tennis-ball.tsx` | Balle : trail, glow, visibilité, shadow | ~80 |
| `tennis-sounds.ts` | Tous les sons : hit, bounce, serve, crowd, ambient, perfect | ~195 |
| `tennis-store.ts` | Store mutable pour 60fps (bypass React batching) | ~32 |
| `swing-detector.ts` | Détection de swings via gyroscope du téléphone | ~180 |

### Constantes Serveur Actuelles

```
Court       : 36 (longueur) x 20 (largeur)
Gravité     : 18
Vitesse perso: 15
Hit radius  : 2.5
Bot miss    : 12%
Points victoire : 7
Tick rate   : 16ms (60Hz)
```

### Pattern Critique : Mutable Store

React 18 batch les `setState()` de Zustand. Pour des données 60Hz (position balle, personnages), on bypass React :

```typescript
// tennis-store.ts — PAS de React, juste des objets JS mutables
export const charTargets: Record<string, { x: number; z: number }> = {};
export const ballStore = { current: null as BallPos | null };

// Dans motion-tennis-game.tsx — useGameStore.subscribe() au lieu de useEffect
useGameStore.subscribe((state, prevState) => {
  // Feu SYNCHRONE pour chaque set(), pas batché par React
  ballStore.current = { x: ball.x, y: ball.y, z: ball.z };
});

// Dans tennis-ball.tsx — useFrame lit le store mutable
useFrame(() => {
  if (ballStore.current) meshRef.current.position.set(...);
});
```

### Manette Téléphone

1. QR code affiché sur l'écran de jeu → lien vers `/controller/ROOMCODE`
2. Le téléphone ouvre la page, demande l'accès gyroscope
3. Calibration : 3 swings de test
4. Le `SwingDetector` analyse les données `DeviceMotionEvent` et détecte le type de swing
5. Chaque swing est envoyé en WebSocket : `{ action: "swing", swingType, power, swingTimestamp }`
6. Le serveur broadcast `player-swung` → animation sur l'écran

---

## Système de Points Globaux

- Chaque partie donne des points : rang 1 = +50, rang 2 = +25, rang 3 = +10, + score/10
- Stocké en localStorage (fallback) + PartyKit stats server (persistant)
- 10 niveaux : Débutant → Apprenti → Joueur → Confirmé → Expert → Maître → Grand Maître → Légende → Mythique → Divin
- Affiché dans le game-over screen

---

## Ce Qui Marche

- [x] Lobby : créer salle, rejoindre, sélection de jeu, ready check
- [x] 19 jeux implémentés avec serveur + client
- [x] Game shell commun (score, game over, classement, points)
- [x] Motion Tennis jouable (3D, physique, bot, son, manette téléphone)
- [x] Points globaux (niveaux, leaderboard)
- [x] Déploiement Vercel + PartyKit
- [x] Swing anytime (comme Wii Sports)
- [x] Contrôle directionnel (coup droit = droite, revers = gauche)

---

## Ce Qui Reste à Faire / Améliorer

### Motion Tennis (priorité haute)
- [ ] **Tester la manette téléphone en profondeur** — le bug de connexion a été fix (fallback sur premier joueur humain sans manette) mais pas retesté en vrai
- [ ] **Feedback visuel de direction** — quand tu frappes, montrer une flèche indiquant où la balle va (droite/gauche)
- [ ] **Personnages plus réactifs** — les Mii devraient avoir des animations de course plus visibles, bras qui bougent
- [ ] **Réplique exacte Wii Sports** — le timing devrait être le seul facteur de direction (pas le choix forehand/backhand explicite). Simplifier les contrôles à "juste swing"
- [ ] **Mode 2 joueurs** — actuellement solo vs bot. Tester et peaufiner le mode 2 joueurs en LAN
- [ ] **Caméra dynamique** — zoom/déplacement pendant les rallies pour suivre l'action
- [ ] **Effets de particules** — traînée de la balle plus visible, effet d'impact au sol
- [ ] **Tutoriel in-game** — explication interactive au premier lancement

### Général (priorité moyenne)
- [ ] **Auth Discord/Google** — next-auth est installé mais pas branché (AUTH_DISCORD_ID vide)
- [ ] **Persistance des stats** — le PartyKit stats server fonctionne mais les données sont perdues au redéploiement (pas de DB)
- [ ] **Responsive mobile** — le lobby fonctionne sur mobile mais certains jeux sont optimisés desktop
- [ ] **PWA** — rendre l'app installable
- [ ] **Leaderboard page** — page dédiée avec classement global (les données existent déjà)

### Jeux individuels (priorité basse)
- [ ] Tester chaque jeu à 4+ joueurs en conditions réelles
- [ ] Équilibrer les scores/points entre jeux
- [ ] Améliorer les questions du Speed Quiz (actuellement hardcodées)
- [ ] Ajouter des packs de mots pour Undercover/Infiltré

---

## Commandes Utiles

```bash
# Dev
npm run dev                    # Next.js dev server
npm run party:dev              # PartyKit local (ws://localhost:1999)

# Build
npm run build                  # Build Next.js
npm run lint                   # ESLint

# Deploy
npx partykit deploy            # Deploy serveur WebSocket
npx vercel --prod              # Deploy frontend

# Debug
npx partykit tail              # Logs en temps réel du serveur PartyKit
```

---

## Conventions de Code

- **TypeScript strict** partout
- **`@/*`** alias pour `./src/*` (tsconfig)
- **Serveur** : chaque jeu hérite de `BaseGame` (abstract class)
- **Client** : chaque jeu est un composant React avec `GameProps` (roomCode, playerId, playerName)
- **Messages WebSocket** : toujours `{ type: string, payload: object }`
- **État de jeu** : le serveur est la source de vérité, le client affiche
- **60Hz data** : utiliser le pattern mutable store (tennis-store.ts), JAMAIS useEffect pour du temps réel
- **Sons** : Web Audio API synthétisés (pas de fichiers audio)
- **UI** : tout en français
