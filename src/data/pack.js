// The word pack: the only place language lives. Another language pair is another fork with another pack.
//   lang, dir     the pack language and its text direction
//   font          the face the word moment is set in, loaded from the page's own origin; `digits` names
//                 the same face kept to the pack's digits and thousands mark, which numbers are set in
//   species       { id, word, say, clip, ms } in the order they first appear across the levels, which is
//                 also the parade order. `id` is a core SPECIES id, `word` the plain written word (no
//                 diacritics), `say` the name in Latin letters, shown beside the word while it is
//                 said, `clip` its approved recording (public/audio/manifest.json), `ms` its length
//   numbers       { n, word, say, clip, ms }, one per wave of the game, 1 to the last; `word` is n in
//                 Persian digits, shown as it is said
//   weather       { rain, stars, petals }, each { word, say, clip, ms }, by a level's weather kind (levels.js):
//                 said after the number and species of the wave the weather begins with, shown as a
//                 species' word is, without a face
//   hud           { wave }, the words the HUD shows in place of its English labels (a level's 'waveWord'
//                 part, levels.js); read, never heard, so no clip, set as a species' word is
//   digits        the ten digits, 0 to 9, a number is written in where the screen shows it in Persian
//   group         the mark that groups such a number's thousands
//   letterColours the colours the word moment cycles through, one per letter
export const PACK = {
  lang: 'fa', dir: 'rtl',
  font: { family: 'PackWord', digits: 'PackDigits', file: 'public/fonts/Vazirmatn-Bold.woff2', weight: '700' },
  species: [
    { id: 'dog', word: 'سگ', say: 'sag', clip: 'public/audio/sag.mp3', ms: 760 },
    { id: 'cow', word: 'گاو', say: 'gav', clip: 'public/audio/gav.mp3', ms: 760 },
    { id: 'rabbit', word: 'خرگوش', say: 'khargush', clip: 'public/audio/khargush.mp3', ms: 1070 },
    { id: 'bird', word: 'پرنده', say: 'parande', clip: 'public/audio/parande.mp3', ms: 780 },
    { id: 'cat', word: 'گربه', say: 'gorbe', clip: 'public/audio/gorbe.mp3', ms: 760 },
    { id: 'horse', word: 'اسب', say: 'asb', clip: 'public/audio/asb.mp3', ms: 760 },
    { id: 'fish', word: 'ماهی', say: 'mahi', clip: 'public/audio/mahi.mp3', ms: 860 },
    { id: 'mouse', word: 'موش', say: 'mush', clip: 'public/audio/mush.mp3', ms: 970 },
  ],
  numbers: [
    { n: 1, word: '۱', say: 'yek', clip: 'public/audio/yek.mp3', ms: 760 },
    { n: 2, word: '۲', say: 'do', clip: 'public/audio/do.mp3', ms: 760 },
    { n: 3, word: '۳', say: 'se', clip: 'public/audio/se.mp3', ms: 760 },
    { n: 4, word: '۴', say: 'chahar', clip: 'public/audio/chahar.mp3', ms: 760 },
    { n: 5, word: '۵', say: 'panj', clip: 'public/audio/panj.mp3', ms: 840 },
    { n: 6, word: '۶', say: 'shesh', clip: 'public/audio/shesh.mp3', ms: 810 },
    { n: 7, word: '۷', say: 'haft', clip: 'public/audio/haft.mp3', ms: 760 },
    { n: 8, word: '۸', say: 'hasht', clip: 'public/audio/hasht.mp3', ms: 760 },
    { n: 9, word: '۹', say: 'noh', clip: 'public/audio/noh.mp3', ms: 760 },
    { n: 10, word: '۱۰', say: 'dah', clip: 'public/audio/dah.mp3', ms: 760 },
    { n: 11, word: '۱۱', say: 'yazdah', clip: 'public/audio/yazdah.mp3', ms: 840 },
    { n: 12, word: '۱۲', say: 'davazdah', clip: 'public/audio/davazdah.mp3', ms: 890 },
    { n: 13, word: '۱۳', say: 'sizdah', clip: 'public/audio/sizdah.mp3', ms: 890 },
    { n: 14, word: '۱۴', say: 'chahardah', clip: 'public/audio/chahardah.mp3', ms: 860 },
    { n: 15, word: '۱۵', say: 'panzdah', clip: 'public/audio/panzdah.mp3', ms: 1070 },
    { n: 16, word: '۱۶', say: 'shanzdah', clip: 'public/audio/shanzdah.mp3', ms: 910 },
    { n: 17, word: '۱۷', say: 'hafdah', clip: 'public/audio/hafdah.mp3', ms: 780 },
    { n: 18, word: '۱۸', say: 'hojdah', clip: 'public/audio/hojdah.mp3', ms: 910 },
    { n: 19, word: '۱۹', say: 'nuzdah', clip: 'public/audio/nuzdah.mp3', ms: 860 },
    { n: 20, word: '۲۰', say: 'bist', clip: 'public/audio/bist.mp3', ms: 760 },
    { n: 21, word: '۲۱', say: 'bist-o-yek', clip: 'public/audio/bist-o-yek.mp3', ms: 970 },
    { n: 22, word: '۲۲', say: 'bist-o-do', clip: 'public/audio/bist-o-do.mp3', ms: 760 },
    { n: 23, word: '۲۳', say: 'bist-o-se', clip: 'public/audio/bist-o-se.mp3', ms: 890 },
    { n: 24, word: '۲۴', say: 'bist-o-chahar', clip: 'public/audio/bist-o-chahar.mp3', ms: 890 },
    { n: 25, word: '۲۵', say: 'bist-o-panj', clip: 'public/audio/bist-o-panj.mp3', ms: 1070 },
    { n: 26, word: '۲۶', say: 'bist-o-shesh', clip: 'public/audio/bist-o-shesh.mp3', ms: 1100 },
    { n: 27, word: '۲۷', say: 'bist-o-haft', clip: 'public/audio/bist-o-haft.mp3', ms: 970 },
    { n: 28, word: '۲۸', say: 'bist-o-hasht', clip: 'public/audio/bist-o-hasht.mp3', ms: 1070 },
    { n: 29, word: '۲۹', say: 'bist-o-noh', clip: 'public/audio/bist-o-noh.mp3', ms: 990 },
    { n: 30, word: '۳۰', say: 'si', clip: 'public/audio/si.mp3', ms: 760 },
  ],
  weather: {
    rain: { word: 'باران', say: 'baran', clip: 'public/audio/baran.mp3', ms: 760 },
    stars: { word: 'ستاره', say: 'setare', clip: 'public/audio/setare.mp3', ms: 1120 },
    petals: { word: 'گل', say: 'gol', clip: 'public/audio/gol.mp3', ms: 760 },
  },
  hud: { wave: 'موج' },
  digits: '۰۱۲۳۴۵۶۷۸۹',
  group: '٬',
  letterColours: ['#ffd23a', '#3affc8', '#ff5ad8', '#7aa8ff', '#ff8a3a'],
};
