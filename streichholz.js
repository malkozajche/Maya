(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const STAGES = [
    { id: "build", title: "Bauen & Zählen", short: "Bauen" },
    { id: "table", title: "Tabelle füllen", short: "Tabelle" },
    { id: "words", title: "In Worten", short: "Worte" },
    { id: "hundred", title: "100 Dreiecke", short: "100" },
    { id: "cards", title: "Term wählen", short: "Term" },
    { id: "kuerz", title: "Term kürzen", short: "Kürzen" },
    { id: "sub", title: "x = 17 einsetzen", short: "Einsetzen" },
  ];

  /** Table gaps Maya must fill, in order */
  const TABLE_GAPS = [
    {
      row: 2,
      field: "sticks",
      label: "3 Dreiecke — wie viele Streichhölzer?",
      hint: "Rechnung: 3 + 2 · 2 = ?",
      answer: 7,
      kind: "num",
    },
    {
      row: 3,
      field: "calc",
      label: "4 Dreiecke — welche Rechnung?",
      hint: "Muster: 3 + (Dreiecke − 1) · 2",
      answer: "3+3*2",
      kind: "calc",
      placeholder: "3 + 3 · 2",
    },
    {
      row: 3,
      field: "sticks",
      label: "4 Dreiecke — Anzahl Streichhölzer?",
      hint: "3 + 3 · 2 = ?",
      answer: 9,
      kind: "num",
    },
    {
      row: 4,
      field: "calc",
      label: "5 Dreiecke — welche Rechnung?",
      hint: "Weiter im Muster: 3 + 4 · 2",
      answer: "3+4*2",
      kind: "calc",
      placeholder: "3 + 4 · 2",
    },
    {
      row: 4,
      field: "sticks",
      label: "5 Dreiecke — Anzahl Streichhölzer?",
      hint: "3 + 4 · 2 = ?",
      answer: 11,
      kind: "num",
    },
    {
      row: 5,
      field: "tris",
      label: "Bei Rechnung 3 + 10 · 2 — wie viele Dreiecke?",
      hint: "10 = Dreiecke − 1 → Dreiecke = ?",
      answer: 11,
      kind: "num",
    },
    {
      row: 5,
      field: "sticks",
      label: "11 Dreiecke — Anzahl Streichhölzer?",
      hint: "3 + 10 · 2 = ?",
      answer: 23,
      kind: "num",
    },
    {
      row: 6,
      field: "tris",
      label: "33 Streichhölzer — wie viele Dreiecke?",
      hint: "3 + (n − 1) · 2 = 33 → n = ?",
      answer: 16,
      kind: "num",
    },
    {
      row: 6,
      field: "calc",
      label: "16 Dreiecke — welche Rechnung?",
      hint: "3 + 15 · 2",
      answer: "3+15*2",
      kind: "calc",
      placeholder: "3 + 15 · 2",
    },
  ];

  const ROWS = [
    { tris: 1, calc: "3", sticks: 3, picture: 1 },
    { tris: 2, calc: "3 + 1 · 2", sticks: 5, picture: 2 },
    { tris: 3, calc: "3 + 2 · 2", sticks: null, picture: 3 },
    { tris: 4, calc: null, sticks: null, picture: 4 },
    { tris: 5, calc: null, sticks: null, picture: 5 },
    { tris: null, calc: "3 + 10 · 2", sticks: null, picture: 0 },
    { tris: null, calc: null, sticks: 33, picture: 0 },
  ];

  const STORAGE = {
    progress: "maya-streichholz-progress-v1",
    scratch: "maya-streichholz-scratch-v1",
    sound: "maya-streichholz-sound-v1",
  };

  const state = {
    stageIndex: 0,
    stars: 0,
    unlocked: 1,
    completed: [],
    triangles: 1,
    tableGap: 0,
    tableFilled: {},
    hundredStep: 0,
    subStep: 0,
    soundOn: localStorage.getItem(STORAGE.sound) !== "0",
    cardPicked: false,
  };

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE.progress);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (Array.isArray(p.completed)) state.completed = p.completed;
      if (typeof p.unlocked === "number") state.unlocked = Math.max(1, p.unlocked);
      if (typeof p.stars === "number") state.stars = p.stars;
    } catch (_) {
      /* ignore */
    }
  }

  function saveProgress() {
    localStorage.setItem(
      STORAGE.progress,
      JSON.stringify({
        completed: state.completed,
        unlocked: state.unlocked,
        stars: state.stars,
      })
    );
  }

  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playTone(freq, dur, type = "sine", gain = 0.045) {
    if (!state.soundOn) return;
    try {
      const ctx = ensureAudio();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gain;
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (_) {
      /* ignore */
    }
  }

  function sfxOk() {
    playTone(523.25, 0.12, "triangle", 0.04);
    window.setTimeout(() => playTone(659.25, 0.14, "triangle", 0.04), 80);
    window.setTimeout(() => playTone(783.99, 0.18, "triangle", 0.035), 160);
  }

  function sfxBad() {
    playTone(392, 0.1, "sine", 0.03);
    window.setTimeout(() => playTone(349.23, 0.12, "sine", 0.025), 90);
  }

  function sfxClick() {
    playTone(440, 0.08, "triangle", 0.03);
  }

  const confettiCanvas = $("confetti");
  const confettiCtx = confettiCanvas.getContext("2d");
  let confettiBits = [];
  let confettiRaf = 0;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth * devicePixelRatio;
    confettiCanvas.height = window.innerHeight * devicePixelRatio;
    confettiCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function burstConfetti(n = 60) {
    resizeConfetti();
    const colors = ["#f0a84b", "#e85d3a", "#3eb89a", "#6eb8d9", "#c4783a", "#fff4e8"];
    for (let i = 0; i < n; i++) {
      confettiBits.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
        y: window.innerHeight * 0.3,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * -8 - 2,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[i % colors.length],
        life: 45 + Math.random() * 25,
      });
    }
    if (!confettiRaf) confettiRaf = requestAnimationFrame(tickConfetti);
  }

  function tickConfetti() {
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiBits = confettiBits.filter((p) => p.life > 0);
    confettiBits.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.rot += p.vr;
      p.life -= 1;
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

  function showStarPop() {
    const el = $("starPop");
    el.hidden = false;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    window.setTimeout(() => {
      el.hidden = true;
    }, 1000);
  }

  function addStar(n = 1) {
    state.stars += n;
    $("starCount").textContent = String(state.stars);
    showStarPop();
    sfxOk();
    saveProgress();
  }

  function say(text, mood = "") {
    $("playSpeech").textContent = text;
    const fox = $("playFox");
    fox.classList.remove("happy", "think");
    if (mood) fox.classList.add(mood);
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(`screen-${name}`).classList.add("active");
  }

  function sticksFor(n) {
    return n <= 0 ? 0 : 3 + (n - 1) * 2;
  }

  /**
   * Zigzag matchstick chain: each new triangle shares one side;
   * the 2 new sticks are added on the free outer side (worksheet style △▽△▽).
   * Returns unique segments {x1,y1,x2,y2, addedAt} where addedAt is triangle index (0-based).
   */
  function chainSegments(count, size, originX, baseY) {
    const n = Math.max(0, count | 0);
    if (n === 0) return [];
    const h = (size * Math.sqrt(3)) / 2;
    const bottom = [];
    const top = [];
    // Up triangle: 2 bottom + 1 top; down triangle: 1 bottom + 2 top (zigzag strip).
    const needBottom = Math.ceil(n / 2) + 1;
    const needTop = Math.floor(n / 2) + 1;
    for (let i = 0; i < needBottom; i++) {
      bottom.push({ x: originX + i * size, y: baseY });
    }
    for (let i = 0; i < needTop; i++) {
      top.push({ x: originX + size / 2 + i * size, y: baseY - h });
    }

    const edgeKey = (a, b) => {
      const k1 = `${Math.round(a.x * 10)},${Math.round(a.y * 10)}`;
      const k2 = `${Math.round(b.x * 10)},${Math.round(b.y * 10)}`;
      return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    };

    const seen = new Map();
    const segs = [];
    const addEdge = (a, b, tri) => {
      const key = edgeKey(a, b);
      if (seen.has(key)) return;
      seen.set(key, tri);
      segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, addedAt: tri });
    };

    for (let i = 0; i < n; i++) {
      if (i % 2 === 0) {
        const bi = i / 2;
        addEdge(bottom[bi], bottom[bi + 1], i);
        addEdge(bottom[bi + 1], top[bi], i);
        addEdge(top[bi], bottom[bi], i);
      } else {
        const bi = (i + 1) / 2;
        addEdge(bottom[bi], top[bi - 1], i);
        addEdge(top[bi - 1], top[bi], i);
        addEdge(top[bi], bottom[bi], i);
      }
    }
    return segs;
  }

  function drawStickSegment(svg, seg, { animate = false, delay = 0, tip = true } = {}) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", seg.x1);
    line.setAttribute("y1", seg.y1);
    line.setAttribute("x2", seg.x2);
    line.setAttribute("y2", seg.y2);
    line.setAttribute("class", "stick-line" + (animate ? " stick-draw" : ""));
    if (animate) line.style.animationDelay = `${delay}s`;
    svg.appendChild(line);
    if (tip) {
      const tipDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      tipDot.setAttribute("cx", seg.x2);
      tipDot.setAttribute("cy", seg.y2);
      tipDot.setAttribute("r", 3.2);
      tipDot.setAttribute("class", "stick-tip");
      svg.appendChild(tipDot);
      const tipDot2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      tipDot2.setAttribute("cx", seg.x1);
      tipDot2.setAttribute("cy", seg.y1);
      tipDot2.setAttribute("r", 3.2);
      tipDot2.setAttribute("class", "stick-tip");
      svg.appendChild(tipDot2);
    }
  }

  function drawTriangles(svg, count, animateLast = false) {
    svg.innerHTML = "";
    const size = 56;
    const originX = 28;
    const baseY = 118;
    const segs = chainSegments(count, size, originX, baseY);
    const width = Math.max(200, originX + (Math.floor(count / 2) + 1) * size + size / 2 + 24);
    svg.setAttribute("viewBox", `0 0 ${width} 140`);

    let newIndex = 0;
    segs.forEach((seg) => {
      const isNew = animateLast && count > 0 && seg.addedAt === count - 1;
      drawStickSegment(svg, seg, {
        animate: isNew,
        delay: isNew ? newIndex++ * 0.14 : 0,
        tip: true,
      });
    });
  }

  function miniPicture(n) {
    if (!n) return '<span style="color:#999">—</span>';
    const count = Math.min(n, 5);
    const size = 16;
    const originX = 3;
    const baseY = 30;
    const segs = chainSegments(count, size, originX, baseY);
    const width = originX + (Math.floor(count / 2) + 1) * size + size / 2 + 6;
    const lines = segs
      .map(
        (s) =>
          `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="#c4783a" stroke-width="2.5" stroke-linecap="round"/>`
      )
      .join("");
    return `<svg class="mini-svg" viewBox="0 0 ${width} 36" aria-hidden="true">${lines}</svg>`;
  }

  function normalizeCalc(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/·/g, "*")
      .replace(/×/g, "*")
      .replace(/−/g, "-")
      .replace(/–/g, "-");
  }

  function normalizeTerm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/·/g, "*")
      .replace(/×/g, "*")
      .replace(/−/g, "-")
      .replace(/–/g, "-");
  }

  function isSimplifiedTerm(s) {
    const t = normalizeTerm(s);
    const ok = new Set([
      "2x+1",
      "1+2x",
      "2*x+1",
      "1+2*x",
      "2·x+1",
      "1+2·x",
      "(2x)+1",
      "1+(2x)",
    ]);
    return ok.has(t);
  }

  function renderStageGrid() {
    const grid = $("stageGrid");
    grid.innerHTML = "";
    STAGES.forEach((st, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "stage-btn";
      if (state.completed.includes(st.id)) btn.classList.add("done");
      const locked = i >= state.unlocked;
      btn.disabled = locked;
      btn.innerHTML = `<span class="n">Stufe ${i + 1}</span><span class="t">${st.short}</span>`;
      btn.addEventListener("click", () => {
        sfxClick();
        startAt(i);
      });
      grid.appendChild(btn);
    });
  }

  function renderTrail() {
    const trail = $("playTrail");
    trail.innerHTML = "";
    STAGES.forEach((st, i) => {
      const d = document.createElement("span");
      d.className = "trail-dot";
      d.textContent = String(i + 1);
      if (i < state.stageIndex) d.classList.add("done");
      if (i === state.stageIndex) d.classList.add("now");
      d.title = st.title;
      trail.appendChild(d);
    });
  }

  function hidePanels() {
    [
      "panel-build",
      "panel-table",
      "panel-words",
      "panel-hundred",
      "panel-cards",
      "panel-kuerz",
      "panel-sub",
    ].forEach((id) => {
      $(id).hidden = true;
    });
  }

  function startAt(index) {
    state.stageIndex = index;
    showScreen("play");
    enterStage();
  }

  function enterStage() {
    const st = STAGES[state.stageIndex];
    $("stageNum").textContent = String(state.stageIndex + 1);
    $("stageTotal").textContent = String(STAGES.length);
    $("stageTitle").textContent = st.title;
    $("progressBar").style.width = `${((state.stageIndex) / STAGES.length) * 100}%`;
    renderTrail();
    hidePanels();
    $("scratchTerm").textContent = `Stufe: ${st.title}`;

    if (st.id === "build") enterBuild();
    if (st.id === "table") enterTable();
    if (st.id === "words") enterWords();
    if (st.id === "hundred") enterHundred();
    if (st.id === "cards") enterCards();
    if (st.id === "kuerz") enterKuerz();
    if (st.id === "sub") enterSub();
  }

  function completeStage() {
    const st = STAGES[state.stageIndex];
    if (!state.completed.includes(st.id)) state.completed.push(st.id);
    state.unlocked = Math.max(state.unlocked, state.stageIndex + 2);
    saveProgress();
    addStar(1);
    burstConfetti(40);
    $("progressBar").style.width = `${((state.stageIndex + 1) / STAGES.length) * 100}%`;

    if (state.stageIndex >= STAGES.length - 1) {
      window.setTimeout(() => {
        $("finalStars").textContent = "★".repeat(Math.min(5, Math.max(3, state.stars)));
        $("doneMessage").textContent =
          `Du hast ${state.stars} Sterne! Term gefunden, gekürzt und x = 17 eingesetzt.`;
        showScreen("done");
        burstConfetti(90);
        say("Pfad geschafft! Fuchsi tanzt!", "happy");
      }, 700);
      return;
    }

    window.setTimeout(() => {
      state.stageIndex += 1;
      enterStage();
    }, 850);
  }

  /* —— Build —— */
  function enterBuild() {
    $("panel-build").hidden = false;
    $("missionText").textContent =
      "Tippe + Dreieck: die 2 neuen Hölzer kommen an die freie Seite. Baue mindestens bis 4.";
    say("Zwei neue Hölzer an die freie Seite — so wächst die Kette!", "think");
    state.triangles = 1;
    updateBuild();
  }

  function updateBuild() {
    const n = state.triangles;
    drawTriangles($("matchSvg"), n, true);
    $("triCount").textContent = String(n);
    $("stickCount").textContent = String(sticksFor(n));
    $("btnLessTri").disabled = n <= 1;
    $("btnMoreTri").disabled = n >= 5;
    $("btnBuildNext").disabled = n < 4;
  }

  /* —— Table —— */
  function cellKey(row, field) {
    return `${row}:${field}`;
  }

  function enterTable() {
    $("panel-table").hidden = false;
    $("missionText").textContent = "Fülle die Lücken in der Tabelle — eine nach der anderen.";
    say("Ein Schritt nach dem anderen auf dem Pfad!", "think");
    state.tableGap = 0;
    state.tableFilled = {};
    // Pre-fill known cells
    ROWS.forEach((r, i) => {
      if (r.tris != null) state.tableFilled[cellKey(i, "tris")] = String(r.tris);
      if (r.calc != null) state.tableFilled[cellKey(i, "calc")] = r.calc;
      if (r.sticks != null) state.tableFilled[cellKey(i, "sticks")] = String(r.sticks);
    });
    renderTable();
    showTableGap();
  }

  function displayCalc(raw) {
    return String(raw).replace(/\*/g, "·");
  }

  function renderTable() {
    const body = $("tableBody");
    body.innerHTML = "";
    const gap = TABLE_GAPS[state.tableGap];
    ROWS.forEach((r, i) => {
      const tr = document.createElement("tr");
      if (gap && gap.row === i) tr.classList.add("row-active");
      const filledAll =
        state.tableFilled[cellKey(i, "tris")] &&
        state.tableFilled[cellKey(i, "calc")] &&
        state.tableFilled[cellKey(i, "sticks")];
      if (filledAll && (!gap || gap.row !== i)) tr.classList.add("row-done");

      const tris = state.tableFilled[cellKey(i, "tris")];
      const calc = state.tableFilled[cellKey(i, "calc")];
      const sticks = state.tableFilled[cellKey(i, "sticks")];
      const picN = tris ? Number(tris) : r.picture;

      tr.innerHTML = `
        <td>${tris != null ? tris : "?"}</td>
        <td>${miniPicture(picN || 0)}</td>
        <td>${calc != null ? displayCalc(calc) : "?"}</td>
        <td>${sticks != null ? sticks : "?"}</td>
      `;
      body.appendChild(tr);
    });
  }

  function showTableGap() {
    if (state.tableGap >= TABLE_GAPS.length) {
      completeStage();
      return;
    }
    const g = TABLE_GAPS[state.tableGap];
    $("tableFillLabel").textContent = g.label;
    $("tableFeedback").textContent = "";
    $("tableFeedback").className = "feedback";
    const row = $("tableFillRow");
    row.innerHTML = "";
    if (g.kind === "num") {
      const inp = document.createElement("input");
      inp.id = "tableInput";
      inp.className = "num-blank";
      inp.type = "text";
      inp.inputMode = "numeric";
      inp.autocomplete = "off";
      inp.placeholder = "?";
      inp.setAttribute("aria-label", g.label);
      row.appendChild(inp);
      inp.focus();
    } else {
      const inp = document.createElement("input");
      inp.id = "tableInput";
      inp.className = "term-blank";
      inp.type = "text";
      inp.autocomplete = "off";
      inp.placeholder = g.placeholder || "3 + … · 2";
      inp.setAttribute("aria-label", g.label);
      row.appendChild(inp);
      inp.focus();
    }
    renderTable();
  }

  function checkTable() {
    const g = TABLE_GAPS[state.tableGap];
    const inp = $("tableInput");
    const val = (inp?.value || "").trim();
    if (!val) {
      $("tableFeedback").textContent = "Trag etwas ein.";
      $("tableFeedback").className = "feedback bad";
      sfxBad();
      return;
    }
    let ok = false;
    if (g.kind === "num") {
      ok = Number(val.replace(",", ".")) === g.answer;
    } else {
      ok = normalizeCalc(val) === g.answer || normalizeCalc(val) === g.answer.replace(/\*/g, "·");
      // also accept with · already normalized
      ok = normalizeCalc(val) === normalizeCalc(g.answer);
    }
    if (!ok) {
      $("tableFeedback").textContent = "Noch nicht — nutze den Tipp oder den Schreibzettel.";
      $("tableFeedback").className = "feedback bad";
      say("Fast! Schau nochmal auf das Muster.", "think");
      sfxBad();
      return;
    }
    if (g.kind === "calc") {
      state.tableFilled[cellKey(g.row, g.field)] = g.placeholder || displayCalc(String(g.answer));
    } else {
      state.tableFilled[cellKey(g.row, g.field)] = String(g.answer);
    }
    $("tableFeedback").textContent = "Genau! +Stern";
    $("tableFeedback").className = "feedback ok";
    say("Ja! Die Tabelle wächst.", "happy");
    addStar(1);
    burstConfetti(25);
    state.tableGap += 1;
    window.setTimeout(() => {
      if (state.tableGap >= TABLE_GAPS.length) completeStage();
      else showTableGap();
    }, 650);
  }

  /* —— Words —— */
  function enterWords() {
    $("panel-words").hidden = false;
    $("missionText").textContent = "Beschreibe die Regel mit eigenen Worten.";
    say("Du darfst die Hilfswörter antippen!", "think");
    $("wordsInput").value = "";
    $("wordsFeedback").textContent = "";
    $("wordsFeedback").className = "feedback";
  }

  function checkWords() {
    const t = $("wordsInput").value.toLowerCase();
    if (t.trim().length < 12) {
      $("wordsFeedback").textContent = "Schreib ein bisschen mehr — was passiert beim ersten und bei jedem weiteren Dreieck?";
      $("wordsFeedback").className = "feedback bad";
      sfxBad();
      return;
    }
    const hasFirst = /3|drei|erst/.test(t);
    const hasTwo = /2|zwei|weiter|dazu|plus|jedes/.test(t);
    if (hasFirst && hasTwo) {
      $("wordsFeedback").textContent = "Wunderbare Beschreibung!";
      $("wordsFeedback").className = "feedback ok";
      say("Fuchsi hat deine Regel verstanden!", "happy");
      completeStage();
      return;
    }
    $("wordsFeedback").textContent =
      "Tipp: Erwähne die 3 Hölzer fürs erste Dreieck und +2 für jedes weitere.";
    $("wordsFeedback").className = "feedback bad";
    sfxBad();
  }

  /* —— Hundred —— */
  function enterHundred() {
    $("panel-hundred").hidden = false;
    $("missionText").textContent = "Rechne Schritt für Schritt für 100 Dreiecke.";
    say("Erst Klammer, dann Punkt, dann Strich!", "think");
    state.hundredStep = 0;
    $("hundredInput").value = "";
    $("hundredFeedback").textContent = "";
    $("hundredFeedback").className = "feedback";
    renderHundredPath();
    setHundredPrompt();
  }

  function renderHundredPath() {
    const steps = ["100 − 1", "99 · 2", "3 + 198", "Ergebnis"];
    const el = $("hundredPath");
    el.innerHTML = "";
    steps.forEach((label, i) => {
      const s = document.createElement("span");
      s.className = "path-step";
      if (i < state.hundredStep) s.classList.add("done");
      if (i === state.hundredStep) s.classList.add("now");
      s.textContent = label;
      el.appendChild(s);
    });
  }

  function setHundredPrompt() {
    const prompts = [
      { label: "Schritt 1: Was ist 100 − 1?", expr: "100 − 1", answer: 99 },
      { label: "Schritt 2: Was ist 99 · 2?", expr: "99 · 2", answer: 198 },
      { label: "Schritt 3: Was ist 3 + 198?", expr: "3 + 198", answer: 201 },
      { label: "Endergebnis: Streichhölzer für 100 Dreiecke", expr: "3 + (100 − 1) · 2", answer: 201 },
    ];
    const p = prompts[Math.min(state.hundredStep, prompts.length - 1)];
    $("hundredLabel").textContent = p.label;
    $("hundredExpr").textContent = p.expr;
    $("hundredInput").value = "";
    $("hundredInput").dataset.answer = String(p.answer);
    renderHundredPath();
  }

  function checkHundred() {
    const got = Number(($("hundredInput").value || "").trim().replace(",", "."));
    const want = Number($("hundredInput").dataset.answer);
    if (!Number.isFinite(got)) {
      $("hundredFeedback").textContent = "Zahl eintragen.";
      $("hundredFeedback").className = "feedback bad";
      sfxBad();
      return;
    }
    if (got !== want) {
      $("hundredFeedback").textContent = "Noch nicht — rechne auf dem Schreibzettel nach.";
      $("hundredFeedback").className = "feedback bad";
      sfxBad();
      return;
    }
    $("hundredFeedback").textContent = "Stimmt!";
    $("hundredFeedback").className = "feedback ok";
    addStar(1);
    state.hundredStep += 1;
    if (state.hundredStep >= 4) {
      say("201 Hölzer für 100 Dreiecke — wow!", "happy");
      completeStage();
    } else {
      say("Weiter auf dem Rechenpfad!", "happy");
      burstConfetti(20);
      setHundredPrompt();
    }
  }

  /* —— Cards —— */
  function enterCards() {
    $("panel-cards").hidden = false;
    $("missionText").textContent = "Färbe das richtige Kärtchen — tippe es an.";
    say("Vergleich mit der Tabelle: 3 + (x − 1) · 2", "think");
    state.cardPicked = false;
    $("merkeBox").hidden = true;
    $("btnCardsNext").hidden = true;
    $("cardsFeedback").textContent = "";
    $("cardsFeedback").className = "feedback";
    document.querySelectorAll(".term-card").forEach((c) => {
      c.disabled = false;
      c.classList.remove("picked-wrong", "picked-right");
    });
  }

  function pickCard(btn) {
    if (state.cardPicked) return;
    const term = btn.dataset.term;
    if (term === "correct") {
      state.cardPicked = true;
      btn.classList.add("picked-right");
      document.querySelectorAll(".term-card").forEach((c) => {
        c.disabled = true;
      });
      $("cardsFeedback").textContent = "Richtig! Das passt zur Tabelle.";
      $("cardsFeedback").className = "feedback ok";
      $("merkeBox").hidden = false;
      $("btnCardsNext").hidden = false;
      say("Variable x — und das ist dein Term!", "happy");
      addStar(1);
      burstConfetti(50);
    } else {
      btn.classList.add("picked-wrong");
      $("cardsFeedback").textContent = "Passt nicht zur Tabelle. Probier ein anderes Kärtchen.";
      $("cardsFeedback").className = "feedback bad";
      say("Schau: bei x=2 soll 5 rauskommen.", "think");
      sfxBad();
      window.setTimeout(() => btn.classList.remove("picked-wrong"), 500);
    }
  }

  /* —— Kürzen —— */
  function enterKuerz() {
    $("panel-kuerz").hidden = false;
    $("missionText").textContent = "Vereinfache den Term so weit wie möglich.";
    say("Klammer ausmultiplizieren, dann zusammenfassen!", "think");
    $("kuerzInput").value = "";
    $("kuerzFeedback").textContent = "";
    $("kuerzFeedback").className = "feedback";
  }

  function checkKuerz() {
    const val = $("kuerzInput").value.trim();
    if (!val) {
      $("kuerzFeedback").textContent = "Trag den gekürzten Term ein.";
      $("kuerzFeedback").className = "feedback bad";
      sfxBad();
      return;
    }
    if (isSimplifiedTerm(val)) {
      $("kuerzFeedback").textContent = "Perfekt gekürzt: 2x + 1";
      $("kuerzFeedback").className = "feedback ok";
      say("Kurz und knackig — stark!", "happy");
      completeStage();
      return;
    }
    // Accept expanded-but-not-fully if close
    const t = normalizeTerm(val);
    if (t === "3+2*(x-1)" || t === "3+(x-1)*2" || t === "3+2x-2") {
      $("kuerzFeedback").textContent =
        "Gut angefangen — fasse noch zusammen: 3 − 2 + 2x → ?";
      $("kuerzFeedback").className = "feedback bad";
      say("Noch ein Schritt: zusammenfassen!", "think");
      sfxBad();
      return;
    }
    $("kuerzFeedback").textContent = "Noch nicht. Tipp: 3 + (x − 1) · 2 = 3 + 2x − 2 = …";
    $("kuerzFeedback").className = "feedback bad";
    sfxBad();
  }

  /* —— Substitute —— */
  function enterSub() {
    $("panel-sub").hidden = false;
    $("missionText").textContent = "Setze x = 17 ein und erkläre, was du berechnet hast.";
    say("Einsetzen und rechnen — dann erklären!", "think");
    state.subStep = 0;
    $("subInput").value = "";
    $("subExplain").value = "";
    $("subFeedback").textContent = "";
    $("subFeedback").className = "feedback";
    renderSubPath();
    setSubPrompt();
  }

  function renderSubPath() {
    const steps = ["17 − 1", "16 · 2", "3 + 32", "Wert + Erklärung"];
    const el = $("subPath");
    el.innerHTML = "";
    steps.forEach((label, i) => {
      const s = document.createElement("span");
      s.className = "path-step";
      if (i < state.subStep) s.classList.add("done");
      if (i === state.subStep) s.classList.add("now");
      s.textContent = label;
      el.appendChild(s);
    });
  }

  function setSubPrompt() {
    const prompts = [
      { label: "Schritt 1: 17 − 1 = ?", expr: "17 − 1", answer: 16, needExplain: false },
      { label: "Schritt 2: 16 · 2 = ?", expr: "16 · 2", answer: 32, needExplain: false },
      { label: "Schritt 3: 3 + 32 = ?", expr: "3 + 32", answer: 35, needExplain: false },
      {
        label: "Wert des Terms bei x = 17",
        expr: "3 + (17 − 1) · 2",
        answer: 35,
        needExplain: true,
      },
    ];
    const p = prompts[state.subStep];
    document.querySelector("#panel-sub .fill-label").textContent = p.label;
    $("subExpr").textContent = p.expr;
    $("subInput").value = "";
    $("subInput").dataset.answer = String(p.answer);
    $("subInput").dataset.needExplain = p.needExplain ? "1" : "0";
    $("subExplain").hidden = !p.needExplain;
    document.querySelector("#panel-sub .explain-label").hidden = !p.needExplain;
    renderSubPath();
  }

  function checkSub() {
    const got = Number(($("subInput").value || "").trim().replace(",", "."));
    const want = Number($("subInput").dataset.answer);
    if (!Number.isFinite(got) || got !== want) {
      $("subFeedback").textContent = "Zahl stimmt noch nicht — auf dem Zettel nachrechnen.";
      $("subFeedback").className = "feedback bad";
      sfxBad();
      return;
    }
    if ($("subInput").dataset.needExplain === "1") {
      const ex = $("subExplain").value.toLowerCase();
      const ok =
        ex.trim().length >= 8 &&
        (/17|dreieck|streich|holz|anzahl|term/.test(ex));
      if (!ok) {
        $("subFeedback").textContent =
          "Zahl stimmt! Erkläre noch kurz: Was bedeuten die 35? (z. B. Hölzer für 17 Dreiecke)";
        $("subFeedback").className = "feedback bad";
        sfxBad();
        return;
      }
    }
    $("subFeedback").textContent = "Genau!";
    $("subFeedback").className = "feedback ok";
    addStar(1);
    state.subStep += 1;
    if (state.subStep >= 4) {
      say("35 Streichhölzer für 17 Dreiecke — geschafft!", "happy");
      completeStage();
    } else {
      burstConfetti(18);
      setSubPrompt();
    }
  }

  /* —— Wire UI —— */
  function bind() {
    $("btnStart").addEventListener("click", () => startAt(0));
    $("btnStartFromHow").addEventListener("click", () => startAt(0));
    $("btnHow").addEventListener("click", () => showScreen("how"));
    $("btnBackHow").addEventListener("click", () => showScreen("home"));
    $("btnHome").addEventListener("click", () => {
      renderStageGrid();
      showScreen("home");
    });
    $("btnDoneHome").addEventListener("click", () => {
      renderStageGrid();
      showScreen("home");
    });
    $("btnAgain").addEventListener("click", () => startAt(0));

    $("btnSound").addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      localStorage.setItem(STORAGE.sound, state.soundOn ? "1" : "0");
      $("btnSound").textContent = state.soundOn ? "Sound an" : "Sound aus";
      $("btnSound").setAttribute("aria-pressed", state.soundOn ? "true" : "false");
      if (state.soundOn) sfxClick();
    });

    $("btnMoreTri").addEventListener("click", () => {
      if (state.triangles < 5) {
        state.triangles += 1;
        sfxClick();
        updateBuild();
        if (state.triangles >= 4) say("Muster klar? Dann tippe Weiter!", "happy");
      }
    });
    $("btnLessTri").addEventListener("click", () => {
      if (state.triangles > 1) {
        state.triangles -= 1;
        sfxClick();
        updateBuild();
      }
    });
    $("btnBuildNext").addEventListener("click", () => completeStage());

    $("btnCheckTable").addEventListener("click", checkTable);
    $("btnHintTable").addEventListener("click", () => {
      const g = TABLE_GAPS[state.tableGap];
      $("tableFeedback").textContent = g ? `Tipp: ${g.hint}` : "";
      $("tableFeedback").className = "feedback";
      say(g?.hint || "Schau auf die Rechnungsspalte.", "think");
    });
    $("tableFillRow").addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkTable();
    });

    $("btnCheckWords").addEventListener("click", checkWords);
    $("btnHintWords").addEventListener("click", () => {
      $("wordsFeedback").textContent =
        "Idee: „Erstes Dreieck: 3 Hölzer. Jedes weitere: +2 Hölzer.“";
      $("wordsFeedback").className = "feedback";
    });
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const box = $("wordsInput");
        const add = chip.dataset.chip;
        box.value = (box.value ? box.value + " " : "") + add;
        box.focus();
        sfxClick();
      });
    });

    $("btnCheckHundred").addEventListener("click", checkHundred);
    $("btnHintHundred").addEventListener("click", () => {
      const hints = [
        "100 Dreiecke → 99 weitere nach dem ersten.",
        "99 · 2 = 198",
        "3 + 198 = 201",
        "Antwort: 201 Streichhölzer",
      ];
      $("hundredFeedback").textContent = hints[Math.min(state.hundredStep, hints.length - 1)];
      $("hundredFeedback").className = "feedback";
    });
    $("hundredInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkHundred();
    });

    document.querySelectorAll(".term-card").forEach((btn) => {
      btn.addEventListener("click", () => pickCard(btn));
    });
    $("btnCardsNext").addEventListener("click", () => completeStage());

    $("btnCheckKuerz").addEventListener("click", checkKuerz);
    $("btnHintKuerz").addEventListener("click", () => {
      $("kuerzFeedback").textContent =
        "3 + (x − 1) · 2 = 3 + 2·x − 2 = 2x + 1";
      $("kuerzFeedback").className = "feedback";
      say("Ausmultiplizieren, dann 3 und −2 zusammenfassen.", "think");
    });
    $("kuerzInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkKuerz();
    });

    $("btnCheckSub").addEventListener("click", checkSub);
    $("btnHintSub").addEventListener("click", () => {
      const hints = [
        "17 − 1 = 16",
        "16 · 2 = 32",
        "3 + 32 = 35",
        "35 Streichhölzer für 17 Dreiecke",
      ];
      $("subFeedback").textContent = hints[Math.min(state.subStep, hints.length - 1)];
      $("subFeedback").className = "feedback";
    });
    $("subInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkSub();
    });

    let scratchTimer = 0;
    $("scratchFree").addEventListener("input", () => {
      window.clearTimeout(scratchTimer);
      scratchTimer = window.setTimeout(() => {
        localStorage.setItem(STORAGE.scratch, $("scratchFree").value);
      }, 300);
    });
    const saved = localStorage.getItem(STORAGE.scratch);
    if (saved != null) $("scratchFree").value = saved;

    window.addEventListener("resize", resizeConfetti);
  }

  // boot
  loadProgress();
  $("starCount").textContent = String(state.stars);
  $("btnSound").textContent = state.soundOn ? "Sound an" : "Sound aus";
  $("btnSound").setAttribute("aria-pressed", state.soundOn ? "true" : "false");
  renderStageGrid();
  bind();
  resizeConfetti();
})();
