/* Cap 110 · Élastiques — programmes en chrono.
   Une séance = des blocs. Chaque bloc : temps de travail w (s), repos r (s), nombre de tours,
   repos entre les tours rt (s), et la liste des exercices dans l'ordre. */
const ECH = {
  debout: { nom: "Échauffement", w: 40, r: 10, tours: 1, exos: ["marche-place", "moulinets", "ecartement", "coude-genou", "rotation-debout"] },
  doux: { nom: "Échauffement", w: 40, r: 10, tours: 1, exos: ["marche-place", "moulinets", "ecartement", "boxe-assis"] },
  assis: { nom: "Échauffement assis", w: 40, r: 10, tours: 1, exos: ["boxe-assis", "rotation-assis", "face-pull-assis", "genoux-assis"] }
};
const CALME = {
  debout: { nom: "Retour au calme", w: 40, r: 10, tours: 1, exos: ["etirement-dorsaux", "etirement-lateral", "etirement-ischios", "etirement-mollets"] },
  assis: { nom: "Retour au calme", w: 40, r: 10, tours: 1, exos: ["etirement-ischios", "rotation-assis", "face-pull-assis"] }
};
const C = (nom, w, r, tours, rt, exos) => ({ nom, w, r, tours, rt, exos });

/* ---------- séances du plan 12 semaines (les temps sont ajustés semaine par semaine) */
const PLAN12 = {
  phases: [
    { de: 1, a: 4, niv: 1, nom: "Fondations", txt: "Tout en Facile : chaise, appui, élastiques légers. Tu apprends les gestes." },
    { de: 5, a: 8, niv: 2, nom: "Construction", txt: "Passage au Moyen : la barre, debout sans appui, élastiques de 10 à 25 kg." },
    { de: 9, a: 12, niv: 3, nom: "Accélération", txt: "Moyen et Difficile mélangés, plus de tours, moins de repos." }
  ],
  semaines: [
    [30, 30, 2], [30, 30, 3], [35, 25, 3], [40, 20, 3],
    [30, 30, 3], [35, 25, 3], [40, 20, 3], [40, 20, 4],
    [35, 25, 3], [40, 20, 3], [40, 20, 4], [45, 15, 4]
  ],
  seances: {
    1: {
      A: { nom: "A · Corps entier", exos: ["assis-debout", "rowing-assis", "pompes-mur", "kickback-fessier", "developpe-epaules-assis", "pallof"] },
      B: { nom: "B · Corps entier", exos: ["extension-genou-assis", "tirage-vertical-assis", "developpe-assis", "abduction-debout", "curl-assis", "crunch-assis"] },
      C: { nom: "C · Cardio doux", exos: ["marche-place", "boxe-elastique", "genou-contrarie", "jumping-jack", "rowing-debout", "coude-genou"] }
    },
    2: {
      A: { nom: "A · Corps entier", exos: ["squat-barre", "rowing-barre", "developpe-debout", "pull-through", "developpe-militaire", "rotation-debout"] },
      B: { nom: "B · Corps entier", exos: ["souleve-terre", "tirage-vertical-debout", "ecarte-debout", "fente-statique", "face-pull", "crunch-debout"] },
      C: { nom: "C · Cardio sans saut", exos: ["squat-tirage", "boxe-elastique", "marche-laterale", "vagues", "genoux-hauts", "bucheron-haut"] }
    },
    3: {
      A: { nom: "A · Force", exos: ["squat-pause", "souleve-rowing", "developpe-debout", "fente-arriere-barre", "developpe-militaire", "bucheron-bas"] },
      B: { nom: "B · Force", exos: ["souleve-une-jambe", "rowing-une-main", "pompes-table", "fente-laterale", "tirage-bras-tendus", "crunch-debout"] },
      C: { nom: "C · Cardio intense", exos: ["thruster", "vagues", "patineur", "grimpeur-table", "squat-tirage", "genoux-hauts"] }
    }
  }
};
function plan12Seance(sem, lettre) {
  const ph = PLAN12.phases.find(p => sem >= p.de && sem <= p.a);
  const [w, r, tours] = PLAN12.semaines[sem - 1];
  const s = PLAN12.seances[ph.niv][lettre];
  const ech = ph.niv === 1 ? ECH.doux : ECH.debout;
  return {
    id: `plan12-s${sem}-${lettre}`, nom: `Semaine ${sem} · ${s.nom}`, niv: ph.niv, plan: true,
    blocs: [ech, C("Circuit", w, r, tours, 60, s.exos), CALME.debout]
  };
}

/* ---------- programmes prêts à lancer */
const PROGS = [
  { id: "douceur", nom: "Départ en douceur", niv: 1, semaines: "4 semaines · 3 séances", focus: "Corps entier, beaucoup d'assis",
    desc: "Le point de départ. Une chaise, des élastiques légers, 30 secondes d'effort et autant de repos. Fais les trois séances dans la semaine, avec un jour de pause entre chaque.",
    seances: [
      { id: "douceur-1", nom: "Haut du corps assis", niv: 1, blocs: [ECH.assis, C("Circuit", 30, 30, 2, 60, ["rowing-assis", "developpe-assis", "tirage-vertical-assis", "developpe-epaules-assis", "curl-assis", "crunch-assis"]), CALME.assis] },
      { id: "douceur-2", nom: "Bas du corps avec appui", niv: 1, blocs: [ECH.doux, C("Circuit", 30, 30, 2, 60, ["assis-debout", "extension-genou-assis", "kickback-fessier", "abduction-debout", "presse-assise", "mollets-barre"]), CALME.debout] },
      { id: "douceur-3", nom: "Corps entier en douceur", niv: 1, blocs: [ECH.doux, C("Circuit", 30, 30, 2, 60, ["assis-debout", "rowing-debout", "pompes-mur", "genou-contrarie", "elevations-laterales", "pallof", "boxe-elastique"]), CALME.debout] }
    ] },
  { id: "assis", nom: "100 % assis", niv: 1, semaines: "À volonté", focus: "Jours de douleurs aux genoux ou au dos",
    desc: "Rien debout, rien au sol. Pour les jours où les articulations tirent, ou pour bouger devant la télé.",
    seances: [
      { id: "assis-1", nom: "Assis · haut du corps", niv: 1, blocs: [ECH.assis, C("Circuit", 30, 30, 3, 60, ["rowing-assis", "developpe-assis", "tirage-vertical-assis", "ecarte-assis", "curl-assis", "triceps-assis"]), CALME.assis] },
      { id: "assis-2", nom: "Assis · corps entier", niv: 1, blocs: [ECH.assis, C("Circuit", 30, 30, 3, 60, ["presse-assise", "rowing-assis", "extension-genou-assis", "developpe-epaules-assis", "genoux-assis", "boxe-assis", "crunch-assis"]), CALME.assis] }
    ] },
  { id: "express", nom: "Express 10 minutes", niv: 0, semaines: "Tous les jours", focus: "Quand le temps manque",
    desc: "Dix minutes qui comptent. Un niveau par séance : prends celui où tu peux encore parler à la fin de chaque effort.",
    seances: [
      { id: "express-1", nom: "Express Facile", niv: 1, blocs: [C("Mise en route", 30, 0, 1, 0, ["marche-place"]), C("Circuit", 30, 20, 2, 30, ["assis-debout", "rowing-debout", "pompes-mur", "kickback-fessier", "boxe-elastique", "pallof"])] },
      { id: "express-2", nom: "Express Moyen", niv: 2, blocs: [C("Mise en route", 30, 0, 1, 0, ["marche-place"]), C("Circuit", 40, 20, 2, 30, ["squat-barre", "rowing-barre", "developpe-debout", "marche-laterale", "squat-tirage", "rotation-debout"])] },
      { id: "express-3", nom: "Express Difficile", niv: 3, blocs: [C("Mise en route", 30, 0, 1, 0, ["genoux-hauts"]), C("Circuit", 40, 15, 2, 30, ["thruster", "souleve-rowing", "fente-arriere-barre", "pompes-table", "vagues", "bucheron-haut"])] }
    ] },
  { id: "brule", nom: "Brûle-calories sans saut", niv: 2, semaines: "2 à 3 fois par semaine", focus: "Cardio et dépense",
    desc: "Des circuits qui font monter le souffle sans un seul saut. Les genoux et le dos sont épargnés, le cœur travaille.",
    seances: [
      { id: "brule-1", nom: "Circuit cardio 1", niv: 2, blocs: [ECH.debout, C("Circuit", 40, 20, 4, 60, ["squat-tirage", "boxe-elastique", "marche-laterale", "vagues", "genoux-hauts", "jumping-jack"]), CALME.debout] },
      { id: "brule-2", nom: "Circuit cardio 2", niv: 2, blocs: [ECH.debout, C("Circuit", 40, 20, 4, 60, ["patineur", "bucheron-haut", "squat-barre", "coude-genou", "rowing-debout", "bucheron-bas"]), CALME.debout] }
    ] },
  { id: "split", nom: "Haut et bas séparés", niv: 2, semaines: "4 séances par semaine", focus: "Plus de volume par muscle",
    desc: "Un jour le haut, un jour le bas. Chaque muscle a 48 heures pour récupérer pendant que l'autre moitié travaille.",
    seances: [
      { id: "split-haut", nom: "Haut du corps", niv: 2, blocs: [ECH.debout, C("Dos et poitrine", 40, 20, 3, 60, ["rowing-barre", "developpe-debout", "tirage-vertical-debout", "ecarte-debout"]), C("Épaules et bras", 40, 20, 2, 60, ["developpe-militaire", "face-pull", "curl-barre", "triceps-tete"]), CALME.debout] },
      { id: "split-bas", nom: "Bas du corps", niv: 2, blocs: [ECH.debout, C("Jambes", 40, 20, 3, 60, ["squat-barre", "souleve-roumain", "fente-statique", "pull-through"]), C("Fessiers et mollets", 40, 20, 2, 60, ["marche-laterale", "adduction-debout", "kickback-fessier", "mollets-barre"]), CALME.debout] }
    ] },
  { id: "abdos", nom: "Ventre et gainage debout", niv: 1, semaines: "2 fois par semaine", focus: "Abdominaux sans aller au sol",
    desc: "Tout se fait debout ou assis. Le ventre travaille en résistant aux rotations, ce qui protège aussi le dos.",
    seances: [
      { id: "abdos-1", nom: "Gainage Facile", niv: 1, blocs: [ECH.doux, C("Circuit", 30, 30, 3, 60, ["pallof", "crunch-assis", "flexion-laterale", "genoux-assis", "rotation-assis"]), CALME.debout] },
      { id: "abdos-2", nom: "Gainage Moyen", niv: 2, blocs: [ECH.debout, C("Circuit", 40, 20, 3, 60, ["rotation-debout", "bucheron-haut", "crunch-debout", "gainage-table", "bucheron-bas", "genoux-hauts"]), CALME.debout] }
    ] },
  { id: "pyramide", nom: "Pyramide", niv: 2, semaines: "1 fois par semaine", focus: "Changer de rythme",
    desc: "Les mêmes quatre mouvements, 20 secondes, puis 30, puis 40, et on redescend. Tu sens la différence entre chaque palier.",
    seances: [
      { id: "pyramide-1", nom: "Pyramide 20-30-40-30-20", niv: 2, blocs: [ECH.debout,
        C("Palier 20 s", 20, 20, 1, 0, ["squat-barre", "rowing-debout", "developpe-debout", "boxe-elastique"]),
        C("Palier 30 s", 30, 20, 1, 0, ["squat-barre", "rowing-debout", "developpe-debout", "boxe-elastique"]),
        C("Palier 40 s", 40, 20, 1, 0, ["squat-barre", "rowing-debout", "developpe-debout", "boxe-elastique"]),
        C("Palier 30 s", 30, 20, 1, 0, ["squat-barre", "rowing-debout", "developpe-debout", "boxe-elastique"]),
        C("Palier 20 s", 20, 20, 1, 0, ["squat-barre", "rowing-debout", "developpe-debout", "boxe-elastique"]), CALME.debout] }
    ] },
  { id: "force", nom: "Force à la barre", niv: 3, semaines: "2 fois par semaine", focus: "Charges lourdes, plus de muscle",
    desc: "La barre avec deux ou trois élastiques accrochés. Efforts plus longs, vrais repos. Le muscle gagné brûle des calories même au repos.",
    seances: [
      { id: "force-1", nom: "Force A", niv: 3, blocs: [ECH.debout, C("Circuit lourd", 45, 30, 4, 90, ["squat-pause", "rowing-barre", "developpe-militaire", "souleve-terre"]), CALME.debout] },
      { id: "force-2", nom: "Force B", niv: 3, blocs: [ECH.debout, C("Circuit lourd", 45, 30, 4, 90, ["fente-arriere-barre", "souleve-rowing", "developpe-debout", "thruster"]), CALME.debout] }
    ] },
  { id: "tabata", nom: "Tabata élastiques", niv: 3, semaines: "1 fois par semaine", focus: "Intervalles courts et intenses",
    desc: "20 secondes à fond, 10 secondes de repos, huit fois par paire d'exercices. Réservé à quand le Moyen ne te fait plus rien.",
    seances: [
      { id: "tabata-1", nom: "Tabata 4 × 4 minutes", niv: 3, blocs: [ECH.debout,
        C("Tabata 1", 20, 10, 4, 10, ["squat-tirage", "boxe-elastique"]),
        C("Tabata 2", 20, 10, 4, 10, ["thruster", "vagues"]),
        C("Tabata 3", 20, 10, 4, 10, ["patineur", "rowing-debout"]),
        C("Tabata 4", 20, 10, 4, 10, ["genoux-hauts", "bucheron-haut"]), CALME.debout] }
    ] },
  { id: "mobilite", nom: "Mobilité et récupération", niv: 1, semaines: "Les jours de repos", focus: "Souplesse, dos, épaules",
    desc: "Un quart d'heure pour délier le dos, les épaules et les hanches. Parfait le lendemain d'une grosse séance.",
    seances: [
      { id: "mobilite-1", nom: "Récupération 15 minutes", niv: 1, blocs: [C("Mobilité", 45, 15, 2, 30, ["marche-place", "moulinets", "passage-epaules", "etirement-lateral", "etirement-dorsaux", "etirement-ischios", "etirement-quadriceps", "etirement-mollets"])] }
    ] }
];

/* ---------- construction de la ligne de temps d'une séance */
const EXO = Object.fromEntries(EXOS.map(e => [e.id, e]));
function buildTimeline(seance, opt = {}) {
  const dr = opt.deltaRepos || 0;
  const segs = [];
  const blocs = seance.blocs.map(b => ({ ...b, r: Math.max(b.r ? 5 : 0, b.r + (b.r ? dr : 0)), rt: Math.max(0, (b.rt || 0) + (b.rt ? dr : 0)) }));
  const first = EXO[blocs[0].exos[0]];
  segs.push({ type: "prep", d: 10, ex: first, label: "Prépare-toi" });
  blocs.forEach((b, bi) => {
    for (let t = 1; t <= b.tours; t++) {
      b.exos.forEach((id, i) => {
        const ex = EXO[id];
        segs.push({ type: "work", d: b.w, ex, bloc: b.nom, bi, tour: t, tours: b.tours, i, n: b.exos.length });
        const lastExo = i === b.exos.length - 1;
        if (!lastExo) { if (b.r > 0) segs.push({ type: "rest", d: b.r, ex: EXO[b.exos[i + 1]], label: "Repos" }); }
        else if (t < b.tours) { const d = b.rt || b.r; if (d > 0) segs.push({ type: "rest", d, ex: EXO[b.exos[0]], label: d > b.r ? "Repos entre les tours" : "Repos" }); }
        else if (bi < blocs.length - 1) { const nb = blocs[bi + 1]; segs.push({ type: "rest", d: Math.max(20, b.rt ? Math.min(b.rt, 45) : 20), ex: EXO[nb.exos[0]], label: "On passe à : " + nb.nom.toLowerCase() }); }
      });
    }
  });
  return segs;
}
const totalSec = segs => segs.reduce((s, x) => s + x.d, 0);
function kcalOf(segs, kg) {
  let k = 0;
  for (const s of segs) {
    const met = s.type === "work" ? s.ex.met : s.type === "rest" ? 1.8 : 1.5;
    k += met * kg * s.d / 3600;
  }
  return k;
}

/* ---------- générateur de séance sur mesure */
function rngFrom(seed) {
  let h = 2166136261 ^ seed;
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const FOCUS = {
  corps: { nom: "Corps entier", ordre: ["jambes", "dos", "poitrine", "cardio", "jambes", "epaules", "abdos", "bras", "dos", "cardio"] },
  haut: { nom: "Haut du corps", ordre: ["dos", "poitrine", "epaules", "bras", "dos", "poitrine", "abdos", "bras", "epaules", "dos"] },
  bas: { nom: "Jambes et fessiers", ordre: ["jambes", "jambes", "cardio", "jambes", "abdos", "jambes", "jambes", "cardio", "jambes", "jambes"] },
  ventre: { nom: "Ventre et taille", ordre: ["abdos", "abdos", "cardio", "abdos", "jambes", "abdos", "cardio", "abdos", "abdos", "dos"] },
  cardio: { nom: "Cardio brûle-calories", ordre: ["cardio", "jambes", "cardio", "dos", "cardio", "abdos", "cardio", "jambes", "cardio", "poitrine"] }
};
function generer(o) {
  const R = rngFrom(o.seed || 1);
  const okPos = e => o.position === "assis" ? e.pos === "assis" : o.position === "sanssol" ? e.pos !== "sol" : true;
  const okNiv = e => o.niv === 1 ? e.niv === 1 : o.niv === 2 ? e.niv <= 2 : e.niv >= 2;
  const assis0 = o.position === "assis";
  const ech0 = assis0 ? ECH.assis : (o.niv === 1 ? ECH.doux : ECH.debout);
  const hors = new Set(o.ech ? ech0.exos : []);
  let pool = EXOS.filter(e => e.cat !== "mobilite" && okPos(e) && okNiv(e) && !e.statique && !hors.has(e.id));
  if (pool.length < 6) pool = EXOS.filter(e => e.cat !== "mobilite" && okPos(e) && !hors.has(e.id));
  const n = 10;
  const used = new Set(), pick = [];
  const ordre = FOCUS[o.focus].ordre;
  for (let i = 0; pick.length < n && i < 60; i++) {
    const cat = ordre[i % ordre.length];
    let cand = pool.filter(e => e.cat === cat && !used.has(e.id));
    if (!cand.length) cand = pool.filter(e => !used.has(e.id) && ordre.includes(e.cat));
    if (!cand.length) cand = pool.filter(e => !used.has(e.id));
    if (!cand.length) break;
    const e = cand[Math.floor(R() * cand.length)];
    used.add(e.id); pick.push(e.id);
  }
  const assis = o.position === "assis";
  const ech = assis ? ECH.assis : (o.niv === 1 ? ECH.doux : ECH.debout);
  const calme = assis ? CALME.assis : CALME.debout;
  const cible = o.duree * 60;
  const make = (k, tours) => {
    const blocs = [];
    if (o.ech) blocs.push(ech);
    blocs.push(C("Circuit", o.w, o.r, tours, 60, pick.slice(0, k)));
    if (o.calme) blocs.push(calme);
    return blocs;
  };
  let best = null;
  for (let k = Math.min(5, pick.length); k <= pick.length; k++) {
    for (let tours = 1; tours <= 8; tours++) {
      const t = totalSec(buildTimeline({ blocs: make(k, tours) }));
      const score = Math.abs(t - cible) + (tours === 1 && o.duree >= 15 ? 240 : 0) + (k < 6 && o.duree >= 20 ? 120 : 0);
      if (!best || score < best.score) best = { score, k, tours };
    }
  }
  return { id: "surmesure-" + (o.seed || 1), nom: `${FOCUS[o.focus].nom} · ${o.duree} min`, niv: o.niv, blocs: make(best.k, best.tours), tours: best.tours };
}
