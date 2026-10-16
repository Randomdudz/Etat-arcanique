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

- Un classement visible dans l’Arène affiche les 10 joueurs ayant remporté le plus de duels cette semaine, avec leur pseudo et le détail des victoires contre l’IA et contre des joueurs.
- Les victoires sont enregistrées pour les comptes en ligne. Les défis directs entre amis sont remplacés par le matchmaking.
