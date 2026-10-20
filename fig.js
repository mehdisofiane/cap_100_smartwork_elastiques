/* Cap 110 · Élastiques — silhouettes animées.
   Vue « profil » (le personnage regarde vers la droite) et vue « face ».
   Profil : hip [x,y], torso (°), neck (°), ankle / ankle2 [x,y] (genou par IK) ou knee / knee2 imposés,
            foot / foot2 (° de la pointe), bras par angles (uarm, farm, uarm2, farm2) ou mains imposées (hand, hand2).
   Face   : pel [x,y], tilt (° d'inclinaison du buste), sh (haussement), aR / aL chevilles, kR / kL genoux imposés,
            bras par angles (uarm, farm, us, ls…) ou vecteurs (uv, fv) ou mains imposées (hR, hL).
   Angles : 0 = vers la droite, 90 = vers le haut, -90 = vers le bas. */
const FIG = (() => {
  const L = { torso: 58, neck: 8, head: 11, uarm: 30, farm: 28, thigh: 40, shin: 40, foot: 13 };
  const rad = a => a * Math.PI / 180;
  const dir = a => [Math.cos(rad(a)), -Math.sin(rad(a))];
  const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const f1 = n => (Math.round(n * 10) / 10).toString();
  const pl = pts => pts.map(p => f1(p[0]) + "," + f1(p[1])).join(" ");

  /* ancrages de porte : x du bord de porte, hauteurs nommées */
  const DOORS = {
    G:  { x: 64,  rect: [48, 64] },
    D:  { x: 270, rect: [270, 286] },
    GF: { x: 100, rect: [84, 100] },
    DF: { x: 240, rect: [240, 256] }
  };
  const HEIGHTS = { haut: 30, tete: 60, poitrine: 92, assis: 112, taille: 132, genou: 176, bas: 204 };
  function anchor(ex) {
    if (!ex.door) return null;
    const d = DOORS[ex.door];
    const y = typeof ex.ah === "number" ? ex.ah : HEIGHTS[ex.ah || "poitrine"];
    return [d.x, y];
  }

  function ik(a, b, l1, l2, bend) {
    let dx = b[0] - a[0], dy = b[1] - a[1];
    let d = Math.hypot(dx, dy) || 0.001;
    const max = l1 + l2 - 0.01;
    if (d > max) { const k = max / d; dx *= k; dy *= k; d = max; }
    const base = Math.atan2(dy, dx);
    const c = Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
    const off = Math.acos(c);
    const c1 = [a[0] + l1 * Math.cos(base + off), a[1] + l1 * Math.sin(base + off)];
    const c2 = [a[0] + l1 * Math.cos(base - off), a[1] + l1 * Math.sin(base - off)];
    const score = p => bend === "up" ? -p[1] : bend === "down" ? p[1] : bend === "left" ? -p[0] : p[0];
    const j = score(c1) >= score(c2) ? c1 : c2;
    return { j, end: [a[0] + dx, a[1] + dy] };
  }

  const DEF = { us: 1, ls: 1, us2: 1, ls2: 1, sh: 0, tilt: 0, foot: 0, foot2: 0 };
  function mix(p, q, t) {
    const o = {};
    const keys = new Set([...Object.keys(p), ...Object.keys(q)]);
    for (const k of keys) {
      const a = p[k] ?? DEF[k], b = q[k] ?? DEF[k] ?? p[k];
      if (Array.isArray(a)) o[k] = [lerp(a[0], (b || a)[0], t), lerp(a[1], (b || a)[1], t)];
      else if (typeof a === "number") o[k] = lerp(a, typeof b === "number" ? b : a, t);
      else if (a === undefined && b !== undefined) o[k] = Array.isArray(b) ? b.slice() : b;
      else o[k] = t < .5 ? a : b;
    }
    return o;
  }

  /* ---------- vue de profil */
  function solveProfile(ex, P) {
    const H = P.hip, td = dir(P.torso);
    const N = add(H, td, L.torso);
    const C = add(N, dir(P.neck ?? P.torso), L.neck + L.head);
    const S = add(N, td, -5);
    const leg = (A, bend, K, fa) => {
      let knee, end;
      if (K) { knee = K; end = A; } else { const r = ik(H, A, L.thigh, L.shin, bend); knee = r.j; end = r.end; }
      return [H, knee, end, add(end, dir(fa ?? 0), L.foot)];
    };
    const legN = leg(P.ankle, P.lb || ex.legBend || "right", P.knee, P.foot);
    const legF = leg(P.ankle2 || P.ankle, P.lb2 || ex.legBend2 || ex.legBend || "right", P.knee2, P.foot2 ?? P.foot);
    const rel = ex.armRel ? P.torso - 90 : 0;
    const fix = v => v === "k" ? add(legN[1], [2, -6]) : v === "k2" ? add(legF[1], [2, -6])
      : v === "km" ? [lerp(H[0], legN[1][0], .62), lerp(H[1], legN[1][1], .62) - 5] : v;
    const arm = (hand, ua, fa, bend, us = 1, ls = 1) => {
      if (hand) { const r = ik(S, hand, L.uarm, L.farm, bend); return [S, r.j, r.end]; }
      const E = add(S, dir((ua ?? -90) + rel), L.uarm * us);
      return [S, E, add(E, dir((fa ?? -90) + rel), L.farm * ls)];
    };
    const hN = fix(P.hand ?? ex.handFix);
    let hF = fix(P.hand2 ?? ex.hand2Fix);
    if (!hF && hN && !ex.hand2Free && P.uarm2 === undefined) hF = add(hN, [3, -2]);
    const armN = arm(hN, P.uarm, P.farm, P.ab || ex.armBend || "down", P.us, P.ls);
    const armF = arm(hF, P.uarm2 ?? P.uarm, P.farm2 ?? P.farm, P.ab2 || ex.arm2Bend || ex.armBend || "down", P.us2 ?? P.us, P.ls2 ?? P.ls);
    const mid = lg => { const m = [lerp(lg[2][0], lg[3][0], .45), lerp(lg[2][1], lg[3][1], .45)]; return [m[0], Math.max(m[1] + 3, Math.min(217, m[1] + 3))]; };
    return {
      kind: "p", H, N, C, S, legN, legF, armN, armF,
      pts: { h: armN[2], h2: armF[2], e: armN[1], a: legN[2], a2: legF[2], k: legN[1], k2: legF[1], t: legN[3], t2: legF[3], f: mid(legN), f2: mid(legF), H, N, S, C, A: anchor(ex) }
    };
  }

  /* ---------- vue de face */
  function solveFront(ex, P) {
    const pel = P.pel || (ex.seatF ? [170, 164] : [170, 134]);
    const td = dir(90 - (P.tilt || 0));
    const pr = [-td[1], td[0]];
    const N = add(pel, td, L.torso);
    const C = add(N, td, L.neck + L.head);
    const SC = add(add(N, td, -5), [0, -(P.sh || 0)]);
    const SR = add(SC, pr, 19), SL = add(SC, pr, -19);
    const HR = [pel[0] + 11, pel[1]], HL = [pel[0] - 11, pel[1]];
    const seat = ex.seatF;
    const aR = P.aR || (seat ? [188, 214] : [182, 214]);
    const aL = P.aL || (seat ? [152, 214] : [158, 214]);
    const kR = P.kR || (seat ? [pel[0] + 16, pel[1] + 8] : null);
    const kL = P.kL || (seat ? [pel[0] - 16, pel[1] + 8] : null);
    const legR = kR ? [HR, kR, aR] : (() => { const r = ik(HR, aR, L.thigh, L.shin, P.lbR || "right"); return [HR, r.j, r.end]; })();
    const legL = kL ? [HL, kL, aL] : (() => { const r = ik(HL, aL, L.thigh, L.shin, P.lbL || "left"); return [HL, r.j, r.end]; })();
    const dR = a => dir(a), dL = a => { const v = dir(a); return [-v[0], v[1]]; };
    const armA = (Sh, side, ua, fa, us = 1, ls = 1, uv, fv) => {
      const m = side === "L" ? -1 : 1;
      const E = uv ? add(Sh, [uv[0] * m, uv[1]]) : add(Sh, side === "L" ? dL(ua ?? -90) : dR(ua ?? -90), L.uarm * us);
      const Hh = fv ? add(E, [fv[0] * m, fv[1]]) : add(E, side === "L" ? dL(fa ?? -90) : dR(fa ?? -90), L.farm * ls);
      return [Sh, E, Hh];
    };
    const rel = ex.armRel ? (P.tilt || 0) : 0;
    const ikArm = (Sh, h, bend) => { const r = ik(Sh, h, L.uarm, L.farm, bend); return [Sh, r.j, r.end]; };
    const armR = P.hR ? ikArm(SR, P.hR, P.abR || ex.abR || "right")
      : armA(SR, "R", (P.uarm ?? -90) - rel, (P.farm ?? -90) - rel, P.us, P.ls, P.uv, P.fv);
    const hLp = P.hL || (P.hR && P.uarm2 === undefined && P.uv2 === undefined ? [2 * pel[0] - P.hR[0], P.hR[1]] : null);
    const armL = hLp ? ikArm(SL, hLp, P.abL || ex.abL || "left")
      : armA(SL, "L", (P.uarm2 ?? P.uarm ?? -90) + rel, (P.farm2 ?? P.farm ?? -90) + rel, P.us2 ?? P.us, P.ls2 ?? P.ls, P.uv2 ?? P.uv, P.fv2 ?? P.fv);
    const fR = [legR[2][0] + 3, 217], fL = [legL[2][0] - 3, 217];
    return {
      kind: "f", pel, N, C, SR, SL, HR, HL, legR, legL, armR, armL,
      pts: { h: armR[2], h2: armL[2], e: armR[1], a: legR[2], a2: legL[2], k: legR[1], k2: legL[1], f: fR, f2: fL, H: pel, N, C, A: anchor(ex), M: [pel[0], 217] }
    };
  }

  const solve = (ex, P) => ex.vue === "face" ? solveFront(ex, P) : solveProfile(ex, P);

  /* ---------- décor */
  function props(ex) {
    const out = [];
    const list = ex.props || [];
    const A = anchor(ex);
    if (list.includes("tapis") || ex.pos === "sol") out.push(`<rect x="52" y="216" width="236" height="5" rx="2.5" class="fx-mat"/>`);
    if (ex.door) {
      const d = DOORS[ex.door];
      out.push(`<g class="fx-prop"><rect x="${d.rect[0]}" y="18" width="${d.rect[1] - d.rect[0]}" height="200" rx="1.5"/></g>`);
      out.push(`<g class="fx-door-edge"><line x1="${d.x}" y1="18" x2="${d.x}" y2="218"/></g>`);
    }
    if (list.includes("chaise")) out.push(`<g class="fx-prop"><rect x="104" y="170" width="56" height="6" rx="2"/><rect x="104" y="104" width="6" height="72" rx="2"/><rect x="107" y="176" width="5" height="42"/><rect x="152" y="176" width="5" height="42"/></g>`);
    if (list.includes("chaiseD")) out.push(`<g class="fx-prop"><rect x="226" y="170" width="56" height="6" rx="2"/><rect x="276" y="104" width="6" height="72" rx="2"/><rect x="229" y="176" width="5" height="42"/><rect x="274" y="176" width="5" height="42"/></g>`);
    if (list.includes("dossierD")) out.push(`<g class="fx-prop"><rect x="226" y="146" width="48" height="6" rx="2"/><rect x="226" y="100" width="6" height="52" rx="2"/><rect x="229" y="152" width="5" height="66"/><rect x="266" y="152" width="5" height="66"/></g>`);
    if (list.includes("chaiseF")) out.push(`<g class="fx-prop"><rect x="128" y="96" width="84" height="7" rx="3" opacity=".55"/><rect x="132" y="100" width="6" height="72" opacity=".55"/><rect x="202" y="100" width="6" height="72" opacity=".55"/><rect x="124" y="168" width="92" height="8" rx="3"/><rect x="130" y="176" width="6" height="42"/><rect x="204" y="176" width="6" height="42"/></g>`);
    if (list.includes("chaiseCote")) out.push(`<g class="fx-prop"><rect x="74" y="170" width="46" height="6" rx="2"/><rect x="114" y="104" width="6" height="72" rx="2"/><rect x="77" y="176" width="5" height="42"/><rect x="113" y="176" width="5" height="42"/></g>`);
    if (list.includes("mur")) out.push(`<g class="fx-prop"><rect x="256" y="18" width="16" height="200"/></g>`);
    if (list.includes("table")) out.push(`<g class="fx-prop"><rect x="226" y="165" width="88" height="6" rx="2"/><rect x="232" y="171" width="5" height="47"/><rect x="303" y="171" width="5" height="47"/></g>`);
    if (list.includes("marche")) out.push(`<g class="fx-prop"><rect x="184" y="188" width="76" height="30" rx="2"/></g>`);
    if (A) out.push(`<g class="fx-anchor-g"><rect x="${A[0] - (ex.door.startsWith("G") ? 6 : 0)}" y="${A[1] - 4}" width="6" height="8" rx="2"/></g>`);
    return out.join("");
  }

  /* ---------- accessoires */
  function band(p, q, cls = "") {
    const len = Math.hypot(p[0] - q[0], p[1] - q[1]);
    const w = Math.max(2.2, Math.min(4.4, 4.8 - len / 55));
    return `<line class="fx-band ${cls}" x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke-width="${f1(w)}"/>`;
  }
  function bands(ex, s) {
    if (!ex.band) return "";
    const pt = k => Array.isArray(k) ? k : s.pts[k];
    let o = "";
    for (const pair of ex.band) {
      const a = pt(pair[0]), b = pt(pair[1]);
      if (a && b) o += band(a, b, pair[2] === "far" ? "fx-band-far" : "");
    }
    return o;
  }
  const handle = (h, far) => `<rect class="fx-handle${far ? " fx-farop" : ""}" x="${f1(h[0] - 3.2)}" y="${f1(h[1] - 7)}" width="6.4" height="14" rx="3.2"/>`;
  const strap = (a, far) => `<rect class="fx-strap${far ? " fx-farop" : ""}" x="${f1(a[0] - 5)}" y="${f1(a[1] - 6)}" width="10" height="7" rx="2.5"/>`;

  function frame(ex, P, ghost) {
    const s = solve(ex, P);
    const g = ghost;
    let o = "";
    const bandsTop = ex.bandTop ?? (ex.vue === "face" && !ex.bandBack);
    if (!g && !bandsTop) o += bands(ex, s);
    if (s.kind === "p") {
      o += `<polyline class="fx-limb fx-far" points="${pl(s.legF)}"/>`;
      o += `<polyline class="fx-limb fx-far" points="${pl(s.armF)}"/>`;
      if (!g && ex.poignees) o += handle(s.armF[2], true);
      if (!g && ex.sangle && ex.sangle.includes("a2")) o += strap(s.legF[2], true);
      o += `<polyline class="fx-limb" points="${pl(s.legN)}"/>`;
      o += `<polyline class="fx-limb fx-torso" points="${pl([s.H, s.N])}"/>`;
      o += `<circle class="fx-head" cx="${f1(s.C[0])}" cy="${f1(s.C[1])}" r="${L.head}"/>`;
      if (!g && ex.sangle && ex.sangle.includes("a")) o += strap(s.legN[2]);
      if (!g && bandsTop) o += bands(ex, s);
      o += `<polyline class="fx-limb" points="${pl(s.armN)}"/>`;
      if (!g && ex.poignees) o += handle(s.armN[2]);
      if (!g && ex.barre) { const h = s.armN[2]; o += `<circle class="fx-barend" cx="${f1(h[0])}" cy="${f1(h[1])}" r="6.5"/><circle class="fx-barcore" cx="${f1(h[0])}" cy="${f1(h[1])}" r="2.4"/>`; }
      if (!g) o += [s.H, s.legN[1], s.armN[1]].map(p => `<circle class="fx-joint" cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.6"/>`).join("");
      return o;
    }
    /* face */
    o += `<polyline class="fx-limb" points="${pl(s.legL)}"/><polyline class="fx-limb" points="${pl(s.legR)}"/>`;
    o += `<line class="fx-limb fx-foot" x1="${f1(s.legR[2][0])}" y1="${f1(s.legR[2][1])}" x2="${f1(s.legR[2][0] + 6)}" y2="${f1(s.legR[2][1] + 2)}"/><line class="fx-limb fx-foot" x1="${f1(s.legL[2][0])}" y1="${f1(s.legL[2][1])}" x2="${f1(s.legL[2][0] - 6)}" y2="${f1(s.legL[2][1] + 2)}"/>`;
    o += `<polyline class="fx-limb fx-torso" points="${pl([s.HL, s.HR])}"/>`;
    o += `<polyline class="fx-limb fx-torso fx-spine" points="${pl([s.pel, s.N])}"/>`;
    o += `<polyline class="fx-limb fx-torso" points="${pl([s.SL, s.SR])}"/>`;
    o += `<circle class="fx-head" cx="${f1(s.C[0])}" cy="${f1(s.C[1])}" r="${L.head}"/>`;
    if (!g && ex.sangle) { if (ex.sangle.includes("a")) o += strap(s.legR[2]); if (ex.sangle.includes("a2")) o += strap(s.legL[2]); }
    o += `<polyline class="fx-limb" points="${pl(s.armR)}"/><polyline class="fx-limb" points="${pl(s.armL)}"/>`;
    if (!g && bandsTop) o += bands(ex, s);
    if (!g && ex.barre) {
      const a = s.armL[2], b = s.armR[2];
      const v = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(v[0], v[1]) || 1, u = [v[0] / n, v[1] / n];
      const a2 = add(a, u, -14), b2 = add(b, u, 14);
      o += `<line class="fx-bar" x1="${f1(a2[0])}" y1="${f1(a2[1])}" x2="${f1(b2[0])}" y2="${f1(b2[1])}"/>`;
      o += `<circle class="fx-barend" cx="${f1(a2[0])}" cy="${f1(a2[1])}" r="4"/><circle class="fx-barend" cx="${f1(b2[0])}" cy="${f1(b2[1])}" r="4"/>`;
    }
    if (!g && ex.poignees) o += handle(s.armR[2]) + handle(s.armL[2]);
    if (!g) o += [s.legR[1], s.legL[1], s.armR[1], s.armL[1]].map(p => `<circle class="fx-joint" cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.4"/>`).join("");
    return o;
  }

  /* ---------- temps : aller-retour (par défaut) ou cycle */
  const tlCache = new WeakMap();
  function timeline(ex) {
    if (tlCache.has(ex)) return tlCache.get(ex);
    const n = ex.poses.length - 1;
    const d = ex.dur || [1.5, 1.5];
    const segs = [];
    if (ex.cycle) {
      for (let i = 0; i <= n; i++) segs.push({ a: i, b: (i + 1) % (n + 1), t: d[i] ?? d[d.length - 1], phase: i % 2 });
    } else {
      const hold = ex.hold || [.3, .3];
      const fw = n === 1 ? [d[0]] : d.slice(0, n);
      const bw = n === 1 ? [d[1] ?? d[0]] : d.slice(n);
      fw.forEach((t, i) => segs.push({ a: i, b: i + 1, t, phase: 0 }));
      segs.push({ hold: true, a: n, b: n, t: hold[1], phase: 0 });
      bw.slice().reverse().forEach((t, i) => segs.push({ a: n - i, b: n - i - 1, t: t ?? 1.5, phase: 1 }));
      segs.push({ hold: true, a: 0, b: 0, t: hold[0], phase: 1 });
    }
    const total = segs.reduce((s, x) => s + x.t, 0);
    const r = { segs, total };
    tlCache.set(ex, r);
    return r;
  }
  function poseAt(ex, time) {
    const tl = timeline(ex);
    let t = ((time % tl.total) + tl.total) % tl.total;
    for (const s of tl.segs) {
      if (t <= s.t) { const k = s.hold ? 0 : ease(t / s.t); return { P: mix(ex.poses[s.a], ex.poses[s.b], k), phase: s.phase }; }
      t -= s.t;
    }
    return { P: ex.poses[0], phase: 0 };
  }

  const VB = "40 10 260 220";
  function shell(ex, inner, live, label) {
    const ghosts = !ex.cycle && ex.poses.length > 1;
    return `<svg viewBox="${VB}" class="fx${live ? " fx-live" : ""}" ${label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`}><line x1="40" y1="218" x2="300" y2="218" class="fx-ground"/>${props(ex)}${ghosts ? `<g class="fx-ghost">${frame(ex, ex.poses[0], true)}</g><g class="fx-ghost">${frame(ex, ex.poses[ex.poses.length - 1], true)}</g>` : ""}<g class="fx-body">${inner}</g></svg>`;
  }
  function staticSVG(ex, which) {
    const P = ex.poses[which ?? Math.min(1, ex.poses.length - 1)];
    return shell(ex, frame(ex, P, false), false);
  }

  /* ---------- une seule boucle d'animation pour toutes les silhouettes visibles */
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = new Map();
  let raf = 0;
  function tick(now) {
    raf = 0;
    let any = false;
    for (const [el, st] of live) {
      if (!el.isConnected) { live.delete(el); continue; }
      if (!st.on) continue;
      any = true;
      if (st.fps && now - st.last < 1000 / st.fps) continue;
      st.last = now;
      if (st.paused) continue;
      const t = (now - st.start) / 1000 * st.speed;
      const r = poseAt(st.ex, t);
      st.g.innerHTML = frame(st.ex, r.P, false);
      if (st.onPhase && r.phase !== st.phase) { st.phase = r.phase; st.onPhase(r.phase); }
    }
    if (any) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  function mount(el, ex, opt = {}) {
    unmount(el);
    el.innerHTML = shell(ex, frame(ex, ex.poses[Math.min(1, ex.poses.length - 1)], false), true, opt.label);
    const st = { ex, g: el.querySelector(".fx-body"), start: performance.now() - (opt.offset || 0) * 1000, last: 0, speed: opt.speed || (reduce() ? .45 : 1), fps: opt.fps || 0, on: opt.on !== false, onPhase: opt.onPhase, phase: -1, paused: false };
    live.set(el, st);
    if (st.on) kick();
    return st;
  }
  function unmount(el) { live.delete(el); }
  function setOn(el, on) { const st = live.get(el); if (!st) return; st.on = on; if (on) kick(); }
  function setSpeed(el, sp) { const st = live.get(el); if (!st) return; const now = performance.now(); const t = (now - st.start) * st.speed; st.speed = sp; st.start = now - t / sp; }
  function setPaused(el, p) { const st = live.get(el); if (st) st.paused = p; }

  return { mount, unmount, setOn, setSpeed, setPaused, staticSVG, poseAt, timeline, frame, shell, solve, L };
})();
