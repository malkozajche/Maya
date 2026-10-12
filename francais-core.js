/* Bilan 6 worksheet: the book exercises, plus scoring. Browser + Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MayaFrancais = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var NUMBERS = { "0": "zero", "1": "un", "2": "deux", "3": "trois", "4": "quatre", "5": "cinq", "6": "six", "7": "sept", "8": "huit", "9": "neuf", "10": "dix" };

  function fold(s) {
    var t = String(s == null ? "" : s).toLowerCase();
    t = t.replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/ç/g, "c");
    t = t.replace(/[0-9]+/g, function (n) {
      return NUMBERS[n] ? " " + NUMBERS[n] + " " : " " + n + " ";
    });
    if (typeof t.normalize === "function") t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    t = t.replace(/['’ʼ`]/g, " ").replace(/[-–—]/g, " ");
    t = t.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    return t;
  }

  function compact(s) {
    return fold(s).replace(/\s/g, "");
  }

  function levenshtein(a, b) {
    var m = a.length;
    var n = b.length;
    if (!m) return n;
    if (!n) return m;
    var prev = new Array(n + 1);
    var cur = new Array(n + 1);
    var i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      var ca = a.charCodeAt(i - 1);
      for (j = 1; j <= n; j++) {
        var cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        var del = prev[j] + 1;
        var ins = cur[j - 1] + 1;
        var sub = prev[j - 1] + cost;
        cur[j] = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
      }
      var swap = prev;
      prev = cur;
      cur = swap;
    }
    return prev[n];
  }

  function ratio(a, b) {
    var e = compact(a);
    var h = compact(b);
    if (!e && !h) return 1;
    if (!e || !h) return 0;
    return 1 - levenshtein(e, h) / Math.max(e.length, h.length);
  }

  function contentHit(expected, heard) {
    var ew = fold(expected).split(" ").filter(function (w) {
      return w.length >= 4 || w === "au" || w === "aux";
    });
    if (ew.length < 2) return false;
    var hw = fold(heard).split(" ");
    for (var i = 0; i < ew.length; i++) {
      if (hw.indexOf(ew[i]) < 0) return false;
    }
    return true;
  }

  function passes(expected, heard) {
    var h = fold(heard);
    var e = fold(expected);
    if (!h || !e) return false;
    if (compact(h).length < Math.min(4, compact(e).length)) return false;
    if (h === e || compact(h) === compact(e)) return true;
    return contentHit(e, h);
  }

  function speechMatch(expected, heard, alts) {
    var options = [expected].concat(alts || []);
    var best = 0;
    var pass = false;
    for (var i = 0; i < options.length; i++) {
      var sc = ratio(options[i], heard);
      if (sc > best) best = sc;
      if (passes(options[i], heard)) pass = true;
    }
    return { pass: pass, score: best };
  }

  function same(expected, typed) {
    var h = fold(typed);
    var e = fold(expected);
    return !!h && h === e;
  }

  function hasWord(h, w) {
    return (" " + h + " ").indexOf(" " + w + " ") >= 0;
  }

  var PARLER = [
    {
      id: "p1",
      n: "1",
      de: "… fragen, wie das Wetter ist.",
      frame: "Quel …, aujourd'hui?",
      fields: [{ key: "a", label: "" }],
      say: "Quel temps fait-il, aujourd'hui ?",
    },
    {
      id: "p2",
      n: "2",
      de: "… sagen, dass das Wetter schön / schlecht ist. Es regnet.",
      frame: "Il fait …",
      fields: [
        { key: "a", label: "Il fait …" },
        { key: "b", label: "Es regnet:" },
      ],
      say: "Il fait beau. Il fait mauvais. Il pleut.",
    },
    {
      id: "p3",
      n: "3",
      de: "… sagen, dass jemand große Schmerzen hat.",
      frame: "Il a …",
      fields: [{ key: "a", label: "" }],
      say: "Il a très mal.",
    },
    {
      id: "p4",
      n: "4",
      de: "… fragen, wo die Abfahrt ist.",
      frame: "Où est … ?",
      fields: [{ key: "a", label: "" }],
      say: "Où est le départ ?",
    },
    {
      id: "p5",
      n: "5",
      de: "… fragen, wie lange eine Schifffahrt dauert.",
      frame: "Combien … ?",
      fields: [{ key: "a", label: "" }],
      say: "Combien de temps dure le tour en bateau ?",
    },
    {
      id: "p6",
      n: "6",
      de: "… fragen, was eine Eintrittskarte kostet.",
      frame: "Combien … ?",
      fields: [{ key: "a", label: "" }],
      say: "Combien coûte le billet d'entrée ?",
    },
    {
      id: "p7",
      n: "7",
      de: "… sagen, dass etwas noch viermal gemacht werden soll.",
      frame: "Encore … !",
      fields: [{ key: "a", label: "" }],
      say: "Encore quatre fois !",
    },
    {
      id: "p8",
      n: "8",
      de: "… sagen, dass der Strand hinter dem Platz ist.",
      frame: "… la place.",
      fields: [{ key: "a", label: "" }],
      say: "La plage est derrière la place.",
    },
  ];

  function checkParler(id, text) {
    var h = fold(text);
    if (!h) return false;
    if (id === "p1") {
      return h.indexOf("temps") >= 0 && h.indexOf("fait") >= 0 && h.indexOf("heure") < 0;
    }
    if (id === "p2") {
      var beauCount = h.split("beau").length - 1;
      var positive = h.indexOf("fait beau") >= 0 || (beauCount >= 1 && h.indexOf("pas beau") < 0) || beauCount >= 2;
      var negative = h.indexOf("mauvais") >= 0 || h.indexOf("pas beau") >= 0;
      var rain = h.indexOf("pleut") >= 0 && h.indexOf("pleure") < 0;
      return positive && negative && rain;
    }
    if (id === "p3") return hasWord(h, "mal") && (h.indexOf("tres") >= 0) && h.indexOf("malade") < 0;
    if (id === "p4") return h.indexOf("depart") >= 0 && h.indexOf("plage") < 0;
    if (id === "p5") return h.indexOf("temps") >= 0 && h.indexOf("dure") >= 0 && h.indexOf("bateau") >= 0 && h.indexOf("coute") < 0;
    if (id === "p6") return h.indexOf("coute") >= 0 && (h.indexOf("billet") >= 0 || h.indexOf("entree") >= 0) && h.indexOf("dure") < 0;
    if (id === "p7") return h.indexOf("quatre") >= 0 && h.indexOf("fois") >= 0 && h.indexOf("quatrieme") < 0;
    if (id === "p8") {
      var p = h.indexOf("plage");
      var d = h.indexOf("derriere");
      var place = h.indexOf("place");
      return p >= 0 && d > p && place > d;
    }
    return false;
  }

  var VOCAB = [
    {
      id: "v0",
      example: true,
      before: "Exemple : Aujourd'hui, il ne fait vraiment pas chaud, il fait ",
      after: ".",
      answer: "froid",
      say: "Aujourd'hui, il ne fait vraiment pas chaud, il fait froid.",
    },
    {
      id: "v1",
      before: "1. Aujourd'hui, il ne fait vraiment pas chaud, il fait ",
      after: ".",
      answer: "froid",
      say: "Aujourd'hui, il ne fait vraiment pas chaud, il fait froid.",
    },
    {
      id: "v2",
      before: "2. Cool, on n'a plus de cours, c'est les ",
      after: " !",
      answer: "vacances",
      say: "Cool, on n'a plus de cours, c'est les vacances !",
    },
    {
      id: "v3",
      before: "3. Nice est une ville entre la mer et la ",
      after: ".",
      answer: "montagne",
      say: "Nice est une ville entre la mer et la montagne.",
    },
    {
      id: "v4",
      before: "4. Oh, les jolies ",
      after: " : la mer, les palmiers, les maisons sont bleus, verts, jaunes, rouges …",
      answer: "couleurs",
      say: "Oh, les jolies couleurs : la mer, les palmiers, les maisons sont bleus, verts, jaunes, rouges …",
    },
    {
      id: "v5",
      before: "5. On fait un petit ou un ",
      after: " tour en mer ?",
      answer: "grand",
      say: "On fait un petit ou un grand tour en mer ?",
    },
    {
      id: "v6",
      before: "6. Sur le bateau, il ne fait pas chaud : il y a du ",
      after: ".",
      answer: "vent",
      say: "Sur le bateau, il ne fait pas chaud : il y a du vent.",
    },
    {
      id: "v7",
      before: "7. Aïe, mon pied ! Un oursin ! J'ai ",
      after: " !",
      answer: "mal",
      say: "Aïe, mon pied ! Un oursin ! J'ai mal !",
    },
  ];

  var ORDER = [
    {
      id: "o1",
      example: true,
      n: "1",
      chips: ["Max", "Antoine", "présenter", "? Zoé"],
      say: "Max présente Antoine à Zoé.",
    },
    {
      id: "o2",
      n: "2",
      lead: "Max et Lola …",
      chips: [
        { t: "Max et Lola", insert: "Max et Lola" },
        { t: "donner", insert: "donner" },
        { t: "? amie de Lola", insert: "amie de Lola" },
        { t: "un billet pour le bateau", insert: "un billet pour le bateau" },
      ],
      say: "Max et Lola donnent un billet pour le bateau à l'amie de Lola.",
    },
    {
      id: "o3",
      n: "3",
      chips: [
        { t: "Antoine", insert: "Antoine" },
        { t: "une glace", insert: "une glace" },
        { t: "demander", insert: "demander" },
        { t: "? vendeur", insert: "vendeur" },
      ],
      say: "Antoine demande une glace au vendeur.",
    },
    {
      id: "o4",
      n: "4",
      chips: [
        { t: "Les grands-parents", insert: "Les grands-parents" },
        { t: "proposer", insert: "proposer" },
        { t: "? enfants", insert: "enfants" },
        { t: "un tour en bateau", insert: "un tour en bateau" },
      ],
      say: "Les grands-parents proposent un tour en bateau aux enfants.",
    },
    {
      id: "o5",
      n: "5",
      chips: [
        { t: "Un moniteur", insert: "Un moniteur" },
        { t: "montrer", insert: "montrer" },
        { t: "les exercices", insert: "les exercices" },
        { t: "? adolescents", insert: "adolescents" },
      ],
      say: "Un moniteur montre les exercices aux adolescents.",
    },
    {
      id: "o6",
      n: "6",
      chips: [
        { t: "Max", insert: "Max" },
        { t: "son stage", insert: "son stage" },
        { t: "? filles", insert: "filles" },
        { t: "raconter", insert: "raconter" },
      ],
      say: "Max raconte son stage aux filles.",
    },
  ];

  var LIRE = [
    { t: "Max et Lola " },
    { id: "l1", answer: "montrent", size: 10 },
    { t: " Nice à Zoé. Zoé aime beaucoup la vieille ville avec ses " },
    { id: "l2", answer: "petites", size: 8 },
    { t: " rues. Avec ses amis, elle va sur la promenade des Anglais. De là, elle " },
    { id: "l3", answer: "voit", size: 6 },
    { t: " enfin la mer et sa couleur " },
    { id: "l4", answer: "bleue", size: 6 },
    { t: " de rêve. Zoé prend des photos." },
    { br: true },
    { t: "Zoé : Je voudrais aller dans l'eau. Demain, on va " },
    { id: "l5", answer: "nager", size: 7 },
    { t: " ?" },
    { br: true },
    { t: "Lola : Tu sais, la mer est encore " },
    { id: "l6", answer: "froide", size: 7 },
    { t: "." },
    { br: true },
    { t: "Antoine : L'eau n'est pas " },
    { id: "l7", answer: "chaude", size: 7 },
    { t: ", mais moi, je vais sur les rochers et je " },
    { id: "l8", answer: "saute", size: 7 },
    { t: " dans l'eau, pas de problème." },
    { br: true },
    { t: "Max : Mais d'abord, on va manger " },
    { id: "l9", answer: "une glace", size: 10 },
    { t: ", OK ?" },
    { br: true },
    { t: "Zoé : Super idée !" },
  ];

  var LIRE_BANK = ["une glace", "nager", "sauter", "montrer", "voir", "petit", "chaud", "froid", "bleu"];

  var LIRE_SAY = [
    "Max et Lola montrent Nice à Zoé.",
    "Zoé aime beaucoup la vieille ville avec ses petites rues.",
    "Avec ses amis, elle va sur la promenade des Anglais.",
    "De là, elle voit enfin la mer et sa couleur bleue de rêve.",
    "Zoé prend des photos.",
    "Je voudrais aller dans l'eau. Demain, on va nager ?",
    "Tu sais, la mer est encore froide.",
    "L'eau n'est pas chaude, mais moi, je vais sur les rochers et je saute dans l'eau, pas de problème.",
    "Mais d'abord, on va manger une glace, OK ?",
    "Super idée !",
  ];

  var ADJ = [
    { id: "a1", label: "m.", who: "Max est", answer: "content" },
    { id: "a2", label: "f.", who: "Zoé est", answer: "contente" },
    { id: "a3", label: "m.", who: "Jules et Max sont", answer: "contents" },
    { id: "a4", label: "f.", who: "Lola et Zoé sont", answer: "contentes" },
    { id: "a5", label: "m. + f.", who: "Max et Lola sont", answer: "contents" },
  ];

  var VOIR = [
    { id: "vv1", who: "je", answer: "vois" },
    { id: "vv2", who: "tu", answer: "vois" },
    { id: "vv3", who: "il / elle / on", answer: "voit" },
    { id: "vv4", who: "nous", answer: "voyons" },
    { id: "vv5", who: "vous", answer: "voyez" },
    { id: "vv6", who: "ils / elles", answer: "voient" },
  ];

  var LINES = [
    { id: "s19", say: "Aujourd'hui, Lola montre la ville à son amie.", de: "Lola zeigt ihrer Freundin die Stadt." },
    { id: "s19b", say: "Aujourd'hui, on montre notre ville à Zoé !", de: "Heute zeigen wir Zoé unsere Stadt." },
    { id: "s20a", say: "Nice est une ville intéressante.", de: "Die meisten Adjektive stehen nach dem Nomen." },
    { id: "s20b", say: "Nice est une grande ville.", de: "Nur wenige Adjektive stehen vor dem Nomen." },
    { id: "s21a", say: "Tu es contente, Zoé ?", de: "Sprechblase" },
    { id: "s21b", say: "Oh oui ! Nice est une ville intéressante !", de: "Sprechblase" },
    { id: "s21c", say: "Vous voyez le dauphin, là-bas ?", de: "Sprechblase" },
    { id: "s21d", say: "Moi, je vois un sac en plastique.", de: "Sprechblase" },
  ];

  var PREPS = ["à", "à l'", "au", "aux"];

  function lireAnswers() {
    var map = {};
    LIRE.forEach(function (part) {
      if (part.id) map[part.id] = part.answer;
    });
    return map;
  }

  return {
    fold: fold,
    speechMatch: speechMatch,
    same: same,
    checkParler: checkParler,
    PARLER: PARLER,
    VOCAB: VOCAB,
    ORDER: ORDER,
    LIRE: LIRE,
    LIRE_BANK: LIRE_BANK,
    LIRE_SAY: LIRE_SAY,
    ADJ: ADJ,
    VOIR: VOIR,
    LINES: LINES,
    PREPS: PREPS,
    lireAnswers: lireAnswers,
  };
});
