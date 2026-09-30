# Lueur

Un jeu d'odyssée paisible, fait par un papa pour sa fille (11 à 13 ans).

## L'idée

Les lumières du pays se sont tues une à une : lanternes, phares, lucioles, et pour finir les
étoiles. Une fille part avec la dernière flamme dans sa lanterne. Le premier soir elle rencontre
un renard ; ils voyagent ensemble de lumière en lumière. Chaque lumière rallumée rend ses
couleurs à une région.

Références visuelles : Monument Valley (dioramas isométriques, pastels) et Endling (renard
low-poly, vue de côté, palette du crépuscule), sans la tension d'Endling.

## Règles de paix

- Pas d'ennemis, pas de chrono, pas de chute, pas de game over.
- L'obscurité est calme, jamais menaçante.
- Le lien avec le renard ne fait que grandir : aucune jauge qui punit quand on ne joue pas.
- Pas de texte de papa dans ce jeu. La récompense est sans mots : la couleur revient, une
  constellation apparaît.

## Les deux voyageurs

| | Sait faire | Ne sait pas faire |
|---|---|---|
| La fille | Porter la lanterne, tourner les mécanismes | Passer sur les nénuphars, voir dans le noir |
| Le renard | Sauter, passer par les nénuphars, flairer les cachettes | Actionner quoi que ce soit |

## Un chapitre, quatre temps

1. **Le sentier** (vue de côté) : marcher, ramasser des trouvailles, suivre le renard quand il
   flaire quelque chose, croiser deux animaux, franchir l'obstacle de la région.
2. **Le camp** : partager à manger, puis un jeu avec le renard ; lui montrer ses trouvailles ;
   il s'endort. Le lien grandit d'un cran.
3. **Le lieu de la lumière** (diorama isométrique) : une énigme en trois étapes.
4. **Rallumer** : la couleur revient sur le diorama puis sur le sentier, une constellation
   s'ajoute au ciel du camp.

Cinq régions prévues : le marais, la forêt, les falaises, la montagne, le ciel.

## Les cinq chapitres

Chaque chapitre ajoute une idée au diorama, et garde celles d'avant.

| Chapitre | Lumière | Idée nouvelle |
|---|---|---|
| 1. Le marais | une tour aux lanternes | nénuphars, dalles à tenir, pont tournant |
| 2. La forêt | l'arbre aux lucioles | terrier : le renard entre d'un côté, ressort de l'autre |
| 3. Les falaises | le phare | bascule : une dalle monte quand l'autre descend |
| 4. La montagne | l'observatoire | rayon, miroirs à tourner, cristal |
| 5. Le ciel | l'étoile | tout à la fois |

## Ce qui change d'une région à l'autre

| Région | Obstacle du sentier | Animaux | Jeu du camp |
|---|---|---|---|
| Marais | le renard saute et fait tomber une planche | grenouille, héron | une caresse |
| Forêt | pousser trois fois un tronc mort | chouette, cerf | lancer un bâton |
| Falaises | passer les pierres à marée basse | mouettes, crabe | cache-cache |
| Montagne | « 1, 2, 3, soleil » : s'arrêter quand le renard se couche, avant la rafale | marmotte, bouquetin | relier des étoiles |
| Ciel | monter sur le nuage qui fait la navette | baleine du ciel, oiseaux-étoiles | une caresse |

Le **carnet** (bouton en haut à gauche du camp) garde les trouvailles et les animaux rencontrés.
Montrer au renard les trois trouvailles d'une région ajoute une étoile à sa constellation.

La **fin** : après le ciel, le chemin du retour traverse les cinq régions rallumées, jusqu'à la
maison.

## État

Les cinq chapitres sont jouables de bout en bout : sentier, camp, quatre dioramas, lumière rallumée,
constellation. Musique et bruitages générés (Web Audio), installable comme appli (manifest +
service worker, jouable hors ligne).

Dans les dioramas :
- l'indice (une empreinte) apparaît après 22 secondes sans bouger, ou en touchant le renard
  quand il est déjà choisi ;
- sur petit écran la vue se rapproche du personnage actif ; le bouton aux quatre coins montre
  tout le diorama ;
- recommencer demande deux appuis ;
- une dalle et ce qui la commande portent le même motif gravé ; une dalle baissée se voit en
  pointillé ;
- au tout premier diorama, une main montre quoi toucher.

La troisième étape de chaque chapitre est la plus corsée (7 à 11 gestes) ; la quatrième, plus
courte, porte le monument à rallumer.

Réglages (bouton en haut à droite) : volume de la musique et des bruitages, indices (tout seul,
si je demande, jamais), vue des énigmes (auto, de près, en entier), moins d'animations, rejouer
une région déjà rallumée, recommencer l'aventure.

## Fichiers

- `js/rules.js` : les règles des dioramas et le solveur (sert aussi aux indices).
- `js/levels.js` : les vingt cartes, en texte.
- `js/diorama.js`, `js/road.js`, `js/camp.js`, `js/ending.js` : les scènes.
- `js/critters.js` : les animaux du sentier.
- `js/audio.js` : musique et bruitages.
- `js/settings.js`, `js/icons.js` : l'écran de réglages et les icônes de l'interface.
- `tools/check.mjs` : vérifie chaque carte (solution, aucune impasse, rien de caché derrière le
  monument). À relancer après toute modification d'une carte : `node tools/check.mjs`.
- `tools/icons.py` : régénère les icônes de l'appli.

## Lancer

```bash
python3 -m http.server 5180 --directory .
```

Paramètres de test : `?reset`, `?chapter=0..4`, `?scene=road|camp|diorama|ending`, `?stage=0..3`, `?lit`.
Touches : flèches, espace/Tab (changer de personnage), Entrée (tourner la roue), `h` (indice),
`r` (recommencer le diorama).
