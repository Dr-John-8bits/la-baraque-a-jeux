# Couverture des sources

Ce fichier clarifie ce qui a ete exploite pour le corpus documentaire au 2026-06-01.

| Source fournie | Statut | Usage actuel |
| --- | --- | --- |
| Ilévia | Telecharge via GTFS + indexe | Lignes, arrets, stations, terminus, ordre des stations, communes desservies. |
| data.lillemetropole.fr | Telecharge via data.gouv/dataMEL + indexe | Communes, quartiers, equipements publics, monuments, parcs, rues, arrets Ilévia. |
| Catalogue Ville de Lille sur dataMEL | Indexe + jeux utiles telecharges | Repere les jeux Ville de Lille deja importes. |
| lille.fr | Indexe seulement | Verification ponctuelle future des lieux, quartiers, evenements. |
| lillemetropole.fr | Indexe + PDF IPAP telecharge localement | Verification territoire, urbanisme et patrimoine. |
| Archives departementales du Nord | Indexe seulement | Piste de verification historique, pas encore d'extraction structuree. |
| Comptoir des Flandres - expressions ch'ti | Indexe seulement | Piste pour relire/reformuler les mots regionaux. |
| Nord Escapade - dictionnaire ch'ti | Indexe seulement | Piste pour relire/reformuler les mots regionaux. |
| Banque Chtimi - gastronomie et jeux | Indexe seulement | Piste pour traditions, gastronomie et vocabulaire. |
| France 3 - 110 mots du Nord | Indexe seulement | Piste journalistique a recouper avant integration. |
| Comptoir des Flandres - bieres du Nord | Indexe seulement | Piste brassicole, sans reprendre les fiches produits. |
| Depliant tourisme du Nord | PDF telecharge localement | Verification manuelle de reperes touristiques et culturels. |

Les sources marquees "indexe seulement" ne sont pas copiees dans le depot, car leur licence ne permet pas de traiter leur contenu comme une base ouverte. Elles servent a verifier puis a reformuler.

Au 2026-06-01, les sources web regionales ci-dessus alimentent une reserve de 103 graines reformulees dans `processed/editorial/regional-word-seeds.json`. Seuls 40 mots relus sont integres dans `packages/corpus/le-mot-a-biloute/words.json`.
