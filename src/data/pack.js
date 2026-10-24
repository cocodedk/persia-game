// The word pack: the only place language lives. Another language pair is another fork with another pack.
//   lang, dir     the pack language and its text direction
//   font          the face the word moment is set in, loaded from the page's own origin
//   species       { id, word, say, clip, ms } in the order they first appear in level 1, which is also the
//                 parade order. `id` is a core SPECIES id, `word` the plain written word (no
//                 diacritics), `say` the name in Latin letters, shown beside the word while it is
//                 said, `clip` its approved recording (public/audio/manifest.json), `ms` its length
//   numbers       { n, word, say, clip, ms } for 1..5; `word` is the Persian digit, shown as it is said
//   letterColours the colours the word moment cycles through, one per letter
export const PACK = {
  lang: 'fa', dir: 'rtl',
  font: { family: 'PackWord', file: 'public/fonts/Vazirmatn-Bold.woff2', weight: '700' },
  species: [
    { id: 'dog', word: 'سگ', say: 'sag', clip: 'public/audio/sag.mp3', ms: 760 },
    { id: 'cow', word: 'گاو', say: 'gav', clip: 'public/audio/gav.mp3', ms: 760 },
    { id: 'rabbit', word: 'خرگوش', say: 'khargush', clip: 'public/audio/khargush.mp3', ms: 1070 },
    { id: 'bird', word: 'پرنده', say: 'parande', clip: 'public/audio/parande.mp3', ms: 780 },
    { id: 'cat', word: 'گربه', say: 'gorbe', clip: 'public/audio/gorbe.mp3', ms: 760 },
    { id: 'horse', word: 'اسب', say: 'asb', clip: 'public/audio/asb.mp3', ms: 760 },
    { id: 'fish', word: 'ماهی', say: 'mahi', clip: 'public/audio/mahi.mp3', ms: 860 },
  ],
  numbers: [
    { n: 1, word: '۱', say: 'yek', clip: 'public/audio/yek.mp3', ms: 760 },
    { n: 2, word: '۲', say: 'do', clip: 'public/audio/do.mp3', ms: 760 },
    { n: 3, word: '۳', say: 'se', clip: 'public/audio/se.mp3', ms: 760 },
    { n: 4, word: '۴', say: 'chahar', clip: 'public/audio/chahar.mp3', ms: 760 },
    { n: 5, word: '۵', say: 'panj', clip: 'public/audio/panj.mp3', ms: 840 },
  ],
  letterColours: ['#ffd23a', '#3affc8', '#ff5ad8', '#7aa8ff', '#ff8a3a'],
};
