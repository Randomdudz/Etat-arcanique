// ============ WORKER : tournoi de decks de l'IA ============
// Le tournoi d'auto-jeu (182 parties, ~20 s) tourne ici, hors du thread principal :
// l'interface et les duels restent fluides pendant le calcul.
// La version (?v=) est reprise du chargement du worker pour charger les mêmes scripts que la page.
var EAW_V=((self.location&&self.location.search)||'').match(/[?&]v=([^&]+)/);
var EAW_Q=EAW_V?'?v='+EAW_V[1]:'';
importScripts('card-art.js'+EAW_Q,'data.js'+EAW_Q,'engine.js'+EAW_Q,'ai.js'+EAW_Q);
self.onmessage=function(e){
  var d=e.data||{},out=null;
  try{out=bestDeck(d.coll,d.rs,d.opts)}catch(err){out=null}
  self.postMessage({sig:d.sig,out:out});
};
