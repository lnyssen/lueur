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
      // rester sur une dalle levée la garde levée : la fille attend dessus pendant que le renard change de dalle
      { bridge: 'h', map: [
        '....#poo...',
        '.#W....o...',
        '.G#.P..o...',
        '.F#....q...',
        '.##....oo..',
        '.##r##sr#L.',
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
        '....ap......',
        '.#W.........',
        '.G#.P.##rsL.',
        '.F#.........',
        '............',
        '......bq....',
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
      // elle bascule elle-même en passant ; l'astuce : le renard peut tenir une dalle levée pour elle
      { map: [
        '.G#rtvuv#L',
        '.F#.ooooo.',
        '..opot....',
      ] },
      // l'escalier : le renard saute d'une bascule à l'autre, la fille avance d'une dalle à chaque fois
      { map: [
        '....otto...',
        '.G#oo..o...',
        '.F#....o...',
        '.##....o...',
        '.##uvuv#L..',
        '.##oooo....',
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
      // deux roues des miroirs : allumer pour passer, éteindre plus loin pour repasser
      { beam: [1, 0], map: [
        '.......K..',
        '.GY.......',
        '.F#.E..N..',
        '.#........',
        '.#kY#jr#L.',
        '.oooooop..',
      ] },
      // les rôles s'inversent : la fille tourne les miroirs, le renard avance sur les dalles de lumière
      { beam: [1, 0], map: [
        '.........K.',
        '.GY........',
        '.F#.E....N.',
        '.#.........',
        '.#okjkj#q..',
        '.s.........',
        '.#L........',
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
      { beam: [1, 0], map: [
        '..........K',
        '.GY........',
        '.F#..E....N',
        '.#.........',
        '.#okjtt....',
        '.#.........',
        '.#uvu#L....',
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
