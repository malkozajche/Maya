(function () {
  var C = window.MayaFrancais;
  var $ = function (id) { return document.getElementById(id); };
  var soundOn = true;
  var stars = loadNum("maya-bilan-stars");
  var done = loadJson("maya-bilan-done") || {};
  var recognition = null;
  var heardRoot = null;
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  function loadNum(key) {
    try { return Number(localStorage.getItem(key)) || 0; } catch (e) { return 0; }
  }
  function loadJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function save() {
    try {
      localStorage.setItem("maya-bilan-stars", String(stars));
      localStorage.setItem("maya-bilan-done", JSON.stringify(done));
    } catch (e) { /* private mode */ }
  }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        else if (attrs[key] != null) node.setAttribute(key, attrs[key]);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null) return;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function writtenCount() {
    return Object.keys(done).filter(function (id) { return done[id] === "ok" && id.charAt(0) !== "s"; }).length;
  }

  function renderScore() {
    $("starCount").textContent = String(stars);
    $("hitCount").textContent = String(writtenCount());
  }

  function frenchVoice() {
    if (!window.speechSynthesis) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var fr = voices.filter(function (v) { return /^fr/i.test(v.lang); });
    return fr.filter(function (v) { return /fr[-_]fr/i.test(v.lang); })[0] || fr[0] || null;
  }

  function speak(text, rate) {
    if (!soundOn || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = "fr-FR";
    utter.rate = rate || 0.92;
    var voice = frenchVoice();
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  }

  function speakLines(lines, rate) {
    if (!soundOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    lines.forEach(function (line) {
      var utter = new SpeechSynthesisUtterance(line);
      utter.lang = "fr-FR";
      utter.rate = rate || 0.9;
      var voice = frenchVoice();
      if (voice) utter.voice = voice;
      window.speechSynthesis.speak(utter);
    });
  }

  function stopMic() {
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.stop(); } catch (e) { /* already stopped */ }
      recognition = null;
    }
    document.querySelectorAll(".mic-btn.is-live").forEach(function (btn) {
      btn.classList.remove("is-live");
    });
  }

  function listen(say, heardEl, id) {
    if (!SpeechRec) return;
    stopMic();
    var rec = new SpeechRec();
    recognition = rec;
    rec.lang = "fr-FR";
    rec.interimResults = true;
    heardRoot = heardEl;
    var finalText = "";
    rec.onresult = function (event) {
      var text = "";
      for (var i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText = text;
      }
      heardEl.textContent = "Ich höre: " + text;
    };
    rec.onerror = function () {
      heardEl.textContent = "Das Mikrofon hat nicht geklappt. Hör noch einmal zu und sprich laut.";
    };
    rec.onend = function () {
      if (recognition !== rec) return;
      recognition = null;
      if (!finalText) return;
      var match = C.speechMatch(say, finalText);
      if (match.pass) {
        heardEl.textContent = "Das klingt nach dem Satz.";
        if (!done["mic-" + id]) {
          done["mic-" + id] = "spoke";
          stars += 1;
          save();
          renderScore();
          burstConfetti(20);
        }
      } else {
        heardEl.textContent = "Ich habe gehört: " + finalText + ". Nochmal, langsam.";
        speak(say, 0.72);
      }
    };
    try { rec.start(); } catch (e) {
      heardEl.textContent = "Das Mikrofon ist gerade belegt.";
    }
  }

  function resultBox(id, ok, say) {
    var box = el("div", { class: "result " + (ok ? "ok" : "bad") });
    box.appendChild(el("p", { class: "msg", text: ok ? "Richtig." : "Lösung:" }));
    box.appendChild(el("p", { class: "sol", lang: "fr", text: say }));
    var row = el("div", { class: "row" });
    row.appendChild(el("button", { type: "button", class: "btn soft", "data-act": "hear", "data-say": say, text: "Anhören" }));
    row.appendChild(el("button", { type: "button", class: "btn ghost", "data-act": "slow", "data-say": say, text: "Langsam" }));
    if (SpeechRec) {
      row.appendChild(el("button", { type: "button", class: "btn primary mic-btn", "data-act": "mic", "data-say": say, "data-id": id, text: "Nachsprechen" }));
    }
    box.appendChild(row);
    var heard = el("p", { class: "heard", "data-heard": id });
    box.appendChild(heard);
    return box;
  }

  function lockCard(card, ok, say, id) {
    card.querySelectorAll("input, textarea, select").forEach(function (field) {
      field.disabled = true;
      if (field.classList) field.classList.add(ok ? "good" : "bad");
    });
    var old = card.querySelector(".result");
    if (old) old.remove();
    card.appendChild(resultBox(id, ok, say));
    var btn = card.querySelector("[data-act='check']");
    if (btn) btn.disabled = true;
    speak(say, 0.92);
    if (ok && !done[id]) {
      done[id] = "ok";
      stars += 1;
      save();
      renderScore();
      burstConfetti(28);
      var fox = $("homeFox");
      if (fox) {
        fox.classList.remove("sad");
        fox.classList.add("happy");
      }
    }
  }

  function valuesOf(card) {
    var parts = [];
    card.querySelectorAll("[data-field]").forEach(function (field) {
      parts.push(field.value);
    });
    return parts.join(" ");
  }

  function renderParler(root) {
    C.PARLER.forEach(function (item) {
      var card = el("article", { class: "card", "data-id": item.id, "data-kind": "parler" });
      card.appendChild(el("p", { class: "de", text: item.n + ". " + item.de }));
      card.appendChild(el("p", { class: "frame", lang: "fr", text: item.frame }));
      item.fields.forEach(function (field) {
        if (field.label) card.appendChild(el("p", { class: "field-label", text: field.label }));
        card.appendChild(el("input", {
          type: "text",
          "data-field": field.key,
          lang: "fr",
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: "false",
          "aria-label": item.de,
        }));
      });
      card.appendChild(el("div", { class: "row" }, [
        el("button", { type: "button", class: "btn primary check", "data-act": "check", text: "Prüfen" }),
      ]));
      root.appendChild(card);
    });
  }

  function renderVocab(root) {
    C.VOCAB.forEach(function (item) {
      if (item.example) {
        var ex = el("p", { class: "fr-line", lang: "fr" });
        ex.appendChild(document.createTextNode(item.before));
        ex.appendChild(el("strong", { text: item.answer }));
        ex.appendChild(document.createTextNode(item.after));
        root.appendChild(ex);
        root.appendChild(el("div", { class: "row" }, [
          el("button", { type: "button", class: "btn soft", "data-act": "hear", "data-say": item.say, text: "Beispiel anhören" }),
        ]));
        return;
      }
      var card = el("article", { class: "card", "data-id": item.id, "data-kind": "word" });
      var line = el("p", { class: "fr-line", lang: "fr" });
      line.appendChild(document.createTextNode(item.before));
      line.appendChild(el("input", {
        type: "text",
        class: "inline-input",
        "data-field": "a",
        lang: "fr",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": item.before,
      }));
      line.appendChild(document.createTextNode(item.after));
      card.appendChild(line);
      card.appendChild(el("div", { class: "row" }, [
        el("button", { type: "button", class: "btn primary check", "data-act": "check", text: "Prüfen" }),
      ]));
      root.appendChild(card);
    });
  }

  function renderOrder(root) {
    root.appendChild(el("p", { class: "rule", text: "Denkt daran: à + le → au, à + les → aux!" }));
    var tools = el("div", { class: "prep-row" });
    C.PREPS.forEach(function (prep) {
      tools.appendChild(el("button", { type: "button", "data-act": "prep", "data-prep": prep, text: prep }));
    });
    root.appendChild(el("p", { class: "field-label", text: "Tippe ein Kärtchen in den Satz. Für das ? nimm à, à l', au oder aux. Das Verb kommt in die richtige Form, wie im Beispiel." }));
    root.appendChild(tools);

    C.ORDER.forEach(function (item) {
      if (item.example) {
        var ex = el("article", { class: "card" });
        ex.appendChild(el("p", { class: "de", text: "Beispiel " + item.n }));
        var chips = el("div", { class: "chips" });
        item.chips.forEach(function (chip) {
          chips.appendChild(el("span", { class: "chip", text: chip }));
        });
        ex.appendChild(chips);
        ex.appendChild(el("p", { class: "sol", lang: "fr", text: item.say }));
        ex.appendChild(el("div", { class: "row" }, [
          el("button", { type: "button", class: "btn soft", "data-act": "hear", "data-say": item.say, text: "Anhören" }),
        ]));
        root.appendChild(ex);
        return;
      }
      var card = el("article", { class: "card", "data-id": item.id, "data-kind": "order" });
      card.appendChild(el("p", { class: "de", text: item.n + "." }));
      var chipRow = el("div", { class: "chips" });
      item.chips.forEach(function (chip) {
        var cls = "chip";
        if (chip.t.charAt(0) === "?") cls += " prep";
        else if (/er$/.test(chip.t)) cls += " verb";
        else cls += " obj";
        chipRow.appendChild(el("button", { type: "button", class: cls, "data-act": "insert", "data-insert": chip.insert, text: chip.t }));
      });
      card.appendChild(chipRow);
      var prepRow = el("div", { class: "prep-row" });
      C.PREPS.forEach(function (prep) {
        prepRow.appendChild(el("button", { type: "button", "data-act": "prep", "data-prep": prep, text: prep }));
      });
      card.appendChild(prepRow);
      card.appendChild(el("textarea", {
        "data-field": "a",
        lang: "fr",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": "Satz " + item.n,
        placeholder: "Schreib den Satz hier.",
      }));
      card.appendChild(el("div", { class: "row" }, [
        el("button", { type: "button", class: "btn primary check", "data-act": "check", text: "Prüfen" }),
      ]));
      root.appendChild(card);
    });
  }

  function renderLire(root) {
    var bank = el("div", { class: "bank" });
    C.LIRE_BANK.forEach(function (word) {
      bank.appendChild(el("button", { type: "button", "data-act": "bank", "data-insert": word, text: word }));
    });
    root.appendChild(el("p", { class: "field-label", text: "Wortkasten. Tipp ein Wort in die Lücke, dann die richtige Form." }));
    root.appendChild(bank);
    var passage = el("div", { class: "passage", lang: "fr", id: "passage" });
    C.LIRE.forEach(function (part) {
      if (part.br) {
        passage.appendChild(el("br"));
        return;
      }
      if (part.t) {
        passage.appendChild(document.createTextNode(part.t));
        return;
      }
      passage.appendChild(el("input", {
        type: "text",
        class: "inline-input",
        "data-blank": part.id,
        "data-answer": part.answer,
        size: String(part.size || 8),
        lang: "fr",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": "Lücke",
      }));
    });
    root.appendChild(passage);
    root.appendChild(el("div", { class: "row" }, [
      el("button", { type: "button", class: "btn primary check", "data-act": "check-lire", text: "Text prüfen" }),
      el("button", { type: "button", class: "btn soft", "data-act": "lire-hear", text: "Text anhören" }),
    ]));
    root.appendChild(el("div", { id: "lire-result" }));
  }

  function renderObjects(root) {
    root.appendChild(el("p", { class: "fr-line", lang: "fr", text: "Aujourd'hui, Lola montre la ville à son amie." }));
    root.appendChild(el("p", { class: "instr", text: "Satzstellung: Subjekt – Verb – Objekt (direkt vor indirekt)." }));
    var card = el("article", { class: "card", "data-id": "obj", "data-kind": "obj" });
    function pick(bit, label) {
      var wrap = el("div", { class: "pick" });
      wrap.appendChild(el("span", { lang: "fr", text: label }));
      var select = el("select", { "data-bit": bit, "aria-label": label });
      select.appendChild(el("option", { value: "", text: "was ist das?" }));
      select.appendChild(el("option", { value: "dir", text: "direktes Objekt" }));
      select.appendChild(el("option", { value: "ind", text: "indirektes Objekt" }));
      wrap.appendChild(select);
      return wrap;
    }
    card.appendChild(pick("ville", "la ville"));
    card.appendChild(pick("amie", "à son amie"));
    card.appendChild(el("div", { class: "row" }, [
      el("button", { type: "button", class: "btn primary check", "data-act": "check", text: "Prüfen" }),
    ]));
    root.appendChild(card);
    root.appendChild(el("p", { class: "instr", text: "Lerne die Verben mit ihren Ergänzungen: aider qn · proposer qc à qn · montrer qc à qn." }));
    C.LINES.filter(function (line) { return line.id.indexOf("s19") === 0; }).forEach(function (line) {
      root.appendChild(speakLine(line));
    });
  }

  function renderAdj(root) {
    root.appendChild(el("p", { class: "instr", text: "Die meisten Adjektive stehen nach dem Nomen. Nur wenige stehen davor: joli, petit, grand, bon, mauvais." }));
    root.appendChild(el("ul", { class: "before-list" }, [
      el("li", { text: "joli / jolie  — hübsch" }),
      el("li", { text: "petit / petite  — klein" }),
      el("li", { text: "grand / grande  — groß" }),
      el("li", { text: "bon / bonne  — gut" }),
      el("li", { text: "mauvais / mauvaise  — schlecht" }),
    ]));
    C.LINES.filter(function (line) { return line.id.indexOf("s20") === 0; }).forEach(function (line) {
      root.appendChild(speakLine(line));
    });
    var card = el("article", { class: "card", id: "adj-card", "data-kind": "table" });
    var table = el("table", { class: "table" });
    table.appendChild(el("tr", {}, [
      el("th", { text: "" }),
      el("th", { text: "" }),
      el("th", { text: "content" }),
    ]));
    C.ADJ.forEach(function (row) {
      table.appendChild(el("tr", {}, [
        el("td", { text: row.label }),
        el("td", { lang: "fr", text: row.who }),
        el("td", {}, [el("input", {
          type: "text",
          "data-blank": row.id,
          "data-answer": row.answer,
          lang: "fr",
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: "false",
          "aria-label": row.who,
        })]),
      ]));
    });
    card.appendChild(table);
    card.appendChild(el("div", { class: "row" }, [
      el("button", { type: "button", class: "btn primary check", "data-act": "check-table", text: "Tabelle prüfen" }),
    ]));
    card.appendChild(el("div", { class: "table-result" }));
    root.appendChild(card);
  }

  function renderVoir(root) {
    var card = el("article", { class: "card", id: "voir-card", "data-kind": "table" });
    var table = el("table", { class: "table" });
    C.VOIR.forEach(function (row) {
      table.appendChild(el("tr", {}, [
        el("td", { lang: "fr", text: row.who }),
        el("td", {}, [el("input", {
          type: "text",
          "data-blank": row.id,
          "data-answer": row.answer,
          lang: "fr",
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: "false",
          "aria-label": row.who,
        })]),
      ]));
    });
    card.appendChild(table);
    card.appendChild(el("div", { class: "row" }, [
      el("button", { type: "button", class: "btn primary check", "data-act": "check-table", text: "Tabelle prüfen" }),
    ]));
    card.appendChild(el("div", { class: "table-result" }));
    root.appendChild(card);
    C.LINES.filter(function (line) { return line.id.indexOf("s21") === 0; }).forEach(function (line) {
      root.appendChild(speakLine(line));
    });
  }

  function speakLine(line) {
    var card = el("article", { class: "card" });
    card.appendChild(el("p", { class: "field-label", text: line.de }));
    card.appendChild(el("p", { class: "sol", lang: "fr", text: line.say }));
    var row = el("div", { class: "row" });
    row.appendChild(el("button", { type: "button", class: "btn soft", "data-act": "hear", "data-say": line.say, text: "Anhören" }));
    row.appendChild(el("button", { type: "button", class: "btn ghost", "data-act": "slow", "data-say": line.say, text: "Langsam" }));
    if (SpeechRec) row.appendChild(el("button", { type: "button", class: "btn primary mic-btn", "data-act": "mic", "data-say": line.say, "data-id": line.id, text: "Nachsprechen" }));
    card.appendChild(row);
    card.appendChild(el("p", { class: "heard", "data-heard": line.id }));
    return card;
  }

  function section(id, kicker, title, instr) {
    var box = el("section", { class: "block", id: id });
    box.appendChild(el("p", { class: "kicker", text: kicker }));
    box.appendChild(el("h2", { text: title }));
    if (instr) box.appendChild(el("p", { class: "instr", text: instr }));
    return box;
  }

  function build() {
    var sheet = $("sheet");
    var parler = section("sec-parler", "Bilan", "1 Parler", "Du kannst jetzt schon …");
    renderParler(parler);
    var vocab = section("sec-vocab", "Bilan", "2 Vocabulaire", "Complétez les phrases avec les bons mots.");
    renderVocab(vocab);
    var ordre = section("sec-ordre", "Bilan · G 19", "3 Grammaire et écrire", "Mettez les verbes et les compléments dans le bon ordre. Écrivez les phrases dans votre cahier.");
    renderOrder(ordre);
    var lire = section("sec-lire", "Bilan · G 20", "4 Lire et écrire", "Complétez le texte avec les bons mots. Mettez les verbes et les adjectifs à la bonne forme.");
    renderLire(lire);
    var obj = section("sec-obj", "Grammaire 19", "Lola montre la ville à son amie", "Direktes und indirektes Objekt.");
    renderObjects(obj);
    var adj = section("sec-adj", "Grammaire 20", "Ils sont contents", "Das Adjektiv.");
    renderAdj(adj);
    var voir = section("sec-voir", "Grammaire 21", "Je vois …", "Das Verb voir (sehen).");
    renderVoir(voir);
    [parler, vocab, ordre, lire, obj, adj, voir].forEach(function (node) { sheet.appendChild(node); });
  }

  function checkCard(card) {
    var id = card.getAttribute("data-id");
    var kind = card.getAttribute("data-kind");
    var text = valuesOf(card);
    var ok = false;
    var say = "";
    if (kind === "parler") {
      var item = C.PARLER.filter(function (row) { return row.id === id; })[0];
      ok = C.checkParler(id, text);
      say = item.say;
    } else if (kind === "word") {
      var word = C.VOCAB.filter(function (row) { return row.id === id; })[0];
      ok = C.same(word.answer, text);
      say = word.say;
    } else if (kind === "order") {
      var order = C.ORDER.filter(function (row) { return row.id === id; })[0];
      ok = C.same(order.say, text);
      say = order.say;
    } else if (kind === "obj") {
      var ville = card.querySelector("[data-bit='ville']").value;
      var amie = card.querySelector("[data-bit='amie']").value;
      ok = ville === "dir" && amie === "ind";
      say = "Aujourd'hui, Lola montre la ville à son amie.";
    }
    lockCard(card, ok, say, id);
  }

  function checkTable(card) {
    var inputs = card.querySelectorAll("[data-blank]");
    var says = [];
    inputs.forEach(function (input) {
      if (input.disabled) return;
      var answer = input.getAttribute("data-answer");
      var id = input.getAttribute("data-blank");
      var ok = C.same(answer, input.value);
      input.disabled = true;
      input.classList.add(ok ? "good" : "bad");
      if (!ok) input.value = answer;
      says.push(input.closest("tr").querySelector("td[lang], td:nth-child(2)").textContent + " " + answer);
      if (ok && !done[id]) {
        done[id] = "ok";
        stars += 1;
      }
    });
    save();
    renderScore();
    var box = card.querySelector(".table-result");
    box.innerHTML = "";
    box.appendChild(el("div", { class: "result ok" }, [
      el("p", { class: "msg", text: "So heißen die Formen." }),
      el("button", { type: "button", class: "btn soft", "data-act": "hear-lines", text: "Anhören" }),
    ]));
    box.querySelector("button").addEventListener("click", function () {
      speakLines(says.map(function (line) { return line.trim(); }), 0.88);
    });
    var btn = card.querySelector("[data-act='check-table']");
    if (btn) btn.disabled = true;
    speakLines(says, 0.88);
  }

  function checkLire() {
    var inputs = document.querySelectorAll("#passage [data-blank]");
    inputs.forEach(function (input) {
      if (input.disabled) return;
      if (!foldish(input.value)) return;
      var ok = C.same(input.getAttribute("data-answer"), input.value);
      input.disabled = true;
      input.classList.add(ok ? "good" : "bad");
      if (!ok) input.value = input.getAttribute("data-answer");
      var id = input.getAttribute("data-blank");
      if (ok && !done[id]) {
        done[id] = "ok";
        stars += 1;
      }
    });
    save();
    renderScore();
  }

  function foldish(value) {
    return String(value || "").trim().length > 0;
  }

  function insertAt(field, text) {
    if (!field) return;
    var glue = field.value && !/\s$/.test(field.value) && !/'$/.test(text) && !/l'$/.test(text) ? " " : "";
    if (/l'$/.test(text)) glue = field.value && !/\s$/.test(field.value) ? " " : "";
    field.value = field.value + glue + text;
    if (/l'$/.test(text)) field.value = field.value.replace(/\s+$/, "");
    field.focus();
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    if (act === "hear") {
      speak(btn.getAttribute("data-say"), 0.92);
      return;
    }
    if (act === "slow") {
      speak(btn.getAttribute("data-say"), 0.72);
      return;
    }
    if (act === "mic") {
      var heard = btn.parentNode.parentNode.querySelector("[data-heard]") || btn.closest("article").querySelector(".heard");
      listen(btn.getAttribute("data-say"), heard, btn.getAttribute("data-id") || "line");
      return;
    }
    if (act === "lire-hear") {
      speakLines(C.LIRE_SAY, 0.9);
      return;
    }
    if (act === "check") {
      checkCard(btn.closest("article"));
      return;
    }
    if (act === "check-table") {
      checkTable(btn.closest("article"));
      return;
    }
    if (act === "check-lire") {
      checkLire();
      return;
    }
    if (act === "insert") {
      var area = btn.closest("article").querySelector("textarea");
      insertAt(area, btn.getAttribute("data-insert"));
      return;
    }
    if (act === "prep") {
      var card = btn.closest("article");
      var target = card ? card.querySelector("textarea") : document.activeElement;
      if (!target || target.tagName !== "TEXTAREA") {
        target = document.querySelector("#sec-ordre textarea");
      }
      insertAt(target, btn.getAttribute("data-prep"));
      return;
    }
    if (act === "bank") {
      var blank = document.activeElement && document.activeElement.getAttribute("data-blank")
        ? document.activeElement
        : document.querySelector("#passage [data-blank]:not([disabled])");
      if (blank) {
        blank.value = btn.getAttribute("data-insert");
        blank.focus();
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || event.target.tagName === "TEXTAREA") return;
    var card = event.target.closest && event.target.closest("article");
    if (!card) return;
    var btn = card.querySelector("[data-act='check'], [data-act='check-table']");
    if (btn && !btn.disabled) {
      event.preventDefault();
      btn.click();
    }
  });

  $("btnSound").addEventListener("click", function () {
    soundOn = !soundOn;
    $("btnSound").setAttribute("aria-pressed", soundOn ? "true" : "false");
    $("btnSound").textContent = soundOn ? "Sound an" : "Sound aus";
    if (!soundOn && window.speechSynthesis) window.speechSynthesis.cancel();
  });

  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener("voiceschanged", function () {});
  }

  var confettiBits = [];
  var confettiRaf = 0;
  var confettiCtx = $("confetti").getContext("2d");

  function burstConfetti(amount) {
    var canvas = $("confetti");
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    confettiCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    var colors = ["#ff7a8a", "#ff9b6a", "#5ecfb8", "#7ec8e8", "#f0a53a", "#fff"];
    for (var i = 0; i < amount; i++) {
      confettiBits.push({
        x: Math.random() * window.innerWidth,
        y: -10,
        w: 6,
        h: 8,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 3,
        rot: 0,
        vr: 0.1,
        color: colors[i % colors.length],
        life: 60,
      });
    }
    if (!confettiRaf) confettiRaf = requestAnimationFrame(tick);
  }

  function tick() {
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiBits = confettiBits.filter(function (p) { return p.life > 0; });
    confettiBits.forEach(function (p) {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.globalAlpha = Math.max(0, p.life / 40);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-3, -4, p.w, p.h);
      confettiCtx.restore();
    });
    if (confettiBits.length) confettiRaf = requestAnimationFrame(tick);
    else confettiRaf = 0;
  }

  build();
  renderScore();
})();
