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
        steps: ["Zuerst Punktrechnung: 2/9 · 2 = 4/9", "Dann Strich: 8/9 + 4/9 = 12/9 = 4/3"],
        answer: F(4, 3),
        alsoAccept: [F(12, 9)],
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
        steps: ["Punkt: 1/3 · 1/2 = 1/6", "Strich: 5/6 − 1/6 = 4/6 = 2/3"],
        answer: F(2, 3),
        alsoAccept: [F(4, 6)],
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
        steps: ["Punkt: 1/4 · 1/2 = 1/8", "Strich: 7/8 − 1/8 = 6/8 = 3/4"],
        answer: F(3, 4),
        alsoAccept: [F(6, 8)],
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

  const state = {
    level: "easy",
    queue: [],
    index: 0,
    stars: 0,
    streak: 0,
    phase: "choose", // choose | answer | doneQ
    hintShown: false,
    advanceTimer: 0,
  };

  const $ = (id) => document.getElementById(id);

  const screens = {
    home: $("screen-home"),
    how: $("screen-how"),
    play: $("screen-play"),
    done: $("screen-done"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function updateStats() {
    $("starCount").textContent = String(state.stars);
    $("streakCount").textContent = String(state.streak);
  }

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
      // still continue after brief pause so she can learn
      setTimeout(() => enterAnswerPhase(problem), 900);
      return;
    }

    $("feedback").textContent = "Genau! Das ist der erste Schritt.";
    $("feedback").className = "feedback ok";
    state.stars += 1;
    state.streak += 1;
    updateStats();
    setTimeout(() => enterAnswerPhase(problem), 550);
  }

  function enterAnswerPhase(problem) {
    state.phase = "answer";
    $("missionText").textContent = "Jetzt ausrechnen – Ergebnis als Bruch eingeben:";
    $("termBoard").innerHTML = highlightTerm(problem.display, problem.highlightFirst);
    $("stepChoices").hidden = true;
    $("answerPanel").hidden = false;
    $("answerInput").value = "";
    $("answerInput").focus();
    $("btnNext").hidden = true;
    if (!$("feedback").classList.contains("ok")) {
      $("feedback").textContent = "";
      $("feedback").className = "feedback";
    }
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

    $("missionText").textContent = "Welchen Schritt machst du zuerst?";
    $("termBoard").innerHTML = highlightTerm(problem.display, problem.highlightFirst);
    $("answerPanel").hidden = true;
    $("btnNext").hidden = true;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";

    buildStepChoices(problem);
  }

  function answersMatch(problem, got) {
    if (!got) return false;
    if (eq(got, problem.answer)) return true;
    if (problem.alsoAccept && problem.alsoAccept.some((a) => eq(got, a))) return true;
    // floating tolerance for equivalent forms already simplified via eq
    return false;
  }

  function onCheck() {
    const problem = currentProblem();
    if (state.phase !== "answer") return;

    const got = parseAnswer($("answerInput").value);
    if (!got) {
      $("feedback").textContent = "Bitte als Bruch schreiben, z. B. 4/3 oder -1/4.";
      $("feedback").className = "feedback bad";
      return;
    }

    if (answersMatch(problem, got)) {
      $("feedback").textContent = `Stimmt! ${fmtPretty(problem.answer)} — stark!`;
      $("feedback").className = "feedback ok";
      state.stars += 2;
      state.streak += 1;
      updateStats();
      state.phase = "doneQ";
      $("btnNext").hidden = false;
      $("answerPanel").hidden = true;
      $("progressBar").style.width = `${(state.index + 1) / state.queue.length * 100}%`;
      // Auto-advance so a correct answer always moves the game forward.
      window.clearTimeout(state.advanceTimer);
      state.advanceTimer = window.setTimeout(() => {
        if (state.phase === "doneQ") onNext();
      }, 900);
      return;
    }

    state.streak = 0;
    updateStats();
    $("feedback").textContent = `Noch nicht (gelesen: ${fmt(got)}). Nutze den Tipp und versuch’s nochmal.`;
    $("feedback").className = "feedback bad";
  }

  function onHint() {
    const problem = currentProblem();
    const tip = problem.steps[state.hintShown ? Math.min(1, problem.steps.length - 1) : 0];
    state.hintShown = true;
    $("feedback").textContent = `Tipp: ${tip}`;
    $("feedback").className = "feedback hint";
  }

  function onNext() {
    window.clearTimeout(state.advanceTimer);
    if (state.index >= state.queue.length - 1) {
      finishRound();
      return;
    }
    state.index += 1;
    renderQuestion();
  }

  function finishRound() {
    showScreen("done");
    $("finalStars").textContent = "★".repeat(Math.min(5, Math.max(1, Math.round(state.stars / 4))));
    $("doneMessage").textContent = `Du hast ${state.stars} Sterne gesammelt. Punkt vor Strich sitzt immer besser!`;
  }

  function startRound() {
    state.queue = shuffle(BANK[state.level]).slice(0, 8);
    state.index = 0;
    showScreen("play");
    renderQuestion();
  }

  // Level selection
  document.querySelectorAll(".level").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".level").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.level = btn.dataset.level;
    });
  });

  $("btnStart").addEventListener("click", startRound);
  $("btnStartFromHow").addEventListener("click", startRound);
  $("btnHow").addEventListener("click", () => showScreen("how"));
  $("btnBackHow").addEventListener("click", () => showScreen("home"));
  $("btnHome").addEventListener("click", () => showScreen("home"));
  $("btnDoneHome").addEventListener("click", () => showScreen("home"));
  $("btnAgain").addEventListener("click", startRound);
  $("btnCheck").addEventListener("click", onCheck);
  $("btnHint").addEventListener("click", onHint);
  $("btnNext").addEventListener("click", onNext);
  $("answerInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCheck();
  });

  updateStats();

  // Optional deep-links for demos / bookmarks: ?screen=how|play&level=medium
  const params = new URLSearchParams(location.search);
  const levelParam = params.get("level");
  if (levelParam && BANK[levelParam]) {
    state.level = levelParam;
    document.querySelectorAll(".level").forEach((b) => {
      b.classList.toggle("active", b.dataset.level === levelParam);
    });
  }
  const screenParam = params.get("screen");
  if (screenParam === "how") showScreen("how");
  if (screenParam === "play") startRound();
})();
