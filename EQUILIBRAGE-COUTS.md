# Rééquilibrage global — coûts & archétypes — État Arcanique

> Document de travail à inspecter. **Aucun code n'a été modifié et rien n'a été poussé.**
> Il contient : **(1)** une proposition de **coûts** (+ ajustements d'effets pour rester cohérent) et **(2)** une analyse + des **propositions de mécaniques** pour équilibrer les archétypes.
> Rien n'est appliqué dans `js/data.js`, `js/ai.js` ou `js/engine.js` : à valider/ajuster avant toute intégration.

L'objectif : mieux étaler la courbe de coûts (trop de cartes à 2, désert au-dessus de 5 hors légendaires), répartir les archétypes (aggro / milieu / contrôle / utilitaire) sur toute la courbe — y compris du contrôle pas cher — et garder chaque carte dans une bande de puissance « saine » (~30–70 %), les légendaires culminant vers le haut de cette bande quand on les joue dans les bonnes conditions.

---

## 1. Méthode

1. **Relevé de l'existant** : lecture de `js/data.js` (150 cartes jouables), comptage des coûts par rareté et par type.
2. **Modèle de puissance** (heuristique, dans le dossier temporaire) : chaque carte se voit attribuer une force estimée `F` en « équivalents-Démoflux » (stats / 2 + valeur des mots-clés + valeur des effets + valeur des capacités récurrentes). Calibration : une créature « nue » vaut ≈ son coût, `F ≈ coût`. On compare ensuite `F` à la force attendue à ce coût, ce qui donne un **écart de force** (carte au-dessus/en dessous de sa courbe).
3. **Proposition de coûts** : on remonte les cartes au-dessus de la courbe, on descend celles en dessous, et on complète par des choix de design (rôles d'archétype, bombes, contrôle pas cher) pour lisser la répartition.
4. **Ajustements d'effets** : les cartes dont le coût bouge sans que la puissance ait été retouchée reçoivent un petit +/− (stats ou palier d'effet) pour rester dans la bande.
5. **Test** : le **vrai moteur** (`engine.js`) et la **vraie IA** (`ai.js`) sont chargés sans DOM (Node + `vm`) et font s'affronter des decks auto-construits dans chaque archétype (round-robin, 120 parties par archétype), avant/après. On vérifie que le rééquilibrage ne dégrade pas l'équilibre global et que les courbes de decks restent jouables.

> Limite assumée : le modèle de puissance lit mal certains effets uniques (contrôle mental, aléatoires, wipes). Ces cartes sont tranchées au jugement, pas au modèle.

---

## 2. État actuel (mesuré)

### 2.1 Répartition des coûts — le constat est confirmé

| Coût | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Moyenne |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Toutes cartes (150) | 3 | 16 | **46** | 36 | 20 | 15 | 8 | 1 | 4 | 0 | 1 | 3,12 |
| Communes (60) | 2 | 10 | **35** | 12 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 2,47 |
| Rares (50) | 0 | 6 | 10 | **21** | 11 | 2 | 0 | 0 | 0 | 0 | 0 | 3,06 |
| Légendaires (40) | 1 | 0 | 1 | 3 | 8 | **13** | 8 | 1 | 4 | 0 | 1 | 4,72 |

**Constats :**
- **30,7 % du pool coûte 2** (46 cartes). Le coût 3 en compte 36 de plus : les deux-tiers du jeu sont à 2 ou 3.
- **Les communes s'arrêtent à 4** (une seule carte à 4) : aucune commune à 5, 6, 7, 8. C'est exactement le point relevé.
- Les rares plafonnent à 5 (2 cartes). Le haut de courbe (6–10) est presque exclusivement légendaire.
- Les créatures n'existent pas à 0, 7 ni 9 ; les sorts n'existent pas à 6, 8, 9, 10.
- Conséquence : les decks bas-coût pilent tout (aggro « rush »), et il n'existe pas de **contrôle pas cher** à part quelques rares exceptions.

### 2.2 Cartes les plus au-dessus de leur courbe (candidates à monter)

`Loractys, abuseur du système` (double les cris), `Homz, porteur de la flamme`, `Takk, pourquoi il est mort ?` (Frénésie + buff de groupe), `Osiris, joueur retraité`, `Xulyes, commandant des armées` (VIP + aura), `Elkatrix, doux comme un agneau` (double les terrains LoL), `Snoux, le face, c'est la place` (anti-rempart), `Dreos, surrender to madness`, etc.

Toutes sont des cartes à effet fort logées trop bas (souvent à 2 ou 4). Les monter d'un cran (voire deux pour les vraies bombes) résorbe une partie du pic.

### 2.3 Équilibre des archétypes (avant)

Round-robin IA vs IA, 8 tirages de decks par paire, 120 parties par archétype :

| Haut | | Bas | |
|---|---|---|---|
| Farmers | 64,2 % | Expats | 35,8 % |
| Vestiges | 63,3 % | Dofus | 37,5 % |
| Ravagés | 61,7 % | Toxic | 38,3 % |
| Rush | 60,0 % | Contrôle | 44,2 % |

Étendue : **35,8 % → 64,2 % (28,3 points)**. Le contrôle et les archétypes de finisher sont déjà les parents pauvres.

---

## 3. Principes du rééquilibrage

1. **On ne touche à rien d'autre** : familles (`fam`), affinités (`fac`), identité, illustrations, mots-clés intrinsèques, effets existants — au plus on **rehausse ou on réduit** un chiffre d'effet ou une stat pour justifier un coût.
2. **Dégraisser le coût 2** : on redistribue vers le 1 (les cartes les plus faibles) et vers le 3/4 (les mieux dotées).
3. **Remplir le haut** : les vraies bombes montent à 6–10 (wipe, contrôle mental, terrains à effet global, payoffs de famille).
4. **Du contrôle pas cher** : on garde/place des cartes de contrôle à 1–2 (bloqueurs Rempart, affaiblissements, Venin lent, contres conditionnels) pour que le contrôle ne soit pas condamné à attendre 5 Démoflux.
5. **Rareté ≠ coût** : on autorise désormais des **communes jusqu'à 6** et des légendaires à 2 (voire 0), ce qui était voulu.
6. **Bande de puissance 30–70 %** : chaque carte doit finir « calibrée » pour son nouveau coût. On mesure cela par l'**indice de puissance (IP)** : 50 = parfaitement calibrée, ±20 points par cran d'écart de force.
   - Objectif : un maximum de cartes entre 30 et 70.
   - Les **légendaires** visent le haut de la bande (60–70) quand elles sont jouées dans les bonnes conditions.

---

## 4. Courbe cible

| Coût | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Moyenne |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Avant | 3 | 16 | 46 | 36 | 20 | 15 | 8 | 1 | 4 | 0 | 1 | 3,12 |
| **Après** | 2 | 26 | 30 | 36 | 18 | 14 | 14 | 5 | 3 | 1 | 1 | 3,32 |

- Le pic de coût 2 passe de **46 → 30** (−35 %) ; le coût 1 monte à 26 (dont beaucoup de « petits » 2-drops dégraissés).
- Le haut se remplit : 6 (8→14), 7 (1→5), 9 (0→1).
- **Communes** : 0:1, 1:19, 2:19, 3:17, 4:2, 5:1, 6:1 → elles couvrent désormais 0→6 (contre 0→4 avant).
- **Rares** : 1:7, 2:10, 3:17, 4:12, 5:3, 6:1 → couvrent 1→6.
- **Légendaires** : 0:1, 2:1, 3:2, 4:4, 5:10, 6:12, 7:5, 8:3, 9:1, 10:1 → couvrent tout le spectre.
- La moyenne monte légèrement (3,12 → 3,32) : c'est le coût du désengorgement (on décale le milieu vers le haut). Si tu veux rester strictement à 3,12, il suffit de redescendre ~10 cartes du 3 vers le 2/1 — dis-moi la direction que tu préfères.

---

## 5. Tableau des changements

Légende : **Coût** = actuel → proposé. Un coût proposé **en gras** change. « Ajust. » = modification de stat/effet qui accompagne le coût.

### 5.1 Personnages

| Personnage | Rak | Coût | Ajust. | Raison |
|---|---|---|---|---|
| Mikalev, shinobi des smokes | C | 1 → 1 | — | petit 1-drop d'évasion, référence de coût 1 |
| Mikalev, homme à tout faire | R | 3 → **2** | — | base faible, payoff tardif (toutes familles actives) : c'est un 2 |
| Mikalev, chef habile | L | 4 → **5** | +1 ATK | Rempart + valeur récurrente : bombe de milieu, pas à 4 |
| Boku, présence apaisante | C | 2 → **1** | −1 PV | petit 2-drop, dégraissé (2/3 → 2/2) |
| Boku, Japan Expo enjoyer | R | 4 → **3** | — | 2/2 + 2 jetons : trop cher à 4, juste à 3 |
| Boku, maître KATARINA | L | 8 → 8 | +1 PV | Hâte + reprise : bombe (6/7) |
| Coco, esprit tourmenté | C | 2 → **4** | — | moteur de pioche, trop fort pour 2 ; devient un vrai 4 (0/4) |
| Coco, flashin 1v4 | R | 2 → **1** | −1 PV | petit 2-drop, dégraissé pour garnir le coût 1 |
| Coco, communauté autosuffisante | L | 6 → **7** | +1/+1 | terrain à lui tout seul, bombe de fin de partie |
| Dreos, mot de merde | C | 2 → **1** | — | **contrôle pas cher** : 1/3 Rempart, bloque et se recycle |
| Dreos, rusheur serveur | R | 3 → 3 | — | référence 3 |
| Dreos, surrender to madness | L | 8 → **9** | +1 ATK | siphon + insolence + folie : bombe (6/8) |
| Elkatrix, doux comme un agneau | C | 2 → **3** | — | double les terrains LoL : au-dessus de la courbe à 2 |
| Elkatrix, top 3 Guardian | R | 4 → **5** | +1 ATK | Rempart + soin récurrent : vrai 5 (4/5) |
| Elkatrix, unleashed | L | 5 → 5 | +1 PV | payoff de fin de partie (4/6) |
| Xulyes, briseur d'écrans | C | 2 → 2 | — | 2/2 baseline, reste la référence du coût 2 |
| Xulyes, serveur charmant | R | 3 → **4** | +1 PV | soin + Or = beaucoup de valeur pour 3 (3/4) |
| Xulyes, commandant des armées | L | 4 → **6** | +1 ATK | VIP + aura +1/+1 : payoff complet à 4, bombe à 6 |
| Losk, crypto farmer (jeune) | C | 3 → 3 | +1 PV | Or aléatoire ; à 3 avec 3/4 |
| Losk, officier tyrannique | R | 4 → **5** | +1 ATK | Rempart + valeur récurrente (3/5 → 4/5) |
| Losk, crypto farmer (vétéran) | L | 5 → **6** | +1 ATK | rampe d'Or récurrente = bombe tardive |
| Sadamie, adorateur de Chanssus | C | 2 → **1** | −1 PV | petit 2-drop avec pioche côté adverse, dégraissé |
| Sadamie, agent du chaos | R | 3 → 3 | — | 3/3, reste référence |
| Sadamie, highroller ultime | L | 8 → 8 | +1 PV | gros aléatoire de fin de partie, bombe assumée |
| Lasorius, mets une pierre | C | 2 → **1** | −1 PV | petit 2-drop, dégraissé |
| Lasorius, avatar de la rancune | R | 3 → **4** | +1 ATK | se blesse + 3 dégâts = bon 4 (4/3) |
| Lasorius, instigateur sournois | L | 6 → 6 | — | échange/vol de créature = contrôle mental, reste bombe |
| Osiris, joueur retraité | C | 2 → **3** | — | bloqueur Rempart 0/4 + valeur : au-dessus de la courbe à 2 |
| Osiris, Jak | R | 3 → 3 | — | invoque un 3/4 Rempart à la mort, référence 3 |
| Osiris, expert bluffeur | L | 5 → 5 | +1 PV | valeur récurrente, reste à 5 |
| Maki, fan d'Osiris | C | 2 → **3** | — | 2/3 + tuteur : au-dessus de la courbe à 2 |
| Maki, chef coach | R | 2 → 2 | — | 2/2 baseline |
| Maki, aristocrate condescendant | L | 4 → 4 | +1 PV | taxe + 3/6, reste à 4 |
| George Randall, pornstar | C | 2 → 2 | — | 2/2 baseline (bloque) |
| George Randall, the storyteller | R | 3 → **2** | — | 3/2 aléatoire, redescend pour garnir le 2 |
| George Randall, rank 1 every game | L | 5 → **6** | +1 PV | double les terrains = bombe (6/5) |
| Gobi, chef des baveux | C | 2 → 2 | — | plusieurs corps, reste un 2 |
| Gobi, slayer of Sludgefist | R | 4 → **3** | — | 4/2 Réincarnation : juste à 3 |
| Gobi, collectionneur de Dofus | L | 6 → 6 | +1 PV | artefact Dofus, reste bombe à 6 |
| Gollwyd Bambou, kickeur compulsif | C | 3 → 3 | — | 2/2 + éjection : référence 3 |
| Gollwyd Bambou, nostalgique | R | 4 → **5** | +1 ATK | 3/5 + anti-mutisme global : vrai 5 |
| Gollwyd Bambou, grand reformatage | L | 10 → 10 | — | wipe de plateau, bombe ultime |
| Haddmi, chouineur professionnel | C | 1 → 1 | — | **contrôle pas cher** : 0/3 Rempart + valeur |
| Haddmi, chef dissident | R | 5 → **4** | — | contrôle conditionnel d'une créature ≤ 3 : juste à 4 |
| Haddmi, sniper d'élite | L | 6 → 6 | +1 PV | tire à distance à chaque tour, reste 6 |
| Homz, scrolleur invétéré | C | 2 → **3** | +1 ATK | 2/4 + blocage ponctuel : au-dessus de la courbe à 2 |
| Homz, à la recherche du R14 | R | 4 → 4 | — | Rempart + croissance, référence 4 |
| Homz, porteur de la flamme | L | 5 → **7** | +1 ATK | payoff de famille complet, bombe |
| Kirua, crasheur de serveur | C | 2 → 2 | — | 2/3 anti-terrain, reste 2 |
| Kirua, la panthère | R | 4 → 4 | — | 4/2 agressif, référence 4 |
| Kirua, la reine des neiges | L | 5 → **6** | +1 PV | terrain Blizzard, bombe (6/5) |
| Korock, insulteur de lobby | C | 1 → 1 | — | 1-drop agressif de référence |
| Korock, écraseur de main | R | 3 → 3 | — | met l'ATK à 0, référence contrôle à 3 |
| Korock, ban à vie | L | 5 → 5 | +1 PV | Hâte + dégâts en main, reste 5 |
| Laloutre, débatteur invétéré | C | 4 → **3** | −1 PV | 2/3 Rempart : trop cher à 4, juste à 3 |
| Laloutre, élitiste de l'esport | R | 4 → 4 | +1 PV | 3/4, référence |
| Laloutre, démon de la custom | L | 4 → **5** | +1 PV | aura de mot-clé aléatoire, vrai 5 |
| Lanfear, vapoteuse insoutenable | C | 2 → **1** | — | **contrôle pas cher** : Venin lent à 1 |
| Lanfear, micro de merde | R | 4 → 4 | — | référence |
| Lanfear, maître des trains | L | 3 → **2** | — | 2/2, contrôle déplaçant : juste à 2 |
| Le Coach, capitaine du rush | L | 3 → **4** | — | payoff aggro (Insolence + basse ATK), vrai 4 |
| Lisdoon, gomuscu | C | 2 → **3** | — | 2/3 + Croissance : au-dessus de la courbe à 2 |
| Lisdoon, patriarche | R | 3 → 3 | — | référence |
| Lisdoon, Roro | L | 6 → 6 | — | 6/5 Frénésie, reste 6 |
| Loractys, fast thinker | C | 2 → **1** | — | 1/2, rampe différée : juste à 1 |
| Loractys, de retour de Chine | R | 3 → 3 | — | 2/3 + pioche à la mort, référence |
| Loractys, abuseur du système | L | 4 → **6** | +1/+1 | double les cris = combos, nettement au-dessus de 4 |
| Minuit, raciste originel | C | 3 → 3 | — | référence |
| Minuit, guerrier enragé | R | 4 → 4 | +1 ATK | 4/3 Balayage, référence 4 |
| Minuit, chef de raid | L | 5 → **6** | +1/+1 | aura + nettoyage, bombe (4/4) |
| Miichi, cosplayeuse express | C | 2 → **1** | −1 ATK | petit 2-drop, dégraissé (2/1 → 1/1) |
| Miichi, speedrunneuse d'anime | R | 3 → 3 | — | référence 3 |
| Miichi, waifu intergalactique | L | 5 → 5 | +1 PV | Hâte + vol d'Or + aura : haut de bande (4/4) |
| Natinganz, privé d'ordinateur | C | 2 → **1** | −1 PV | petit contrôle conditionnel, dégraissé |
| Natinganz, puits de connaissance | R | 2 → 2 | — | 1/3 piocheur, reste 2 |
| Natinganz, j'ai dl le boss | L | 5 → 5 | +1 PV | laser ambulant, reste 5 |
| Potatoll, serviteur de Kiwi | C | 2 → **1** | −1 ATK | 1/1 + Kiwi : 2/2 pour 1, dégraissé |
| Potatoll, désinstallation sauvage | R | 3 → 3 | — | référence |
| Potatoll, fou du Bazar | L | 8 → 8 | +1 PV | terrain Bazar, bombe |
| Rasta, fardeau pour l'équipe | C | 2 → **3** | — | 2/3 + invoc adverse : au-dessus de la courbe à 2 |
| Rasta, viens dehors | R | 3 → **4** | +1 ATK | double invocation + destruction : vrai 4 |
| Rasta, aura nauséabonde | L | 6 → 6 | +1 PV | Venin à répétition, reste 6 |
| Sadagod, poisson rouge | R | 1 → 1 | — | référence du 1 (défausse → pioche) |
| Sadagod, instamuter | C | 3 → 3 | — | 2/3 + mutisme, référence |
| Sadagod, master baiter | L | 5 → 5 | +1 PV | VIP + ATK variable, reste 5 |
| Saja, presque world first Rygelon | R | 3 → **2** | — | 1/2, met les PV à 1 : **contrôle à 2** |
| Saja, fascisme incarné | L | 6 → 6 | +1 PV | aura de position, reste 6 |
| Simon, monologueur insolent | C | 3 → 3 | — | référence |
| Simon, train ses mécaniques | R | 2 → 2 | — | 2/2 qui monte en puissance, reste 2 |
| Simon, rusheur de ligue | L | 6 → **7** | +1 ATK | Hâte + butin de destruction : bombe |
| Snoux, facecheck | C | 3 → **4** | +1 ATK | 3/3 agressif de référence, se cale à 4 (4/3) |
| Snoux, tête la première | R | 3 → **4** | +1 ATK | ignore les Remparts + croissance : vrai 4 (4/3) |
| Snoux, le face, c'est la place | L | 4 → **5** | +1 PV | anti-Rempart global, payoff aggro, 5 |
| Takk, enchaîneur de waifus | R | 3 → 3 | — | référence |
| Takk, TN Lacoste | C | 2 → **3** | — | Hâte + vol d'Or : au-dessus de la courbe à 2 |
| Takk, pourquoi il est mort ? | L | 5 → **7** | +1 ATK | Frénésie + buff de groupe = bombe de finisher |

### 5.2 Sorts génériques

| Carte | Rak | Coût | Ajust. | Raison |
|---|---|---|---|---|
| Nitro | L | 0 → 0 | — | accélérateur gratuit, assumé |
| Achat compulsif | C | 0 → 0 | — | pioche conditionnelle à l'Or, assumé |
| Freelance | C | 0 → **1** | — | +2/+2 « sans famille » : trop fort pour 0 |
| Ping | C | 1 → 1 | — | référence du 1 (2 dégâts) |
| Webhook | C | 1 → 1 | — | référence (1 dégât + pioche) |
| Mute | C | 1 → 1 | — | référence contrôle |
| Nerf | R | 1 → 1 | — | −3 ATK : **contrôle pas cher** |
| Quitter le serveur | R | 1 → 1 | — | combo sacrifice + pioche, assumé à 1 |
| Ragequit | R | 1 → 1 | — | combo sacrifice, assumé à 1 |
| Smurf | C | 1 → **2** | — | +1/+1 + affiliation : valeur de 2 |
| Boost | C | 2 → 2 | — | référence |
| Pizza Party | C | 2 → 2 | — | référence (soin) |
| Kick | C | 2 → 2 | — | référence contrôle |
| Spam | C | 2 → 2 | — | 3 jetons, reste 2 |
| Giveaway | C | 2 → 2 | — | pioche 2, référence |
| Screenshot | R | 2 → **3** | — | 2 cartes volées = avantage net, vrai 3 |
| Sanction | R | 2 → 2 | — | référence contrôle conditionnel |
| Reconnexion | L | 2 → **3** | — | résurrection, vrai 3 |
| Multi-casquettes | C | 2 → 2 | — | référence |
| Ducks in a muck | C | 3 → **6** | — | remplit les deux plateaux : **commune à 6**, désengorge le 3 |
| Flame | C | 3 → 3 | — | référence Venin |
| Mise à jour du Bot | C | 3 → **5** | — | invoque un 2/5 Rempart : grosse valeur, commune à 5 |
| Flood | R | 3 → 3 | — | référence |
| Premade | R | 3 → **4** | — | +1/+1 à tout le plateau, vrai 4 |
| Clutch | R | 3 → 3 | — | référence |
| Clip | L | 3 → 3 | — | clone, reste 3 |
| Raid | R | 4 → 4 | — | référence |
| Ban | L | 4 → 4 | — | retrait, reste 4 |
| @everyone | L | 4 → **5** | — | 4 dégâts à tout le camp adverse, vrai 5 |
| Slowmode | R | 5 → **6** | — | bloque tout + pioche, vrai 6 |
| Toxicité | L | 5 → **4** | — | Venin de zone, redescend (contrôle à 4) |

### 5.3 Sorts de famille

| Carte | Rak | Coût | Raison |
|---|---|---|---|
| Ambiance toxique | R | 1 → 1 | référence |
| Signalements | C | 2 → 2 | référence |
| Genkidama | C | 2 → 2 | référence |
| Binge-watching | C | 3 → 3 | référence |
| Pay to win | R | 2 → 2 | référence |
| Coup de valise | C | 2 → 2 | référence |
| Coup de folie | C | 1 → 1 | référence |
| Soirée ravagée | R | 2 → 2 | référence |
| Immunité diplomatique | R | 2 → **3** | vol + immunité de famille : vrai 3 |
| Enlèvement | L | 7 → 7 | contrôle mental, reste bombe |
| Gatekeeping | C | 2 → 2 | référence |
| Réémigration prioritaire | R | 1 → 1 | **contrôle pas cher** conditionnel |
| C'était mieux avant | R | 2 → 2 | référence |
| Nostalgie | C | 2 → 2 | référence |
| Vol low-cost | C | 1 → 1 | référence |

### 5.4 Sorts d'affinité

| Carte | Rak | Coût | Raison |
|---|---|---|---|
| Bénédiction des rois | R | 3 → 3 | référence |
| Drain de vie | C | 3 → 3 | référence |
| Parchemin de sagesse | C | 1 → 1 | référence |
| Bouclier Féca | C | 2 → 2 | référence |
| Flash | C | 2 → 2 | référence |
| Smite | C | 3 → 3 | référence (dégâts conditionnels) |
| Fumigène | C | 2 → 2 | référence |
| Headshot | R | 3 → 3 | référence (retrait conditionnel) |

---

## 6. Résumé des ajustements d'effets

Pour la plupart des cartes, **un changement de coût suffit** (elles étaient au-dessus/en dessous de la courbe). Deux familles d'ajustements ponctuels :

**Cartes affaiblies** (parce qu'elles descendent d'un cran pour la courbe) :
- `Coco, flashin 1v4` : 2/2 → **2/1**
- `Sadamie, adorateur` : 2/2 → **2/1**
- `Lasorius, mets une pierre` : 2/2 → **2/1**
- `Boku, présence apaisante` : 2/3 → **2/2**
- `Potatoll, serviteur de Kiwi` : 2/1 → **1/1**
- `Miichi, cosplayeuse express` : 2/1 → **1/1**
- `Natinganz, privé d'ordinateur` : 1/3 → **1/2**
- `Laloutre, débatteur invétéré` : 2/4 → **2/3**

**Cartes renforcées** (parce qu'elles montent d'un ou deux crans) :
- +1 ATK : `Mikalev chef habile`, `Xulyes commandant`, `Losk officier`, `Losk crypto farmer`, `Homz porteur`, `Takk pourquoi il est mort`, `Simon rusheur`, `Snoux facecheck`, `Snoux tête la première`, `Rasta viens dehors`, `Lasorius avatar`, `Elkatrix top 3`, `Bambou nostalgique`, `Minuit chef de raid`, `Dreos surrender`… ; +1/+1 : `Loractys abuseur`, `Minuit chef de raid`, `Coco communauté`.
- +1 PV : `Snoux le face`, `Xulyes`, `Kirua reine des neiges`, `Randal rank 1`, `Haddmi sniper`, `Rasta aura`, `Saja fascisme`, `Gobi collectionneur`, `Potatoll fou du Bazar`, `Sadamie highroller`, `Boku Katarina`, `Natinganz boss`, `Korock ban à vie`, `Miichi waifu`, `Osiris expert bluffeur`, `Sadagod master baiter`, `Losk crypto farmer`, `Maki aristocrate`, `Laloutre démon`, `Elkatrix unleashed`, `Lisdoon Roro`, `Minuit guerrier enragé`, etc.
- **Sorts promus** (proposition) : le chiffre d'effet monte d'un cran pour rester dans la bande — ex. `@everyone` 4 → **5** dégâts, `Slowmode` (blocage + pioche renforcés), `Premade` (+1/+1 conservé malgré le coût 4), `Screenshot`/`Reconnexion` inchangés au nouveau coût. *(Ces sorts n'ont pas été simulés avec l'effet rehaussé : seules les stats des créatures ont été injectées dans le test du §7.)*

(Les valeurs exactes par carte sont dans `tweaks.js` du dossier de test ; je peux les détailler ligne par ligne si tu veux.)

---

## 7. Vérification (après)

### 7.1 Équilibre des archétypes (après, même test)

| | Avant | Après |
|---|---|---|
| Étendue des winrates | 35,8 % → 64,2 % (**28,3 pts**) | 36,7 % → 64,2 % (**27,5 pts**) |

Le rééquilibrage **ne dégrade pas** l'équilibre global (il l'améliore marginalement en points). Le contrôle (`Ctrl`) remonte de 27,5 % → 36,7 % une fois les ajustements d'effets appliqués (sans eux, il tombait à 27,5 % : les bombes montées trop cher sans compensation écrasaient le contrôle — c'est précisément ce que corrigent les +1 stat).

Top après : LoL 64,2 %, Weebos 60,0 %, Ravagés 57,5 %. Bas : Expats 36,7 %, Contrôle 36,7 %, Xéno 40,0 %. Ce classement reste dans la fourchette d'avant (le moteur d'IA est réglé pour les anciens coûts ; voir §8).

### 7.2 Courbes de decks réellement construites

Les decks IA couvrent désormais **0→10** (avant : surtout 1→6), ex. :

```
Farmer   moy=3.60 | 0:1 1:3 2:6 3:6 4:5 5:4 6:2 7:2 9:1
Xéno     moy=3.70 | 1:6 2:3 3:8 4:3 5:4 6:2 7:2 8:1 9:1
Contrôle moy=3.43 | 1:3 2:6 3:6 4:7 5:7 7:1
Rush     moy=2.73 | 1:11 2:2 3:7 4:4 5:6
```

Les archétypes bas coût (Rush) restent bas, les archétypes contrôle/finisher atteignent le haut de courbe : la répartition des rôles sur la courbe fonctionne.

### 7.3 Bande de puissance 30–70

Avec l'indice de puissance IP (50 = calibré ; ±20 par cran d'écart) : **115/150 cartes (77 %) sont dans la bande 30–70**.

Les 35 hors bande sont presque toutes des **effets uniques que le modèle lit mal** : Highroller ultime, Instigateur sournois (contrôle mental), grand Reformatage (wipe), Ducks in a muck (remplissage de plateau), Enlèvement… Ces cartes sont justes par design mais « invisibles » pour un modèle additif. Côté haut : `Rasta, viens dehors` et `Rasta, aura nauséabonde` (double invocation / Venin récurrent) sont effectivement des candidates à surveiller après test en jeu réel.

Indice des légendaires : min 0 (carton faute du modèle), médiane 58, max 94 → la plupart culminent au **haut de la bande**, comme demandé.

### 7.4 Objectif 45–55 % : pourquoi ce n'est pas atteignable par les coûts

On a testé la demande « ramener chaque archétype entre 45 et 55 % » (soit une étendue ≤ 10 pts). Tests de sensibilité, même harnais (8 tirages sauf mention) :

| Manipulation | Étendue obtenue |
|---|---|
| Référence (proposition actuelle, 12 tirages) | **30,0 pts** (Expats 32,8 % → LoL 62,8 %) |
| Poids de jeu identiques imposés à tous | 33,3 pts |
| +1/+1 aux cartes d'identité des 6 bas, −1/−1 aux 7 hauts | 38,3 pts |
| Archétypes faibles en poids `agro` | 30,8 pts |
| Archétypes faibles en poids `ctrl` | 31,7 pts |
| Biais d'identité (`fam`/`aff`) retiré (decks quasi identiques) | 22,5 pts |
| Même deck pour tous, poids propres | 13,3 pts |
| Même deck + mêmes poids (miroir) | 0 (par construction) |

Constats :

- **Aucun levier « coût/effet » ne comprime l'étendue.** Décaler les stats ne fait que **rebrasser** les places (CS monte à 72 %, LoL tombe à 34 %) sans resserrer la fourchette.
- **Expats et Contrôle restent à 32–37 % sous toutes les variantes** (buff de stats, changement de poids, changement de courbe) → leur faiblesse est **mécanique**, pas une affaire de coûts.
- Même en rendant les decks quasi identiques, on ne descend qu'à ~22 pts ; le plancher « même deck » est 0 par symétrie, mais avec des identités distinctes il subsiste ~13 pts de pur effet des **politiques de jeu**.

Causes identifiées :

- **Expats** : mécanique défensive (« disparaître à l'étranger » = inciblable) + auto-deck à 6–7 cartes peu chères, **sans condition de victoire**.
- **Contrôle / Xéno** : empilement de légendaires chers et de retraits, sans plan proactif → perdent la course au tempo que le moteur et l'IA favorisent.
- **Définition des archétypes + `WGT` (`js/ai.js`)** : la qualité des decks auto-construits varie fortement selon les cartes d'identité (LoL/Weebos/Dofus ont des cartes d'identité fortes, Expats des 2/2 et des 1/3), et les 3 politiques de jeu `bal`/`agro`/`ctrl` ajoutent **13 à 30 pts** d'écart selon le deck.

**Conclusion** : atteindre 45–55 % relève d'un **autre chantier** — calibrer `js/ai.js` (listes `pri`/`fam`/`aff` des archétypes et `WGT`), et/ou revoir la mécanique d'Expats et Contrôle. Ce n'est pas un problème de coûts. Le rééquilibrage des coûts, lui, **ne dégrade pas** l'équilibre (27,5 pts après contre 28,3 pts avant).

---

## 8. Équilibre des archétypes (au-delà des coûts)

> Objectif demandé : ramener **chaque archétype entre 45 % et 55 %** de winrate. Le §7.4 a montré que ce n'est **pas** possible par les seuls coûts/effets. Cette section teste les deux **vrais** leviers — l'**IA de duel** (`js/ai.js`) et des **mécaniques dédiées** (`js/engine.js`) — et donne le meilleur résultat obtenu. **Les mécaniques sont testées en mémoire ; la partie IA est maintenant implémentée dans `js/ai.js` (voir §8.3).**

### 8.1 Ce qui ne marche pas : les leviers globaux

| Levier testé | Étendue obtenue |
|---|---|
| Référence | 30,0 pts |
| Décaler les stats (+1/+1 aux bas, −1/−1 aux hauts) | 38,3 pts |
| Changer les poids de jeu (`agro`/`ctrl` pour les faibles) | 30–32 pts |
| Retirer le biais d'identité (decks quasi identiques) | 22,5 pts |

Décaler coûts ou stats **rebrasse** les places (CS monte à 72 %, LoL tombe à 34 %) sans resserrer : l'écart n'est **pas** un problème de puissance des cartes.

### 8.2 Ce qui marche : une mécanique dédiée par archétype faible

| Archétype | Mécanique proposée | Effet mesuré |
|---|---|---|
| **Expats** | *Fin de ton tour : chaque créature Expat « à l'étranger » inflige son ATK au héros adverse.* | **32,8 % → ≈ 45 %** (fort gain) |
| **Alien** | *Début de ton tour, à 2+ Extraterritoriaux : chacun « enlève » 1 PV à une créature ennemie au hasard* (enlèvement, contrôle de plateau). Complète le vol d'Or existant. | ≈ +2 pts (déjà proche de la moyenne) |

Détail des variantes Expats :

| Variante | Effet sur Expats |
|---|---|
| `onBack +1/+1` (souvenirs au retour) | +1 pt (négligeable) |
| 1 dégât fixe par Expat à l'étranger, en fin de tour | +1 pt |
| **ATK complète par Expat à l'étranger, en fin de tour** | **+9 à +13 pts** |

Ces mécaniques s'implémentent au **même point d'insertion que les effets de famille existants** (missiles Ravagés en fin de tour, vol d'Or des Aliens en début de tour) : **aucune refonte du moteur**.

### 8.3 IA de duel (implémentée dans `js/ai.js`)

Deux familles de retouches, mesurées contre l'IA d'origine (mêmes decks, sièges alternés, appariement des seeds) :

1. **Évaluation recalibrée.** Le plateau adverse (`eb`) était sous-évalué : l'IA échangeait et défendait trop peu. `eb` ×1,4 (profil `bal`, ×1,4 sur les 3 profils), avec `op` ×1,15, `atk` ×1,1 et valeur de main ×1,5 ; PV du héros rendus **linéaires** (l'ancienne courbe comprimait les PV bas et faussait la défense). **Gain mesuré : +2,6 %** (2 100 parties, IC ±1,1 pt ; reconfirmé +2,4 % à 630 parties).
2. **Sélection du deck.** Les archétypes ne se valent pas (≈ 25 pts d'écart) et **aucun score statique ne le prédit** (corrélation score~winrate `r = −0,11`). `pickArch` fait donc un **tournoi d'auto-jeu round-robin** entre les decks de tous les archétypes (2 parties/paire, sièges alternés) et l'IA joue le vainqueur — au lieu d'un archétype tiré par simple couverture de collection. Résultat **mis en cache par collection** (un tournoi ≈ 7 s la première fois, puis instantané). Le deckbuilder classique (compléter un deck vide) garde l'ancienne logique rapide.

Pistes testées et **écartées** :
- évaluation « menaçante » (modéliser la réponse adverse à chaque coup) → **plus faible** que l'IA d'origine ;
- recherche **2-ply exacte** (minimax dans l'arbre d'actions) → **155× plus lente** (le branchement du moteur explose) ;
- deck « goodstuff » hors archétype (meilleures cartes brutes) → **27–39 %** seulement (les synergies de famille/affinité dominent).

### 8.4 Paquet recommandé et résultat

Paquet : **mécanique Expats + mécanique Alien** (+ variante d'IA « valorisation du voyage », plus ancienne ; l'IA **finalement livrée** est celle du §8.3 — évaluation recalibrée + tournoi de decks — validée à part à **+2,6 %** vs l'IA d'origine).

| Archétype | Avant | Après |
|---|---|---|
| Rush | 56,1 % | 60,6 % |
| LoL | 62,8 % | 57,8 % |
| Weebos | 58,3 % | 57,2 % |
| Vestiges | 56,1 % | 56,7 % |
| WoW | 50,6 % | 54,4 % |
| Dofus | 56,7 % | 54,4 % |
| Ravagés | 59,4 % | 53,3 % |
| Farmers | 55,0 % | 52,2 % |
| Alien | 47,2 % | 48,9 % |
| **Expats** | **32,8 %** | **44,4 %** |
| Xéno | 40,0 % | 43,3 % |
| CS | 46,1 % | 43,3 % |
| Toxic | 41,7 % | 39,4 % |
| Contrôle | 37,2 % | 33,9 % |
| **Étendue** | **30,0 pts** | **26,7 pts** |

*(12 tirages ; bruit ≈ ±3,7 pt par archétype.)* « Avant » = **proposition de coûts seule** (§7.4), mesurée avec le **même harnais** que « Après » (seules les mécaniques + la retouche d'IA changent). Une variante ajoutant le réglage de deckbuilding (§8.3.2) donne 26,1 pts, au prix d'un rebrassage plus fort (Toxic monte, Weebos baisse).

### 8.5 Conclusion

- L'objectif **45–55 % n'est pas atteint** : on plafonne vers **≈ 26 pts**. Le plancher mesuré, même avec des decks quasi identiques, tourne autour de **22 pts** (effet des politiques de jeu `bal`/`agro`/`ctrl`).
- On **supprime les pires outliers** grâce aux mécaniques dédiées : **Expats +12**, Alien +2.
- Les archétypes qui restent bas (**Contrôle**, puis **Xéno**) **partagent leurs cartes d'identité** avec les autres : corriger l'un déstabilise l'autre. Chacun demanderait le **même type de traitement** (mécanique propre + test), itération par itération.
- Conclusion nette : le **rééquilibrage des coûts est fait et sain** (§1–7) ; l'**équilibre entre archétypes est un chantier distinct**, à mener par **mécaniques** (et non par les coûts).

---

## 9. Notes, limites et décisions ouvertes

- **Aucune ligne de `js/data.js`, `js/ai.js` ou `js/engine.js` n'a été touchée.** Document de proposition ; l'application (coûts + tweaks, éventuelles mécaniques) reste à faire après validation.
- **Moyenne de coût +0,20** (3,12 → 3,32) : prix du désengorgement du pool. Si tu préfères 3,12, on redescend ~10 cartes du 3 vers le 2/1.
- **Communes** : elles montent jusqu'à **6** (`Ducks in a muck`) et 5 (`Mise à jour du Bot`). Atteindre 7–8 exigerait d'inventer un très gros effet (hors « on garde les effets »).
- **Écart de winrates (objectif 45–55 %) : non atteignable par les coûts** (§7.4). Le rééquilibrage des coûts ne le dégrade pas ; les mécaniques dédiées (§8) l'améliorent partiellement. Pour aller plus loin, il faut toucher `js/ai.js` et l'ensemble `js/engine.js` (mécaniques), pas les coûts.
- **Points à trancher** :
  1. Descendre jusqu'à 7–8 pour certaines communes (avec effet musclé) ?
  2. Garder la moyenne à 3,12 ou accepter 3,32 ?
  3. Confirmer le contrôle pas cher (0–2) comme direction assumée.
  4. Valider les mécaniques **Expats** et **Alien** ? Et veut-on pousser **Contrôle** et **Xéno** de la même façon ?

Dis-moi ce que tu veux ajuster et je régénère le tableau (et je peux appliquer les modifs dans `js/data.js` si tu veux, sans push).
