# Editorial

Ce dossier regroupe les conventions editoriales communes aux jeux :

- sources documentaires ;
- regles de reformulation ;
- exclusions et contenus sensibles ;
- schemas de corpus dans `../../packages/corpus/schema/` ;
- suivi des validations.

Les sources communes et les contenus jouables vivent dans `../../packages/corpus/`. Les demandes editoriales propres a chaque jeu restent pour le moment dans leurs dossiers applicatifs, puis les contenus valides sont transferes dans le corpus commun.

Avant d'ajouter un contenu jouable :

- verifier que le fait est sourcable ;
- reformuler tous les textes dans la voix du projet ;
- ajouter ou reutiliser un `sourceId` stable ;
- lancer `npm run check:corpus`.
