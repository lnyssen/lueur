// Les cinq chapitres et leurs dioramas. La légende des cartes est dans rules.js ;
// `node tools/check.mjs` vérifie que chaque diorama a une solution et aucune impasse.
export const CHAPTERS = [
  {
    id: 'marais', name: 'le marais',
    levels: [
      { map: [
        '........',
        '.##r###.',
        '.G#..#L.',
        '.F#..p#.',
        '..oooo..',
      ] },
      { bridge: 'h', map: [
        '....#p..',
        '.#W.....',
        '.G#.P...',
        '.F#.....',
        '.##r##L.',
      ] },
      { bridge: 'h', map: [
        '....#L.#q.',
        '....s.....',
        '.##r##.P..',
        '.G#.#W....',
        '.F#.#.....',
        '..o.o.....',
        '..oop.....',
      ] },
    ],
  },
  {
    id: 'foret', name: 'la forêt',
    levels: [
      { map: [
        '........',
        '.G#r#L..',
        '.Fa..o..',
        '.....ob.',
        '.....#p.',
      ] },
      { bridge: 'h', map: [
        '..........',
        '.G#r#W....',
        '.Fa.#.P.sL',
        '....o.....',
        '..b#p.q...',
      ] },
      { bridge: 'h', map: [
        '....#L.a..',
        '....s.....',
        '.G#r#W.P..',
        '.F#o#.....',
        '...o......',
        '...p....q.',
        '.......b#.',
      ] },
    ],
  },
  {
    id: 'falaises', name: 'les falaises',
    levels: [
      { map: [
        '.........',
        '.G#v#L...',
        '.F#.o....',
        '..oto....',
      ] },
      { map: [
        '..........',
        '.G#t#u#v#L',
        '.F#.......',
        '..oot.....',
      ] },
      { bridge: 'h', map: [
        '....#t....',
        '.#W......L',
        '.G#.P.u#v#',
        '.F#.......',
      ] },
    ],
  },
  {
    id: 'montagne', name: 'la montagne',
    levels: [
      { beam: [1, 0], map: [
        '......K..',
        '.GY......',
        '.F#.E.N..',
        '..#......',
        '..#k#L...',
      ] },
      { beam: [1, 0], map: [
        '.......K..',
        '.G#r#Y....',
        '.F#o#E.N..',
        '.o..#.....',
        '.op.#k#L..',
      ] },
      { beam: [1, 0], map: [
        '........K.',
        '.G#u#Y....',
        '.F#.#.E.N.',
        '.ot.#oo...',
        '....#v#k#L',
      ] },
    ],
  },
  {
    id: 'ciel', name: 'le ciel',
    levels: [
      { map: [
        '.........',
        '.G#v#L...',
        '.Fa.o....',
        '....o....',
        '...b#t...',
      ] },
      { bridge: 'h', beam: [0, 1], map: [
        '....#p....',
        '.#W.......',
        '.G#.P.#Y.E',
        '.F#.......',
        '.##rk##LKN',
      ] },
      { bridge: 'h', beam: [1, 0], map: [
        '.......a...',
        '...........',
        '.G#r#W.P...',
        '.F#o#......',
        '...ov......',
        '...p#Y..E.M',
        '....k......',
        '.btL#.....K',
      ] },
    ],
  },
];
