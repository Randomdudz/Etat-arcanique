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
// Règles Firestore (chaque joueur ne peut lire et écrire que sa propre sauvegarde) :
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /saves/{uid} {
//         allow read, write: if request.auth != null && request.auth.uid == uid;
//       }
//     }
//   }
window.EA_CLOUD={apiKey:'',projectId:''};
