(() => {
  "use strict";

  /** @typedef {{ n: number, d: number }} Frac */

  const gcd = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  };

  const simplify = (n, d) => {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    if (n === 0) return { n: 0, d: 1 };
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  };

  const F = (n, d = 1) => simplify(n, d);

  const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => F(a.n * b.n, a.d * b.d);
  const div = (a, b) => F(a.n * b.d, a.d * b.n);
  const neg = (a) => F(-a.n, a.d);
  const powInt = (a, e) => {
    let r = F(1);
    for (let i = 0; i < e; i++) r = mul(r, a);
    return r;
  };

  const eq = (a, b) => a.n * b.d === b.n * a.d;

  const VULGAR = {
    "½": { n: 1, d: 2 },
    "⅓": { n: 1, d: 3 },
    "⅔": { n: 2, d: 3 },
    "¼": { n: 1, d: 4 },
    "¾": { n: 3, d: 4 },
    "⅕": { n: 1, d: 5 },
    "⅖": { n: 2, d: 5 },
    "⅗": { n: 3, d: 5 },
    "⅘": { n: 4, d: 5 },
    "⅙": { n: 1, d: 6 },
    "⅚": { n: 5, d: 6 },
    "⅛": { n: 1, d: 8 },
    "⅜": { n: 3, d: 8 },
    "⅝": { n: 5, d: 8 },
    "⅞": { n: 7, d: 8 },
  };

  const parseAnswer = (raw) => {
    // Normalize unicode minus / fraction slash / decimal comma first.
    let s = String(raw)
      .trim()
      .replace(/[−–—]/g, "-")
      .replace(/[⁄∕]/g, "/")
      .replace(/,/g, ".");
    if (!s) return null;

    // Lone vulgar fraction, optional leading minus: ¾ or -¼
    const vulgarOnly = s.match(/^(-?)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
    if (vulgarOnly) {
      const v = VULGAR[vulgarOnly[2]];
      return F(vulgarOnly[1] === "-" ? -v.n : v.n, v.d);
    }

    // Mixed number MUST have a separator (space or +), otherwise
    // "12/9" was wrongly read as 1 + 2/9.
    const mixedSpace = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    const mixedPlus = s.match(/^(-?\d+)\s*\+\s*(\d+)\s*\/\s*(\d+)$/);
    const mixed = mixedSpace || mixedPlus;
    if (mixed) {
      const whole = Number(mixed[1]);
      const n = Number(mixed[2]);
      const d = Number(mixed[3]);
      if (!d) return null;
      const sign = whole < 0 || Object.is(whole, -0) ? -1 : 1;
      return add(F(whole), F(sign * n, d));
    }

    s = s.replace(/\s+/g, "");

    const frac = s.match(/^(-?\d+)\/(-?\d+)$/);
    if (frac) {
      const d = Number(frac[2]);
      if (!d) return null;
      return F(Number(frac[1]), d);
    }

    if (/^-?\d+(\.\d+)?$/.test(s)) {
      const x = Number(s);
      if (!Number.isFinite(x)) return null;
      const str = String(x);
      if (!str.includes(".")) return F(x, 1);
      const decimals = str.split(".")[1].length;
      const den = 10 ** decimals;
      return F(Math.round(x * den), den);
    }

    return null;
  };

  const fmt = (f) => {
    if (f.d === 1) return String(f.n);
    return `${f.n}/${f.d}`;
  };

  const fmtPretty = (f) => {
    if (f.d === 1) return String(f.n);
    const sign = f.n < 0 ? "−" : "";
    const n = Math.abs(f.n);
    return `${sign}${n}⁄${f.d}`;
  };

  /**
   * Problems mirror textbook exercise styles:
   * Punkt vor Strich, Klammern, Brüche, ggf. Potenzen / Negative.
   */
  const BANK = {
    easy: [
      {
        id: "e1",
        display: "⁸⁄₉ + ²⁄₉ · 2",
        highlightFirst: "²⁄₉ · 2",
        firstStep: "punkt",
        steps: [
          "Zuerst Punktrechnung: 2/9 · 2 = 4/9",
          "Dann Strich: 8/9 + 4/9 = 12/9 → völlig gekürzt: 4/3",
        ],
        answer: F(4, 3),
      },
      {
        id: "e2",
        display: "⁴⁄₃ + ⁴⁄₃ · 2",
        highlightFirst: "⁴⁄₃ · 2",
        firstStep: "punkt",
        steps: ["Zuerst · : 4/3 · 2 = 8/3", "Dann +: 4/3 + 8/3 = 12/3 = 4"],
        answer: F(4, 1),
        alsoAccept: [F(12, 3)],
      },
      {
        id: "e3",
        display: "⁵⁄₆ − ¹⁄₃ · ½",
        highlightFirst: "¹⁄₃ · ½",
        firstStep: "punkt",
        steps: [
          "Punkt: 1/3 · 1/2 = 1/6",
          "Strich: 5/6 − 1/6 = 4/6 → völlig gekürzt: 2/3",
        ],
        answer: F(2, 3),
      },
      {
        id: "e4",
        display: "¾ · ⁸⁄₉ + ⅙",
        highlightFirst: "¾ · ⁸⁄₉",
        firstStep: "punkt",
        steps: ["Punkt: 3/4 · 8/9 = 24/36 = 2/3", "Strich: 2/3 + 1/6 = 4/6 + 1/6 = 5/6"],
        answer: F(5, 6),
      },
      {
        id: "e5",
        display: "2 − ¾ · ⁸⁄₃",
        highlightFirst: "¾ · ⁸⁄₃",
        firstStep: "punkt",
        steps: ["Punkt: 3/4 · 8/3 = 2", "Strich: 2 − 2 = 0"],
        answer: F(0, 1),
      },
      {
        id: "e6",
        display: "⁵⁄₄ + ½ : ¼",
        highlightFirst: "½ : ¼",
        firstStep: "punkt",
        steps: ["Punkt (:): 1/2 : 1/4 = 2", "Strich: 5/4 + 2 = 5/4 + 8/4 = 13/4"],
        answer: F(13, 4),
      },
      {
        id: "e7",
        display: "⁷⁄₈ − ¼ · ½",
        highlightFirst: "¼ · ½",
        firstStep: "punkt",
        steps: [
          "Punkt: 1/4 · 1/2 = 1/8",
          "Strich: 7/8 − 1/8 = 6/8 → völlig gekürzt: 3/4",
        ],
        answer: F(3, 4),
      },
      {
        id: "e8",
        display: "⅓ · 6 + ⅖",
        highlightFirst: "⅓ · 6",
        firstStep: "punkt",
        steps: ["Punkt: 1/3 · 6 = 2", "Strich: 2 + 2/5 = 10/5 + 2/5 = 12/5"],
        answer: F(12, 5),
      },
    ],
    medium: [
      {
        id: "m1",
        display: "¾ − ¾ · (⅚ + ½)",
        highlightFirst: "(⅚ + ½)",
        firstStep: "klammer",
        steps: [
          "Klammer: 5/6 + 1/2 = 5/6 + 3/6 = 8/6 = 4/3",
          "Punkt: 3/4 · 4/3 = 1",
          "Strich: 3/4 − 1 = −1/4",
        ],
        answer: F(-1, 4),
      },
      {
        id: "m2",
        display: "(⅖ + ⅗) · ¾",
        highlightFirst: "(⅖ + ⅗)",
        firstStep: "klammer",
        steps: ["Klammer: 2/5 + 3/5 = 1", "Punkt: 1 · 3/4 = 3/4"],
        answer: F(3, 4),
      },
      {
        id: "m3",
        display: "⅚ + (⅓ − ⅙) · 2",
        highlightFirst: "(⅓ − ⅙)",
        firstStep: "klammer",
        steps: [
          "Klammer: 1/3 − 1/6 = 2/6 − 1/6 = 1/6",
          "Punkt: 1/6 · 2 = 1/3",
          "Strich: 5/6 + 1/3 = 5/6 + 2/6 = 7/6",
        ],
        answer: F(7, 6),
      },
      {
        id: "m4",
        display: "½ · (¾ + ¼) − ⅛",
        highlightFirst: "(¾ + ¼)",
        firstStep: "klammer",
        steps: [
          "Klammer: 3/4 + 1/4 = 1",
          "Punkt: 1/2 · 1 = 1/2",
          "Strich: 1/2 − 1/8 = 4/8 − 1/8 = 3/8",
        ],
        answer: F(3, 8),
      },
      {
        id: "m5",
        display: "2 · (⅚ − ⅓) + ¼",
        highlightFirst: "(⅚ − ⅓)",
        firstStep: "klammer",
        steps: [
          "Klammer: 5/6 − 1/3 = 5/6 − 2/6 = 3/6 = 1/2",
          "Punkt: 2 · 1/2 = 1",
          "Strich: 1 + 1/4 = 5/4",
        ],
        answer: F(5, 4),
      },
      {
        id: "m6",
        display: "(⅞ − ⅜) : ½",
        highlightFirst: "(⅞ − ⅜)",
        firstStep: "klammer",
        steps: ["Klammer: 7/8 − 3/8 = 4/8 = 1/2", "Punkt (:): 1/2 : 1/2 = 1"],
        answer: F(1, 1),
      },
      {
        id: "m7",
        display: "⅘ − ⅖ · (¾ + ¼)",
        highlightFirst: "(¾ + ¼)",
        firstStep: "klammer",
        steps: [
          "Klammer: 3/4 + 1/4 = 1",
          "Punkt: 2/5 · 1 = 2/5",
          "Strich: 4/5 − 2/5 = 2/5",
        ],
        answer: F(2, 5),
      },
      {
        id: "m8",
        display: "⅓ + ⅔ · (½ + ½)",
        highlightFirst: "(½ + ½)",
        firstStep: "klammer",
        steps: [
          "Klammer: 1/2 + 1/2 = 1",
          "Punkt: 2/3 · 1 = 2/3",
          "Strich: 1/3 + 2/3 = 1",
        ],
        answer: F(1, 1),
      },
    ],
    hard: [
      {
        id: "h1",
        display: "−5 − 4 · (−2)",
        highlightFirst: "4 · (−2)",
        firstStep: "punkt",
        steps: ["Punkt: 4 · (−2) = −8", "Strich: −5 − (−8) = −5 + 8 = 3"],
        answer: F(3, 1),
      },
      {
        id: "h2",
        display: "(⅘)² − ⅓ · ⅗",
        highlightFirst: "(⅘)²",
        firstStep: "potenz",
        steps: [
          "Potenz: (4/5)² = 16/25",
          "Punkt: 1/3 · 3/5 = 1/5 = 5/25",
          "Strich: 16/25 − 5/25 = 11/25",
        ],
        answer: F(11, 25),
      },
      {
        id: "h3",
        display: "¾ − ¾ · (⅚ + ½)",
        highlightFirst: "(⅚ + ½)",
        firstStep: "klammer",
        steps: [
          "Klammer: 5/6 + 1/2 = 4/3",
          "Punkt: 3/4 · 4/3 = 1",
          "Strich: 3/4 − 1 = −1/4",
        ],
        answer: F(-1, 4),
      },
      {
        id: "h4",
        display: "2² · (⅓ + ⅙) − ½",
        highlightFirst: "2²",
        firstStep: "potenz",
        // Actually both power and paren can be first; we teach powers & paren before ·
        // Prefer klammer OR potenz - let's ask for potenz as listed, but accept klammer too via choice logic
        steps: [
          "Potenz: 2² = 4",
          "Klammer: 1/3 + 1/6 = 1/2",
          "Punkt: 4 · 1/2 = 2",
          "Strich: 2 − 1/2 = 3/2",
        ],
        answer: F(3, 2),
        firstStepAlt: "klammer",
      },
      {
        id: "h5",
        display: "−⅜ + (−¼) · 2",
        highlightFirst: "(−¼) · 2",
        firstStep: "punkt",
        steps: ["Punkt: (−1/4) · 2 = −1/2", "Strich: −3/8 + (−1/2) = −3/8 − 4/8 = −7/8"],
        answer: F(-7, 8),
      },
      {
        id: "h6",
        display: "(⅔ + ⅓)² − ¾",
        highlightFirst: "(⅔ + ⅓)",
        firstStep: "klammer",
        steps: [
          "Klammer: 2/3 + 1/3 = 1",
          "Potenz: 1² = 1",
          "Strich: 1 − 3/4 = 1/4",
        ],
        answer: F(1, 4),
      },
      {
        id: "h7",
        display: "⅚ : ⅖ − ½",
        highlightFirst: "⅚ : ⅖",
        firstStep: "punkt",
        steps: [
          "Punkt (:): 5/6 : 2/5 = 5/6 · 5/2 = 25/12",
          "Strich: 25/12 − 1/2 = 25/12 − 6/12 = 19/12",
        ],
        answer: F(19, 12),
      },
      {
        id: "h8",
        display: "1 − ⅖ · (¾ − ¼)",
        highlightFirst: "(¾ − ¼)",
        firstStep: "klammer",
        steps: [
          "Klammer: 3/4 − 1/4 = 1/2",
          "Punkt: 2/5 · 1/2 = 1/5",
          "Strich: 1 − 1/5 = 4/5",
        ],
        answer: F(4, 5),
      },
    ],
  };

  const STEP_LABELS = {
    klammer: "Zuerst die Klammer rechnen",
    potenz: "Zuerst die Potenz rechnen",
    punkt: "Zuerst Punktrechnung (· oder :)",
    strich: "Zuerst Strichrechnung (+ oder −)",
  };

  const LEVEL_ORDER = ["easy", "medium", "hard"];
  const LEVEL_META = {
    easy: { next: "medium", label: "Sanft", num: 1 },
    medium: { next: "hard", label: "Mutig", num: 2 },
    hard: { next: null, label: "Sternenflug", num: 3 },
  };

  const STORAGE_KEY = "maya-termen-progress-v1";
  const SCRATCH_DIARY_KEY = "maya-scratch-diary-v1";
  const SCRATCH_CURRENT_KEY = "maya-scratch-current-v1";
  const STICKER_KEY = "maya-stickers-v1";
  const SOUND_KEY = "maya-sound-on";

  const STICKERS = [
    { id: "bloom", name: "Blumenball", cls: "bloom", how: "Erste richtige Antwort" },
    { id: "leafy", name: "Waldblatt", cls: "leafy", how: "Serie von 3" },
    { id: "gem", name: "Pfadstein", cls: "gem", how: "Level Sanft geschafft" },
    { id: "comet", name: "Sternenkomet", cls: "comet", how: "Level Sternenflug geschafft" },
  ];

  const CHEERS = [
    "Ja! Fuchsi hüpft vor Freude!",
    "Wow, Maya — das saß!",
    "Du rockst den Termen-Pfad!",
    "Super Schritt — weiter so!",
    "Klasse! Noch ein Stein auf dem Pfad!",
  ];
  const NUDGES = [
    "Kein Stress — schreib auf dem Zettel.",
    "Atem holen… dann Punkt vor Strich.",
    "Fuchsi glaubt an dich!",
    "Tipp nutzen ist total erlaubt.",
  ];
  const GUIDES = [
    "Genau diesen Schritt jetzt — du schaffst das.",
    "Rechne schön langsam auf dem Zettel.",
    "Zwischenergebnis eintragen, dann geht’s weiter.",
  ];

  const loadProgress = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { unlocked: ["easy"], completed: [], totalStars: 0 };
      const data = JSON.parse(raw);
      return {
        unlocked: Array.isArray(data.unlocked) && data.unlocked.length ? data.unlocked : ["easy"],
        completed: Array.isArray(data.completed) ? data.completed : [],
        totalStars: Number(data.totalStars) || 0,
      };
    } catch {
      return { unlocked: ["easy"], completed: [], totalStars: 0 };
    }
  };

  const loadStickers = () => {
    try {
      const raw = localStorage.getItem(STICKER_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const saveStickers = (ids) => {
    localStorage.setItem(STICKER_KEY, JSON.stringify(ids));
  };

  const saveProgress = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unlocked: state.unlocked,
        completed: state.completed,
        totalStars: state.totalStars,
      })
    );
  };

  const loadDiary = () => {
    try {
      const raw = localStorage.getItem(SCRATCH_DIARY_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const saveDiary = (entries) => {
    localStorage.setItem(SCRATCH_DIARY_KEY, JSON.stringify(entries.slice(0, 100)));
  };

  const persistCurrentScratch = () => {
    localStorage.setItem(SCRATCH_CURRENT_KEY, $("scratchFree").value);
  };

  const restoreCurrentScratch = () => {
    const saved = localStorage.getItem(SCRATCH_CURRENT_KEY);
    if (saved != null) $("scratchFree").value = saved;
  };

  const snapshotScratch = (reason) => {
    const text = $("scratchFree").value;
    if (!text.trim()) return;
    const problem = state.queue[state.index];
    const entry = {
      id: Date.now(),
      at: new Date().toISOString(),
      reason,
      level: state.level,
      levelLabel: LEVEL_META[state.level]?.label || state.level,
      problemId: problem?.id || "",
      term: problem?.display || $("scratchTerm").textContent || "",
      text,
    };
    const diary = loadDiary();
    const prev = diary[0];
    if (prev && prev.text === entry.text && prev.term === entry.term) {
      prev.at = entry.at;
      prev.reason = reason;
    } else {
      diary.unshift(entry);
    }
    saveDiary(diary);
  };

  const progress = loadProgress();

  const state = {
    level: "easy",
    queue: [],
    index: 0,
    stars: 0,
    streak: 0,
    phase: "choose", // choose | guide | answer | doneQ
    hintShown: false,
    advanceTimer: 0,
    guideIndex: 0,
    guidePassed: false,
    guideFilled: [],
    kuerzen: null, // { rawN, rawD, target, context: 'guide'|'answer' }
    unlocked: progress.unlocked.includes("easy")
      ? progress.unlocked
      : ["easy", ...progress.unlocked],
    completed: progress.completed,
    totalStars: progress.totalStars,
    stickers: loadStickers(),
    soundOn: localStorage.getItem(SOUND_KEY) !== "0",
    solvedInRound: 0,
  };

  const $ = (id) => document.getElementById(id);

  const screens = {
    home: $("screen-home"),
    how: $("screen-how"),
    play: $("screen-play"),
    done: $("screen-done"),
    parent: $("screen-parent"),
    stickers: $("screen-stickers"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function mayaLevelFromStars(total) {
    return 1 + Math.floor(Math.max(0, total) / 12);
  }

  function updateStats() {
    $("starCount").textContent = String(state.stars);
    $("streakCount").textContent = String(state.streak);
    $("mayaLevel").textContent = String(mayaLevelFromStars(state.totalStars));
    const soundBtn = $("btnSound");
    if (soundBtn) {
      soundBtn.setAttribute("aria-pressed", state.soundOn ? "true" : "false");
      soundBtn.textContent = state.soundOn ? "Sound an" : "Sound aus";
    }
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function setFoxMood(mood) {
    ["homeFox", "playFox"].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.classList.remove("happy", "think", "sad");
      if (mood) {
        void el.offsetWidth;
        el.classList.add(mood);
      }
    });
  }

  function say(text, mood) {
    const play = $("playSpeech");
    const home = $("homeSpeech");
    if (play && screens.play.classList.contains("active")) {
      play.textContent = text;
    }
    if (home) home.textContent = text;
    if (mood) setFoxMood(mood);
  }

  function popStar(label) {
    const el = $("starPop");
    if (!el) return;
    el.hidden = false;
    el.textContent = label || "+Stern";
    el.classList.remove("star-pop");
    void el.offsetWidth;
    el.classList.add("star-pop");
    window.setTimeout(() => {
      el.hidden = true;
    }, 900);
  }

  let audioCtx = null;
  function playTone(freq, dur, type = "sine", gain = 0.045) {
    if (!state.soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gain;
      osc.connect(g);
      g.connect(audioCtx.destination);
      const t = audioCtx.currentTime;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
    } catch {
      /* ignore audio errors */
    }
  }

  function sfxCheer() {
    playTone(523.25, 0.12, "triangle", 0.04);
    window.setTimeout(() => playTone(659.25, 0.14, "triangle", 0.04), 80);
    window.setTimeout(() => playTone(783.99, 0.18, "triangle", 0.035), 160);
  }

  function sfxNudge() {
    playTone(392, 0.1, "sine", 0.03);
    window.setTimeout(() => playTone(349.23, 0.12, "sine", 0.025), 90);
  }

  function sfxStep() {
    playTone(440, 0.08, "triangle", 0.03);
    window.setTimeout(() => playTone(554.37, 0.1, "triangle", 0.03), 70);
  }

  function unlockSticker(id) {
    if (state.stickers.includes(id)) return null;
    state.stickers.push(id);
    saveStickers(state.stickers);
    const meta = STICKERS.find((s) => s.id === id);
    return meta || { id, name: id };
  }

  function renderTrail(containerId, currentIndex, total, solvedCount) {
    const box = $(containerId);
    if (!box) return;
    box.innerHTML = "";
    const n = total || 8;
    for (let i = 0; i < n; i++) {
      const stone = document.createElement("span");
      stone.className = "stone";
      if (i < solvedCount) stone.classList.add("done");
      if (i === currentIndex) stone.classList.add("current");
      box.appendChild(stone);
    }
  }

  function renderStickerGrid(targetId, highlightId) {
    const box = $(targetId);
    if (!box) return;
    box.innerHTML = "";
    STICKERS.forEach((s) => {
      const owned = state.stickers.includes(s.id);
      const card = document.createElement("div");
      card.className = `sticker ${owned ? "owned" : "locked-sticker"}`;
      if (highlightId && s.id === highlightId) card.classList.add("owned");
      card.innerHTML = `<span class="${s.cls}" aria-hidden="true"></span><span class="sticker-label">${owned ? s.name : "???"}</span>`;
      card.title = owned ? s.name : s.how;
      box.appendChild(card);
    });
  }

  function refreshLevelButtons() {
    document.querySelectorAll(".level").forEach((btn) => {
      const id = btn.dataset.level;
      const unlocked = state.unlocked.includes(id);
      btn.classList.toggle("locked", !unlocked);
      btn.disabled = !unlocked;
      const lock = btn.querySelector(".level-lock");
      if (lock) {
        if (!unlocked) {
          lock.hidden = false;
          lock.textContent = "Noch gesperrt";
        } else if (state.completed.includes(id)) {
          lock.hidden = false;
          lock.textContent = "Geschafft";
        } else {
          lock.hidden = true;
        }
      }
      if (!unlocked && state.level === id) {
        state.level = "easy";
      }
      btn.classList.toggle("active", btn.dataset.level === state.level && unlocked);
    });
  }

  // --- Confetti -----------------------------------------------------------
  const confettiCanvas = $("confetti");
  const confettiCtx = confettiCanvas.getContext("2d");
  let confettiBits = [];
  let confettiRaf = 0;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth * devicePixelRatio;
    confettiCanvas.height = window.innerHeight * devicePixelRatio;
    confettiCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function burstConfetti(amount = 90) {
    resizeConfetti();
    const colors = ["#ff7a8a", "#ff9b6a", "#5ecfb8", "#7ec8e8", "#f0a53a", "#fff"];
    for (let i = 0; i < amount; i++) {
      confettiBits.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 80,
        w: 6 + Math.random() * 7,
        h: 8 + Math.random() * 10,
        vx: -3 + Math.random() * 6,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4,
        color: colors[(Math.random() * colors.length) | 0],
        life: 90 + ((Math.random() * 40) | 0),
      });
    }
    if (!confettiRaf) confettiRaf = requestAnimationFrame(tickConfetti);
  }

  function tickConfetti() {
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiBits = confettiBits.filter((p) => p.life > 0);
    confettiBits.forEach((p) => {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.rot += p.vr;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot);
      confettiCtx.globalAlpha = Math.max(0, p.life / 40);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    });
    if (confettiBits.length) {
      confettiRaf = requestAnimationFrame(tickConfetti);
    } else {
      confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      confettiRaf = 0;
    }
  }

  window.addEventListener("resize", resizeConfetti);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function currentProblem() {
    return state.queue[state.index];
  }

  function buildStepChoices(problem) {
    const box = $("stepChoices");
    box.hidden = false;
    box.innerHTML = "";

    const options = ["klammer", "potenz", "punkt", "strich"];
    // Prefer showing relevant distractors first
    const ordered = shuffle(options);

    ordered.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = STEP_LABELS[key];
      btn.dataset.step = key;
      btn.addEventListener("click", () => onChooseStep(key, btn));
      box.appendChild(btn);
    });
  }

  function isCorrectFirstStep(problem, key) {
    if (key === problem.firstStep) return true;
    if (problem.firstStepAlt && key === problem.firstStepAlt) return true;
    return false;
  }

  function onChooseStep(key, btn) {
    const problem = currentProblem();
    if (state.phase !== "choose") return;

    const buttons = [...$("stepChoices").querySelectorAll(".choice")];
    const ok = isCorrectFirstStep(problem, key);

    buttons.forEach((b) => {
      b.disabled = true;
      if (isCorrectFirstStep(problem, b.dataset.step)) b.classList.add("correct");
    });

    if (!ok) {
      btn.classList.add("wrong");
      $("feedback").textContent = "Fast! Schau nochmal: Klammern → Potenzen → Punkt → Strich.";
      $("feedback").className = "feedback bad";
      state.streak = 0;
      updateStats();
      say(pick(NUDGES), "think");
      sfxNudge();
      // still continue after brief pause so she can learn
      setTimeout(() => enterGuidePhase(problem), 900);
      return;
    }

    $("feedback").textContent = "Genau! Jetzt führen wir den Schritt aus.";
    $("feedback").className = "feedback ok";
    state.stars += 1;
    state.totalStars += 1;
    state.streak += 1;
    saveProgress();
    updateStats();
    popStar("+1");
    say(pick(CHEERS), "happy");
    sfxCheer();
    const first = unlockSticker("bloom");
    if (first) say(`Neuer Sticker: ${first.name}!`, "happy");
    setTimeout(() => enterGuidePhase(problem), 550);
  }

  function parseStepExpect(stepText) {
    const gek = stepText.match(/völlig gekürzt:\s*(-?\d+(?:\/\d+)?)/i);
    if (gek) return parseAnswer(gek[1]);
    const cleaned = stepText.split("→")[0].replace(/[−–—]/g, "-");
    const parts = cleaned.split("=");
    if (parts.length < 2) return null;
    const last = parts[parts.length - 1].trim();
    const m = last.match(/-?\d+(?:\/\d+)?/);
    return m ? parseAnswer(m[0]) : null;
  }

  function parseStepParts(stepText) {
    const expect = parseStepExpect(stepText);
    const beforeArrow = stepText.split("→")[0].trim();
    const eqIdx = beforeArrow.lastIndexOf("=");
    const leftFull = (eqIdx === -1 ? beforeArrow : beforeArrow.slice(0, eqIdx)).trim();
    const labelMatch = leftFull.match(/^(.+?):\s*(.*)$/);
    const label = labelMatch ? labelMatch[1].trim() : "Schritt";
    const expr = labelMatch ? labelMatch[2].trim() : leftFull;
    return { label, expr, expect, full: stepText };
  }

  function renderPathStations(problem) {
    const box = $("pathStations");
    if (!box) return;
    box.innerHTML = "";
    const steps = problem.steps || [];
    steps.forEach((stepText, i) => {
      const parts = parseStepParts(stepText);
      const station = document.createElement("div");
      station.className = "path-station";
      if (i < state.guideIndex) station.classList.add("filled");
      if (i === state.guideIndex) station.classList.add("active");
      const filled = state.guideFilled[i];
      const val = filled ? fmtPretty(filled) : i < state.guideIndex ? "✓" : "?";
      station.innerHTML = `<span class="ps-num">Schritt ${i + 1}</span><span class="ps-val">${escapeHtml(val)}</span>`;
      station.title = parts.label;
      box.appendChild(station);
    });
    // Final answer station
    const end = document.createElement("div");
    end.className = "path-station";
    if (state.guideIndex >= steps.length) end.classList.add("active");
    end.innerHTML = `<span class="ps-num">Ende</span><span class="ps-val">${state.guideIndex >= steps.length ? "★" : "?"}</span>`;
    box.appendChild(end);
  }

  function readGuideFraction() {
    const numRaw = $("guideNumInput").value.trim().replace(/[−–—]/g, "-");
    const denRaw = $("guideDenInput").value.trim().replace(/[−–—]/g, "-");
    if (!numRaw) return null;
    if (!/^-?\d+$/.test(numRaw)) return null;
    const nAbs = Math.abs(Number(numRaw));
    let d = 1;
    if (denRaw !== "") {
      if (!/^\d+$/.test(denRaw) || Number(denRaw) === 0) return null;
      d = Number(denRaw);
    }
    const negative = $("btnGuideSign").getAttribute("aria-pressed") === "true";
    const n = negative ? -nAbs : nAbs;
    return {
      value: F(n, d),
      fullyReduced: n === 0 || gcd(Math.abs(n), d) === 1,
      rawN: n,
      rawD: d,
    };
  }

  function resetGuideInputs() {
    // Never touch the Schreibzettel — only reset the step-check fraction boxes.
    $("guideNumInput").value = "";
    $("guideDenInput").value = "";
    $("btnGuideSign").setAttribute("aria-pressed", "false");
    $("btnGuideSign").textContent = "+";
    $("guideFeedback").textContent = "";
    $("guideFeedback").className = "guide-feedback";
    $("guideReveal").hidden = true;
    $("guideReveal").textContent = "";
    $("btnGuideNext").hidden = true;
    state.guidePassed = false;
  }

  function fillGuideBoxes(frac) {
    if (!frac) return;
    const negative = frac.n < 0;
    $("btnGuideSign").setAttribute("aria-pressed", negative ? "true" : "false");
    $("btnGuideSign").textContent = negative ? "−" : "+";
    $("guideNumInput").value = String(Math.abs(frac.n));
    $("guideDenInput").value = frac.d === 1 ? "" : String(frac.d);
  }

  function renderGuideStep() {
    const problem = currentProblem();
    const steps = problem.steps || [];
    const i = state.guideIndex;
    const parts = parseStepParts(steps[i] || "");
    $("guidePanel").hidden = false;
    const fillCard = document.querySelector(".fill-card");
    if (fillCard) fillCard.hidden = false;
    $("guideLabel").textContent = `${parts.label} · Schritt ${i + 1} von ${steps.length}`;
    $("guideExpr").textContent = parts.expr || "…";
    $("missionText").textContent = `Rechenpfad Schritt ${i + 1}: Wert für „${parts.expr}“ eintragen.`;
    $("termBoard").innerHTML = highlightTerm(problem.display, problem.highlightFirst);
    renderPathStations(problem);
    say(`Hier eintragen: ${parts.expr} = ?`, "think");
    resetGuideInputs();
    $("guideNumInput").focus();
  }

  function enterGuidePhase(problem) {
    state.phase = "guide";
    state.guideIndex = 0;
    state.guideFilled = [];
    hideKuerzenPanel();
    $("stepChoices").hidden = true;
    $("answerPanel").hidden = true;
    $("btnNext").hidden = true;
    $("doneSteps").hidden = true;
    $("doneStepsList").innerHTML = "";
    $("scratchPad").hidden = false;
    $("scratchTerm").textContent = `Term: ${problem.display}`;
    // Schreibzettel stays exactly as Maya left it.
    if (!$("feedback").classList.contains("ok")) {
      $("feedback").textContent = "";
      $("feedback").className = "feedback";
    }
    renderGuideStep();
  }

  function appendDoneStep(expr, value) {
    $("doneSteps").hidden = false;
    const li = document.createElement("li");
    li.textContent = `${expr} = ${fmtPretty(value)}`;
    $("doneStepsList").appendChild(li);
  }

  function markStepComplete(expect, got) {
    const value = expect || got.value;
    state.guideFilled[state.guideIndex] = value;
    state.guidePassed = true;
    $("btnGuideNext").hidden = false;
    renderPathStations(currentProblem());
    sfxStep();
  }

  function onCheckGuide() {
    if (state.phase !== "guide") return;
    const problem = currentProblem();
    const stepText = problem.steps[state.guideIndex];
    const parts = parseStepParts(stepText);
    const expect = parts.expect;
    const got = readGuideFraction();

    if (!got) {
      $("guideFeedback").textContent = "Zähler (oben) und Nenner (unten) eintragen — Nenner leer = ganze Zahl.";
      $("guideFeedback").className = "guide-feedback bad";
      return;
    }

    if (!expect) {
      $("guideFeedback").textContent = "Gut — hier ist die Lösung für diesen Schritt.";
      $("guideFeedback").className = "guide-feedback hint";
      revealCurrentStep(true);
      return;
    }

    if (eq(got.value, expect)) {
      if (!got.fullyReduced) {
        $("guideFeedback").textContent = `Wert stimmt — bitte noch kürzen!`;
        $("guideFeedback").className = "guide-feedback hint";
        openKuerzenPanel(got.rawN, got.rawD, expect, "guide");
        return;
      }
      $("guideFeedback").textContent = `Genau: ${parts.expr} = ${fmtPretty(expect)}`;
      $("guideFeedback").className = "guide-feedback ok";
      say(pick(CHEERS), "happy");
      $("guideReveal").hidden = false;
      $("guideReveal").textContent = stepText;
      markStepComplete(expect, got);
      return;
    }

    $("guideFeedback").textContent = `Noch nicht. Rechne „${parts.expr}“ nochmal — oder tippe Hilfe zeigen.`;
    $("guideFeedback").className = "guide-feedback bad";
    say(pick(NUDGES), "sad");
    sfxNudge();
  }

  function revealCurrentStep(autoNextReady) {
    const problem = currentProblem();
    const stepText = problem.steps[state.guideIndex];
    const parts = parseStepParts(stepText);
    $("guideReveal").hidden = false;
    $("guideReveal").textContent = stepText;
    if (parts.expect) {
      fillGuideBoxes(parts.expect);
      markStepComplete(parts.expect, { value: parts.expect });
      $("guideFeedback").textContent = `Hilfe: ${parts.expr} = ${fmtPretty(parts.expect)} — tippe Weiter auf dem Pfad.`;
    } else {
      state.guidePassed = true;
      $("btnGuideNext").hidden = false;
      $("guideFeedback").textContent = "Hier ist der Schritt — dann weiter auf dem Pfad.";
    }
    $("guideFeedback").className = "guide-feedback hint";
    say("Hilfe liegt bereit — schau und geh weiter.", "think");
    if (autoNextReady) $("btnGuideNext").focus();
  }

  function onGuideNext() {
    if (state.phase !== "guide" || !state.guidePassed) return;
    const problem = currentProblem();
    const parts = parseStepParts(problem.steps[state.guideIndex]);
    const filled = state.guideFilled[state.guideIndex] || parts.expect;
    if (filled) appendDoneStep(parts.expr, filled);
    state.guideIndex += 1;
    if (state.guideIndex >= problem.steps.length) {
      renderPathStations(problem);
      enterAnswerPhase(problem);
      return;
    }
    renderGuideStep();
  }

  function resetFractionInputs() {
    $("numInput").value = "";
    $("denInput").value = "";
    $("btnSign").setAttribute("aria-pressed", "false");
    $("btnSign").textContent = "+";
    updateKuerzenLive();
  }

  function fmtRaw(n, d) {
    const sign = n < 0 ? "−" : "";
    const abs = Math.abs(n);
    if (d === 1) return `${sign}${abs}`;
    return `${sign}${abs}/${d}`;
  }

  function readFractionInput() {
    const numRaw = $("numInput").value.trim().replace(/[−–—]/g, "-");
    const denRaw = $("denInput").value.trim().replace(/[−–—]/g, "-");
    if (!numRaw) return null;

    // Digits only (optional leading minus ignored — sign button owns the sign)
    if (!/^-?\d+$/.test(numRaw)) return null;
    const nAbs = Math.abs(Number(numRaw));
    if (!Number.isFinite(nAbs)) return null;

    let d = 1;
    if (denRaw !== "") {
      if (!/^\d+$/.test(denRaw) || Number(denRaw) === 0) return null;
      d = Number(denRaw);
    }

    const negative = $("btnSign").getAttribute("aria-pressed") === "true";
    const n = negative ? -nAbs : nAbs;
    const value = F(n, d);
    // Whole numbers (empty denominator → d=1) count as gekürzt.
    // 4/6 must NOT count as gekürzt — remind to write 2/3.
    const fullyReduced = n === 0 || gcd(Math.abs(n), d) === 1;
    return { value, fullyReduced, rawN: n, rawD: d };
  }

  function updateKuerzenLive() {
    const live = $("kuerzenLive");
    const banner = document.querySelector(".gekuerzt-banner");
    const got = readFractionInput();
    if (!got || got.rawD === 1) {
      live.hidden = true;
      live.textContent = "";
      live.className = "kuerzen-live";
      return;
    }
    live.hidden = false;
    if (!got.fullyReduced) {
      live.className = "kuerzen-live";
      live.textContent = `Tipp: ${fmtRaw(got.rawN, got.rawD)} lässt sich noch kürzen → ${fmtPretty(got.value)}`;
    } else {
      live.className = "kuerzen-live ok-kuerzen";
      live.textContent = `${fmtPretty(got.value)} — völlig gekürzt, super!`;
    }
  }

  function enterAnswerPhase(problem) {
    state.phase = "answer";
    state.guideIndex = (problem.steps || []).length;
    $("missionText").textContent = "Letzter Stein auf dem Pfad — Endergebnis (völlig gekürzt) eintragen:";
    $("termBoard").innerHTML = highlightTerm(problem.display, problem.highlightFirst);
    $("stepChoices").hidden = true;
    $("guidePanel").hidden = false;
    const fillCard = document.querySelector(".fill-card");
    if (fillCard) fillCard.hidden = true;
    renderPathStations(problem);
    $("answerPanel").hidden = false;
    $("scratchPad").hidden = false;
    $("scratchTerm").textContent = `Term: ${problem.display}`;
    resetFractionInputs();
    $("numInput").focus();
    $("btnNext").hidden = true;
    $("feedback").textContent = "Alle Zwischenschritte stehen — jetzt nur noch das Endergebnis.";
    $("feedback").className = "feedback ok";
    say("Letzter Wert auf dem Pfad — du bist fast da!", "happy");
  }

  function highlightTerm(display, fragment) {
    if (!fragment || !display.includes(fragment)) {
      return escapeHtml(display);
    }
    const parts = display.split(fragment);
    return `${escapeHtml(parts[0])}<span class="hl">${escapeHtml(fragment)}</span>${escapeHtml(parts.slice(1).join(fragment))}`;
  }

  function escapeHtml(s) {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderQuestion() {
    const problem = currentProblem();
    const total = state.queue.length;
    const num = state.index + 1;

    state.phase = "choose";
    state.hintShown = false;

    $("qNum").textContent = String(num);
    $("qTotal").textContent = String(total);
    $("progressBar").style.width = `${((num - 1) / total) * 100}%`;
    renderTrail("playTrail", state.index, total, state.solvedInRound);

    $("missionText").textContent = "Welchen Schritt machst du zuerst? Danach rechnen wir ihn zusammen.";
    $("termBoard").innerHTML = highlightTerm(problem.display, problem.highlightFirst);
    say(`Stein ${num} auf dem Pfad — was zuerst?`, "think");
    hideKuerzenPanel();
    $("answerPanel").hidden = true;
    $("guidePanel").hidden = true;
    $("doneSteps").hidden = true;
    $("doneStepsList").innerHTML = "";
    $("scratchPad").hidden = false;
    $("scratchTerm").textContent = `Term: ${problem.display}`;
    $("btnNext").hidden = true;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";

    buildStepChoices(problem);
  }

  function renderParentDiary() {
    const box = $("parentDiary");
    const diary = loadDiary();
    const live = $("scratchFree").value.trim();
    box.innerHTML = "";

    if (live) {
      const liveCard = document.createElement("article");
      liveCard.className = "diary-card";
      liveCard.innerHTML = `<p class="diary-meta">Jetzt auf dem Zettel</p>
        <p class="diary-term">${escapeHtml($("scratchTerm").textContent || "Schreibzettel")}</p>
        <p class="diary-body"></p>`;
      liveCard.querySelector(".diary-body").textContent = live;
      box.appendChild(liveCard);
    }

    if (!diary.length && !live) {
      const empty = document.createElement("p");
      empty.className = "diary-empty";
      empty.textContent = "Noch nichts gespeichert — sobald Maya kritzelt, erscheint es hier.";
      box.appendChild(empty);
      return;
    }

    diary.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "diary-card";
      const when = new Date(entry.at);
      const whenLabel = Number.isNaN(when.getTime())
        ? entry.at
        : when.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
      card.innerHTML = `<p class="diary-meta">${escapeHtml(whenLabel)} · Level ${escapeHtml(entry.levelLabel || "")} · ${escapeHtml(entry.reason || "")}</p>
        <p class="diary-term">${escapeHtml(entry.term || "")}</p>
        <p class="diary-body"></p>`;
      card.querySelector(".diary-body").textContent = entry.text || "";
      box.appendChild(card);
    });
  }

  function answersMatch(problem, value) {
    if (!value) return false;
    return eq(value, problem.answer);
  }

  function hideKuerzenPanel() {
    state.kuerzen = null;
    const panel = $("kuerzenPanel");
    if (panel) panel.hidden = true;
    $("kuerzenFeedback").textContent = "";
    $("kuerzenFeedback").className = "guide-feedback";
  }

  function openKuerzenPanel(rawN, rawD, target, context) {
    state.kuerzen = { rawN, rawD, target, context };
    state.phase = "kuerzen";
    const banner = document.querySelector(".gekuerzt-banner");
    if (banner) {
      banner.classList.remove("pulse");
      void banner.offsetWidth;
      banner.classList.add("pulse");
    }
    $("kuerzenPanel").hidden = false;
    $("kuerzenFrom").textContent = fmtRaw(rawN, rawD);
    $("kuerzenPrompt").textContent = `${fmtRaw(rawN, rawD)} ist noch nicht völlig gekürzt. Trag den gekürzten Bruch ein!`;
    $("kuerzenNum").value = "";
    $("kuerzenDen").value = "";
    $("btnKuerzenSign").setAttribute("aria-pressed", target.n < 0 ? "true" : "false");
    $("btnKuerzenSign").textContent = target.n < 0 ? "−" : "+";
    // Don't pre-set minus as a giveaway for negatives that aren't obvious — only match target sign if raw was negative
    if (rawN >= 0) {
      $("btnKuerzenSign").setAttribute("aria-pressed", "false");
      $("btnKuerzenSign").textContent = "+";
    }
    $("kuerzenFeedback").textContent = "Merke: immer völlig kürzen!";
    $("kuerzenFeedback").className = "guide-feedback hint";
    $("answerPanel").hidden = true;
    $("btnNext").hidden = true;
    window.clearTimeout(state.advanceTimer);
    say(`Noch kürzen: ${fmtRaw(rawN, rawD)} → ?`, "think");
    sfxNudge();
    $("kuerzenNum").focus();
  }

  function readKuerzenFraction() {
    const numRaw = $("kuerzenNum").value.trim().replace(/[−–—]/g, "-");
    const denRaw = $("kuerzenDen").value.trim().replace(/[−–—]/g, "-");
    if (!numRaw) return null;
    if (!/^-?\d+$/.test(numRaw)) return null;
    const nAbs = Math.abs(Number(numRaw));
    let d = 1;
    if (denRaw !== "") {
      if (!/^\d+$/.test(denRaw) || Number(denRaw) === 0) return null;
      d = Number(denRaw);
    }
    const negative = $("btnKuerzenSign").getAttribute("aria-pressed") === "true";
    const n = negative ? -nAbs : nAbs;
    return {
      value: F(n, d),
      fullyReduced: n === 0 || gcd(Math.abs(n), d) === 1,
      rawN: n,
      rawD: d,
    };
  }

  function onCheckKuerzen() {
    if (!state.kuerzen || state.phase !== "kuerzen") return;
    const got = readKuerzenFraction();
    const target = state.kuerzen.target;
    if (!got) {
      $("kuerzenFeedback").textContent = "Zähler und Nenner vom gekürzten Bruch eintragen.";
      $("kuerzenFeedback").className = "guide-feedback bad";
      return;
    }
    if (!got.fullyReduced) {
      $("kuerzenFeedback").textContent = `${fmtRaw(got.rawN, got.rawD)} geht noch kleiner — bitte völlig kürzen!`;
      $("kuerzenFeedback").className = "guide-feedback hint";
      say("Noch nicht völlig gekürzt — weiter kürzen!", "think");
      return;
    }
    if (!eq(got.value, target)) {
      $("kuerzenFeedback").textContent = `Das ist nicht wertgleich zu ${fmtRaw(state.kuerzen.rawN, state.kuerzen.rawD)}. Nochmal kürzen.`;
      $("kuerzenFeedback").className = "guide-feedback bad";
      sfxNudge();
      return;
    }

    $("kuerzenFeedback").textContent = `Super! ${fmtRaw(state.kuerzen.rawN, state.kuerzen.rawD)} → ${fmtPretty(target)}`;
    $("kuerzenFeedback").className = "guide-feedback ok";
    const ctx = state.kuerzen.context;
    hideKuerzenPanel();
    say(`Völlig gekürzt: ${fmtPretty(target)} — stark!`, "happy");
    sfxCheer();

    if (ctx === "guide") {
      state.phase = "guide";
      const problem = currentProblem();
      const stepText = problem.steps[state.guideIndex];
      const parts = parseStepParts(stepText);
      $("guideFeedback").textContent = `Genau: ${parts.expr} = ${fmtPretty(target)} (völlig gekürzt)`;
      $("guideFeedback").className = "guide-feedback ok";
      $("guideReveal").hidden = false;
      $("guideReveal").textContent = stepText;
      fillGuideBoxes(target);
      markStepComplete(target, { value: target });
      return;
    }

    // Final answer path
    acceptCorrectAnswer(currentProblem(), { value: target, fullyReduced: true, rawN: target.n, rawD: target.d });
  }

  function onRevealKuerzen() {
    if (!state.kuerzen) return;
    const t = state.kuerzen.target;
    $("btnKuerzenSign").setAttribute("aria-pressed", t.n < 0 ? "true" : "false");
    $("btnKuerzenSign").textContent = t.n < 0 ? "−" : "+";
    $("kuerzenNum").value = String(Math.abs(t.n));
    $("kuerzenDen").value = t.d === 1 ? "" : String(t.d);
    $("kuerzenFeedback").textContent = `Hilfe: völlig gekürzt ist ${fmtPretty(t)}. Tippe „Gekürzt prüfen“.`;
    $("kuerzenFeedback").className = "guide-feedback hint";
  }

  function acceptCorrectAnswer(problem, got) {
    $("feedback").textContent = `Stimmt! ${fmtPretty(problem.answer)} — völlig gekürzt, stark!`;
    $("feedback").className = "feedback ok";
    say(pick(CHEERS), "happy");

    state.stars += 2;
    state.totalStars += 2;
    state.streak += 1;
    state.solvedInRound += 1;
    saveProgress();
    updateStats();
    popStar("+2");
    burstConfetti(90);
    sfxCheer();
    renderTrail("playTrail", Math.min(state.index + 1, state.queue.length - 1), state.queue.length, state.solvedInRound);

    if (state.streak >= 3) {
      const s = unlockSticker("leafy");
      if (s) {
        say(`Neuer Sticker: ${s.name}!`, "happy");
        burstConfetti(60);
      }
    }

    state.phase = "doneQ";
    $("btnNext").hidden = false;
    $("answerPanel").hidden = true;
    hideKuerzenPanel();
    $("progressBar").style.width = `${((state.index + 1) / state.queue.length) * 100}%`;
    window.clearTimeout(state.advanceTimer);
    state.advanceTimer = window.setTimeout(() => {
      if (state.phase === "doneQ") onNext();
    }, 1100);
  }

  function onCheck() {
    const problem = currentProblem();
    if (state.phase !== "answer") return;

    const got = readFractionInput();
    if (!got) {
      $("feedback").textContent = "Oben den Zähler eintragen, unten den Nenner (bei ganzen Zahlen Nenner leer lassen).";
      $("feedback").className = "feedback bad";
      return;
    }

    updateKuerzenLive();

    if (answersMatch(problem, got.value)) {
      snapshotScratch("lösung");
      if (!got.fullyReduced) {
        $("feedback").textContent = "Wert stimmt — jetzt bitte noch völlig kürzen!";
        $("feedback").className = "feedback hint";
        openKuerzenPanel(got.rawN, got.rawD, problem.answer, "answer");
        return;
      }
      acceptCorrectAnswer(problem, got);
      return;
    }

    state.streak = 0;
    updateStats();
    if (!got.fullyReduced) {
      $("feedback").textContent = `Noch nicht (du hast ${fmtRaw(got.rawN, got.rawD)}). Denk an: erst kürzen → ${fmtPretty(got.value)}.`;
    } else {
      $("feedback").textContent = `Noch nicht (du hast ${fmtRaw(got.rawN, got.rawD)}). Merke: völlig gekürzt! Nutze den Tipp.`;
    }
    $("feedback").className = "feedback bad";
    say(pick(NUDGES), "sad");
    sfxNudge();
  }

  function onHint() {
    const problem = currentProblem();
    if (state.phase === "kuerzen") {
      onRevealKuerzen();
      return;
    }
    if (state.phase === "guide") {
      revealCurrentStep(true);
      return;
    }
    const tip = problem.steps[state.hintShown ? Math.min(1, problem.steps.length - 1) : 0];
    state.hintShown = true;
    $("feedback").textContent = `Tipp: ${tip}`;
    $("feedback").className = "feedback hint";
  }

  function onNext() {
    window.clearTimeout(state.advanceTimer);
    snapshotScratch("weiter");
    if (state.index >= state.queue.length - 1) {
      finishRound();
      return;
    }
    state.index += 1;
    renderQuestion();
  }

  function finishRound() {
    snapshotScratch("runde");
    const meta = LEVEL_META[state.level];
    const alreadyDone = state.completed.includes(state.level);
    if (!alreadyDone) state.completed.push(state.level);

    let unlockedNew = null;
    if (meta.next && !state.unlocked.includes(meta.next)) {
      state.unlocked.push(meta.next);
      unlockedNew = meta.next;
    }

    const newStickers = [];
    if (state.level === "easy") {
      const s = unlockSticker("gem");
      if (s) newStickers.push(s.name);
    }
    if (state.level === "hard") {
      const s = unlockSticker("comet");
      if (s) newStickers.push(s.name);
    }

    saveProgress();
    refreshLevelButtons();
    renderTrail("homeTrail", 7, 8, 8);

    showScreen("done");
    burstConfetti(160);
    sfxCheer();
    say("Pfad geschafft! Fuchsi ist so stolz auf dich!", "happy");
    $("levelClearedLabel").textContent = `Level ${meta.num} · ${meta.label}`;
    $("finalStars").textContent = "★".repeat(Math.min(5, Math.max(1, Math.round(state.stars / 4))));
    $("doneMessage").textContent = `Du hast ${state.stars} Sterne gesammelt und ${state.solvedInRound} Steine auf dem Pfad erobert. Super, Maya!`;

    const stickerMsg = $("stickerUnlock");
    if (newStickers.length) {
      stickerMsg.hidden = false;
      stickerMsg.textContent = `Neuer Sticker: ${newStickers.join(", ")}!`;
    } else {
      stickerMsg.hidden = true;
    }
    renderStickerGrid("doneStickers", newStickers[0] && STICKERS.find((s) => s.name === newStickers[0])?.id);

    const unlockEl = $("unlockMessage");
    const nextBtn = $("btnNextLevel");
    if (unlockedNew) {
      const nextMeta = LEVEL_META[unlockedNew];
      unlockEl.hidden = false;
      unlockEl.textContent = `Freigeschaltet: Level ${nextMeta.num} · ${nextMeta.label}`;
      nextBtn.hidden = false;
      nextBtn.dataset.nextLevel = unlockedNew;
    } else if (meta.next && state.unlocked.includes(meta.next)) {
      unlockEl.hidden = false;
      unlockEl.textContent = `Weiter zu Level ${LEVEL_META[meta.next].num} · ${LEVEL_META[meta.next].label}?`;
      nextBtn.hidden = false;
      nextBtn.dataset.nextLevel = meta.next;
    } else {
      unlockEl.hidden = false;
      unlockEl.textContent = "Alle Level freigeschaltet — du bist Term-Heldin!";
      nextBtn.hidden = true;
    }
  }

  function startRound() {
    if (!state.unlocked.includes(state.level)) {
      state.level = "easy";
      refreshLevelButtons();
    }
    state.queue = shuffle(BANK[state.level]).slice(0, 8);
    state.index = 0;
    state.stars = 0;
    state.streak = 0;
    state.solvedInRound = 0;
    updateStats();
    showScreen("play");
    say("Los geht’s — Fuchsi läuft mit dir den Pfad entlang!", "happy");
    sfxStep();
    renderQuestion();
  }

  // Level selection — picking a level starts immediately
  document.querySelectorAll(".level").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled || !state.unlocked.includes(btn.dataset.level)) return;
      state.level = btn.dataset.level;
      refreshLevelButtons();
      startRound();
    });
  });

  $("btnStart").addEventListener("click", startRound);
  $("btnStartFromHow").addEventListener("click", startRound);
  $("btnHow").addEventListener("click", () => showScreen("how"));
  $("btnBackHow").addEventListener("click", () => showScreen("home"));
  $("btnStickers").addEventListener("click", () => {
    renderStickerGrid("stickerGrid");
    showScreen("stickers");
  });
  $("btnBackStickers").addEventListener("click", () => showScreen("home"));
  $("btnSound").addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    localStorage.setItem(SOUND_KEY, state.soundOn ? "1" : "0");
    updateStats();
    if (state.soundOn) sfxStep();
  });
  $("btnParent").addEventListener("click", () => {
    persistCurrentScratch();
    snapshotScratch("eltern-ansicht");
    renderParentDiary();
    showScreen("parent");
  });
  $("btnBackParent").addEventListener("click", () => showScreen("home"));
  $("btnRefreshDiary").addEventListener("click", () => {
    persistCurrentScratch();
    renderParentDiary();
  });
  $("btnClearDiary").addEventListener("click", () => {
    if (window.confirm("Mayas gespeicherte Schreibzettel auf diesem Gerät wirklich löschen?")) {
      saveDiary([]);
      renderParentDiary();
    }
  });
  $("btnHome").addEventListener("click", () => {
    snapshotScratch("menü");
    showScreen("home");
  });
  $("btnDoneHome").addEventListener("click", () => {
    refreshLevelButtons();
    showScreen("home");
  });
  let scratchTimer = 0;
  $("scratchFree").addEventListener("input", () => {
    window.clearTimeout(scratchTimer);
    scratchTimer = window.setTimeout(() => {
      persistCurrentScratch();
    }, 250);
  });
  $("btnAgain").addEventListener("click", startRound);
  $("btnNextLevel").addEventListener("click", () => {
    const next = $("btnNextLevel").dataset.nextLevel;
    if (next && state.unlocked.includes(next)) {
      state.level = next;
      refreshLevelButtons();
      startRound();
    }
  });
  $("btnCheck").addEventListener("click", onCheck);
  $("btnHint").addEventListener("click", onHint);
  $("btnNext").addEventListener("click", onNext);
  $("btnCheckKuerzen").addEventListener("click", onCheckKuerzen);
  $("btnRevealKuerzen").addEventListener("click", onRevealKuerzen);
  $("btnKuerzenSign").addEventListener("click", () => {
    const pressed = $("btnKuerzenSign").getAttribute("aria-pressed") === "true";
    $("btnKuerzenSign").setAttribute("aria-pressed", pressed ? "false" : "true");
    $("btnKuerzenSign").textContent = pressed ? "+" : "−";
  });
  $("kuerzenNum").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("kuerzenDen").focus();
    }
  });
  $("kuerzenDen").addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCheckKuerzen();
  });
  $("btnCheckGuide").addEventListener("click", onCheckGuide);
  $("btnRevealStep").addEventListener("click", () => revealCurrentStep(true));
  $("btnGuideNext").addEventListener("click", onGuideNext);
  $("btnGuideSign").addEventListener("click", () => {
    const pressed = $("btnGuideSign").getAttribute("aria-pressed") === "true";
    $("btnGuideSign").setAttribute("aria-pressed", pressed ? "false" : "true");
    $("btnGuideSign").textContent = pressed ? "+" : "−";
  });
  $("guideNumInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("guideDenInput").focus();
    }
  });
  $("guideDenInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCheckGuide();
  });
  $("btnSign").addEventListener("click", () => {
    const pressed = $("btnSign").getAttribute("aria-pressed") === "true";
    $("btnSign").setAttribute("aria-pressed", pressed ? "false" : "true");
    $("btnSign").textContent = pressed ? "+" : "−";
    updateKuerzenLive();
  });
  const goNextFieldOrCheck = (e) => {
    if (e.key !== "Enter") return;
    if (e.target.id === "numInput") {
      e.preventDefault();
      $("denInput").focus();
      return;
    }
    onCheck();
  };
  $("numInput").addEventListener("keydown", goNextFieldOrCheck);
  $("denInput").addEventListener("keydown", goNextFieldOrCheck);
  ["input", "change"].forEach((evt) => {
    $("numInput").addEventListener(evt, updateKuerzenLive);
    $("denInput").addEventListener(evt, updateKuerzenLive);
  });

  updateStats();
  refreshLevelButtons();
  restoreCurrentScratch();
  renderTrail("homeTrail", 0, 8, state.completed.length ? Math.min(8, state.completed.length * 2) : 0);
  renderStickerGrid("stickerGrid");
  say("Komm mit, Maya — wir erobern den Termen-Pfad!", null);

  // Optional deep-links for demos / bookmarks: ?screen=how|play&level=medium
  const params = new URLSearchParams(location.search);
  const levelParam = params.get("level");
  if (levelParam && BANK[levelParam]) {
    if (!state.unlocked.includes(levelParam)) {
      // Dev/demo unlock so deep links still work for testing.
      state.unlocked = LEVEL_ORDER.slice();
      saveProgress();
    }
    state.level = levelParam;
    refreshLevelButtons();
  }
  const screenParam = params.get("screen");
  if (screenParam === "how") showScreen("how");
  if (screenParam === "play") startRound();
  if (screenParam === "parent") {
    renderParentDiary();
    showScreen("parent");
  }
})();
