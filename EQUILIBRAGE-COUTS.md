# Réévaluation des coûts — État Arcanique

> **Proposition uniquement : aucun coût, effet, stat ou règle n'est modifié par ce document. Rien n'a été poussé.**
> Cette version remplace les propositions précédentes : elles sous-évaluaient les jetons et les synergies de familles et attribuaient à tort des gains de winrate à une simulation qui ne testait pas tous les effets proposés.

## Conclusion après réexamen

Le constat de départ reste valable : le coût 2 est très chargé et les communes sont presque toutes à 1–3. En revanche, **il ne faut pas déplacer les cartes vers le coût 1 en se basant uniquement sur leurs stats imprimées**. Les jetons, les effets récurrents et chaque unité supplémentaire qui compte pour une famille changent la valeur réelle de la carte et parfois celle de toute la main.

La proposition précédente de rééquilibrage est donc **retirée dans son ensemble**, y compris sa courbe « après », ses ajustements de stats et ses résultats de simulation. Elle ne doit pas servir de liste de changements à appliquer. Les décisions prudentes proposées ici sont un nouveau point de départ, à tester avant toute modification du jeu.

## 1. Référence actuelle

Décompte des 150 cartes jouables de `js/data.js` (les jetons ne sont pas inclus) :

| Rareté | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Toutes (150) | 3 | 16 | **46** | 36 | 20 | 15 | 8 | 1 | 4 | 0 | 1 |
| Communes (60) | 2 | 10 | **35** | 12 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Rares (50) | 0 | 6 | 10 | **21** | 11 | 2 | 0 | 0 | 0 | 0 | 0 |
| Légendaires (40) | 1 | 0 | 1 | 3 | 8 | **13** | 8 | 1 | 4 | 0 | 1 |

Les coûts 2 et 3 concentrent 82 cartes. Ce déséquilibre mérite d'être réduit, mais **le nombre de cartes dans chaque tranche ne constitue pas à lui seul un objectif de puissance**. Une carte à 2 qui crée plusieurs corps ou active une famille peut valoir davantage qu'une carte à 3 avec de meilleures stats.

## 2. Méthode de valeur à appliquer à chaque proposition

Avant de déplacer une carte, l'évaluer dans son contexte de jeu et de deck :

1. **Corps créés** : ajouter à la carte tous les jetons et toutes les créatures qu'elle invoque. Compter leurs stats, mots-clés, survie, emplacement et famille. Les jetons ne sont pas de simples stats bonus : ils peuvent attaquer séparément et occuper des cases.
2. **Seuils de famille** : mesurer l'effet de la carte avant et après son arrivée. Un Weebos peut franchir les seuils à 3 et 5 ; un Farmer, Ravagé ou Alien peut atteindre un palier qui produit Or, dégâts ou autres ressources. Inclure la valeur de ces déclenchements et le fait que la carte reste sur le plateau.
3. **Synergies croisées** : tenir compte de `fac`, des effets « tous les membres d'une famille », des cartes qui invoquent des membres de famille et des coûts réduits par famille. Évaluer les intersections de familles et pas seulement la famille imprimée de la carte.
4. **Valeur selon le terrain** : vérifier l'affinité, le terrain requis, la répétition d'effets et les cartes qui doublent ces effets. Un bonus conditionnel peut être rare dans un deck, mais explosif lorsqu'il se produit.
5. **Interaction et tempo** : valoriser correctement Rempart, retrait, mutisme, protection, soins, dégâts récurrents, pioche et contrôle temporaire. Les comparer à ce qu'ils neutralisent, pas uniquement à un total de stats.
6. **Coût réel et occasion** : prendre en compte les réductions, le Démoflux, l'Or, le tour où la carte devient jouable et ce qu'elle empêche de jouer en même temps.
7. **Rareté et draft** : ne pas traiter rareté et coût comme équivalents. Une carte de draft apparaît dans un environnement de deck et de choix différent d'une carte de collection.

Une baisse de coût **augmente aussi la régularité et l'accès à la synergie**. Elle ne doit donc pas être automatiquement compensée par une baisse de stats : il faut d'abord comparer des parties et des decks complets. Inversement, une hausse de coût accompagnée d'un bonus de stats peut annuler entièrement le nerf.

## 3. Corrections explicites aux anciennes propositions

| Carte | Ancienne proposition | Décision après réexamen |
|---|---|---|
| **Boku, présence apaisante** | 2 → 1 et −1 PV | **Retirer. Reste à 2, 2/3.** Boku appartient aux Weebos, soigne les créatures voisines en fin de tour et aide à atteindre les seuils Weebos. La réduire à 1 tout en ne comptant que son corps sous-estimait ses effets cumulés. |
| **Boku, Japan Expo enjoyer** | 4 → 3 | **Retirer. Reste à 4 pour l'instant.** Son Cri invoque deux Weebs 1/1 : la carte forme trois corps Weebos en tout avec Boku, ce qui peut activer immédiatement un palier de famille. Ce n'est pas un simple 2/2. |
| **Slowmode** | 5 → 6, effet renforcé | **Retirer toute hausse et tout renforcement. Reste à 5, effet inchangé.** Bloquer toutes les créatures ennemies et piocher une carte est déjà un puissant retournement de tempo. |
| **@everyone** | 4 → 5 et dégâts augmentés | **Retirer. Reste à 4 et inflige 4 dégâts comme aujourd'hui.** Le sort touche toutes les créatures, y compris celles de son propriétaire ; cette symétrie fait partie de sa puissance et de son risque. |
| **Mise à jour du Bot** | 3 → 5 | **Retirer pour l'instant. Reste à 3.** Le Bot 2/5 avec Rempart est une créature supplémentaire qui protège le héros ; sa valeur dépasse celle d'un corps 2/5 nu, sans pour autant justifier de le déplacer arbitrairement à 5. |
| **Ducks in a muck** | 3 → 6 | **Retirer. Reste à 3.** Les Canards 0/3 remplissent les deux plateaux et modifient les attaques des deux joueurs. C'est un effet symétrique et très dépendant de la situation, pas une grosse carte de fin de courbe. |
| **Miichi, cosplayeuse express** | 2 → 1 et −1 ATK | **Retirer. Reste à 2 et conserve son Cri.** Elle crée une Weeb 1/1 : le corps invoqué compte pour les seuils Weebos et rend le coût effectif différent de celui d'une 2/1 isolée. |
| **Potatoll, serviteur de Kiwi** | 2 → 1 et −1 ATK | **Retirer. Reste à 2 et conserve son Cri.** Elle crée un second corps. Kiwi n'est pas Weebos, mais l'invocation fournit quand même un bloqueur et une présence séparée sur le plateau. |
| **Saja, presque world first Rygelon** | 3 → 2 | **Retirer. Reste à 3.** Son Cri peut réduire une créature ennemie à 1 PV : c'est un retrait conditionnel majeur, pas un simple effet de stats sur un 1/2. |
| **Nerfs ou buffs de stats ajoutés pour « coller » au nouveau coût** | Plusieurs cartes, notamment des légendaires | **Retirer toute la liste d'ajustements de stats.** Ces changements n'ont pas été validés avec les synergies de plateau et pouvaient effacer ou inverser l'effet du changement de coût. |

### Contrôle à 1 : le diagnostic précédent était faux

Il existe déjà des options de contrôle à bas coût : **Mute** (1), **Nerf** (1), **Réémigration prioritaire** (1, conditionnelle à la famille), ainsi que des réponses à 2 comme **Ping**, **Kick** et **Sanction** sous condition. Il ne faut donc pas déplacer une carte vers 1 uniquement pour « créer du contrôle à 1 ». La vraie question est la diversité, la disponibilité et le coût d'opportunité de ces réponses dans les decks.

## 4. Nouvelles orientations — candidates à tester, pas changements validés

Les quelques déplacements ci-dessous sont des hypothèses plus mesurées. Ils ne sont pas accompagnés de nerfs ou de buffs de stats.

| Carte | Coût actuel → candidat | Motif et garde-fou |
|---|---:|---|
| **Coco, esprit tourmenté** | 2 → **3** | Son Tilt « pioche 3, garde 1 » donne un choix de cartes de grande qualité et un corps 0/4. Tester d'abord un seul cran (pas 4), en mesurant la valeur de la main, les déclenchements du Tilt et ses synergies Alien/Ravagés. |
| **Elkatrix, doux comme un agneau** | 2 → **3** | Le doublement des effets des terrains LoL a une forte valeur conditionnelle et peut doubler des déclenchements répétés. Vérifier sa fréquence réelle dans les decks et sa combinaison avec les terrains avant de retenir la hausse. |
| **Osiris, joueur retraité** | 2 → **3** | Rempart 0/4 et effets de fin de tour liés au terrain : le rôle défensif est immédiat, mais la valeur additionnelle dépend de l'affinité de terrain. Tester séparément les terrains LoL, Dofus et CS. |
| **Coco, flashin 1v4** | 2 → **1, à tester seulement** | Cette hypothèse de baisse ne peut être retenue que si le corps et le texte réel sont faibles dans les decks concernés. Avant décision, compter ses affiliations, les effets de famille auxquels elle contribue et son interaction avec Ravagés/Aliens. Aucun retrait de PV proposé. |

Les autres changements de coût proposés dans l'ancienne version sont **en attente**, pas reconduits par défaut. Cela concerne notamment les personnages à Agonie, Respawn, Frénésie, croissance, aura, contrôle d'une créature, invocation de jetons ou effet conditionné par une famille/un terrain. Leur rang dans la courbe devra venir après la mesure de leur contribution complète au plateau.

## 5. Comment réduire le pic du coût 2 sans casser les familles

- Commencer par les cartes à effet **autonome**, sans jeton ni capacité récurrente, dont les résultats montrent un avantage constant à coût 2.
- Pour une carte qui crée des corps ou active un seuil de famille, **conserver d'abord son coût et son texte**, puis mesurer son taux d'inclusion, son impact lorsque le seuil est atteint et son taux de victoire dans plusieurs decks.
- Préférer un changement d'un seul cran à la fois. Ne pas déplacer une carte de 2 à 4 sur la base d'un score statique.
- Garder des communes jouables à 2–3 : la rareté n'oblige pas à pousser artificiellement les communes à 5–8. Des coûts élevés pour une commune ne sont pertinents que si son effet existant offre déjà une valeur de fin de partie cohérente.
- Vérifier les courbes **par deck**, et non seulement la distribution globale : un deck Weebos doit pouvoir assembler ses membres tôt, tandis qu'un deck contrôle peut accepter des réponses plus chères s'il survit jusque-là.

La nouvelle cible est donc **qualitative avant d'être numérique** : réduire le nombre de cartes 2 réellement surperformantes, ajouter quelques options utiles au coût 1 seulement quand elles sont saines, et déplacer vers 3–5 les cartes dont la puissance observée le justifie. Je ne propose pas de nouvelle table de comptes « après » tant que les choix carte par carte n'ont pas été testés ; annoncer de tels comptes maintenant donnerait une précision trompeuse.

## 6. Protocole de validation avant application

Pour chaque carte candidate :

1. Faire tourner des parties avec les versions avant/après, à decks et graines appariés, sièges alternés.
2. Tester au minimum les archétypes qui exploitent ses familles et affinités, ainsi qu'un deck sans cette synergie.
3. Enregistrer taux de sélection/inclusion, coût moyen réellement payé, tours de pose, valeur des jetons créés, fréquence des seuils de famille atteints, et winrate.
4. Tester les synergies de terrain séparément, notamment les effets doublés par Elkatrix.
5. Pour les sorts globaux ou symétriques (dont Slowmode, @everyone et Ducks in a muck), analyser plusieurs états de plateau ; leur valeur moyenne seule masque les retournements extrêmes.
6. Accepter un changement seulement s'il améliore la répartition sans rendre un archétype ou une combinaison de famille excessivement dominant.

Les résultats chiffrés de l'ancien document (winrates « après », indice de puissance et courbe simulée) sont **invalidés et supprimés** : le test ne modélisait pas fidèlement tous les coûts, effets proposés et synergies. Il faudra relancer ces mesures sur les modifications exactes, dans le moteur réel, avant d'en tirer une conclusion.

## 7. État des fichiers

- Ce document est une proposition de rééquilibrage uniquement ; **aucune carte n'a été modifiée**.
- L'amélioration distincte de l'IA est dans `js/ai.js`, `js/duel-ui.js` et `js/arena.js` ; elle ne change ni les coûts ni les effets des cartes.
- Aucune modification n'a été poussée.
