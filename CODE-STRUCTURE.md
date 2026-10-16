# Structure du code

Le jeu reste un site statique : GitHub Pages publie les fichiers tels quels, et l’URL du jeu ne change pas. Aucun serveur ou outil de compilation n’est requis pour les joueurs.

## Fichiers principaux

- `etat-arcanique.html` : structure de la page et ordre de chargement.
- `css/game.css` : styles de l’interface et du plateau.
- `js/data.js` : cartes, familles, terrains, mots-clés et données du jeu.
- `js/card-art.js` : correspondance entre les identifiants de cartes et leurs fichiers d’illustration.
- `js/engine.js` : règles et moteur de duel.
- `js/ai.js` : construction des decks et décisions de l’IA.
- `js/accounts.js` : sauvegardes locales, comptes et synchronisation Firebase.
- `js/network.js` : PeerJS, défis et échanges entre joueurs.
- `js/ui-core.js` : outils d’interface, modales et composants partagés.
- `js/duel-ui.js` : affichage et interactions du duel.
- `js/menus.js` : écrans Jouer, Boutique, Collection, Decks, Amis et Compte.
- `js/arena.js` : draft, courses, matchmaking et interface de l’Arène.
- `png/` : illustrations, boutons, arrière-plans et autres images.
- `assets/cards/` : illustrations des cartes.
- `cloud-config.js` : configuration publique Firebase du jeu.

## Modifier le jeu

- Pour modifier une carte, un terrain ou une famille, chercher son identifiant dans `js/data.js`.
- Pour changer une règle de combat, regarder dans `js/engine.js`.
- Pour modifier une interface, regarder dans le fichier correspondant sous `js/`.
- Pour ajouter une image d’interface, déposer le PNG dans `png/` puis référencer son chemin, par exemple `png/mon-illustration.png` dans JavaScript ou `../png/mon-illustration.png` dans `css/game.css`.
- Pour ajouter ou remplacer une illustration de carte, déposer le fichier dans `assets/cards/` puis mettre à jour sa correspondance dans `js/card-art.js`.

Les scripts sont des scripts classiques chargés dans l’ordre indiqué dans `etat-arcanique.html`. Cet ordre est important : les chemins d’illustrations et les données sont déclarés avant les écrans qui les utilisent. Conserver ce mode de chargement permet de tester la page localement et de la publier directement sur GitHub Pages, sans étape de build.
