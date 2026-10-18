# L’État Arcanique — Patch notes

Journal des mises à jour, la plus récente en premier. Les annonces détaillées des grandes versions restent en dessous.

## v3.9.11 — 18/10/2026

### Duels — le matchmaking arrive aussi sur les duels normaux
- Un panneau **« Duel en ligne »** apparaît dans l’onglet Jouer : choisis un deck, lance la recherche, et le
  matchmaking te trouve un adversaire humain qui cherche aussi une partie. Même principe que la file d’Arène :
  entrée Firestore `duelQueue/{uid}`, appariement déterministe, défi PeerJS accepté automatiquement des deux
  côtés. 5 minutes de recherche maximum, avec bouton pour annuler.
- Les matchs en ligne se jouent en **réglages standard** (30 PV, 80 s par tour, mêmes règles que les duels par
  défaut) avec les récompenses habituelles (soumis au plafond quotidien). Les réglages personnalisés restent
  réservés aux duels contre l’IA et aux défis lancés à un ami.
- Si l’adversaire n’a plus de deck valide, est déjà en partie ou est injoignable, tu le sautes automatiquement et
  la recherche reprend. Impossible de chercher en même temps dans la file d’Arène et dans celle des duels.
- ⚠️ Firebase : ajoute la collection `duelQueue` aux règles Firestore (texte complet dans cloud-config.js ou
  fourni avec cette mise à jour). Sans ça, la recherche de duel en ligne est refusée par le serveur.
- À la fin d’un match en ligne, un bouton « Chercher un autre adversaire » relance directement une recherche.

## v3.9.10 — 18/10/2026

### Interface — listes de deck : tri par coût, légendaires bien visibles
- Les listes et résumés de deck trient les cartes **par coût croissant** (à coût égal : légendaire, puis rare, puis
  commune, puis ordre alphabétique). C’était déjà le cas du deck dans l’éditeur et du récapitulatif d’Arène ; la
  liste des **remplaçantes** de l’Arène, jusqu’ici dans l’ordre du draft, est désormais triée elle aussi.
- Les **légendaires** se repèrent d’un coup d’œil partout : pastille dorée « ★ Légendaire », nom en doré et ligne
  légèrement teintée dans l’éditeur de deck, nom doré dans les listes d’Arène.

## v3.9.9 — 18/10/2026

### Duels & Arène — l’IA experte joue à cartes ouvertes (et sans gaspillage)
- L’IA qui simule la suite de la partie **connaît désormais ta main** : pendant ses simulations, tes cartes ne
  sont plus remplacées au hasard — elle anticipe en pleine connaissance de cause. Objectif assumé : qu’elle joue
  toujours son meilleur coup possible.
- Sa recherche est réoptimisée pour cette information : les simulations jouent maintenant **deux allers-retours
  complets** (son tour, ton tour, son tour, ton tour) avant d’évaluer la position, au lieu d’un seul.
- Mesure en miroir contre l’IA à un coup (40 parties, 4 archétypes de deck, sièges et premier joueur alternés,
  toujours ~0,25 s de réflexion par action) : **37/40 = 92,5 % de victoires**, contre 62,5 % pour la version
  3.9.8.
- À budget égal, les variantes essayées donnent : 70 % à un aller-retour, 85 % à trois, 77,5 % avec 4 candidats,
  85 % avec 8 — deux allers-retours avec 6 candidats est le meilleur réglage trouvé.
- Correctif de comportement : l’IA ne jouera plus une carte qui ne donne que du Démoflux (Pièce, Nitro,
  Paris-Brest) quand plus rien n’est jouable ensuite — elle termine son tour et garde la carte pour un tour où
  elle servira. C’était le « elle joue la Pièce au tour 1 pour ne rien faire ».
- Elle termine son tour dans 53 cas sur 400 décisions réelles (dont 7 où la seule carte jouable était justement une
  carte de Démoflux inutile, désormais écartée d’office). Dans tous les autres cas, la simulation a jugé le passage
  meilleur que les coups disponibles — le plus souvent refuser un achat de terrain ou ne pas dépenser une petite carte
  pour rien.

## v3.9.8 — 18/10/2026

### Duels — l’IA experte arrive aussi contre toi
- L’IA qui simule la suite de la partie avant de jouer (celle de l’Arène depuis la v3.9.7) équipe désormais
  **les duels contre l’ordinateur** : elle anticipe ta riposte au lieu de juger son coup sur l’instant.
- Son temps de réflexion passe de ~0,15 s à ~0,25 s par action — quelques dixièmes de seconde de plus par tour,
  absorbés en bonne partie par les pauses d’animation.
- Mesure en miroir contre l’IA à un coup (40 parties, 4 archétypes de deck, sièges et premier joueur alternés) :
  **62,5 % de victoires** pour la nouvelle, cohérent avec les 61 % relevés à 0,15 s.
- Rappel : pendant ses simulations, **ta main est remplacée au hasard** — elle joue mieux, mais ne lit pas tes cartes.

## v3.9.7 — 18/10/2026

### Arène — l’IA réfléchit avant de jouer
- L’IA d’Arène ne se contente plus d’évaluer son coup immédiat : elle **simule la suite** de la partie
  (fin de son tour, riposte adverse) et choisit le coup dont la moyenne est la meilleure. Les mêmes tirages
  aléatoires sont utilisés pour tous les coups comparés, ce qui rend la comparaison fiable malgré un temps de
  réflexion court.
- Pendant ces simulations, **ta main est retirée au hasard** : l’IA joue mieux, mais ne lit pas tes cartes.
- Mesure en miroir contre l’ancienne IA (80 parties, 4 archétypes de deck, sièges et premier joueur alternés) :
  **~61 % de victoires** pour la nouvelle, contre 50 % pour l’ancienne.
- Contrepartie : l’IA d’Arène réfléchit ~0,15 s par action (souvent moins d’une seconde par tour, quelques
  secondes dans les positions les plus chargées). Les duels amicaux et le tournoi de decks ne changent pas.

## v3.9.6 — 18/10/2026

### Arène — l’IA ne se retient plus
- L’IA d’Arène joue **son meilleur deck possible dès le palier 1** : toutes les raretés lui sont accessibles d’entrée de jeu.
  La montée en rareté aux paliers 4 et 7 annoncée avec la mise à jour 3.9 est remplacée par cette règle.
- La difficulté de l’IA est donc la même du premier au dernier palier ; seules les récompenses augmentent avec tes victoires.
- Bénéfice au passage : un seul deck d’IA à préparer pour toute la course (calcul en arrière-plan effectué une seule fois).

Version du jeu concernée : **v3.9.6** (visible en haut à droite du jeu).

## v3.9.5 — 18/10/2026

- Mise à jour de version : le numéro affiché en haut à droite du jeu passe à **v3.9.5**.
- Aucun changement de gameplay : cette version accompagne la mise en place de ce journal des mises à jour,
  dont la première entrée (les changements de la v3.9.4) est juste en dessous.

## v3.9.4 — 18/10/2026

### Arène plus juste
- Le second joueur ne reçoit plus les **+5 PV** de compensation : en Arène, les deux héros commencent désormais à **30 PV**.
  Le reste de la compensation est conservé (une carte en plus, la Pièce et l’Or).

### Classement de l’Arène — protection côté serveur (en préparation)
- Chaque victoire pourra être validée par le serveur du jeu : elle ne comptera que si le duel a réellement été joué
  (match ouvert par le jeu, durée minimale de 60 s, course en cours, maximum 9 victoires / 3 défaites, 12 courses par 24 h).
- Un **journal daté des parties** est conservé pour l’outil de surveillance : courses lancées, victoires (IA / joueur),
  défaites, avec la durée de chaque match.
- **Ce n’est pas encore activé** : en attendant, le classement s’enregistre exactement comme avant et rien ne change
  pour les joueurs. Le jour de l’activation, il suffira de recharger la page (Ctrl+F5).

Version du jeu concernée : **v3.9.4** (visible en haut à droite du jeu).

---

# L’État Arcanique — Mise à jour 3.9

## Une Arène repensée

Lance-toi dans une course pouvant aller jusqu’à **9 victoires** avant **3 défaites**. Tu peux jouer contre l’IA, défier un ami ou chercher un autre joueur humain.

### Rédraft après une défaite

Après une défaite qui ne met pas fin à ta course, tu gardes ton deck. Tu choisis d’abord **5 nouvelles cartes**, une parmi trois propositions à chaque choix, puis tu sélectionnes les **5 cartes de ton deck** qu’elles vont remplacer. Les cartes remplacées gardent leur position dans le deck.

### Des adversaires et des récompenses qui montent en puissance

- Les decks de l’IA s’enrichissent en raretés aux paliers **4** et **7**.
- Les récompenses augmentent avec tes victoires :

| Victoires | Récompense |
|---:|---:|
| 0 | 40 💎 |
| 1 | 65 💎 |
| 2 | 95 💎 |
| 3 | 135 💎 |
| 4 | 185 💎 |
| 5 | 250 💎 |
| 6 | 335 💎 |
| 7 | 445 💎 |
| 8 | 580 💎 |
| 9 | 750 💎 |

### File de matchmaking humain

- Lance une recherche pour être associé à un autre joueur en attente.
- Un statut visible indique que tu es dans la file ; tu peux annuler la recherche.
- Chaque recherche dure au maximum **5 minutes**. Si aucun match n’est trouvé, tu peux la relancer.
- La file nécessite un compte Firebase en ligne et la configuration Firestore du jeu.

## Ajustements de cartes et de boutique

- **Kiwi** n’a plus **Hâte**.
- **Coach Capitaine du Rush** retrouve sa condition : il concerne les créatures qui coûtent **3 ou moins**.
- Un terrain déjà présent sur un plateau ne peut plus réapparaître dans la boutique.

## Finition de l’interface

- Les boutons principaux de l’Arène reprennent le fond de la tuile Arène du menu.
- Les pictogrammes ont été retirés de ces boutons pour laisser les libellés bien lisibles.

## Commande d’attaque directe

- En duel, **Ctrl + clic gauche** sur l’une de tes créatures permet de viser directement le héros adverse.
- Si l’attaque est impossible, le jeu en indique la raison, par exemple un **Rempart** ou **Désorientée**.

## Équilibrage des Weebos

- Le bonus de **+1 PV** s’active désormais à **3 Weebos** au lieu de 2.
- La réduction de **1 dégât de combat** s’active désormais à **5 Weebos** au lieu de 4.

## Classement hebdomadaire de l’Arène

- Le classement hebdomadaire affiche les joueurs ayant lancé une course, même avec zéro victoire ou après un abandon, avec le nombre de courses et le détail des victoires contre l’IA et contre des joueurs.
- Les victoires sont enregistrées pour les comptes en ligne. Les défis directs entre amis sont remplacés par le matchmaking.
- Correction de l’inscription des courses dans Firestore, qui pouvait échouer au lancement de l’Arène.
