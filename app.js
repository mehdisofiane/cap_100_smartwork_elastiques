/* Cap 110 · Élastiques — application. Rien n'est enregistré : tout vit en mémoire et disparaît à la fermeture. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const fmt = n => Math.round(n).toLocaleString("fr-FR");
  const mmss = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), r = s % 60; return m ? `${m}:${String(r).padStart(2, "0")}` : `${r}`; };
  const mins = s => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };
  const NIV = n => n === 1 ? "Facile" : n === 2 ? "Moyen" : n === 3 ? "Difficile" : "Tous niveaux";
  const CATN = Object.fromEntries(CATS.map(c => [c.k, c.nom]));
  const kgOf = ex => ex.kg;
  const matTxt = ex => ex.mat.filter(m => !["chaise", "table", "mur", "tapis"].includes(m) || ex.mat.length === 1).map(m => MAT[m]).join(", ") || "Élastique seul";
  const support = ex => ex.mat.filter(m => ["chaise", "table", "mur", "tapis"].includes(m)).map(m => MAT[m].toLowerCase());
  const I = {
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M6 6l8 6-8 6zM17 6v12"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M18 6l-8 6 8 6zM7 6v12"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9.5h4L13 5v14l-5-4.5H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    voice: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  };
  const toast = msg => { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 2600); };

  const state = { tab: "exercices", niv: 0, cat: "all", q: "", pos: new Set(), mat: new Set(), poids: 150, week: 1 };

  /* ---------- animations visibles uniquement quand elles sont à l'écran */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    for (const e of entries) FIG.setOn(e.target, e.isIntersecting);
  }, { rootMargin: "80px" }) : null;
  function animate(el, ex, opt = {}) {
    FIG.mount(el, ex, { fps: opt.fps || 24, on: !io, offset: opt.offset ?? Math.random() * 3, label: opt.label });
    if (io) io.observe(el);
  }

  /* ---------- onglets */
  const TABS = ["exercices", "programmes", "surmesure", "kit"];
  function goTab(t, scroll = true) {
    if (!TABS.includes(t)) t = "exercices";
    state.tab = t;
    TABS.forEach(k => { $("#v-" + k).hidden = k !== t; });
    $$(".tab-btn").forEach(b => b.setAttribute("aria-current", b.dataset.tab === t ? "page" : "false"));
    if (scroll) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    try { history.replaceState(null, "", "#" + t); } catch (e) { /* le cadre peut refuser */ }
  }
  $$(".tab-btn").forEach(b => b.addEventListener("click", () => goTab(b.dataset.tab)));
  $$("[data-goto]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); goTab(a.dataset.goto); }));

  /* ---------- héros */
  const HERO = ["squat-barre", "rowing-assis", "boxe-elastique", "elevations-laterales", "kickback-fessier", "bucheron-haut", "developpe-debout", "marche-laterale", "tirage-vertical-assis", "jumping-jack"];
  let heroI = 0, heroT = 0;
  function heroShow(i) {
    const ex = EXO[HERO[i % HERO.length]];
    const st = $("#heroStage");
    st.classList.add("swap");
    setTimeout(() => {
      FIG.mount(st, ex, { label: "Démonstration animée : " + ex.nom });
      st.classList.remove("swap");
      $("#heroName").textContent = ex.nom;
      const l = $("#heroLvl"); l.className = "lvl l" + ex.niv; l.textContent = NIV(ex.niv) + " · " + CATN[ex.cat];
    }, heroT ? 300 : 0);
    heroT = 1;
  }
  function heroLoop() {
    heroShow(heroI);
    const ex = EXO[HERO[heroI % HERO.length]];
    const d = Math.max(5.5, FIG.timeline(ex).total * 2.2) * 1000;
    clearTimeout(heroLoop.t);
    heroLoop.t = setTimeout(() => { heroI++; heroLoop(); }, d);
  }
  $("#heroSee").addEventListener("click", () => openExo(HERO[heroI % HERO.length]));
  const DAY = ["mobilite-1", "douceur-1", "abdos-1", "douceur-2", "express-1", "douceur-3", "assis-2"];
  $("#heroGo").addEventListener("click", () => openSession(findSeance(DAY[new Date().getDay()]), "Séance du jour"));

  /* ---------- exercices : filtres */
  const counts = c => EXOS.filter(e => c === "all" || e.cat === c).length;
  function renderCatChips() {
    const box = $("#catChips");
    box.innerHTML = [`<button class="chip" type="button" data-cat="all" aria-pressed="${state.cat === "all"}">Tout <span class="n">${EXOS.length}</span></button>`]
      .concat(CATS.map(c => `<button class="chip" type="button" data-cat="${c.k}" aria-pressed="${state.cat === c.k}">${esc(c.nom)} <span class="n">${counts(c.k)}</span></button>`)).join("");
  }
  $("#catChips").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; state.cat = b.dataset.cat; renderCatChips(); renderGrid(); });
  function renderFilterChips() {
    $("#posChips").innerHTML = Object.entries(POS).map(([k, v]) => `<button class="chip" type="button" data-pos="${k}" aria-pressed="${state.pos.has(k)}">${v}</button>`).join("");
    const mats = ["barre", "poignees", "porte", "sangles", "chaise", "aucun"];
    $("#matChips").innerHTML = mats.map(k => `<button class="chip" type="button" data-mat="${k}" aria-pressed="${state.mat.has(k)}">${MAT[k]}</button>`).join("");
    const n = state.pos.size + state.mat.size;
    $("#fCount").hidden = !n; $("#fCount").textContent = n;
  }
  $("#posChips").addEventListener("click", e => { const b = e.target.closest("[data-pos]"); if (!b) return; const k = b.dataset.pos; state.pos.has(k) ? state.pos.delete(k) : state.pos.add(k); renderFilterChips(); renderGrid(); });
  $("#matChips").addEventListener("click", e => { const b = e.target.closest("[data-mat]"); if (!b) return; const k = b.dataset.mat; state.mat.has(k) ? state.mat.delete(k) : state.mat.add(k); renderFilterChips(); renderGrid(); });
  $("#toggleFilters").addEventListener("click", () => { const f = $("#filters"); f.hidden = !f.hidden; $("#toggleFilters").setAttribute("aria-expanded", String(!f.hidden)); });
  $("#reset").addEventListener("click", () => { state.pos.clear(); state.mat.clear(); state.q = ""; $("#q").value = ""; state.cat = "all"; state.niv = 0; syncNiv(); renderCatChips(); renderFilterChips(); renderGrid(); });
  function syncNiv() { $$("#nivSeg button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.niv === state.niv))); }
  $("#nivSeg").addEventListener("click", e => { const b = e.target.closest("[data-niv]"); if (!b) return; state.niv = +b.dataset.niv; syncNiv(); renderGrid(); });
  let qT = 0;
  $("#q").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { state.q = e.target.value; renderGrid(); }, 120); });

  const hay = ex => norm([ex.nom, ex.zone, CATN[ex.cat], POS[ex.pos], ex.mat.map(m => MAT[m]).join(" "), NIV(ex.niv), ex.cue].join(" "));
  const HAY = new Map(EXOS.map(e => [e.id, hay(e)]));
  function filtered() {
    const words = norm(state.q).split(/\s+/).filter(Boolean);
    return EXOS.filter(e =>
      (state.cat === "all" || e.cat === state.cat) &&
      (!state.niv || e.niv === state.niv) &&
      (!state.pos.size || state.pos.has(e.pos)) &&
      (!state.mat.size || [...state.mat].every(m => e.mat.includes(m))) &&
      words.every(w => HAY.get(e.id).includes(w)));
  }
  function card(ex) {
    return `<article class="card"><div class="art" data-ex="${ex.id}"></div>
      <div class="body"><div class="fam"><span class="lvl l${ex.niv}">${NIV(ex.niv)}</span><span>${esc(CATN[ex.cat])}</span></div>
      <h3>${esc(ex.nom)}</h3>
      <div class="meta"><span>${POS[ex.pos]}</span><b>${esc(kgOf(ex))}</b></div></div>
      <button class="hit" type="button" data-open="${ex.id}" aria-label="Voir l'exercice : ${esc(ex.nom)}"></button></article>`;
  }
  function renderGrid() {
    const list = filtered();
    $("#rCount").textContent = `${list.length} exercice${list.length > 1 ? "s" : ""}`;
    const box = $("#groups");
    if (!list.length) {
      box.innerHTML = `<div class="empty"><b>Aucun exercice ne correspond.</b><span>Retire un filtre ou essaie un autre mot.</span><button class="btn ghost sm" type="button" id="emptyReset">Tout réinitialiser</button></div>`;
      $("#emptyReset").addEventListener("click", () => $("#reset").click());
      return;
    }
    const groups = NIVS.map(n => ({ ...n, items: list.filter(e => e.niv === n.n) })).filter(g => g.items.length);
    box.innerHTML = groups.map(g => `<section class="lgroup l${g.n}">
      <div class="lgroup-h"><h3><i class="bar"></i>${g.nom} <span class="n">${g.items.length}</span></h3><p>${esc(g.txt)}</p></div>
      <div class="grid">${g.items.map(card).join("")}</div></section>`).join("");
    $$(".art[data-ex]", box).forEach(el => animate(el, EXO[el.dataset.ex], { fps: 24 }));
  }
  $("#groups").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openExo(b.dataset.open); });

  /* ---------- panneau */
  let lastFocus = null;
  function openSheet(html, label) {
    lastFocus = document.activeElement;
    const sh = $("#sheet"), p = $("#sheetPanel");
    p.innerHTML = `<div class="sheet-top"><button class="round" type="button" data-close aria-label="Fermer">${I.close}</button></div>` + html;
    p.scrollTop = 0;
    sh.hidden = false;
    sh.setAttribute("aria-label", label || "Détail");
    document.body.classList.add("locked");
    setTimeout(() => { const b = $("[data-close]", p); if (b) b.focus(); }, 30);
  }
  function closeSheet() {
    const sh = $("#sheet"); if (sh.hidden) return;
    $$(".fxbox, .thumb, .art", sh).forEach(el => FIG.unmount(el));
    sh.hidden = true; $("#sheetPanel").innerHTML = "";
    if ($("#play").hidden) document.body.classList.remove("locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("#sheet").addEventListener("click", e => { if (e.target.id === "sheet" || e.target.closest("[data-close]")) closeSheet(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#play").hidden) closeSheet(); });

  /* ---------- fiche exercice */
  function openExo(id) {
    const ex = EXO[id];
    const sup = support(ex);
    const html = `<div class="sheet-art"><div class="fxbox" id="exoArt"></div>
      <div class="art-ctrl"><span class="resp-pill" id="respPill"></span>
      <div class="seg" role="group" aria-label="Vitesse" id="spdSeg"><button type="button" data-sp=".5" aria-pressed="false">Lent</button><button type="button" data-sp="1" aria-pressed="true">Normal</button></div></div></div>
      <div class="sheet-body">
        <div><div class="eyebrow">${esc(CATN[ex.cat])}</div><h2 id="sheetTitle">${esc(ex.nom)}</h2><p class="zone">${esc(ex.zone)}</p></div>
        <div class="facts">
          <div class="fact"><span>Niveau</span><b><i class="ldot l${ex.niv}"></i>${NIV(ex.niv)}</b></div>
          <div class="fact"><span>Position</span><b>${POS[ex.pos]}${sup.length ? ", " + esc(sup.join(", ")) : ""}</b></div>
          <div class="fact"><span>Matériel</span><b>${esc(matTxt(ex))}</b></div>
          <div class="fact"><span>Élastique conseillé</span><b>${esc(ex.kg)}</b></div>
        </div>
        ${ex.uni ? `<div class="note">${I.info}<span>Un côté à la fois. En chrono, la voix te dit de changer de côté à mi-temps.</span></div>` : ""}
        ${ex.statique ? `<div class="note">${I.info}<span>Position tenue : en chrono, garde la position tout le temps de l'effort.</span></div>` : ""}
        <div class="sec"><h3>Le geste</h3><ol class="steps">${ex.etapes.map(s => `<li><span>${esc(s)}</span></li>`).join("")}</ol></div>
        <div class="sec"><h3>À éviter</h3><ul class="errs">${ex.erreurs.map(s => `<li><span>${esc(s)}</span></li>`).join("")}</ul></div>
        <div class="vars"><div class="var e"><span>Plus facile</span><p>${esc(ex.plusFacile)}</p></div><div class="var h"><span>Plus dur</span><p>${esc(ex.plusDur)}</p></div></div>
        <div class="sheet-actions">
          <button class="btn hot" type="button" data-try="30">${I.go}En chrono : 3 × 30 s</button>
          <button class="btn ghost" type="button" data-try="45">4 × 45 s</button>
        </div>
      </div>`;
    openSheet(html, ex.nom);
    const pill = $("#respPill");
    const setPhase = ph => { const t = ex.resp[ph] || ex.resp[0]; pill.innerHTML = `<i>●</i>${esc(t)}`; pill.hidden = !t; };
    FIG.mount($("#exoArt"), ex, { label: "Démonstration animée : " + ex.nom, onPhase: setPhase });
    setPhase(0);
    $("#spdSeg").addEventListener("click", e => { const b = e.target.closest("[data-sp]"); if (!b) return; $$("#spdSeg button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); FIG.setSpeed($("#exoArt"), +b.dataset.sp); });
    $$("[data-try]").forEach(b => b.addEventListener("click", () => {
      const w = +b.dataset.try;
      const s = { id: "essai-" + ex.id, nom: ex.nom, niv: ex.niv, blocs: [C("Exercice", w, w === 30 ? 30 : 30, w === 30 ? 3 : 4, 30, [ex.id])] };
      closeSheet(); openPlayer(s);
    }));
  }

  /* ---------- séances */
  const findSeance = id => { for (const p of PROGS) for (const s of p.seances) if (s.id === id) return s; return null; };
  const exoCount = s => new Set(s.blocs.flatMap(b => b.exos)).size;
  function blocsHTML(s) {
    return s.blocs.map(b => `<div class="bloc"><div class="bloc-h"><b>${esc(b.nom)}</b><span>${b.w} s d'effort${b.r ? ` · ${b.r} s de repos` : ""} · ${b.tours} tour${b.tours > 1 ? "s" : ""}</span></div>
      <ul class="xlist">${b.exos.map(id => { const ex = EXO[id]; return `<li class="xi"><div class="thumb" data-ex="${id}"></div><div><b>${esc(ex.nom)}</b><span>${esc(ex.kg)}${ex.uni ? " · un côté puis l'autre" : ""}</span></div><button class="hit" type="button" data-open="${id}" aria-label="Voir ${esc(ex.nom)}"></button></li>`; }).join("")}</ul></div>`).join("");
  }
  function openSession(s, eyebrow) {
    let dr = 0;
    const segs = () => buildTimeline(s, { deltaRepos: dr });
    const html = `<div class="sheet-body" style="padding-top:22px">
      <div><div class="eyebrow">${esc(eyebrow || "Séance")}</div><h2 id="sheetTitle">${esc(s.nom)}</h2></div>
      <div class="gen-sum"><div class="kpis">
        <div class="kpi"><b id="sDur"></b><span>durée totale</span></div>
        <div class="kpi"><b>${exoCount(s)}</b><span>exercices</span></div>
        <div class="kpi"><b id="sKcal"></b><span>kcal estimées</span></div>
        <div class="kpi"><b><span class="badge l${s.niv}">${NIV(s.niv)}</span></b><span>niveau</span></div></div></div>
      <div class="actions" style="align-items:center">
        <div class="seg" role="group" aria-label="Repos" id="drSeg"><button type="button" data-dr="15" aria-pressed="false">Plus de repos</button><button type="button" data-dr="0" aria-pressed="true">Normal</button><button type="button" data-dr="-10" aria-pressed="false">Moins de repos</button></div>
        <label class="field-inline" for="poidsS">Ton poids <input id="poidsS" type="number" inputmode="numeric" min="40" max="300" value="${state.poids}"> kg</label>
      </div>
      ${blocsHTML(s)}
      <div class="sheet-actions"><button class="btn hot lg" type="button" id="sGo">${I.go}Lancer la séance</button></div>
      <p class="p-hint" style="color:var(--muted)">Le poids sert seulement à estimer les calories. Il n'est enregistré nulle part.</p>
    </div>`;
    openSheet(html, s.nom);
    const upd = () => { const t = segs(); $("#sDur").textContent = mins(totalSec(t)); $("#sKcal").textContent = "≈ " + fmt(kcalOf(t, state.poids)); };
    upd();
    $$("#sheetPanel .thumb[data-ex]").forEach(el => animate(el, EXO[el.dataset.ex], { fps: 20 }));
    $("#drSeg").addEventListener("click", e => { const b = e.target.closest("[data-dr]"); if (!b) return; dr = +b.dataset.dr; $$("#drSeg button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); upd(); });
    $("#poidsS").addEventListener("input", e => { const v = +e.target.value; if (v >= 40 && v <= 300) { state.poids = v; upd(); } });
    $("#sheetPanel").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) { openExo(b.dataset.open); } });
    $("#sGo").addEventListener("click", () => { closeSheet(); openPlayer(s, { deltaRepos: dr }); });
  }

  /* ---------- programmes */
  function renderPlan() {
    const box = $("#plan12");
    const w = state.week;
    const ph = PLAN12.phases.find(p => w >= p.de && w <= p.a);
    const [tw, tr, tt] = PLAN12.semaines[w - 1];
    box.innerHTML = `<div class="plan-head"><div class="eyebrow">Le programme principal</div><h3>Cap 110 · 12 semaines</h3>
      <p>Trois séances par semaine (A, B, C), un jour de repos entre deux. Tu commences assis et avec appui, tu finis debout à la barre. Choisis ta semaine : les temps s'ajustent tout seuls.</p></div>
      <div class="weeks" role="group" aria-label="Semaine">${PLAN12.semaines.map((s, i) => { const p = PLAN12.phases.findIndex(x => i + 1 >= x.de && i + 1 <= x.a) + 1; return `<button class="week p${p}" type="button" data-week="${i + 1}" aria-pressed="${i + 1 === w}"><small>SEM</small><b>${i + 1}</b><i></i></button>`; }).join("")}</div>
      <div class="phases">${PLAN12.phases.map((p, i) => `<div class="phase p${i + 1}"><b>Semaines ${p.de} à ${p.a} · ${p.nom}</b>${esc(p.txt)}</div>`).join("")}</div>
      <div class="week-detail"><div class="wd-h"><b>Semaine ${w} · ${esc(ph.nom)}</b><span>${tw} s d'effort · ${tr} s de repos · ${tt} tours</span></div>
      ${["A", "B", "C"].map(L => { const s = plan12Seance(w, L); const t = buildTimeline(s); const circ = s.blocs[1].exos; return `<div class="srow"><div class="thumb" data-ex="${circ[0]}"></div><div class="t"><b>${esc(s.nom.replace(/^Semaine \d+ · /, ""))}</b><span>${circ.map(id => esc(EXO[id].nom)).join(" · ")}</span><span class="mono">${mins(totalSec(t))} · ≈ ${fmt(kcalOf(t, state.poids))} kcal</span></div><div class="a"><button class="btn ghost sm" type="button" data-plan="${L}">Détails</button><button class="btn hot sm" type="button" data-plango="${L}">${I.go}Lancer</button></div></div>`; }).join("")}
      </div>`;
    $$(".thumb[data-ex]", box).forEach(el => animate(el, EXO[el.dataset.ex], { fps: 20 }));
  }
  $("#plan12").addEventListener("click", e => {
    const wk = e.target.closest("[data-week]"); if (wk) { state.week = +wk.dataset.week; renderPlan(); return; }
    const d = e.target.closest("[data-plan]"); if (d) { openSession(plan12Seance(state.week, d.dataset.plan), "Cap 110 · 12 semaines"); return; }
    const g = e.target.closest("[data-plango]"); if (g) openPlayer(plan12Seance(state.week, g.dataset.plango));
  });
  function renderProgs() {
    $("#progGrid").innerHTML = PROGS.map(p => {
      const ids = [...new Set(p.seances.flatMap(s => s.blocs.filter(b => !/chauffement|calme/i.test(b.nom)).flatMap(b => b.exos)))].slice(0, 3);
      const t = p.seances.map(s => totalSec(buildTimeline(s)));
      const dur = Math.min(...t) === Math.max(...t) ? mins(t[0]) : `${Math.round(Math.min(...t) / 60)} à ${mins(Math.max(...t))}`;
      return `<article class="prog"><div class="strip">${ids.map(id => `<div data-ex="${id}"></div>`).join("")}</div>
        <div class="pb"><div class="pm"><span class="badge l${p.niv}">${NIV(p.niv)}</span><span>${p.seances.length} séance${p.seances.length > 1 ? "s" : ""} · ${dur}</span></div>
        <h4>${esc(p.nom)}</h4><div class="pm"><span>${esc(p.semaines)} · ${esc(p.focus)}</span></div><p>${esc(p.desc)}</p></div>
        <button class="hit" type="button" data-prog="${p.id}" aria-label="Ouvrir le programme ${esc(p.nom)}"></button></article>`;
    }).join("");
    $$("#progGrid [data-ex]").forEach(el => animate(el, EXO[el.dataset.ex], { fps: 20 }));
  }
  $("#progGrid").addEventListener("click", e => { const b = e.target.closest("[data-prog]"); if (b) openProg(b.dataset.prog); });
  function openProg(id) {
    const p = PROGS.find(x => x.id === id);
    const html = `<div class="sheet-body" style="padding-top:22px">
      <div><div class="eyebrow">${esc(p.semaines)} · ${esc(p.focus)}</div><h2 id="sheetTitle">${esc(p.nom)}</h2><p class="zone">${esc(p.desc)}</p></div>
      ${p.seances.map(s => { const t = buildTimeline(s); const main = s.blocs.find(b => !/chauffement|calme|route/i.test(b.nom)) || s.blocs[0];
        return `<div class="srow"><div class="thumb" data-ex="${main.exos[0]}"></div><div class="t"><b>${esc(s.nom)}</b><span>${main.exos.map(x => esc(EXO[x].nom)).join(" · ")}</span><span class="mono"><span class="lvl l${s.niv}">${NIV(s.niv)}</span> · ${mins(totalSec(t))} · ≈ ${fmt(kcalOf(t, state.poids))} kcal</span></div><div class="a"><button class="btn ghost sm" type="button" data-sess="${s.id}">Détails</button><button class="btn hot sm" type="button" data-sessgo="${s.id}">${I.go}Lancer</button></div></div>`; }).join("")}
    </div>`;
    openSheet(html, p.nom);
    $$("#sheetPanel .thumb[data-ex]").forEach(el => animate(el, EXO[el.dataset.ex], { fps: 20 }));
    $("#sheetPanel").addEventListener("click", e => {
      const d = e.target.closest("[data-sess]"); if (d) { openSession(findSeance(d.dataset.sess), p.nom); return; }
      const g = e.target.closest("[data-sessgo]"); if (g) { closeSheet(); openPlayer(findSeance(g.dataset.sessgo)); }
    });
  }

  /* ---------- sur mesure */
  const G = { niv: 1, duree: 20, focus: "corps", position: "sanssol", w: 30, r: 30, ech: true, calme: true, seed: 1 };
  function segBtns(key, opts) { return opts.map(([v, t]) => `<button type="button" data-k="${key}" data-v="${v}" aria-pressed="${String(G[key]) === String(v)}">${t}</button>`).join(""); }
  function renderGenForm() {
    $("#genForm").innerHTML = `
      <div class="f"><span class="lab">Niveau</span><div class="seg" role="group" aria-label="Niveau">${segBtns("niv", [[1, '<i class="ldot l1"></i>Facile'], [2, '<i class="ldot l2"></i>Moyen'], [3, '<i class="ldot l3"></i>Difficile']])}</div></div>
      <div class="f"><span class="lab">Durée</span><div class="seg" role="group" aria-label="Durée">${segBtns("duree", [[10, "10 min"], [15, "15"], [20, "20"], [30, "30"], [45, "45"]])}</div></div>
      <div class="f"><span class="lab">Objectif</span><div class="chips">${Object.entries(FOCUS).map(([k, f]) => `<button class="chip" type="button" data-k="focus" data-v="${k}" aria-pressed="${G.focus === k}">${f.nom}</button>`).join("")}</div></div>
      <div class="f"><span class="lab">Position</span><div class="seg" role="group" aria-label="Position">${segBtns("position", [["sanssol", "Sans aller au sol"], ["assis", "100 % assis"], ["tout", "Tout"]])}</div></div>
      <div class="f"><label class="lab" for="gW">Effort</label><div class="range-row"><input id="gW" type="range" min="20" max="60" step="5" value="${G.w}"><output for="gW" id="gWo">${G.w} s</output></div></div>
      <div class="f"><label class="lab" for="gR">Repos</label><div class="range-row"><input id="gR" type="range" min="10" max="90" step="5" value="${G.r}"><output for="gR" id="gRo">${G.r} s</output></div></div>
      <div class="f"><span class="lab">Inclure</span><div class="toggles"><button class="chip" type="button" data-t="ech" aria-pressed="${G.ech}">Échauffement</button><button class="chip" type="button" data-t="calme" aria-pressed="${G.calme}">Retour au calme</button></div></div>
      <div class="f"><label class="field-inline" for="poidsG">Ton poids <input id="poidsG" type="number" inputmode="numeric" min="40" max="300" value="${state.poids}"> kg</label></div>`;
  }
  $("#genForm").addEventListener("click", e => {
    const b = e.target.closest("[data-k]");
    if (b) { const k = b.dataset.k; G[k] = ["niv", "duree"].includes(k) ? +b.dataset.v : b.dataset.v; renderGenForm(); renderGen(); return; }
    const t = e.target.closest("[data-t]");
    if (t) { G[t.dataset.t] = !G[t.dataset.t]; t.setAttribute("aria-pressed", String(G[t.dataset.t])); renderGen(); }
  });
  $("#genForm").addEventListener("input", e => {
    if (e.target.id === "gW") { G.w = +e.target.value; $("#gWo").textContent = G.w + " s"; renderGen(); }
    if (e.target.id === "gR") { G.r = +e.target.value; $("#gRo").textContent = G.r + " s"; renderGen(); }
    if (e.target.id === "poidsG") { const v = +e.target.value; if (v >= 40 && v <= 300) { state.poids = v; renderGen(); } }
  });
  let genS = null;
  function renderGen() {
    genS = generer(G);
    const t = buildTimeline(genS);
    const out = $("#genOut");
    $$(".thumb", out).forEach(el => FIG.unmount(el));
    out.innerHTML = `<div class="gen-sum"><div><div class="eyebrow">Ta séance</div><h3>${esc(genS.nom)}</h3></div>
      <div class="kpis"><div class="kpi"><b>${mins(totalSec(t))}</b><span>durée réelle</span></div><div class="kpi"><b>${genS.tours}</b><span>tours du circuit</span></div><div class="kpi"><b>≈ ${fmt(kcalOf(t, state.poids))}</b><span>kcal estimées</span></div></div></div>
      <div class="actions"><button class="btn hot lg" type="button" id="gGo">${I.go}Lancer</button><button class="btn ghost lg" type="button" id="gMix"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>Mélanger</button></div>
      ${blocsHTML(genS)}`;
    $$(".thumb[data-ex]", out).forEach(el => animate(el, EXO[el.dataset.ex], { fps: 20 }));
  }
  $("#genOut").addEventListener("click", e => {
    if (e.target.closest("#gGo")) { openPlayer(genS); return; }
    if (e.target.closest("#gMix")) { G.seed++; renderGen(); return; }
    const b = e.target.closest("[data-open]"); if (b) openExo(b.dataset.open);
  });

  /* ---------- le kit */
  const BANDS = [5, 10, 15, 20, 20, 25, 25];
  function combo(kg) {
    let best = null;
    for (let m = 1; m < 1 << BANDS.length; m++) {
      let s = 0, n = 0; for (let i = 0; i < BANDS.length; i++) if (m & (1 << i)) { s += BANDS[i]; n++; }
      if (s === kg && (!best || n < best.n)) best = { m, n };
    }
    return best;
  }
  function renderKit() {
    const HTS = { haut: 30, tete: 60, poitrine: 92, assis: 112, bas: 204 };
    const near = v => typeof v === "string" ? v : Object.entries(HTS).sort((a, b) => Math.abs(a[1] - v) - Math.abs(b[1] - v))[0][0];
    const uses = h => { const n = EXOS.filter(e => e.door && near(e.ah || "poitrine") === h).length; return n + (n > 1 ? " exercices" : " exercice"); };
    $("#kitBox").innerHTML = `
      <section class="kit-sec"><h3>Dans la pochette</h3>
        <div class="inv">
          <div><b>1</b><span>barre, pour les gros mouvements (squat, soulevé, rowing, développé)</span></div>
          <div><b>7</b><span>élastiques en latex : 5, 10, 15, deux de 20 et deux de 25 kg</span></div>
          <div><b>2</b><span>poignées, pour les exercices à une main ou à deux mains</span></div>
          <div><b>1</b><span>ancrage de porte, pour tirer ou pousser comme sur une poulie</span></div>
          <div><b>2</b><span>sangles de cheville, pour les jambes et les fessiers</span></div>
          <div><b>4</b><span>mousquetons, dont 2 à verrouillage</span></div>
        </div>
        <p>Composition d'après la fiche du pack Elite et les tests publiés. Vérifie les valeurs imprimées sur tes élastiques : si elles diffèrent, fie-toi aux tiennes.</p>
      </section>
      <section class="kit-sec"><h3>Combiner les élastiques</h3>
        <p>Les élastiques s'additionnent : accroche-en plusieurs à la barre ou aux poignées. Choisis une résistance, le site te dit lesquels clipper avec le moins d'élastiques possible.</p>
        <div class="calc panel">
          <div class="rack" id="rack">${BANDS.map((b, i) => `<div class="tube" data-i="${i}"><b>${b} kg</b><div class="t"></div></div>`).join("")}</div>
          <div class="f" style="display:grid;gap:12px">
            <label class="lab" for="kgR">Résistance voulue</label>
            <div class="range-row"><input id="kgR" type="range" min="5" max="120" step="5" value="15"><output for="kgR" id="kgO">15 kg</output></div>
            <div class="calc-out" id="calcOut"></div>
          </div>
        </div>
        <p>Le chiffre indiqué correspond à un élastique très étiré. En début de mouvement, la tension est bien plus faible et elle monte à mesure que tu tires : c'est normal, et c'est ce qui épargne les articulations.</p>
      </section>
      <section class="kit-sec"><h3>Placer l'ancrage de porte</h3>
        <div class="two">
          <div class="door-fig"><svg viewBox="0 0 300 240" role="img" aria-label="Les cinq hauteurs d'ancrage sur une porte">
            <rect x="40" y="10" width="110" height="220" rx="3" fill="var(--prop)"/><rect x="146" y="10" width="6" height="220" fill="var(--muted)" opacity=".5"/>
            <circle cx="56" cy="122" r="5" fill="var(--muted)"/>
            ${[["Haut", 18, uses("haut")], ["Visage", 62, uses("tete")], ["Poitrine", 98, uses("poitrine")], ["Poitrine assis", 128, uses("assis")], ["Bas", 214, uses("bas")]].map(([n, y, c]) => `<rect x="148" y="${y - 4}" width="10" height="8" rx="2" fill="var(--ink)"/><line x1="160" y1="${y}" x2="186" y2="${y}" stroke="var(--band)" stroke-width="2.5"/><text x="192" y="${y + 4}">${n} · ${c}</text>`).join("")}
          </svg></div>
          <div style="display:grid;gap:10px;align-content:start">
            <ul class="dots">
              <li>Place l'ancrage côté charnières, jamais côté poignée.</li>
              <li>Mets-toi du côté où la porte ne s'ouvre pas : en tirant, tu la plaques contre le chambranle.</li>
              <li>Ferme à clé si tu peux, et préviens la maison qu'on n'ouvre pas pendant la séance.</li>
              <li>Passe la boucle par-dessus, sous ou dans l'entrebâillement, puis ferme et tire un coup sec avant d'accrocher l'élastique.</li>
              <li>Chaque fiche d'exercice indique la hauteur à utiliser.</li>
            </ul>
          </div>
        </div>
      </section>
      <section class="kit-sec"><h3>Choisir la bonne résistance</h3>
        <p>À la fin des 30 secondes d'effort, les dernières répétitions doivent être dures mais propres. Si le geste se déforme, prends plus léger ou avance d'un pas vers l'ancrage. Repère-toi avec l'échelle d'effort :</p>
        <div class="scale">
          <div><b>1–2</b><span>Très facile, tu pourrais chanter. Bien pour l'échauffement.</span></div>
          <div><b>3–4</b><span>Facile, tu parles sans peine. Bien pour le retour au calme.</span></div>
          <div class="ok"><b>5–6</b><span>Modéré, tu parles en phrases courtes. C'est la cible du Facile et du Moyen.</span></div>
          <div class="ok"><b>7</b><span>Difficile, quelques mots seulement. Limite haute, réservée au Difficile.</span></div>
          <div class="hot"><b>8+</b><span>Trop dur pour ces séances : allège l'élastique ou rallonge le repos.</span></div>
        </div>
      </section>
      <section class="kit-sec"><h3>Progresser semaine après semaine</h3>
        <p>Change une seule chose à la fois, dans cet ordre, et seulement quand la séance précédente s'est bien passée.</p>
        <ol class="steps">
          <li><span>Ajoute un tour au circuit.</span></li>
          <li><span>Allonge l'effort de 5 secondes.</span></li>
          <li><span>Raccourcis le repos de 5 secondes.</span></li>
          <li><span>Passe à l'élastique au-dessus, ou recule d'un pas.</span></li>
          <li><span>Passe au niveau suivant pour les exercices qui te semblent faciles.</span></li>
        </ol>
      </section>
      <section class="kit-sec"><h3>Sécurité</h3>
        <ul class="dots">
          <li>Avant chaque séance, regarde tes élastiques : une fissure, une zone blanchie ou collante, et l'élastique part à la poubelle.</li>
          <li>Ne lâche jamais un élastique tendu : reviens doucement à la position de départ avant de poser.</li>
          <li>L'élastique ne passe jamais devant le visage quand il est tendu.</li>
          <li>Chaussures fermées qui tiennent bien, et une chaise sans roulettes calée contre un mur.</li>
          <li>Respire tout le temps : on souffle pendant l'effort, on ne bloque jamais.</li>
          <li>Bois de l'eau pendant les repos.</li>
        </ul>
        <div class="alert"><b>Arrête la séance et demande un avis médical si tu ressens :</b><span>une douleur ou une oppression dans la poitrine, un malaise ou un vertige, un essoufflement qui ne passe pas au repos, des palpitations, ou une douleur vive dans une articulation.</span></div>
        <p>Si tu prends un traitement pour la tension, le cœur ou le diabète, parle de ce programme à ton médecin avant de commencer.</p>
      </section>
      <section class="kit-sec"><h3>Projeter la séance</h3>
        <ol class="steps">
          <li><span>Pose la tablette ou le téléphone à l'horizontale, à 2 ou 3 mètres, à hauteur des yeux.</span></li>
          <li><span>Ouvre une séance et touche « Plein écran ». L'écran reste allumé pendant la séance quand l'appareil le permet ; sinon, coupe la mise en veille dans ses réglages.</span></li>
          <li><span>Pour la télé : sur iPhone ou iPad, centre de contrôle puis « Recopie de l'écran » vers l'Apple TV ; sur Android, « Caster » vers un Chromecast.</span></li>
          <li><span>Monte le son : trois bips annoncent chaque fin d'effort et de repos, et une voix annonce l'exercice suivant.</span></li>
          <li><span>Au clavier : Espace pour la pause, flèches gauche et droite pour revenir ou passer.</span></li>
        </ol>
      </section>
      <section class="kit-sec"><h3>Aucune trace</h3>
        <p>Pas de compte, pas de cookie, pas d'historique, pas de statistiques de visite. Les polices sont incluses dans le site, rien n'est demandé à un autre serveur. Ton poids saisi pour les calories reste en mémoire le temps de la visite, puis disparaît avec l'onglet.</p>
      </section>`;
    const upd = () => {
      const kg = +$("#kgR").value; $("#kgO").textContent = kg + " kg";
      const c = combo(kg);
      $$("#rack .tube").forEach(t => t.classList.toggle("on", !!(c && c.m & (1 << +t.dataset.i))));
      const parts = c ? BANDS.filter((b, i) => c.m & (1 << i)) : [];
      $("#calcOut").innerHTML = c ? `${kg} kg = ${parts.join(" + ")}<small>${c.n} élastique${c.n > 1 ? "s" : ""} à accrocher</small>` : "Combinaison impossible";
    };
    $("#kgR").addEventListener("input", upd); upd();
  }

  /* ================= LECTEUR ================= */
  const P = { s: null, segs: [], i: 0, left: 0, end: 0, running: false, timer: 0, lastSec: -1, sound: true, voice: true, ac: null, wake: null, shownEx: null, started: 0, opts: {}, halfSaid: false, pausedAt: 0 };
  const playEl = $("#play");
  function openPlayer(s, opts = {}) {
    P.s = s; P.opts = opts; P.segs = buildTimeline(s, opts); P.i = 0; P.running = false; P.shownEx = null;
    lastFocus = document.activeElement;
    playEl.hidden = false; document.body.classList.add("locked");
    playEl.dataset.phase = "prep";
    const tot = totalSec(P.segs);
    playEl.innerHTML = `<div class="p-top"><button class="p-btn" type="button" data-pq aria-label="Fermer">${I.close}</button><div class="t"><b>${esc(s.nom)}</b><span>${NIV(s.niv)} · ${exoCount(s)} exercices</span></div></div>
      <div class="p-ready"><div class="eyebrow" style="color:var(--p-prep)">Prêt ?</div><h2>${esc(s.nom)}</h2>
        <div class="p-kpis"><div><b>${mins(tot)}</b><span>au total</span></div><div><b>${P.segs.filter(x => x.type === "work").length}</b><span>efforts</span></div><div><b>≈ ${fmt(kcalOf(P.segs, state.poids))}</b><span>kcal pour ${state.poids} kg</span></div></div>
        <p>Prépare ta chaise, ton élastique et une bouteille d'eau. Le premier exercice est « ${esc(P.segs[0].ex.nom)} ».</p>
        <div class="actions" style="justify-content:center"><button class="btn hot lg" type="button" id="pStart">${I.go}Démarrer</button><button class="btn ghost lg" type="button" data-pfull>${I.full.replace("<svg", '<svg fill="none" stroke="currentColor" stroke-width="2"')}Plein écran</button></div>
        <div class="actions" style="justify-content:center"><button class="p-btn" type="button" data-psound aria-pressed="${P.sound}" aria-label="Bips">${I.sound}</button><button class="p-btn" type="button" data-pvoice aria-pressed="${P.voice}" aria-label="Voix">${I.voice}</button></div>
        <span class="p-hint">Espace : pause · ← → : précédent, suivant</span></div>`;
    setTimeout(() => { const b = $("#pStart"); if (b) b.focus(); }, 30);
  }
  function playerShell() {
    playEl.innerHTML = `<div class="p-top"><button class="p-btn" type="button" data-pq aria-label="Quitter la séance">${I.close}</button>
        <div class="t"><b>${esc(P.s.nom)}</b><span id="pWhere"></span></div>
        <div class="rem"><span>reste</span><b id="pRem"></b></div></div>
      <div class="p-main"><div class="p-stage"><div class="fxbox" id="pArt"></div><span class="tag" id="pTag"></span></div>
        <div class="p-info"><div class="p-phase" id="pPhase"></div>
          <div class="p-clock"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bgc" cx="50" cy="50" r="45"/><circle class="fgc" id="pRing" cx="50" cy="50" r="45" stroke-dasharray="282.74" stroke-dashoffset="0"/></svg><div class="p-num" id="pNum" aria-live="off"></div></div>
          <div class="p-name" id="pName"></div><div class="p-sub" id="pSub"></div><div class="p-next" id="pNext"></div></div></div>
      <div class="p-bar" id="pBar">${P.segs.map(x => `<i class="${x.type === "work" ? "w" : x.type === "rest" ? "r" : ""}" style="flex-grow:${x.d}"></i>`).join("")}</div>
      <div class="p-ctrl"><button class="p-btn" type="button" data-psound aria-pressed="${P.sound}" aria-label="Bips">${I.sound}</button><span class="sp"></span>
        <button class="p-btn" type="button" data-pprev aria-label="Précédent">${I.prev}</button>
        <button class="p-btn big" type="button" data-ptoggle aria-label="Pause">${I.pause}</button>
        <button class="p-btn" type="button" data-pnext aria-label="Suivant">${I.next}</button><span class="sp"></span>
        <button class="p-btn" type="button" data-pvoice aria-pressed="${P.voice}" aria-label="Voix">${I.voice}</button>
        <button class="p-btn" type="button" data-pfull aria-label="Plein écran">${I.full}</button></div>`;
  }
  /* sons et voix */
  function beep(f = 880, d = .12, v = .25, when = 0) {
    if (!P.sound || !P.ac) return;
    try {
      const t = P.ac.currentTime + when, o = P.ac.createOscillator(), g = P.ac.createGain();
      o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g); g.connect(P.ac.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) { /* son indisponible */ }
  }
  let frVoice = null;
  function pickVoice() {
    try {
      const vs = speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang));
      frVoice = vs.find(v => v.localService && /fr-FR/i.test(v.lang)) || vs.find(v => v.localService) || vs.find(v => /fr-FR/i.test(v.lang)) || vs[0] || null;
    } catch (e) { frVoice = null; }
  }
  if ("speechSynthesis" in window) { pickVoice(); try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* rien */ } }
  function say(txt) {
    if (!P.voice || !("speechSynthesis" in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = "fr-FR"; if (frVoice) u.voice = frVoice; u.rate = 1.02; speechSynthesis.speak(u); } catch (e) { /* voix indisponible */ }
  }
  async function wakeOn() { try { if ("wakeLock" in navigator && !P.wake) { P.wake = await navigator.wakeLock.request("screen"); P.wake.addEventListener("release", () => { P.wake = null; }); } } catch (e) { P.wake = null; } }
  function wakeOff() { try { P.wake && P.wake.release(); } catch (e) { /* rien */ } P.wake = null; }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !playEl.hidden && P.running) wakeOn(); });
  function toggleFull() {
    const d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
      const f = playEl.requestFullscreen || playEl.webkitRequestFullscreen;
      if (f) { const r = f.call(playEl); if (r && r.catch) r.catch(() => toast("Plein écran indisponible ici : tourne l'appareil à l'horizontale.")); }
      else toast("Plein écran indisponible ici : tourne l'appareil à l'horizontale.");
    } catch (e) { toast("Plein écran indisponible ici."); }
  }
  function start() {
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC && !P.ac) P.ac = new AC(); if (P.ac && P.ac.state === "suspended") P.ac.resume(); } catch (e) { P.ac = null; }
    playerShell();
    P.started = performance.now();
    wakeOn();
    go(0);
    resume();
  }
  function resume() {
    P.running = true; P.end = performance.now() + P.left;
    clearInterval(P.timer); P.timer = setInterval(tick, 100);
    const t = $("[data-ptoggle]", playEl); if (t) { t.innerHTML = I.pause; t.setAttribute("aria-label", "Pause"); }
    if ($("#pArt")) FIG.setPaused($("#pArt"), false);
    wakeOn();
  }
  function pause() {
    if (!P.running) return;
    P.running = false; P.left = Math.max(0, P.end - performance.now());
    clearInterval(P.timer);
    const t = $("[data-ptoggle]", playEl); if (t) { t.innerHTML = I.play; t.setAttribute("aria-label", "Reprendre"); }
    if ($("#pArt")) FIG.setPaused($("#pArt"), true);
    try { speechSynthesis.cancel(); } catch (e) { /* rien */ }
    const ph = $("#pPhase"); if (ph) ph.textContent = "En pause";
  }
  function phaseLabel(seg) { return seg.type === "work" ? "Effort" : seg.type === "rest" ? (seg.label || "Repos") : seg.label; }
  function go(i) {
    if (i >= P.segs.length) { finish(); return; }
    P.i = Math.max(0, i);
    const seg = P.segs[P.i];
    P.left = seg.d * 1000; P.end = performance.now() + P.left; P.lastSec = -1; P.halfSaid = false;
    playEl.dataset.phase = seg.type;
    const ex = seg.ex;
    if (P.shownEx !== ex) { FIG.mount($("#pArt"), ex, { label: "Démonstration : " + ex.nom }); P.shownEx = ex; if (!P.running) FIG.setPaused($("#pArt"), true); }
    $("#pPhase").textContent = P.running || P.i === 0 ? phaseLabel(seg) : "En pause";
    $("#pTag").textContent = seg.type === "work" ? "Maintenant" : "À suivre";
    $("#pName").textContent = ex.nom;
    const workIdx = P.segs.slice(0, P.i + 1).filter(x => x.type === "work").length;
    const totalW = P.segs.filter(x => x.type === "work").length;
    const w = seg.type === "work" ? seg : P.segs.slice(P.i).find(x => x.type === "work");
    $("#pWhere").textContent = w ? `${w.bloc} · tour ${w.tour}/${w.tours} · exercice ${w.i + 1}/${w.n} · effort ${Math.min(totalW, seg.type === "work" ? workIdx : workIdx + 1)}/${totalW}` : "";
    if (seg.type === "work") {
      $("#pSub").innerHTML = `<b>${esc(ex.kg)}</b> · ${esc(ex.cue)}${ex.uni ? " · <b>change de côté à mi-temps</b>" : ""}`;
      const nx = P.segs.slice(P.i + 1).find(x => x.type === "work");
      $("#pNext").innerHTML = nx ? `Ensuite : <b>${esc(nx.ex.nom)}</b>` : "Dernier effort, tiens bon";
      say(ex.nom + (ex.uni ? ". Un côté, puis l'autre à mi-temps." : "."));
    } else if (seg.type === "rest") {
      const anc = ex.door ? " · ancrage " + ({ haut: "en haut", tete: "à hauteur de visage", poitrine: "à hauteur de poitrine", assis: "à hauteur de poitrine assis", bas: "en bas" }[ex.ah] || "à mi-hauteur") : "";
      $("#pSub").innerHTML = ex.mat.includes("aucun") ? "Pas besoin d'élastique pour le suivant" : `Prépare l'élastique : <b>${esc(ex.kg)}</b>${anc}`;
      $("#pNext").textContent = "Respire, bois une gorgée d'eau";
      say(`${seg.label === "Repos" ? "Repos" : seg.label}. Ensuite : ${ex.nom}.`);
    } else {
      $("#pSub").innerHTML = `Premier exercice. <b>${esc(ex.kg)}</b>`;
      $("#pNext").textContent = "";
      say(`Prépare-toi. Premier exercice : ${ex.nom}.`);
    }
    $$("#pBar i").forEach((el, k) => { el.classList.toggle("done", k < P.i); el.classList.toggle("cur", k === P.i); });
    if (seg.type === "work") { beep(880, .35, .3); } else if (seg.type === "rest") { beep(660, .18, .25); beep(495, .3, .25, .2); }
    playEl.classList.remove("flash"); void playEl.offsetWidth; playEl.classList.add("flash");
    draw();
  }
  function remainingTotal() { let s = P.left / 1000; for (let k = P.i + 1; k < P.segs.length; k++) s += P.segs[k].d; return s; }
  function draw() {
    const seg = P.segs[P.i];
    const left = Math.max(0, P.left / 1000);
    const sec = Math.ceil(left - 0.001);
    const n = $("#pNum"); if (!n) return;
    const txt = mmss(sec);
    if (n.textContent !== txt) { n.textContent = txt; n.classList.toggle("small", txt.length > 3); }
    $("#pRing").setAttribute("stroke-dashoffset", (282.74 * (1 - left / seg.d)).toFixed(2));
    $("#pRem").textContent = mins(remainingTotal()).replace(" min", " min");
    return sec;
  }
  function tick() {
    if (!P.running) return;
    P.left = P.end - performance.now();
    if (P.left <= 0) { go(P.i + 1); return; }
    const sec = draw();
    if (sec !== P.lastSec) {
      const seg = P.segs[P.i];
      if (sec <= 3 && sec >= 1 && seg.d > 5) beep(sec === 1 ? 740 : 620, .12, .22);
      if (seg.type === "work" && seg.ex.uni && !P.halfSaid && seg.d >= 20 && sec === Math.ceil(seg.d / 2)) { P.halfSaid = true; beep(990, .1, .25); beep(990, .1, .25, .16); say("Change de côté."); }
      if (seg.type === "rest" && seg.d >= 25 && sec === 10) say("Dix secondes.");
      P.lastSec = sec;
    }
  }
  function finish() {
    clearInterval(P.timer); P.running = false; wakeOff();
    const dur = totalSec(P.segs), kc = kcalOf(P.segs, state.poids);
    playEl.dataset.phase = "done";
    if ($("#pArt")) FIG.unmount($("#pArt"));
    playEl.innerHTML = `<div class="p-top"><button class="p-btn" type="button" data-pclose aria-label="Fermer">${I.close}</button><div class="t"><b>${esc(P.s.nom)}</b><span>Terminé</span></div></div>
      <div class="p-done"><div class="eyebrow" style="color:var(--p-rest)">Séance terminée</div><h2>Bravo, c'est fait.</h2>
        <div class="p-kpis"><div><b>${mins(dur)}</b><span>de séance</span></div><div><b>${P.segs.filter(x => x.type === "work").length}</b><span>efforts</span></div><div><b>≈ ${fmt(kc)}</b><span>kcal pour ${state.poids} kg</span></div></div>
        <p>Étire-toi encore deux minutes si tu en as envie, et bois un grand verre d'eau. La prochaine séance, c'est après un jour de repos.</p>
        <div class="actions" style="justify-content:center"><button class="btn ghost lg" type="button" data-pagain>Refaire la séance</button><button class="btn lg" type="button" data-pclose>Fermer</button></div></div>`;
    beep(660, .15, .25); beep(880, .15, .25, .18); beep(1100, .4, .25, .36);
    say("Séance terminée. Bravo.");
  }
  function askQuit() {
    if (!$("#pArt")) { closePlayer(); return; }
    pause();
    const q = document.createElement("div");
    q.className = "p-quit"; q.style.cssText = "position:absolute;inset:0;background:rgba(11,17,14,.94);z-index:5;padding:24px";
    q.innerHTML = `<h2>Quitter la séance ?</h2><p>Rien n'est enregistré : si tu quittes, la séance repart de zéro la prochaine fois.</p><div class="actions" style="justify-content:center"><button class="btn lg" type="button" data-presume>Continuer</button><button class="btn ghost lg" type="button" data-pclose>Quitter</button></div>`;
    playEl.appendChild(q);
    $("[data-presume]", q).focus();
  }
  function closePlayer() {
    clearInterval(P.timer); P.running = false; wakeOff();
    try { speechSynthesis.cancel(); } catch (e) { /* rien */ }
    try { if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { /* rien */ }
    if ($("#pArt")) FIG.unmount($("#pArt"));
    playEl.hidden = true; playEl.innerHTML = "";
    if ($("#sheet").hidden) document.body.classList.remove("locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  playEl.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "pStart") { start(); return; }
    if (b.hasAttribute("data-pq")) { askQuit(); return; }
    if (b.hasAttribute("data-pclose")) { closePlayer(); return; }
    if (b.hasAttribute("data-presume")) { b.closest(".p-quit").remove(); resume(); $("#pPhase").textContent = phaseLabel(P.segs[P.i]); return; }
    if (b.hasAttribute("data-pagain")) { const s = P.s, o = P.opts; closePlayer(); openPlayer(s, o); return; }
    if (b.hasAttribute("data-ptoggle")) { if (P.running) pause(); else { resume(); $("#pPhase").textContent = phaseLabel(P.segs[P.i]); } return; }
    if (b.hasAttribute("data-pnext")) { const r = P.running; go(P.i + 1); if (!r && $("#pPhase")) $("#pPhase").textContent = "En pause"; return; }
    if (b.hasAttribute("data-pprev")) { const r = P.running; const back = (P.segs[P.i].d * 1000 - P.left) > 3000 ? P.i : P.i - 1; go(back); if (!r && $("#pPhase")) $("#pPhase").textContent = "En pause"; return; }
    if (b.hasAttribute("data-psound")) { P.sound = !P.sound; $$("[data-psound]", playEl).forEach(x => x.setAttribute("aria-pressed", String(P.sound))); toast(P.sound ? "Bips activés" : "Bips coupés"); return; }
    if (b.hasAttribute("data-pvoice")) { P.voice = !P.voice; if (!P.voice) { try { speechSynthesis.cancel(); } catch (er) { /* rien */ } } $$("[data-pvoice]", playEl).forEach(x => x.setAttribute("aria-pressed", String(P.voice))); toast(P.voice ? "Voix activée" : "Voix coupée"); return; }
    if (b.hasAttribute("data-pfull")) { toggleFull(); }
  });
  document.addEventListener("keydown", e => {
    if (playEl.hidden) return;
    if (!$("#pArt")) { if (e.key === "Escape") closePlayer(); return; }
    if ($(".p-quit", playEl)) { if (e.key === "Escape") { $(".p-quit", playEl).remove(); resume(); } return; }
    if (e.key === " " || e.code === "Space") { e.preventDefault(); $("[data-ptoggle]", playEl).click(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); $("[data-pnext]", playEl).click(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); $("[data-pprev]", playEl).click(); }
    else if (e.key === "Escape") { askQuit(); }
  });

  /* ---------- démarrage */
  const nSeances = PROGS.reduce((n, p) => n + p.seances.length, 0) + 36;
  $("#hN").textContent = EXOS.length;
  $("#hF").textContent = EXOS.filter(e => e.niv === 1).length;
  $("#hP").textContent = nSeances;
  renderCatChips(); renderFilterChips(); renderGrid();
  renderPlan(); renderProgs();
  renderGenForm(); renderGen();
  renderKit();
  heroLoop();
  const h = (location.hash || "").replace("#", "");
  goTab(TABS.includes(h) ? h : "exercices", false);
  window.CAP = { openExo, openSession, openPlayer, findSeance, P, state };
})();
