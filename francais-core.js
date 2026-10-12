/* Pure data and scoring for Maya's French Bilan test. Browser + Node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MayaFrancais = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var PASSAGE = [
    { t: "Max et Lola " },
    { b: "l1" },
    { t: " Nice à Zoé. Zoé aime beaucoup la vieille ville avec ses " },
    { b: "l2" },
    { t: " rues. Avec ses amis, elle va sur la promenade des Anglais. De là, elle " },
    { b: "l3" },
    { t: " enfin la mer et sa couleur " },
    { b: "l4" },
    { t: " de rêve. Zoé prend des photos." },
    { br: true },
    { t: "Zoé : Je voudrais aller dans l'eau. Demain, on va " },
    { b: "l5" },
    { t: " ?" },
    { br: true },
    { t: "Lola : Tu sais, la mer est encore " },
    { b: "l6" },
    { t: "." },
    { br: true },
    { t: "Antoine : L'eau n'est pas " },
    { b: "l7" },
    { t: " mais moi, je vais sur les rochers et je " },
    { b: "l8" },
    { t: " dans l'eau, pas de problème." },
    { br: true },
    { t: "Max : Mais d'abord, on va manger " },
    { b: "l9" },
    { t: ", OK ?" },
    { br: true },
    { t: "Zoé : Super idée !" },
  ];

  function choice(text, ok) {
    return { text: text, ok: !!ok };
  }

  var QUESTIONS = [
    {
      id: "p1",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst fragen, wie das Wetter ist.",
      frame: "Quel … aujourd'hui ?",
      choices: [
        choice("Quel temps fait-il aujourd'hui ?", true),
        choice("Quelle heure est-il aujourd'hui ?", false),
        choice("Comment tu t'appelles aujourd'hui ?", false),
      ],
      say: "Quel temps fait-il aujourd'hui ?",
      why: "Quel temps fait-il ? fragt nach dem Wetter. Quelle heure fragt nach der Uhrzeit.",
    },
    {
      id: "p2",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst sagen, dass das Wetter schön ist.",
      frame: "Il fait …",
      choices: [
        choice("Il fait beau.", true),
        choice("Il est beau.", false),
        choice("Je fais beau.", false),
      ],
      say: "Il fait beau.",
      why: "Das Wetter: il fait beau, il fait mauvais. Nicht il est beau.",
    },
    {
      id: "p2b",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst sagen, dass das Wetter schlecht ist.",
      frame: "Il fait …",
      choices: [
        choice("Il fait mauvais.", true),
        choice("Il fait mal.", false),
        choice("Il est mauvais temps.", false),
      ],
      say: "Il fait mauvais.",
      why: "Schlechtes Wetter: il fait mauvais. Il fait mal wäre „es tut weh“.",
    },
    {
      id: "p3",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst sagen, dass es regnet.",
      frame: "Il …",
      choices: [
        choice("Il pleut.", true),
        choice("Il fait pleut.", false),
        choice("Il pleure.", false),
      ],
      say: "Il pleut.",
      why: "Es regnet: il pleut. Il pleure heißt „er weint“.",
    },
    {
      id: "p4",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst sagen, dass jemand große Schmerzen hat.",
      frame: "Il a …",
      choices: [
        choice("Il a très mal.", true),
        choice("Il est très mal.", false),
        choice("Il fait très mal.", false),
      ],
      say: "Il a très mal.",
      why: "Schmerzen: avoir mal. Il a très mal.",
    },
    {
      id: "p5",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst fragen, wo die Abfahrt ist.",
      frame: "Où est … ?",
      choices: [
        choice("Où est le départ ?", true),
        choice("Quand est le départ ?", false),
        choice("Où est la plage ?", false),
      ],
      say: "Où est le départ ?",
      why: "Wo: où. Die Abfahrt: le départ.",
    },
    {
      id: "p6",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst fragen, wie lange die Schifffahrt dauert.",
      frame: "Combien … ?",
      choices: [
        choice("Combien de temps dure le tour en bateau ?", true),
        choice("Combien coûte le tour en bateau ?", false),
        choice("Où dure le tour en bateau ?", false),
      ],
      say: "Combien de temps dure le tour en bateau ?",
      why: "Wie lange: combien de temps. Wie viel kostet es: combien coûte.",
    },
    {
      id: "p7",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst fragen, was die Eintrittskarte kostet.",
      frame: "Combien … ?",
      choices: [
        choice("Combien coûte le billet ?", true),
        choice("Combien de temps coûte le billet ?", false),
        choice("Où est coûte le billet ?", false),
      ],
      say: "Combien coûte le billet ?",
      why: "Der Preis: combien coûte … ? Das Ticket: le billet.",
    },
    {
      id: "p8",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst sagen, dass ihr es noch viermal machen sollt.",
      frame: "Encore … !",
      choices: [
        choice("Encore quatre fois !", true),
        choice("Encore quatrième !", false),
        choice("Quatre encore fois !", false),
      ],
      say: "Encore quatre fois !",
      sayAlso: ["encore 4 fois"],
      why: "Noch einmal: encore. Viermal: quatre fois.",
    },
    {
      id: "p9",
      station: "parler",
      kind: "choice",
      tag: "Parler",
      prompt: "Du kannst sagen, dass der Strand hinter dem Platz ist.",
      frame: "… la place.",
      choices: [
        choice("La plage est derrière la place.", true),
        choice("La plage est devant la place.", false),
        choice("La place est derrière la plage.", false),
      ],
      say: "La plage est derrière la place.",
      why: "Der Strand: la plage. Hinter: derrière. Der Platz: la place.",
    },
    {
      id: "v2",
      station: "vocab",
      kind: "choice",
      tag: "Vokabeln",
      prompt: "Cool, on n'a plus de cours, c'est les ___ !",
      example: "Beispiel: Aujourd'hui, il ne fait vraiment pas chaud, il fait froid.",
      choices: [
        choice("vacances", true),
        choice("bateaux", false),
        choice("places", false),
      ],
      say: "Cool, on n'a plus de cours, c'est les vacances !",
      why: "Keine Schule mehr: ce sont les vacances.",
    },
    {
      id: "v3",
      station: "vocab",
      kind: "choice",
      tag: "Vokabeln",
      prompt: "Nice est une ville entre la mer et la ___.",
      choices: [
        choice("montagne", true),
        choice("plage", false),
        choice("mer", false),
      ],
      say: "Nice est une ville entre la mer et la montagne.",
      why: "Nizza liegt zwischen Meer und Berg: la montagne.",
    },
    {
      id: "v4",
      station: "vocab",
      kind: "choice",
      tag: "Vokabeln",
      prompt: "Oh, les jolies ___ : la mer, les palmiers, les maisons sont bleus, verts, jaunes, rouges …",
      choices: [
        choice("couleurs", true),
        choice("photos", false),
        choice("vacances", false),
      ],
      say: "Oh, les jolies couleurs !",
      why: "Blau, grün, gelb, rot: das sind les couleurs.",
    },
    {
      id: "v5",
      station: "vocab",
      kind: "choice",
      tag: "Vokabeln",
      prompt: "On fait un petit ou un ___ tour en mer ?",
      choices: [
        choice("grand", true),
        choice("petit", false),
        choice("froid", false),
      ],
      say: "On fait un petit ou un grand tour en mer ?",
      why: "petit oder das Gegenteil: un grand tour.",
    },
    {
      id: "v6",
      station: "vocab",
      kind: "choice",
      tag: "Vokabeln",
      prompt: "Sur le bateau, il ne fait pas chaud : il y a du ___.",
      choices: [
        choice("vent", true),
        choice("soleil", false),
        choice("mal", false),
      ],
      say: "Sur le bateau, il y a du vent.",
      why: "Nicht warm auf dem Boot: il y a du vent.",
    },
    {
      id: "v7",
      station: "vocab",
      kind: "choice",
      tag: "Vokabeln",
      prompt: "Aïe, mon pied ! Un oursin ! J'ai ___ !",
      choices: [
        choice("mal", true),
        choice("froid", false),
        choice("peur", false),
      ],
      say: "Aïe, mon pied ! J'ai mal !",
      why: "Ein Seeigel sticht: j'ai mal.",
    },
    {
      id: "s1",
      station: "ordre",
      kind: "order",
      tag: "Satzbau",
      prompt: "Max stellt Antoine vor. Bringe die Teile in die richtige Reihenfolge.",
      note: "Sujet – Verbe – direktes Objekt – indirektes Objekt.",
      tiles: ["Max", "présente", "présenter", "Antoine", "à Zoé"],
      answer: ["Max", "présente", "Antoine", "à Zoé"],
      say: "Max présente Antoine à Zoé.",
      why: "Wie im Buch: Max présente Antoine à Zoé. Antoine direkt, à Zoé indirekt.",
    },
    {
      id: "s2",
      station: "ordre",
      kind: "order",
      tag: "Satzbau",
      prompt: "Max und Lola geben Lolas Freundin ein Ticket fürs Boot.",
      note: "Vor einem Vokal: à l'amie, nicht à la amie.",
      tiles: ["Max et Lola", "donnent", "donner", "un billet pour le bateau", "à l'amie de Lola", "à la amie de Lola"],
      answer: ["Max et Lola", "donnent", "un billet pour le bateau", "à l'amie de Lola"],
      say: "Max et Lola donnent un billet pour le bateau à l'amie de Lola.",
      why: "Das Ticket ist direkt, à l'amie indirekt. amie beginnt mit Vokal: l'amie.",
    },
    {
      id: "s3",
      station: "ordre",
      kind: "order",
      tag: "Satzbau",
      prompt: "Antoine möchte ein Eis beim Verkäufer.",
      note: "à + le → au",
      tiles: ["Antoine", "demande", "demander", "une glace", "au vendeur", "à le vendeur"],
      answer: ["Antoine", "demande", "une glace", "au vendeur"],
      say: "Antoine demande une glace au vendeur.",
      why: "une glace steht vor dem indirekten Objekt. à + le vendeur wird zu au vendeur.",
    },
    {
      id: "s4",
      station: "ordre",
      kind: "order",
      tag: "Satzbau",
      prompt: "Die Großeltern schlagen den Kindern eine Bootsfahrt vor.",
      note: "à + les → aux",
      tiles: ["Les grands-parents", "proposent", "proposer", "un tour en bateau", "aux enfants", "à les enfants"],
      answer: ["Les grands-parents", "proposent", "un tour en bateau", "aux enfants"],
      say: "Les grands-parents proposent un tour en bateau aux enfants.",
      why: "proposer quelque chose à quelqu'un. à + les enfants = aux enfants.",
    },
    {
      id: "s5",
      station: "ordre",
      kind: "order",
      tag: "Satzbau",
      prompt: "Ein Betreuer zeigt den Jugendlichen die Übungen.",
      note: "montrer quelque chose à quelqu'un",
      tiles: ["Un moniteur", "montre", "montrer", "les exercices", "aux adolescents", "à les adolescents"],
      answer: ["Un moniteur", "montre", "les exercices", "aux adolescents"],
      say: "Un moniteur montre les exercices aux adolescents.",
      why: "les exercices direkt, aux adolescents indirekt.",
    },
    {
      id: "s6",
      station: "ordre",
      kind: "order",
      tag: "Satzbau",
      prompt: "Max erzählt den Mädchen von seinem Praktikum.",
      note: "raconter quelque chose à quelqu'un",
      tiles: ["Max", "raconte", "raconter", "son stage", "aux filles", "à les filles"],
      answer: ["Max", "raconte", "son stage", "aux filles"],
      say: "Max raconte son stage aux filles.",
      why: "son stage direkt, aux filles indirekt. à + les = aux.",
    },
    {
      id: "l1",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "Max et Lola ___ Nice à Zoé.",
      passage: true,
      word: "montrent",
      choices: [
        choice("montrent", true),
        choice("montre", false),
        choice("montrer", false),
      ],
      say: "Max et Lola montrent Nice à Zoé.",
      why: "Max et Lola = ils. montrer → montrent.",
    },
    {
      id: "l2",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "la vieille ville avec ses ___ rues",
      passage: true,
      word: "petites",
      choices: [
        choice("petites", true),
        choice("petite", false),
        choice("petits", false),
      ],
      say: "Zoé aime la vieille ville avec ses petites rues.",
      why: "rues ist weiblich und Plural. petit steht vor dem Nomen: petites.",
    },
    {
      id: "l3",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "De là, elle ___ enfin la mer.",
      passage: true,
      word: "voit",
      choices: [
        choice("voit", true),
        choice("vois", false),
        choice("voir", false),
      ],
      say: "De là, elle voit enfin la mer.",
      why: "elle voit. voir: il/elle voit.",
    },
    {
      id: "l4",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "sa couleur ___ de rêve",
      passage: true,
      word: "bleue",
      choices: [
        choice("bleue", true),
        choice("bleu", false),
        choice("bleus", false),
      ],
      say: "Elle voit la mer et sa couleur bleue de rêve.",
      why: "la couleur ist weiblich: bleue.",
    },
    {
      id: "l5",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "Demain, on va ___ ?",
      passage: true,
      word: "nager",
      choices: [
        choice("nager", true),
        choice("nage", false),
        choice("nageons", false),
      ],
      say: "Demain, on va nager ?",
      why: "on va + Infinitiv: nager.",
    },
    {
      id: "l6",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "Tu sais, la mer est encore ___.",
      passage: true,
      word: "froide",
      choices: [
        choice("froide", true),
        choice("froid", false),
        choice("froids", false),
      ],
      say: "La mer est encore froide.",
      why: "la mer ist weiblich: froide.",
    },
    {
      id: "l7",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "L'eau n'est pas ___.",
      passage: true,
      word: "chaude",
      choices: [
        choice("chaude", true),
        choice("chaud", false),
        choice("chaudes", false),
      ],
      say: "L'eau n'est pas chaude.",
      why: "l'eau ist weiblich: chaude.",
    },
    {
      id: "l8",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "je vais sur les rochers et je ___ dans l'eau",
      passage: true,
      word: "saute",
      choices: [
        choice("saute", true),
        choice("sauter", false),
        choice("sautent", false),
      ],
      say: "Je saute dans l'eau.",
      why: "je saute. sauter wie parler: je saute.",
    },
    {
      id: "l9",
      station: "lire",
      kind: "choice",
      tag: "Lesetext",
      prompt: "Mais d'abord, on va manger ___, OK ?",
      passage: true,
      word: "une glace",
      choices: [
        choice("une glace", true),
        choice("un glace", false),
        choice("des glaces", false),
      ],
      say: "On va manger une glace.",
      why: "une glace ist weiblich. Im Wortkasten steht une glace.",
    },
    {
      id: "a1",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "Max est ___.",
      choices: [
        choice("content", true),
        choice("contente", false),
        choice("contents", false),
        choice("contentes", false),
      ],
      say: "Max est content.",
      why: "Max ist männlich Singular: content.",
    },
    {
      id: "a2",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "Zoé est ___.",
      choices: [
        choice("contente", true),
        choice("content", false),
        choice("contentes", false),
        choice("contents", false),
      ],
      say: "Zoé est contente.",
      why: "Zoé ist weiblich Singular: ein -e dazu. contente.",
    },
    {
      id: "a3",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "Jules et Max sont ___.",
      choices: [
        choice("contents", true),
        choice("content", false),
        choice("contentes", false),
        choice("contente", false),
      ],
      say: "Jules et Max sont contents.",
      why: "Zwei Jungen: männlich Plural. contents.",
    },
    {
      id: "a4",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "Lola et Zoé sont ___.",
      choices: [
        choice("contentes", true),
        choice("contents", false),
        choice("contente", false),
        choice("content", false),
      ],
      say: "Lola et Zoé sont contentes.",
      why: "Zwei Mädchen: weiblich Plural. contentes.",
    },
    {
      id: "a5",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "Max et Lola sont ___.",
      choices: [
        choice("contents", true),
        choice("contentes", false),
        choice("content", false),
        choice("contente", false),
      ],
      say: "Max et Lola sont contents.",
      why: "Junge und Mädchen zusammen: männlich Plural. contents.",
    },
    {
      id: "a6",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "grand steht vor dem Nomen. Wie heißt „eine große Stadt“?",
      choices: [
        choice("une grande ville", true),
        choice("une ville grande", false),
        choice("une grand ville", false),
      ],
      say: "Nice est une grande ville.",
      why: "grand/grande steht vor dem Nomen. ville ist weiblich: une grande ville.",
    },
    {
      id: "a7",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "Die meisten Adjektive stehen nach dem Nomen. „eine interessante Stadt“?",
      choices: [
        choice("une ville intéressante", true),
        choice("une intéressante ville", false),
        choice("une ville intéressant", false),
      ],
      say: "Nice est une ville intéressante.",
      why: "intéressant steht nach dem Nomen und bekommt -e: une ville intéressante.",
    },
    {
      id: "a8",
      station: "adj",
      kind: "choice",
      tag: "Adjektiv",
      prompt: "joli steht vor dem Nomen. une ___ promenade",
      choices: [
        choice("jolie", true),
        choice("joli", false),
        choice("jolis", false),
      ],
      say: "une jolie promenade",
      why: "promenade ist weiblich: jolie. Und joli steht vor dem Nomen.",
    },
    {
      id: "vv1",
      station: "voir",
      kind: "choice",
      tag: "voir",
      prompt: "Moi, je ___ un sac en plastique.",
      choices: [
        choice("vois", true),
        choice("voit", false),
        choice("voyons", false),
      ],
      say: "Moi, je vois un sac en plastique.",
      why: "je vois, tu vois. Das -s bleibt stehen.",
    },
    {
      id: "vv2",
      station: "voir",
      kind: "choice",
      tag: "voir",
      prompt: "Tu ___ le bateau ?",
      choices: [
        choice("vois", true),
        choice("voit", false),
        choice("voyez", false),
      ],
      say: "Tu vois le bateau ?",
      why: "tu vois, genau wie je vois.",
    },
    {
      id: "vv3",
      station: "voir",
      kind: "choice",
      tag: "voir",
      prompt: "Elle ___ enfin la mer.",
      choices: [
        choice("voit", true),
        choice("vois", false),
        choice("voient", false),
      ],
      say: "Elle voit enfin la mer.",
      why: "il, elle und on: voit. Ohne -s.",
    },
    {
      id: "vv4",
      station: "voir",
      kind: "choice",
      tag: "voir",
      prompt: "Nous ___ les palmiers.",
      choices: [
        choice("voyons", true),
        choice("voyez", false),
        choice("vois", false),
      ],
      say: "Nous voyons les palmiers.",
      why: "nous voyons. Das y bleibt, und -ons kommt dazu.",
    },
    {
      id: "vv5",
      station: "voir",
      kind: "choice",
      tag: "voir",
      prompt: "Vous ___ le dauphin, là-bas ?",
      choices: [
        choice("voyez", true),
        choice("vois", false),
        choice("voient", false),
      ],
      say: "Vous voyez le dauphin, là-bas ?",
      why: "vous voyez. In der Sprechblase auf dem Boot.",
    },
    {
      id: "vv6",
      station: "voir",
      kind: "choice",
      tag: "voir",
      prompt: "Ils ___ un dauphin.",
      choices: [
        choice("voient", true),
        choice("voyez", false),
        choice("voit", false),
      ],
      say: "Ils voient un dauphin.",
      why: "ils und elles: voient. Das wird wie voyez gesprochen, mit -ent stumm.",
    },
    {
      id: "sp1",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Frag, wie das Wetter ist.",
      say: "Quel temps fait-il aujourd'hui ?",
    },
    {
      id: "sp2",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Sag, dass jemand starke Schmerzen hat.",
      say: "Il a très mal.",
    },
    {
      id: "sp3",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Sag, dass der Strand hinter dem Platz ist.",
      say: "La plage est derrière la place.",
    },
    {
      id: "sp4",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Lola zeigt ihrer Freundin die Stadt.",
      say: "Aujourd'hui, Lola montre la ville à son amie.",
    },
    {
      id: "sp5",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Sag, dass Zoé zufrieden ist.",
      say: "Zoé est contente.",
    },
    {
      id: "sp6",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Frag, ob ihr den Delfin dort seht.",
      say: "Vous voyez le dauphin, là-bas ?",
    },
    {
      id: "sp7",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Sag: noch viermal!",
      say: "Encore quatre fois !",
      sayAlso: ["encore 4 fois"],
    },
    {
      id: "sp8",
      station: "speak",
      kind: "speak",
      tag: "Aussprache",
      prompt: "Schwärme von Nizza.",
      say: "Oh oui ! Nice est une ville intéressante !",
    },
  ];

  var TEST_IDS = ["p1", "p3", "p4", "p9", "v2", "s3", "l1", "a2", "a5", "vv5"];

  var STATIONS = [
    { id: "test", title: "Ganzer Test", desc: "10 Aufgaben aus dem Bilan, danach nachsprechen", badge: "Test" },
    { id: "parler", title: "Parler", desc: "Wetter, Abfahrt, Preis, Strand", badge: "1" },
    { id: "vocab", title: "Vokabeln", desc: "Lücken zum Meer, zum Wind, zu den Ferien", badge: "2" },
    { id: "ordre", title: "Satzbau", desc: "Direktes Objekt vor indirektem, au und aux", badge: "3" },
    { id: "lire", title: "Lesetext", desc: "Max und Lola zeigen Zoé Nizza", badge: "4" },
    { id: "adj", title: "Adjektive", desc: "content, und was vor dem Nomen steht", badge: "5" },
    { id: "voir", title: "voir", desc: "je vois, vous voyez, ils voient", badge: "6" },
    { id: "speak", title: "Nachsprechen", desc: "Nur hören und laut sagen", badge: "♪" },
  ];

  var INTRO = {
    test: "Zehn Aufgaben. Erst die Antwort, dann sprichst du den Satz.",
    parler: "Such den französischen Satz. Dann hörst du ihn und sprichst nach.",
    vocab: "Beispiel aus dem Buch: il fait froid. Jetzt du.",
    ordre: "Subjekt, Verb, direktes Objekt, dann indirektes. à + le = au.",
    lire: "Lies den Text. Verben und Adjektive in der richtigen Form.",
    adj: "Achte auf -e und -s. Manche Adjektive stehen vor dem Nomen.",
    voir: "je vois, tu vois, il voit, nous voyons, vous voyez, ils voient.",
    speak: "Hör genau hin. Sprich den Satz dann ins Mikrofon.",
  };

  var NUMBERS = {
    "0": "zero",
    "1": "un",
    "2": "deux",
    "3": "trois",
    "4": "quatre",
    "5": "cinq",
    "6": "six",
    "7": "sept",
    "8": "huit",
    "9": "neuf",
    "10": "dix",
  };

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
    var j, i;
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
    /* Whole words only, so content/contente and derrière/devant stay different. */
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

  function byId(id) {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (QUESTIONS[i].id === id) return QUESTIONS[i];
    }
    return null;
  }

  function questionsFor(stationId) {
    if (stationId === "test") {
      return TEST_IDS.map(byId);
    }
    return QUESTIONS.filter(function (q) { return q.station === stationId; });
  }

  function correctWord(q) {
    if (!q) return "";
    if (q.word) return q.word;
    if (q.kind === "order") return q.answer.join(" ");
    if (q.choices) {
      for (var i = 0; i < q.choices.length; i++) {
        if (q.choices[i].ok) return q.choices[i].text;
      }
    }
    return q.say || "";
  }

  function choiceOk(q, index) {
    return !!(q && q.choices && q.choices[index] && q.choices[index].ok);
  }

  function orderOk(picked, answer) {
    if (!picked || !answer || picked.length !== answer.length) return false;
    for (var i = 0; i < answer.length; i++) {
      if (picked[i] !== answer[i]) return false;
    }
    return true;
  }

  function validate() {
    var seen = {};
    QUESTIONS.forEach(function (q) {
      if (!q.id || seen[q.id]) throw new Error("bad id " + q.id);
      seen[q.id] = true;
      if (!q.say) throw new Error("no say " + q.id);
      if (q.kind === "choice") {
        var oks = (q.choices || []).filter(function (c) { return c.ok; });
        if (oks.length !== 1) throw new Error("choices " + q.id);
      }
      if (q.kind === "order") {
        q.answer.forEach(function (part) {
          if (q.tiles.indexOf(part) < 0) throw new Error("tile missing " + q.id + " " + part);
        });
        if (q.answer.length < 2) throw new Error("short answer " + q.id);
      }
    });
    TEST_IDS.forEach(function (id) {
      if (!seen[id]) throw new Error("test id " + id);
    });
    PASSAGE.forEach(function (part) {
      if (part.b && !seen[part.b]) throw new Error("passage " + part.b);
    });
  }

  validate();

  return {
    PASSAGE: PASSAGE,
    QUESTIONS: QUESTIONS,
    TEST_IDS: TEST_IDS,
    STATIONS: STATIONS,
    INTRO: INTRO,
    fold: fold,
    compact: compact,
    speechMatch: speechMatch,
    questionsFor: questionsFor,
    byId: byId,
    correctWord: correctWord,
    choiceOk: choiceOk,
    orderOk: orderOk,
  };
});
