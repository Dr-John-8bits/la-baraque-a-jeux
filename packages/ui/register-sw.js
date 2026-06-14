/*
 * Enregistre le service worker racine depuis n'importe quelle page (portail, blog, jeux).
 * Les chemins sont résolus via import.meta.url pour fonctionner quel que soit le sous-dossier
 * de déploiement (racine de domaine ou GitHub Pages en /repo/).
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = new URL("../../sw.js", import.meta.url);
    const scope = new URL("../../", import.meta.url).href;
    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {
      // Hors-ligne ou contexte non sécurisé : on ignore, le site reste fonctionnel.
    });
  });
}
