// Comptes en ligne de L’État Arcanique : configuration Firebase (gratuit).
// Tant que apiKey et projectId sont vides, les comptes sont désactivés (le transfert par code reste disponible).
//
// Mise en place (une seule fois, environ 5 minutes) :
//  1. https://console.firebase.google.com → « Créer un projet » (Google Analytics inutile).
//  2. Menu Créer → Authentication → « Commencer » → onglet « Mode de connexion » → « Adresse e-mail/Mot de passe » → Activer → Enregistrer.
//  3. Menu Créer → Firestore Database → « Créer une base de données » → mode production → onglet « Règles » :
//     remplacer tout le texte par les règles ci-dessous, puis « Publier ».
//  4. ⚙ Paramètres du projet → « Vos applications » → icône </> (Web) → donner un nom → copier ici apiKey et projectId.
//
// Règles Firestore : sauvegardes privées, files de matchmaking (Arène et duel), classement et journal d'Arène en lecture publique.
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /saves/{uid} {
//         allow read, write: if request.auth != null && request.auth.uid == uid;
//       }
//       match /arenaQueue/{uid} {
//         allow read: if request.auth != null;
//         allow create, update, delete: if request.auth != null && request.auth.uid == uid;
//       }
//       match /duelQueue/{uid} {
//         allow read: if request.auth != null;
//         allow create, update, delete: if request.auth != null && request.auth.uid == uid;
//       }
//       // Classement + journal d'Arène : lecture publique, écriture réservée à la Cloud Function « arena »
//       // (les compteurs ne peuvent donc plus être falsifiés depuis la console du navigateur).
//       match /arenaWeeks/{week}/{doc=**} {
//         allow read: if true;
//         allow write: if false;
//       }
//     }
//   }
window.EA_CLOUD={apiKey:'AIzaSyCTnxKnzBGxTs2DM5uodP4VOadaLQWHQIg',projectId:'etat-arcanique',
  arenaFn:'https://europe-west1-etat-arcanique.cloudfunctions.net/arena'};   // Cloud Function du classement d'Arène ('' = ancien mode : écriture directe par le client)
