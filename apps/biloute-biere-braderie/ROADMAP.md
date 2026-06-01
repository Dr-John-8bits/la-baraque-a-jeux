# Roadmap · Biloute · Bière · Braderie

Biloute · Bière · Braderie est un mini-jeu mobile-first de ch'tifoumi lillois.
Le principe actuel : lancer `CH'TI FOU MI`, choisir avant la fin du compte à rebours, puis gagner la tournée en arrivant le premier à 5 points.

## État actuel

Version jouable en webapp statique :

- intégration dans `apps/biloute-biere-braderie/` et dans le portail ;
- thème `Biloute · Bière · Braderie` avec sous-titre et règles du triangle ;
- règles locales :
  - Biloute bat Bière ;
  - Bière bat Braderie ;
  - Braderie bat Biloute ;
- jeu solo contre l'ordinateur ;
- choix mobile-first en trois boutons côte à côte avec emojis ;
- lancement `CH'TI FOU MI` avec 3 secondes pour choisir ;
- défaite de manche automatique si le joueur ne choisit pas à temps ;
- micro-phase de révélation de 1,5 seconde avant affichage du résultat ;
- ordinateur caché pendant la révélation ;
- score appliqué uniquement après la révélation ;
- objectif visible : premier à 5 points ;
- bandeau objectif compact au-dessus du duel ;
- feedback visuel fort pour manche gagnée, perdue, égalité et timeout ;
- score marqué et choix gagnant mis en évidence ;
- fin de tournée claire : gagnée ou perdue ;
- historique court des dernières manches ;
- partage du résultat ;
- stockage local des statistiques de base ;
- `window.render_game_to_text()` et `window.advanceTime(ms)` disponibles pour les tests.

## Décisions UX actées

- Les boutons hauts `?` et réinitialisation ont été supprimés pour alléger l'écran mobile.
- Les règles restent visibles plus bas dans la page.
- L'objectif doit être lisible sans ouvrir d'aide : `Objectif : premier à 5 points`.
- La partie s'appelle plutôt une tournée dans les textes de fin.
- L'animation de révélation doit rester courte : 1,5 seconde suffit pour créer du suspense sans casser le rythme.

## À reprendre du Mot à Biloute

Idées pertinentes pour amener BBB au même niveau de finition :

- un `Calepin` local avec tournées jouées, gagnées, perdues et meilleure série ;
- un historique des dernières tournées, pas seulement des dernières manches ;
- un partage plus riche, avec score final, issue de la tournée et éventuellement une petite grille d'emojis ;
- une aide courte en modal nommée `Hein ?`, si les règles doivent remonter sans remettre un bouton encombrant en haut ;
- un texte de fin plus éditorial, avec une phrase différente selon victoire large, victoire serrée, défaite large ou timeout décisif ;
- une notion de série de tournées gagnées, simple et locale ;
- une meilleure sauvegarde de reprise si le joueur quitte en pleine tournée.

## Priorité 1 · Clarifier la boucle de jeu

Objectif : que le joueur comprenne immédiatement pourquoi il rejoue.

- afficher `Tournée` dans les textes de résultat et de partage ;
- ajouter un compteur `Tournées gagnées` / `Tournées perdues` dans une zone discrète ;
- enrichir l'écran de fin avec :
  - score final ;
  - nombre de manches jouées ;
  - temps morts subis ;
  - série actuelle ;
- transformer le bouton `Rejouer` en `Revanche` après une fin de tournée.

## Priorité 2 · Calepin et rejouabilité

Objectif : donner une raison de revenir sans complexifier le jeu.

- créer un `Calepin` inspiré du Mot à Biloute ;
- stocker les statistiques locales suivantes :
  - tournées jouées ;
  - tournées gagnées ;
  - taux de réussite ;
  - meilleure série ;
  - plus grosse victoire ;
  - nombre de timeouts ;
- afficher un mini-historique des 10 dernières tournées ;
- prévoir un export/import seulement si le calepin devient réellement utile.

## Priorité 3 · Aide et règles

Objectif : garder l'écran principal simple tout en rendant les règles accessibles.

- ajouter un accès `Hein ?` dans une zone basse ou dans les règles, pas dans le header ;
- transformer les règles du triangle en aide courte :
  - emojis ;
  - phrase de règle ;
  - raison humoristique ;
- ajouter une ligne explicite : `Une égalité ne donne aucun point.`

## Priorité 4 · Tests et robustesse

Objectif : éviter les régressions maintenant que le jeu a plusieurs phases.

- ajouter un test dédié de fin de tournée gagnée ;
- ajouter un test dédié de fin de tournée perdue ;
- tester la phase `revealing` avec score inchangé et ordinateur caché ;
- tester le timeout automatique ;
- tester que `Premier à 5` reste visible en mobile court.

## Pistes optionnelles

À garder pour plus tard, seulement si le jeu mérite d'être enrichi :

- mode `Défi du jour` avec un tirage commun quotidien ;
- variantes de microcopy selon le score final ;
- petit badge de performance : `Main sûre`, `Mauvaise foi`, `Perdu dans la braderie` ;
- son très court désactivable au moment de la révélation ;
- animation plus expressive des emojis si elle ne gêne pas le mobile.

## Prochaine reprise conseillée

Commencer par le `Calepin` minimal :

1. Ajouter un bouton discret `Calepin` près des stats ou après la fin de tournée.
2. Enregistrer les tournées gagnées/perdues et la série actuelle.
3. Enrichir le partage avec le score final et la série.
4. Ajouter les tests de fin de tournée.
