# Anti-triche du classement d'Arène (Cloud Function `arena`)

Le classement hebdomadaire d'Arène était écrit directement par le navigateur : n'importe qui pouvait
l'incrémenter depuis la console (F12) ou avec un script, sans jouer. Désormais c'est **cette fonction**
qui écrit les compteurs, et les règles Firestore interdisent l'écriture directe.

## Ce que fait la fonction

| opération | qui l'appelle | ce qu'elle vérifie / écrit |
|---|---|---|
| `run` | entrée dans l'Arène | max `12` courses par 24 h glissantes → `runs +1`, ouvre l'état de course |
| `match` | début d'un duel (IA ou joueur) | délivre un **billet horodaté** (un seul à la fois) |
| `win` | victoire d'un duel | billet valide **et** match d'au moins `60 s` **et** course < 9 V → `total +1`, `winsAI`/`winsHuman +1`, journalise `elapsedMs` |
| `loss` | défaite (ou partie quittée) | consomme le billet, ferme la course à la 3ᵉ défaite (pas de compteur) |
| `end` | abandon / fin de course | ferme la course (l'état serveur ne bloque plus la suivante) |
| `state` | (dépannage) | renvoie l'état de la course en cours |

Chaque évènement est journalisé dans `arenaWeeks/{semaine}/log/{id}` (lecture publique) : type, pseudo,
mode, adversaire, **durée entre le billet et le résultat**, victoires/défaites de la course. C'est ce que
l'outil `dev/surveillance-arene.html` affiche (onglet « Journal serveur »).

L'état des courses vit dans `arenaRuns/{uid}` : collection **invisible** des clients (aucune règle ne
l'autorise en lecture ou écriture, seul le compte de service de la fonction y accède).

Limites volontairement simples : la partie se joue dans le navigateur, le serveur ne peut donc pas
vérifier le déroulement du duel. Il impose en revanche un **rythme humain** (60 s minimum par match,
12 courses/jour), ne compte que des matchs réellement ouverts par un billet, et laisse une trace datée
de chaque victoire — falsifier un compteur depuis la console ne fonctionne plus.

## Déploiement (une seule fois)

Prérequis : [Node.js](https://nodejs.org) 20+, et le plan **Blaze** activé sur le projet Firebase
(console → ⚙ → Utilisation et facturation). Le quota gratuit (2 millions d'appels/mois) couvre très
largement ce jeu : une course d'Arène ≈ 12 appels.

```bash
npm install -g firebase-tools        # CLI Firebase
firebase login                       # compte propriétaire du projet etat-arcanique
cd functions && npm install && cd .. # dépendances de la fonction (firebase-admin, firebase-functions)

firebase deploy --only functions     # déploie « arena » (région europe-west1)
# la CLI affiche l'URL ; si elle diffère de celle de cloud-config.js, corrige cloud-config.js puis
# « firebase deploy --only functions » à nouveau n'est pas nécessaire : pousse juste la correction.

firebase deploy --only firestore:rules   # durcit les règles : seul le serveur écrit le classement
```

L'ordre compte : **la fonction d'abord**, les règles ensuite. Avant le durcissement, l'ancien mode
(écriture directe) continue de fonctionner ; après, le client passe par la fonction (et les pages
restées ouvertes doivent être rechargées avec Ctrl+F5).

## Vérifier

```bash
node test-arena-core.js        # tests du cœur de validation (60 s minimum, 9 V / 3 D, billets…)
```

Puis dans le jeu (GitHub Pages, compte en ligne) : entrer dans l'Arène → l'outil de surveillance doit
afficher `▶ course` dans le journal serveur ; gagner un duel → `⚔ victoire`, avec la durée du match.
Une victoire réelle en moins de 60 s est refusée (message « Match trop court »).

## Réglages

Tout est en haut de `arena-core.js` : `minMatchMs`, `maxMatchMs`, `maxRunMs`, `maxRunsPerDay`,
`maxWins`, `maxLosses`. Après un changement : `firebase deploy --only functions`.

## Coûts

Cloud Functions (Blaze) : 2 M d'appels/mois gratuits, puis ~0,40 $/million. Firestore : chaque
victoire = 2 écritures + 1 journal. Aucun coût tant que le jeu reste à cette échelle (et un budget
d'alerte est réglable dans la console Google Cloud).
