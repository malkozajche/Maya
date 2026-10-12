(function () {
  var C = window.MayaFrancais;
  var $ = function (id) { return document.getElementById(id); };

  var soundOn = true;
  var stars = loadNum("maya-fr-stars");
  var best = loadJson("maya-fr-best") || {};
  var run = null;
  var recognition = null;
  var highlightTimer = 0;
  var triedListen = false;

  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var canRecognize = !!SpeechRec;

  function loadNum(key) {
    try { return Number(localStorage.getItem(key)) || 0; } catch (e) { return 0; }
  }
  function loadJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function saveNum(key, n) {
    try { localStorage.setItem(key, String(n)); } catch (e) { /* private mode */ }
  }
  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function show(id) {
    document.querySelectorAll(".screen").forEach(function (el) {
      el.classList.toggle("active", el.id === id);
    });
  }

  function setSpeech(id, text) {
    var el = $(id);
    if (el) el.textContent = text;
  }

  function mood(which) {
    ["homeFox", "playFox", "doneFox"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.classList.remove("happy", "sad", "think");
      if (which) el.classList.add(which);
    });
  }

  function renderStars() {
    $("starCount").textContent = String(stars);
  }

  function renderHits() {
    if (!run) {
      $("hitCount").textContent = "0";
      $("hitTotal").textContent = "0";
      return;
    }
    $("hitCount").textContent = String(run.hits);
    $("hitTotal").textContent = String(run.ids.length);
  }

  function stopSpeaking() {
    if (highlightTimer) {
      clearInterval(highlightTimer);
      highlightTimer = 0;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.querySelectorAll(".fr-word.on").forEach(function (el) {
      el.classList.remove("on");
    });
  }

  function frenchVoice() {
    if (!window.speechSynthesis) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var fr = voices.filter(function (v) { return /^fr/i.test(v.lang); });
    return fr.filter(function (v) { return /fr[-_]fr/i.test(v.lang); })[0] || fr[0] || null;
  }

  function voiceStatus() {
    var note = $("voiceNote");
    if (!note) return;
    if (!window.speechSynthesis) {
      note.textContent = "Dieses Gerät kann leider nicht vorlesen. Du kannst die Sätze trotzdem lesen und tippen.";
      return;
    }
    var voice = frenchVoice();
    if (voice) {
      note.textContent = "Französische Stimme: " + voice.name + ". Das Mikrofon speichert nichts.";
    } else if ((window.speechSynthesis.getVoices() || []).length) {
      note.textContent = "Keine französische Stimme gefunden. Der Browser liest die Sätze trotzdem vor.";
    }
  }

  function speak(text, rate) {
    if (!soundOn || !window.speechSynthesis || !text) return;
    stopSpeaking();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = "fr-FR";
    utter.rate = rate || 0.92;
    var voice = frenchVoice();
    if (voice) utter.voice = voice;
    var words = Array.prototype.slice.call(document.querySelectorAll("#playCard .fr-word"));
    var stepped = false;
    function mark(index) {
      words.forEach(function (el, i) {
        el.classList.toggle("on", i === index);
      });
    }
    utter.onboundary = function (ev) {
      if (!words.length || ev.charIndex == null) return;
      stepped = true;
      var active = 0;
      words.forEach(function (el, i) {
        if (Number(el.dataset.start) <= ev.charIndex) active = i;
      });
      mark(active);
    };
    utter.onend = function () {
      if (highlightTimer) clearInterval(highlightTimer);
      highlightTimer = 0;
      words.forEach(function (el) { el.classList.remove("on"); });
    };
    window.speechSynthesis.speak(utter);
    window.setTimeout(function () {
      if (stepped || !words.length) return;
      var step = 0;
      var gap = Math.max(280, (text.length * 68) / (rate || 0.92) / words.length);
      highlightTimer = window.setInterval(function () {
        if (step >= words.length) {
          clearInterval(highlightTimer);
          highlightTimer = 0;
          return;
        }
        mark(step);
        step += 1;
      }, gap);
    }, 240);
  }

  function sayHtml(text) {
    var html = "";
    var re = /\S+/g;
    var last = 0;
    var match;
    while ((match = re.exec(text))) {
      html += escapeHtml(text.slice(last, match.index));
      html += '<span class="fr-word" data-start="' + match.index + '">' + escapeHtml(match[0]) + "</span>";
      last = match.index + match[0].length;
    }
    html += escapeHtml(text.slice(last));
    return html;
  }

  function passageHtml() {
    var solved = {};
    run.ids.slice(0, run.index).forEach(function (id) {
      var q = C.byId(id);
      if (q && q.passage) solved[id] = C.correctWord(q);
    });
    var current = run.ids[run.index];
    return C.PASSAGE.map(function (part) {
      if (part.br) return "<br />";
      if (part.t) return escapeHtml(part.t);
      if (solved[part.b]) return '<span class="gap ok">' + escapeHtml(solved[part.b]) + "</span>";
      if (part.b === current) return '<span class="gap on">___</span>';
      return '<span class="gap">___</span>';
    }).join("");
  }

  function speakBox(q, withSkip) {
    var fallback = canRecognize
      ? "Ohne Mikrofon geht auch: Hör zu und tippe „Ich habe laut gesagt“."
      : "Dieses Gerät erkennt keine Sprache. Hör zu und tippe dann „Ich habe laut gesagt“.";
    return (
      '<div class="speak-box">' +
      '<p class="speak-label">Nachsprechen</p>' +
      '<p class="fr-say" lang="fr">' + sayHtml(q.say) + "</p>" +
      '<div class="row">' +
      '<button type="button" class="btn soft" data-act="hear">Anhören</button>' +
      '<button type="button" class="btn ghost" data-act="slow">Langsam</button>' +
      (canRecognize ? '<button type="button" class="btn primary mic-btn" data-act="mic">Ins Mikrofon</button>' : "") +
      "</div>" +
      '<p class="heard" id="heardLine" aria-live="polite"></p>' +
      '<div class="row">' +
      '<button type="button" class="btn ghost" data-act="said">' + (canRecognize ? "Ich habe laut gesagt" : "Ich habe laut gesagt") + "</button>" +
      (withSkip ? '<button type="button" class="btn primary" data-act="next">Weiter</button>' : "") +
      "</div>" +
      '<p class="note">' + fallback + "</p>" +
      "</div>"
    );
  }

  function renderQuestion() {
    stopMic();
    stopSpeaking();
    triedListen = false;
    var q = C.byId(run.ids[run.index]);
    run.phase = q.kind === "speak" ? "speak" : "ask";
    run.picked = [];
    run.tileOrder = q.kind === "order" ? shuffle(q.tiles) : [];
    run.choiceOrder = q.kind === "choice" ? shuffle(q.choices.map(function (_, i) { return i; })) : [];
    $("qNum").textContent = String(run.index + 1);
    $("qTotal").textContent = String(run.ids.length);
    $("progressBar").style.width = (run.index / run.ids.length) * 100 + "%";
    setSpeech("playSpeech", run.index === 0 ? C.INTRO[run.station] : "Nächster Satz.");
    mood("");

    var html = '<p class="q-tag">' + escapeHtml(q.tag) + "</p>";
    if (q.passage && run.station === "lire") html += '<div class="passage" lang="fr">' + passageHtml() + "</div>";
    if (q.example && run.index === 0) html += '<p class="example-line">' + escapeHtml(q.example) + "</p>";
    html += '<p class="prompt">' + escapeHtml(q.prompt) + "</p>";
    if (q.frame) html += '<p class="frame" lang="fr">' + escapeHtml(q.frame) + "</p>";
    if (q.note) html += '<p class="note">' + escapeHtml(q.note) + "</p>";

    if (q.kind === "choice") {
      html += '<div class="choices">';
      run.choiceOrder.forEach(function (index) {
        html += '<button type="button" class="choice" data-act="choice" data-i="' + index + '">' +
          escapeHtml(q.choices[index].text) + "</button>";
      });
      html += "</div>";
    } else if (q.kind === "order") {
      html += '<div class="slot" id="slot"><span class="slot-empty">Tippe die Teile in der richtigen Reihenfolge.</span></div>';
      html += '<div class="tiles" id="tiles">';
      run.tileOrder.forEach(function (tile, i) {
        html += '<button type="button" class="tile" data-act="add" data-i="' + i + '">' + escapeHtml(tile) + "</button>";
      });
      html += "</div>";
      html += '<div class="row"><button type="button" class="btn primary" data-act="check" id="btnCheck" disabled>Prüfen</button></div>';
    } else {
      html += speakBox(q, false);
      html += '<div class="row"><button type="button" class="btn primary" data-act="next">Weiter</button></div>';
    }
    html += '<div id="extra"></div>';
    $("playCard").innerHTML = html;
    if (q.kind === "speak") speak(q.say, 0.92);
  }

  function paintSlotSimple() {
    var slot = $("slot");
    if (!slot) return;
    if (!run.picked.length) {
      slot.innerHTML = '<span class="slot-empty">Tippe die Teile in der richtigen Reihenfolge.</span>';
    } else {
      slot.innerHTML = run.picked.map(function (item, i) {
        return '<button type="button" class="slot-chip" data-act="remove" data-at="' + i + '">' + escapeHtml(item.tile) + "</button>";
      }).join("");
    }
    var q = C.byId(run.ids[run.index]);
    var check = $("btnCheck");
    if (check) check.disabled = run.phase !== "ask" || run.picked.length !== q.answer.length;
    var used = {};
    run.picked.forEach(function (item) { used[item.i] = true; });
    document.querySelectorAll("#tiles .tile").forEach(function (btn) {
      btn.disabled = !!used[btn.dataset.i];
    });
  }

  function lockAsking() {
    run.phase = "speak";
    document.querySelectorAll(".choice").forEach(function (btn) { btn.disabled = true; });
    var check = $("btnCheck");
    if (check) check.disabled = true;
  }

  function showWrittenResult(ok) {
    var q = C.byId(run.ids[run.index]);
    lockAsking();
    if (ok) {
      run.hits += 1;
      stars += 1;
      saveNum("maya-fr-stars", stars);
      renderStars();
      renderHits();
      mood("happy");
      setSpeech("playSpeech", "Oui! Hör zu und sprich nach.");
    } else {
      run.missed.push(q.id);
      mood("sad");
      setSpeech("playSpeech", "Fast. So heißt der Satz.");
    }
    if (q.kind === "choice") {
      document.querySelectorAll(".choice").forEach(function (btn) {
        var good = q.choices[Number(btn.dataset.i)].ok;
        if (good) btn.classList.add("good");
        else if (btn.classList.contains("pending")) btn.classList.add("bad");
      });
    }
    if (q.kind === "order") {
      var slot = $("slot");
      if (slot) {
        slot.classList.add(ok ? "good" : "bad");
        slot.innerHTML = q.answer.map(function (tile) {
          return '<span class="slot-chip">' + escapeHtml(tile) + "</span>";
        }).join("");
      }
    }
    var extra = $("extra");
    extra.innerHTML =
      '<div class="feedback ' + (ok ? "ok" : "no") + '">' +
      (ok ? "Richtig." : "Die Lösung: „" + escapeHtml(q.say) + "“.") +
      " " + escapeHtml(q.why || "") +
      "</div>" +
      speakBox(q, true);
    speak(q.say, 0.92);
  }

  function finishSpeak(pass, viaMic) {
    var q = C.byId(run.ids[run.index]);
    var line = $("heardLine");
    if (pass) {
      if (!run.spoke) {
        run.spoke = true;
        run.speakHits += 1;
        stars += 1;
        saveNum("maya-fr-stars", stars);
        renderStars();
        if (q.kind === "speak") {
          run.hits += 1;
          renderHits();
        }
      }
      mood("happy");
      burstConfetti(28);
      setSpeech("playSpeech", viaMic ? "Das klingt nah dran!" : "Gut mitgesprochen.");
      if (line && !line.textContent) line.textContent = "Geübt.";
    } else {
      setSpeech("playSpeech", "Sag ihn noch einmal, oder geh weiter.");
    }
    var next = document.querySelector('[data-act="next"]');
    if (!next) {
      var box = document.querySelector(".speak-box .row:last-of-type") || document.querySelector(".speak-box");
      if (box) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn primary";
        btn.dataset.act = "next";
        btn.textContent = "Weiter";
        box.appendChild(btn);
      }
    }
  }

  function advance() {
    stopMic();
    stopSpeaking();
    if (run.index + 1 >= run.ids.length) {
      finishRun();
      return;
    }
    run.index += 1;
    run.spoke = false;
    renderQuestion();
  }

  function finishRun() {
    stopMic();
    stopSpeaking();
    $("progressBar").style.width = "100%";
    var total = run.ids.length;
    var ratio = total ? run.hits / total : 0;
    var prev = best[run.station];
    if (!prev || run.hits > prev.hits || (run.hits === prev.hits && run.speakHits > prev.speak)) {
      best[run.station] = { hits: run.hits, total: total, speak: run.speakHits };
      saveJson("maya-fr-best", best);
    }
    var title = ratio >= 0.8 ? "Bravo, Maya!" : ratio >= 0.5 ? "Gut geübt!" : "Nochmal schnuppern";
    $("doneTitle").textContent = title;
    setSpeech("doneSpeech", ratio >= 0.8 ? "Die Sätze aus Nizza sitzen." : "Hör die markierten Sätze noch einmal.");
    mood(ratio >= 0.5 ? "happy" : "think");
    $("doneLede").textContent = run.station === "speak"
      ? "Beim Nachsprechen zählt, ob der Satz erkannt wurde."
      : "Die Treffer sind die geschriebenen Aufgaben. Sterne gibt es auch fürs Nachsprechen.";
    $("doneScore").textContent = run.hits + " von " + total + " richtig · Aussprache " + run.speakHits;
    var uniqueMiss = [];
    run.missed.forEach(function (id) {
      if (uniqueMiss.indexOf(id) < 0) uniqueMiss.push(id);
    });
    $("doneMiss").innerHTML = uniqueMiss.map(function (id) {
      var q = C.byId(id);
      return '<div class="miss"><div><p class="de">' + escapeHtml(q.prompt) + '</p><p class="fr" lang="fr">' +
        escapeHtml(q.say) + '</p></div><button type="button" class="btn ghost" data-act="replay" data-id="' +
        escapeHtml(q.id) + '">Anhören</button></div>';
    }).join("");
    if (ratio >= 0.7) burstConfetti(80);
    show("screen-done");
    renderStations();
  }

  function start(stationId) {
    var list = C.questionsFor(stationId);
    run = {
      station: stationId,
      ids: list.map(function (q) { return q.id; }),
      index: 0,
      hits: 0,
      speakHits: 0,
      missed: [],
      phase: "ask",
      spoke: false,
      picked: [],
    };
    renderHits();
    show("screen-play");
    renderQuestion();
  }

  function stopMic() {
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.stop(); } catch (e) { /* already stopped */ }
      recognition = null;
    }
    document.querySelectorAll(".mic-btn").forEach(function (btn) {
      btn.classList.remove("is-live");
      btn.textContent = "Ins Mikrofon";
    });
  }

  function startMic() {
    if (!canRecognize || run.phase === "ask") return;
    stopSpeaking();
    stopMic();
    var q = C.byId(run.ids[run.index]);
    var rec = new SpeechRec();
    recognition = rec;
    rec.lang = "fr-FR";
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    var finalText = "";
    var btn = document.querySelector(".mic-btn");
    if (btn) {
      btn.classList.add("is-live");
      btn.textContent = "Ich höre zu …";
    }
    setSpeech("playSpeech", "Sprich jetzt auf Französisch.");
    rec.onresult = function (event) {
      var text = "";
      for (var i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText = text;
      }
      var line = $("heardLine");
      if (line) line.textContent = "Ich höre: " + text;
    };
    rec.onerror = function (event) {
      var line = $("heardLine");
      var msg = "Das Mikrofon hat nicht geklappt. Sprich laut und tippe „Ich habe laut gesagt“.";
      if (event.error === "not-allowed") msg = "Das Mikrofon ist blockiert. Du kannst den Satz trotzdem laut sagen.";
      if (event.error === "no-speech") msg = "Ich habe nichts gehört. Versuch es noch einmal.";
      if (line) line.textContent = msg;
      setSpeech("playSpeech", "Kein Problem. Sag den Satz laut für dich.");
    };
    rec.onend = function () {
      if (recognition !== rec) return;
      recognition = null;
      document.querySelectorAll(".mic-btn").forEach(function (el) {
        el.classList.remove("is-live");
        el.textContent = "Nochmal sprechen";
      });
      if (!finalText) return;
      var match = C.speechMatch(q.say, finalText, q.sayAlso);
      var line = $("heardLine");
      if (match.pass) {
        if (line) line.textContent = "Erkannt: " + finalText;
        finishSpeak(true, true);
      } else if (line) {
        line.textContent = "Ich habe gehört: " + finalText + ". Versuch es noch einmal, langsam.";
        setSpeech("playSpeech", "Noch einmal, ganz langsam.");
        speak(q.say, 0.72);
      }
    };
    try {
      rec.start();
    } catch (e) {
      var line = $("heardLine");
      if (line) line.textContent = "Das Mikrofon ist gerade belegt. Warte einen Moment.";
    }
  }

  function onCardClick(event) {
    var btn = event.target.closest("[data-act]");
    if (!btn || !run) return;
    var act = btn.dataset.act;
    var q = C.byId(run.ids[run.index]);
    if (act === "choice" && run.phase === "ask") {
      btn.classList.add("pending");
      showWrittenResult(C.choiceOk(q, Number(btn.dataset.i)));
      return;
    }
    if (act === "add" && run.phase === "ask") {
      run.picked.push({ i: btn.dataset.i, tile: run.tileOrder[Number(btn.dataset.i)] });
      paintSlotSimple();
      return;
    }
    if (act === "remove" && run.phase === "ask") {
      run.picked.splice(Number(btn.dataset.at), 1);
      paintSlotSimple();
      return;
    }
    if (act === "check" && run.phase === "ask") {
      showWrittenResult(C.orderOk(run.picked.map(function (item) { return item.tile; }), q.answer));
      return;
    }
    if (act === "hear") {
      triedListen = true;
      speak(q.say, 0.92);
      return;
    }
    if (act === "slow") {
      triedListen = true;
      speak(q.say, 0.72);
      return;
    }
    if (act === "mic") {
      triedListen = true;
      startMic();
      return;
    }
    if (act === "said") {
      if (!triedListen && soundOn && window.speechSynthesis) {
        var line = $("heardLine");
        if (line) line.textContent = "Hör den Satz zuerst an, dann sprich nach.";
        speak(q.say, 0.92);
        triedListen = true;
        return;
      }
      var lineSaid = $("heardLine");
      if (lineSaid) lineSaid.textContent = "Geübt.";
      if (q.kind === "speak") {
        if (!canRecognize) finishSpeak(true, false);
        else finishSpeak(false, false);
      } else if (!canRecognize) {
        finishSpeak(true, false);
      } else {
        setSpeech("playSpeech", "Wenn du magst, prüf den Satz noch mit dem Mikrofon.");
      }
      return;
    }
    if (act === "next") {
      if (q.kind === "speak" && !run.spoke) run.missed.push(q.id);
      advance();
    }
  }

  function renderStations() {
    $("stationGrid").innerHTML = C.STATIONS.map(function (st) {
      var n = C.questionsFor(st.id).length;
      var rec = best[st.id];
      var bestLine = rec ? '<span class="best-line">Bester Lauf: ' + rec.hits + "/" + rec.total + "</span>" : "";
      return '<button type="button" class="level" data-station="' + st.id + '">' +
        '<span class="level-badge">' + escapeHtml(st.badge) + "</span>" +
        '<span class="level-title">' + escapeHtml(st.title) + "</span>" +
        '<span class="level-desc">' + escapeHtml(st.desc) + " · " + n + " Aufgaben</span>" +
        bestLine +
        "</button>";
    }).join("");
  }

  var confettiBits = [];
  var confettiRaf = 0;
  var confettiCtx = $("confetti").getContext("2d");

  function resizeConfetti() {
    var canvas = $("confetti");
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    confettiCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function burstConfetti(amount) {
    resizeConfetti();
    var colors = ["#ff7a8a", "#ff9b6a", "#5ecfb8", "#7ec8e8", "#f0a53a", "#fff"];
    for (var i = 0; i < amount; i++) {
      confettiBits.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 40,
        w: 6 + Math.random() * 7,
        h: 8 + Math.random() * 8,
        vx: -2.5 + Math.random() * 5,
        vy: 2 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: -0.2 + Math.random() * 0.4,
        color: colors[(Math.random() * colors.length) | 0],
        life: 70,
      });
    }
    if (!confettiRaf) confettiRaf = requestAnimationFrame(tickConfetti);
  }

  function tickConfetti() {
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiBits = confettiBits.filter(function (p) { return p.life > 0; });
    confettiBits.forEach(function (p) {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rot += p.vr;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot);
      confettiCtx.globalAlpha = Math.max(0, p.life / 40);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    });
    if (confettiBits.length) confettiRaf = requestAnimationFrame(tickConfetti);
    else confettiRaf = 0;
  }

  $("btnSound").addEventListener("click", function () {
    soundOn = !soundOn;
    $("btnSound").setAttribute("aria-pressed", soundOn ? "true" : "false");
    $("btnSound").textContent = soundOn ? "Sound an" : "Sound aus";
    if (!soundOn) stopSpeaking();
  });

  $("btnTest").addEventListener("click", function () { start("test"); });
  $("btnStartFromHow").addEventListener("click", function () { start("test"); });
  $("btnHow").addEventListener("click", function () { show("screen-how"); });
  $("btnBackHow").addEventListener("click", function () { show("screen-home"); });
  $("btnDemo").addEventListener("click", function () {
    mood("happy");
    setSpeech("homeSpeech", "Salut Maya ! Aujourd'hui, il fait beau à Nice.");
    speak("Salut Maya ! Aujourd'hui, il fait beau à Nice.", 0.9);
  });
  $("btnQuit").addEventListener("click", function () {
    stopMic();
    stopSpeaking();
    run = null;
    renderHits();
    show("screen-home");
  });
  $("btnMenu").addEventListener("click", function () { show("screen-home"); });
  $("btnAgain").addEventListener("click", function () {
    if (run) start(run.station);
  });
  $("stationGrid").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-station]");
    if (btn) start(btn.dataset.station);
  });
  $("playCard").addEventListener("click", onCardClick);
  $("doneMiss").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-act='replay']");
    if (!btn) return;
    var q = C.byId(btn.dataset.id);
    if (q) speak(q.say, 0.9);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopMic();
      stopSpeaking();
    }
  });

  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener("voiceschanged", voiceStatus);
    voiceStatus();
  }
  renderStars();
  renderHits();
  renderStations();
  window.addEventListener("resize", resizeConfetti);
})();
