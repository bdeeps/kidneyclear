// Chapter 5: more than a filter. The kidneys as a control centre: blood pressure through the
// renin–angiotensin–aldosterone system, water through ADH, red blood cells through erythropoietin,
// plus potassium, acid–base balance and vitamin D.
// Facts (Guyton & Hall, 14th ed., ch. 19, 26, 28 to 31; NIDDK "Your Kidneys & How They Work";
// NHS; Boron & Boulpaep ch. 40):
//  - Renin is released by juxtaglomerular cells of the afferent arteriole when pressure or
//    sodium delivery falls, and by sympathetic nerves. It cuts angiotensinogen (made by the liver)
//    into angiotensin I; angiotensin-converting enzyme (ACE), mostly on lung capillaries, makes
//    angiotensin II. Angiotensin II narrows arterioles (raising blood pressure), makes the kidneys
//    keep sodium, triggers thirst and ADH, and tells the adrenal cortex to release aldosterone.
//    Aldosterone makes the distal nephron keep sodium (and water) and get rid of potassium.
//  - ADH (vasopressin) is released by the posterior pituitary when blood osmolality rises above
//    about 280 to 290 mOsm/kg (a 1% rise is enough), or when blood volume or pressure falls a lot.
//  - Salty food raises blood osmolality → thirst and ADH → water kept → volume up; renin falls.
//  - Erythropoietin (EPO) is made mainly by cells between the kidney tubules when oxygen is low
//    (anaemia, high altitude); it tells the bone marrow to make more red blood cells, over days to
//    weeks. Kidneys also turn vitamin D into its active form, calcitriol (1α-hydroxylase in the
//    proximal tubule), which helps the gut absorb calcium.
//  - Potassium: normal blood level about 3.5 to 5.0 mmol/L (NHS); the kidneys excrete most of the
//    daily intake. Acid–base: blood pH is kept between 7.35 and 7.45; the kidneys reclaim filtered
//    bicarbonate and excrete about 50 to 100 mmol of acid a day (Guyton & Hall ch. 31).
// The levels shown are a simple qualitative teaching model (0 to 100%), not measurements.
import { THREE, M, canvasTexture, clamp, lerp } from '../kit.js';
import { makeTract, C, tint, board, fitNarrow, compactReadout, rnd, swarmOf, rrect, tissue } from '../kidney.js';

export function balanceModel(s) {
  const posm = 290 - 8 * s.water + 9 * s.salt;                  // mOsm/kg
  const vol = 0.55 * s.water + 0.25 * s.salt;                    // how full the blood vessels are (−1 … 1)
  const bpEff = s.bp + 10 * vol;                                  // mmHg change the kidney senses
  const renin = clamp(0.3 - 0.02 * bpEff - 0.15 * s.salt, 0, 1);
  const ang = renin, aldo = clamp(0.1 + 0.9 * ang, 0, 1);
  const adh = clamp(0.25 + (posm - 290) / 24 + clamp(-bpEff / 50, 0, 0.5), 0, 1);
  const epo = clamp(0.15 + 0.8 * s.lowO2, 0, 1);
  const U = 50 + 1150 * adh, V = (600 + 300 * s.salt) / U;
  return { posm, vol, bpEff, renin, ang, aldo, adh, epo, U, V };
}
const lvl = (v, base) => (v < base - 0.12 ? 'low' : v < base + 0.15 ? 'normal' : v < base + 0.35 ? 'raised' : 'high');
export const BASE = { renin: 0.3, ang: 0.3, aldo: 0.37, adh: 0.25, epo: 0.15 };

function drawBoard(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; rrect(g, 0, 0, w, h, 18); g.fill();
  g.fillStyle = '#e8ecf4'; g.font = '600 28px sans-serif'; g.fillText('The kidney’s control dials', 22, 42);
  const rows = [['Renin (kidney)', st.renin, '#6ee7a8', BASE.renin], ['Angiotensin II', st.ang, '#ffb547', BASE.ang], ['Aldosterone (adrenal)', st.aldo, '#c9a7ff', BASE.aldo], ['ADH (pituitary)', st.adh, '#8ef0ff', BASE.adh], ['EPO (kidney)', st.epo, '#ff6b9a', BASE.epo]];
  rows.forEach(([n, v, c, b], i) => {
    const y = 72 + i * 50;
    g.fillStyle = '#c9cfdb'; g.font = '21px sans-serif'; g.fillText(n, 22, y + 22);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(270, y + 4, w - 300, 24);
    g.fillStyle = c; g.fillRect(270, y + 4, (w - 300) * v, 24);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(270 + (w - 300) * b, y, 2, 32);
  });
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '16px sans-serif'; g.fillText('white tick: a resting level', 270, 340);
  // The loop as text boxes.
  const box = (x, y, bw, txt, col) => { g.strokeStyle = col; g.lineWidth = 2; rrect(g, x, y, bw, 40, 10); g.stroke(); g.fillStyle = col; g.font = '18px sans-serif'; g.fillText(txt, x + 10, y + 26); };
  const y0 = 370;
  box(22, y0, 250, 'Pressure or volume falls', '#ff8a8a'); box(340, y0, 230, 'Kidney releases renin', '#6ee7a8');
  box(340, y0 + 70, 230, 'Angiotensin II, aldosterone', '#c9a7ff'); box(22, y0 + 70, 250, 'Keep salt and water, squeeze vessels', '#ffd166');
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2;
  const ar = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 10 * Math.cos(a - 0.4), y2 - 10 * Math.sin(a - 0.4)); g.lineTo(x2 - 10 * Math.cos(a + 0.4), y2 - 10 * Math.sin(a + 0.4)); g.fill(); };
  g.fillStyle = 'rgba(255,255,255,.6)';
  ar(272, y0 + 20, 338, y0 + 20); ar(455, y0 + 40, 455, y0 + 68); ar(338, y0 + 90, 274, y0 + 90); ar(140, y0 + 68, 140, y0 + 42);
  g.fillStyle = '#e8ecf4'; g.font = '600 20px sans-serif'; g.fillText('…which brings pressure back up: negative feedback.', 22, y0 + 150);
}

// Where things are (in the chapter's frame; kidneys at the origin).
const NODE = {
  brain: { p: [0.2, 6.6, 0], name: 'Pituitary (brain): ADH', col: C.adh },
  lungs: { p: [-3.6, 4.6, 0.2], name: 'Lungs: ACE makes angiotensin II', col: 0xffb547 },
  liver: { p: [-3.9, 2.0, 0.3], name: 'Liver: angiotensinogen', col: 0xb86b50 },
  heart: { p: [1.4, 4.4, 0.3], name: 'Heart and blood vessels', col: 0xff6b6b },
  marrow: { p: [3.6, -4.2, 0.3], name: 'Bone marrow: red blood cells', col: C.epo },
};
const STREAMS = [
  { key: 'renin', from: [-1.4, 0.0, 0.2], via: [-3.4, 0.6, 0.6], to: NODE.liver.p, col: C.renin },
  { key: 'ang', from: NODE.liver.p, via: [-4.6, 3.4, 0.6], to: NODE.lungs.p, col: 0xffe066 },
  { key: 'ang', from: NODE.lungs.p, via: [-1.5, 3.4, 0.8], to: [-1.3, 1.65, -0.9], col: 0xffb547 },
  { key: 'ang', from: NODE.lungs.p, via: [-1.2, 5.6, 0.6], to: NODE.heart.p, col: 0xffb547 },
  { key: 'aldo', from: [-1.3, 1.65, -0.9], via: [-2.3, 1.2, 0.2], to: [-1.6, 0.2, -0.6], col: C.aldo },
  { key: 'aldo', from: [1.2, 1.7, -0.9], via: [2.4, 1.4, 0.2], to: [1.6, 0.4, -0.6], col: C.aldo },
  { key: 'adh', from: NODE.brain.p, via: [2.8, 4.0, 0.6], to: [1.8, 0.6, -0.4], col: C.adh },
  { key: 'adh', from: NODE.brain.p, via: [-2.2, 5.2, 1.2], to: [-1.8, 0.1, -0.4], col: C.adh },
  { key: 'epo', from: [2.0, -0.4, -0.5], via: [3.8, -1.6, 0.5], to: NODE.marrow.p, col: C.epo },
  { key: 'rbc', from: NODE.marrow.p, via: [4.6, 1.2, 0.6], to: NODE.heart.p, col: C.rbc },
];
const SCEN = {
  normal: { water: 0, salt: 0, bp: 0, lowO2: 0 },
  dry: { water: -0.9, salt: 0, bp: -5, lowO2: 0 },
  salty: { water: 0, salt: 1, bp: 0, lowO2: 0 },
  bleed: { water: -0.3, salt: 0, bp: -30, lowO2: 0.2 },
  altitude: { water: -0.2, salt: 0, bp: 0, lowO2: 0.9 },
};

export default {
  id: 'balance',
  short: 'More than a filter',
  title: 'The body’s control centre',
  subtitle: 'Kidneys steer blood pressure, water, salt, acid and even red blood cells.',
  view: { pos: [-5.2, 8.8, 18.7], target: [-5.8, 8.45, 0] },
  learn: `<p>Your kidneys don’t just clean blood. They decide how much <b>water</b>, <b>salt</b>, <b>potassium</b> and <b>acid</b> stay in your body, and they send out hormones. Because they see every drop of blood many times a day, they are in the perfect place to keep things steady.</p>
    <p><b>Blood pressure.</b> When pressure or blood volume falls, say after bleeding or losing water, cells in the kidney’s arterioles release <b>renin</b>. Renin starts a chain: it turns <b>angiotensinogen</b> from the liver into angiotensin I, and an enzyme in the lungs (ACE) makes <b>angiotensin II</b>. That squeezes blood vessels, makes you thirsty and tells the adrenal glands to release <b>aldosterone</b>, which makes the kidneys keep salt, and water follows. Pressure rises again. This is <b>negative feedback</b>. (Blood pressure itself is in <a href="/heartclear/#pressure">HeartClear</a>.)</p>
    <p><b>Water.</b> When your blood gets too concentrated, after a salty meal or a hot day, the brain’s pituitary releases <b>ADH</b> and you feel thirsty. The kidneys keep water until things are back to normal.</p>
    <p><b>Other jobs.</b> When blood carries too little oxygen, as at high altitude, the kidneys release <b>erythropoietin (EPO)</b>, which tells the bone marrow to make more <b>red blood cells</b>. They turn <b>vitamin D</b> into its active form so you can absorb calcium, keep <b>potassium</b> between about 3.5 and 5 mmol/L, and get rid of <b>acid</b> to hold blood pH near <b>7.4</b>. Your liver makes urea from spare protein, and the kidneys are how it leaves (see LiverClear).</p>
    <p class="tip"><b>Try it:</b> pick a situation, or move the sliders, and watch which hormones rise and where they travel. Can you find what makes the kidneys release EPO?</p>`,
  terms: [
    { t: 'Renin', d: 'An enzyme released by the kidney when blood pressure or volume falls. It starts the chain that makes angiotensin II.' },
    { t: 'Angiotensin II', d: 'A hormone that narrows blood vessels, causes thirst and triggers aldosterone.' },
    { t: 'Aldosterone', d: 'A hormone from the adrenal glands that makes the kidneys keep sodium and get rid of potassium.' },
    { t: 'Negative feedback', d: 'A control loop that pushes a change back towards normal, like a thermostat.' },
    { t: 'Erythropoietin (EPO)', d: 'A kidney hormone that tells bone marrow to make red blood cells when oxygen is low.' },
    { t: 'Calcitriol', d: 'The active form of vitamin D, made in the kidney, which helps the gut absorb calcium.' },
  ],
  defaults: { water: 0, salt: 0, bp: 0, lowO2: 0, labels: true },
  controls: [
    { key: 'go', type: 'buttons', label: 'Situations', items: [
      { label: 'Normal day', act: (s) => Object.assign(s, SCEN.normal) },
      { label: 'Dehydrated', act: (s) => Object.assign(s, SCEN.dry) },
      { label: 'Salty meal', act: (s) => Object.assign(s, SCEN.salty) },
      { label: 'Bleeding', act: (s) => Object.assign(s, SCEN.bleed) },
      { label: 'High mountains', act: (s) => Object.assign(s, SCEN.altitude) },
    ] },
    { key: 'water', type: 'range', label: 'Water in the body', min: -1, max: 1, step: 0.01, ends: ['dehydrated', 'well watered'], fmt: (v) => (v < -0.3 ? 'low' : v > 0.3 ? 'plenty' : 'normal') },
    { key: 'salt', type: 'range', label: 'Salt just eaten', min: 0, max: 1, step: 0.01, ends: ['none', 'very salty meal'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'bp', type: 'range', label: 'Blood pressure change', min: -40, max: 30, step: 1, ends: ['falls', 'rises'], fmt: (v) => (v > 0 ? '+' : '') + Math.round(v) + ' mmHg' },
    { key: 'lowO2', type: 'range', label: 'Oxygen in the blood', min: 0, max: 1, step: 0.01, ends: ['normal', 'low (e.g. high altitude)'], fmt: (v) => (v < 0.2 ? 'normal' : v < 0.6 ? 'a bit low' : 'low') },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Blood pressure falls after bleeding. What do the kidneys release first?', options: ['Insulin', 'Renin', 'Urea', 'Adrenaline'], answer: 1, why: 'Renin starts the chain to angiotensin II and aldosterone, which squeeze vessels and keep salt and water.' },
    { q: 'What does erythropoietin (EPO) do?', options: ['Filters blood', 'Tells bone marrow to make more red blood cells', 'Breaks down proteins', 'Stores urine'], answer: 1, why: 'When oxygen is low, the kidneys release EPO and the marrow makes more red cells over days to weeks.' },
    { q: 'After a very salty meal, what happens?', options: ['You feel thirsty and ADH rises, so the kidneys keep water', 'The kidneys stop working', 'Renin rises sharply', 'Urine becomes very pale'], answer: 0, why: 'Salt makes the blood more concentrated, so thirst and ADH rise. Renin actually falls, and the extra salt is passed out over the next day or so.' },
  ],
  reel: [
    { ms: 5600, caption: 'When blood pressure drops, kidneys release renin, a chain that squeezes vessels and saves salt.', set: { water: -0.3, salt: 0, lowO2: 0, labels: false }, anim: { bp: [0, -30] }, view: { pos: [-0.2, 8.0, 17], target: [-0.3, 7.4, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = 6.4; stage.root.add(root);
    const tr = makeTract(stage, { labels: false, context: false, flow: true });
    tr.G.ureter.visible = false; tr.G.bladder.visible = false;
    tr.root.position.y = -0.1; root.add(tr.root);
    // Nodes.
    const nodes = {}, nodeLabs = [];
    for (const [k, n] of Object.entries(NODE)) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), tissue(n.col, { opacity: 0.85, emissive: new THREE.Color(n.col).multiplyScalar(0.25) }));
      m.position.set(...n.p); root.add(m); nodes[k] = m;
      nodeLabs.push(tint(stage.label(n.name, [n.p[0], n.p[1] + 0.72, n.p[2]], root), k === 'marrow' ? 'pink' : k === 'brain' ? 'side' : k === 'heart' ? 'blood' : 'gold'));
    }
    const kLab = [tint(stage.label('Kidneys', [0, -1.9, 0.3], root), 'pink'), tint(stage.label('Adrenal glands: aldosterone', [2.8, 2.35, -0.6], root), 'hormone')];
    // Hormone streams.
    const streams = STREAMS.map((S, i) => {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...S.from), new THREE.Vector3(...S.via), new THREE.Vector3(...S.to));
      const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.025, 6), M.ghost(S.col, 0.18)); root.add(line);
      const n = 14, m = swarmOf(n, S.key === 'rbc' ? new THREE.CylinderGeometry(0.12, 0.12, 0.05, 14) : new THREE.SphereGeometry(0.085, 10, 8), M.glow(S.col)); root.add(m);
      return { ...S, curve, m, n, seed: i * 13 };
    });
    const st = balanceModel({ water: 0, salt: 0, bp: 0, lowO2: 0 });
    const chart = canvasTexture(660, 560, (g, w, h) => drawBoard(g, w, h, st));
    const brd = board(chart, 7.5, 6.36); brd.position.set(-10.9, -2.5, -0.4); brd.rotation.y = 0.15; root.add(brd);
    const _p = new THREE.Vector3();
    let t = 0, last = '', rbcLevel = 0.3;
    const fit = fitNarrow(stage, { pos: [0, 12.1, 21], target: [0, 12.1, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        Object.assign(st, balanceModel(s));
        const sig = [s.water, s.salt, s.bp, s.lowO2].map((v) => v.toFixed(2)).join();
        if (sig !== last) { last = sig; chart.redraw(); }
        tr.flow.step(dt * (1 + st.bpEff / 60));
        rbcLevel += (st.epo - rbcLevel) * Math.min(1, dt * 0.5);
        const levels = { renin: st.renin, ang: st.ang, aldo: st.aldo, adh: st.adh, epo: st.epo, rbc: rbcLevel };
        streams.forEach((S) => {
          const L = levels[S.key], show = Math.round(S.n * clamp(L * 1.2, 0.05, 1));
          for (let i = 0; i < S.n; i++) {
            if (i >= show) { S.m.hide(i); continue; }
            const u = (rnd(S.seed + i) + t * 0.22) % 1;
            S.curve.getPointAt(u, _p); S.m.place(i, _p.toArray(), S.key === 'rbc' ? [t + i, i, 0.5] : null);
          }
          S.m.done();
        });
        // Arterioles squeeze with angiotensin II: shown by the heart node pulsing harder.
        nodes.heart.scale.setScalar(1 + 0.08 * Math.sin(t * 7) * (0.6 + st.ang));
        nodes.marrow.scale.setScalar(1 + 0.25 * rbcLevel);
        const narrow = fit();
        nodeLabs.forEach((l) => { l.visible = s.labels && !narrow; }); kLab.forEach((l) => { l.visible = s.labels && !narrow; });
        brd.visible = !narrow;
      },
      readout: (s) => {
        const B = balanceModel(s);
        const what = s.lowO2 > 0.5 ? 'Low oxygen: the kidneys send EPO, and over days to weeks the marrow makes more red cells.'
          : B.bpEff < -8 ? 'Pressure and volume are low: renin, angiotensin II and aldosterone rise, and so does ADH. Salt and water are kept and vessels squeeze.'
          : s.salt > 0.5 ? 'A salty meal makes blood more concentrated: you feel thirsty, ADH rises and water is kept. Renin falls, so the extra salt is passed out over a day or so.'
          : B.posm > 295 ? 'Blood is getting concentrated: ADH rises and urine gets darker.'
          : 'Everything near its set point.';
        return `<div class="big">Blood salt ${Math.round(B.posm)} mOsm/kg</div>
          <div class="row"><span>Renin and aldosterone</span><b>${lvl(B.aldo, BASE.aldo)}</b></div>
          <div class="row"><span>ADH</span><b>${lvl(B.adh, BASE.adh)}</b></div>
          <div class="row"><span>Urine</span><b>about ${B.V.toFixed(1)} L a day at this rate</b></div>
          <div class="row"><span>EPO</span><b>${lvl(B.epo, BASE.epo)}</b></div>
          <small>${what} A simple teaching model.</small>`;
      },
    });
  },
};
