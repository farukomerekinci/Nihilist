/* Nihilist Penguen - oyun mantigi
   Kural: azinlikta kalan oyuncular, cogunlukta kalan oyuncu sayisi kadar puan alir.
   Esitlik ya da ittifak varsa kimse puan alamaz.
   Hedef puana ulasan ilk oyuncu oyunu kazanir. */
(function () {
  "use strict";

  var MIN_PLAYERS = 3;
  var MAX_PLAYERS = 8;
  var COLORS = ["#F0912F", "#63D3B0", "#FF7A7A", "#7BB8FF", "#F5D66B", "#C08BFF", "#7ED957", "#FF9FD2"];
  var STORE_KEY = "nihilist-penguen/setup";

  var $ = function (id) { return document.getElementById(id); };

  var state = {
    players: [],      // { name, color, score }
    target: 15,       // hedef puan
    round: 0,         // tamamlanan tur sayisi
    deck: [],
    deckIndex: 0,
    question: null,
    order: [],        // bu turda oy verme sirasi (oyuncu indeksleri)
    turn: 0,
    votes: {},        // oyuncuIndex -> 1 | 2
    lastGain: {}
  };

  /* ---------------------------------------------------- yardimcilar */
  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function show(screenId) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove("is-active");
    $(screenId).classList.add("is-active");
    window.scrollTo(0, 0);
  }

  function dot(color) {
    var s = document.createElement("span");
    s.className = "player__dot";
    s.style.background = color;
    return s;
  }

  function saveSetup() {
    try {
      var names = [];
      var inputs = document.querySelectorAll("#player-list input");
      for (var i = 0; i < inputs.length; i++) names.push(inputs[i].value);
      localStorage.setItem(STORE_KEY, JSON.stringify({ names: names, target: state.target }));
    } catch (e) { /* depolama kapali olabilir */ }
  }

  function loadSetup() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.names)) return null;
      return data;
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------- kurulum ekrani */
  function playerRow(index, value) {
    var li = document.createElement("li");
    li.className = "player";

    li.appendChild(dot(COLORS[index % COLORS.length]));

    var input = document.createElement("input");
    input.type = "text";
    input.maxLength = 16;
    input.placeholder = index + 1 + ". oyuncu";
    input.value = value || "";
    input.setAttribute("aria-label", index + 1 + ". oyuncunun adı");
    input.addEventListener("input", saveSetup);
    li.appendChild(input);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "player__remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Oyuncuyu çıkar");
    remove.addEventListener("click", function () {
      li.remove();
      renumberPlayers();
      saveSetup();
    });
    li.appendChild(remove);

    return li;
  }

  function renumberPlayers() {
    var rows = document.querySelectorAll("#player-list .player");
    for (var i = 0; i < rows.length; i++) {
      rows[i].querySelector(".player__dot").style.background = COLORS[i % COLORS.length];
      var input = rows[i].querySelector("input");
      input.placeholder = i + 1 + ". oyuncu";
      input.setAttribute("aria-label", i + 1 + ". oyuncunun adı");
      rows[i].querySelector(".player__remove").disabled = rows.length <= MIN_PLAYERS;
    }
    $("add-player").disabled = rows.length >= MAX_PLAYERS;
    $("player-count-hint").textContent = rows.length + " / " + MAX_PLAYERS + " oyuncu";
  }

  function addPlayer(value) {
    var list = $("player-list");
    if (list.children.length >= MAX_PLAYERS) return;
    list.appendChild(playerRow(list.children.length, value));
    renumberPlayers();
  }

  function buildSetup() {
    var saved = loadSetup();
    var names = (saved && saved.names.length >= MIN_PLAYERS) ? saved.names.slice(0, MAX_PLAYERS) : ["", "", ""];
    $("player-list").innerHTML = "";
    for (var i = 0; i < names.length; i++) addPlayer(names[i]);

    if (saved && saved.target) setTarget(saved.target);
  }

  function setTarget(n) {
    state.target = n;
    var chips = document.querySelectorAll("#target-chips .chip");
    for (var i = 0; i < chips.length; i++) {
      var on = Number(chips[i].dataset.target) === n;
      chips[i].classList.toggle("is-on", on);
      chips[i].setAttribute("aria-checked", on ? "true" : "false");
    }
  }

  /* ---------------------------------------------------- oyun akisi */
  function startGame() {
    var inputs = document.querySelectorAll("#player-list input");
    var players = [];
    for (var i = 0; i < inputs.length; i++) {
      var name = inputs[i].value.trim() || i + 1 + ". oyuncu";
      players.push({ name: name, color: COLORS[i % COLORS.length], score: 0 });
    }

    var error = $("setup-error");
    if (players.length < MIN_PLAYERS) {
      error.textContent = "En az " + MIN_PLAYERS + " oyuncu gerekli.";
      error.hidden = false;
      return;
    }
    error.hidden = true;

    state.players = players;
    state.round = 0;
    state.deck = shuffle(QUESTIONS);
    state.deckIndex = 0;
    saveSetup();
    nextRound();
  }

  function drawQuestion() {
    if (state.deckIndex >= state.deck.length) {
      state.deck = shuffle(QUESTIONS);
      state.deckIndex = 0;
    }
    return state.deck[state.deckIndex++];
  }

  function nextRound() {
    state.question = drawQuestion();
    state.votes = {};
    state.turn = 0;
    state.order = shuffle(state.players.map(function (_, i) { return i; }));

    $("round-eyebrow").textContent = "Tur " + (state.round + 1) + " · hedef " + state.target + " puan";
    $("round-question").textContent = state.question.q;
    $("round-opt1").textContent = state.question.a;
    $("round-opt2").textContent = state.question.b;
    show("screen-round");
  }

  function showHandoff() {
    if (state.turn >= state.order.length) { reveal(); return; }
    var player = state.players[state.order[state.turn]];
    $("handoff-name").textContent = player.name;
    $("handoff-name").style.color = player.color;
    $("handoff").hidden = false;
    $("voting").hidden = true;
    show("screen-vote");
  }

  function showVoting() {
    var player = state.players[state.order[state.turn]];
    $("vote-name").textContent = player.name;
    $("vote-question").textContent = state.question.q;
    $("vote-opt1").textContent = state.question.a;
    $("vote-opt2").textContent = state.question.b;
    $("vote-progress").textContent = (state.turn + 1) + " / " + state.order.length + " oyuncu";
    $("handoff").hidden = true;
    $("voting").hidden = false;
  }

  function castVote(choice) {
    state.votes[state.order[state.turn]] = choice;
    state.turn++;
    showHandoff();
  }

  function reveal() {
    var side1 = [], side2 = [];
    for (var i = 0; i < state.players.length; i++) {
      (state.votes[i] === 1 ? side1 : side2).push(i);
    }

    // Azinlikta kalanlar, cogunluktaki oyuncu sayisi kadar puan alir.
    // Esitlik ya da ittifak varsa kimse puan alamaz.
    var winners = [], award = 0;
    if (side1.length !== side2.length && side1.length > 0 && side2.length > 0) {
      var minorityIsOne = side1.length < side2.length;
      winners = minorityIsOne ? side1 : side2;
      award = minorityIsOne ? side2.length : side1.length;
    }

    state.lastGain = {};
    for (var w = 0; w < winners.length; w++) {
      state.players[winners[w]].score += award;
      state.lastGain[winners[w]] = award;
    }

    var verdict, sub;
    if (side1.length === 0 || side2.length === 0) {
      verdict = "Herkes aynı yeri seçti.";
      sub = "Sürü psikolojisi kazandı, kimse puan alamadı.";
    } else if (side1.length === side2.length) {
      verdict = "Tam ortadan ikiye bölündünüz.";
      sub = "Beraberlikte kimse puan alamaz.";
    } else {
      var winningChoice = side1.length < side2.length ? 1 : 2;
      verdict = "Azınlık " + winningChoice + ". seçenek.";
      sub = winners.length + " oyuncu azınlıkta kaldı, her biri " + award + " puan aldı.";
    }
    $("reveal-verdict").textContent = verdict;
    $("reveal-sub").textContent = sub;

    $("tally-opt1").textContent = state.question.a;
    $("tally-opt2").textContent = state.question.b;
    fillTally($("tally-1"), $("tally-names1"), side1, winners);
    fillTally($("tally-2"), $("tally-names2"), side2, winners);

    state.round++;
    show("screen-reveal");
  }

  function fillTally(sideEl, listEl, indexes, winners) {
    var isWin = indexes.length > 0 && winners.indexOf(indexes[0]) !== -1;
    sideEl.classList.toggle("is-win", isWin);
    sideEl.classList.toggle("is-lose", indexes.length > 0 && !isWin);

    listEl.innerHTML = "";
    if (indexes.length === 0) {
      var empty = document.createElement("li");
      empty.className = "is-empty";
      empty.textContent = "kimse seçmedi";
      listEl.appendChild(empty);
      return;
    }
    for (var i = 0; i < indexes.length; i++) {
      var player = state.players[indexes[i]];
      var li = document.createElement("li");
      li.appendChild(dot(player.color));
      var name = document.createElement("span");
      name.textContent = player.name;
      li.appendChild(name);
      if (isWin) {
        var pt = document.createElement("span");
        pt.className = "pt";
        pt.textContent = "+" + state.lastGain[indexes[i]];
        li.appendChild(pt);
      }
      listEl.appendChild(li);
    }
  }

  function showScore() {
    var ranked = state.players.map(function (p, i) { return { player: p, index: i }; })
      .sort(function (x, y) { return y.player.score - x.player.score; });
    var top = ranked.length ? ranked[0].player.score : 0;
    var finished = top >= state.target;

    var board = $("scoreboard");
    board.innerHTML = "";
    for (var i = 0; i < ranked.length; i++) {
      var entry = ranked[i];
      var li = document.createElement("li");
      if (finished && entry.player.score === top && top > 0) li.classList.add("is-leader");

      var rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = i + 1 + ".";
      li.appendChild(rank);
      li.appendChild(dot(entry.player.color));

      var name = document.createElement("span");
      name.className = "name";
      name.textContent = entry.player.name;
      li.appendChild(name);

      if (state.lastGain[entry.index]) {
        var gain = document.createElement("span");
        gain.className = "gain";
        gain.textContent = "+" + state.lastGain[entry.index];
        li.appendChild(gain);
      }

      var pts = document.createElement("span");
      pts.className = "pts";
      pts.textContent = entry.player.score;
      li.appendChild(pts);
      board.appendChild(li);
    }

    if (finished) {
      var champs = ranked.filter(function (e) { return e.player.score === top; });
      $("score-eyebrow").textContent = "Oyun bitti";
      $("score-title").textContent = champs.length > 1
        ? "Berabere: " + champs.map(function (e) { return e.player.name; }).join(", ")
        : "Kazanan: " + champs[0].player.name;
      $("score-continue").textContent = "Yeniden oyna";
    } else {
      $("score-eyebrow").textContent = "Tur " + state.round + " bitti · hedef " + state.target + " puan";
      $("score-title").textContent = "Puan durumu";
      $("score-continue").textContent = "Sonraki tur";
    }
    show("screen-score");
  }

  function continueFromScore() {
    var reached = state.players.some(function (p) { return p.score >= state.target; });
    if (reached) {
      for (var i = 0; i < state.players.length; i++) state.players[i].score = 0;
      state.round = 0;
      state.lastGain = {};
    }
    nextRound();
  }

  /* ---------------------------------------------------- olaylar */
  function bind() {
    $("add-player").addEventListener("click", function () { addPlayer(""); saveSetup(); });
    $("start-game").addEventListener("click", startGame);
    $("begin-voting").addEventListener("click", showHandoff);
    $("handoff-ready").addEventListener("click", showVoting);
    $("next-round").addEventListener("click", showScore);
    $("score-continue").addEventListener("click", continueFromScore);
    $("restart").addEventListener("click", function () { show("screen-setup"); });

    var chips = document.querySelectorAll("#target-chips .chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function (e) {
        setTarget(Number(e.currentTarget.dataset.target));
        saveSetup();
      });
    }

    var votes = document.querySelectorAll(".vote");
    for (var v = 0; v < votes.length; v++) {
      votes[v].addEventListener("click", function (e) {
        castVote(Number(e.currentTarget.dataset.choice));
      });
    }

    $("show-rules").addEventListener("click", function () { $("rules-sheet").hidden = false; });
    $("close-rules").addEventListener("click", function () { $("rules-sheet").hidden = true; });
    $("rules-sheet").addEventListener("click", function (e) {
      if (e.target === $("rules-sheet")) $("rules-sheet").hidden = true;
    });
  }

  buildSetup();
  bind();
})();
