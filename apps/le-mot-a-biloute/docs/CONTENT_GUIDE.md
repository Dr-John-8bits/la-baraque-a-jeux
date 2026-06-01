# Guide éditorial

## Ton

Le ton doit être :

- local sans être excluant ;
- drôle sans forcer ;
- affectueux avec Lille et le Nord ;
- clair pour les personnes qui ne connaissent pas le ch'ti ;
- jamais caricatural.

## Structure d'un mot

Chaque mot doit contenir :

- une réponse en lettres A-Z ;
- une catégorie ;
- un premier indice vague ;
- un ou plusieurs indices supplémentaires ;
- une note bonus de fin.

Exemple :

```js
{
  answer: "DRACHE",
  category: "Vocabulaire ch'ti",
  starterHint: "Ça peut ruiner une belle sortie sans demander la permission.",
  hints: [
    "Météo bien du Nord, version généreuse.",
    "Grosse pluie en parler régional."
  ],
  bonus: {
    title: "Drache",
    text: "Dans le Nord, une drache désigne une grosse pluie."
  }
}
```

## Premier indice

Le premier indice est gratuit, mais doit rester difficile.

Il doit évoquer :

- une sensation ;
- une situation ;
- une image locale ;
- une humeur.

Il ne doit pas donner directement la définition.

## Indices payants

Les indices payants doivent devenir progressivement plus utiles.

Ordre recommandé :

1. Indice de contexte.
2. Définition plus claire.
3. Indice très direct si nécessaire.

## Bonus final

Le bonus doit être court : 1 à 3 phrases.

Objectif :

- expliquer le mot ;
- donner une saveur locale ;
- récompenser la fin de partie.

## Prudence

Éviter :

- les clichés lourds ;
- les orthographes incertaines sans variantes ;
- les références trop obscures ;
- les marques ou chartes visuelles protégées ;
- les formulations laissant croire à une affiliation officielle.
