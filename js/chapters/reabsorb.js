// Chapter 4: reabsorption and concentrating urine. A nephron drawn straight (a schematic), with
// the salty medulla behind it, particles of water, salt, glucose and urea taken back along the
// way, and a board of how concentrated the tubular fluid is at each point.
// Facts:
//  - About 180 L/day filtered, about 1 to 2 L/day of urine: about 99% of the water is
//    reabsorbed (Guyton & Hall, 14th ed., ch. 28; NIDDK).
//  - Proximal tubule: about 65% of filtered sodium and water, nearly all glucose and amino acids,
//    and about half of the urea (Guyton & Hall, ch. 28). Thin descending limb: permeable to water
//    (about 20% of filtered water is reabsorbed in the loop), little salt. Thick ascending limb:
//    pumps out about 25% of filtered sodium (Na⁺-K⁺-2Cl⁻ co-transporter) but is impermeable to
//    water, so the fluid leaving it is dilute (about 100 mOsm/kg). Distal tubule about 5% of
//    sodium; collecting ducts the rest, with water taken back only when ADH is present
//    (aquaporin-2 channels). Guyton & Hall, ch. 28 and 29.
//  - Countercurrent multiplier: the loop builds a gradient in the medulla from about 300 mOsm/kg
//    at the cortex to about 1,200 mOsm/kg at the tip of the papilla in humans (up to about 1,400
//    in Guyton & Hall, ch. 29). Urea recycling, boosted by ADH, supplies about half of it.
//  - Urine concentration ranges from about 50 to 1,200 mOsm/kg (Guyton & Hall, ch. 29). With about
//    600 mOsm of solutes to get rid of each day, the smallest possible urine volume ("obligatory
//    urine volume") is 600 ÷ 1,200 = 0.5 L/day.
//  - Water balance in a typical day (Guyton & Hall, table 25-1): 2.1 L drunk or in food plus
//    0.2 L made by metabolism; losses 0.7 L through skin and lungs, 0.1 L sweat, 0.1 L faeces,
//    1.4 L urine. We use urine ≈ intake − 0.7 L in steady state.
//  - Glucose: the renal threshold, above which glucose starts to appear in urine, is about 180 to
//    200 mg/dL of blood glucose; transport maximum about 375 mg/min (Guyton & Hall, ch. 28,
//    fig. 28-9; Diabetes UK and NHS materials use about 180 mg/dL, 10 mmol/L). Extra glucose in
//    the tubule holds water with it (osmotic diuresis), which is why untreated diabetes can cause
//    thirst and frequent urination (NIDDK "Symptoms & Causes of Diabetes").
//  - The glucose excretion curve here (a smoothed "splay" above 180 mg/dL) and the link from
//    drinking to ADH are simple teaching models, not a clinical calculator.
import { THREE, M, arrow, canvasTexture, clamp, lerp, smooth, tube } from '../kit.js';
import { C, NEPH, tissue, tint, board, fitNarrow, compactReadout, rnd, swarmOf, rrect, urineColour } from '../kidney.js';

// ---------------------------------------------------------------- the model
export const SOLUTE = 600;                          // mOsm to excrete a day (typical)
export function kidneyState(drink, bg) {
  const filtG = 1.8 * bg;                           // g/day: 180 L × bg mg/dL
  const excG = bg > 180 ? 1.8 * (bg - 180) * smooth((bg - 180) / 150) : 0;
  const S = SOLUTE + excG * 5.56;                   // glucose 180 g/mol → 5.56 mOsm per g
  const want = Math.max(0.2, drink - 0.7);          // L/day the body needs to get rid of
  const Uraw = S / want;
  const U = clamp(Uraw, 50, 1200), V = S / U;
  const adh = Math.pow(clamp((U - 50) / 1150, 0, 1), 0.7);
  return { filtG, excG, spill: excG / filtG, S, U, V, adh, short: Math.max(0, V - want), medMax: 600 + 600 * adh };
}
const colourName = (u) => (u < 150 ? 'very pale, nearly clear' : u < 400 ? 'pale straw' : u < 700 ? 'yellow' : u < 1000 ? 'dark yellow' : 'dark amber');

// Schematic path of a nephron, straightened (units; cortex above y = 2.2).
const PATH = {
  pct: [[-4.55, 3.15, 0], [-4.1, 3.55, 0], [-3.7, 2.95, 0], [-3.3, 3.5, 0], [-2.9, 2.95, 0], [-2.55, 3.35, 0], [-2.4, 2.6, 0]],
  desc: [[-2.4, 2.6, 0], [-2.4, 0, 0], [-2.4, -3.7, 0], [-2.2, -4.1, 0], [-1.8, -4.1, 0]],
  asc: [[-1.8, -4.1, 0], [-1.6, -3.8, 0], [-1.6, -1.6, 0]],
  tal: [[-1.6, -1.6, 0], [-1.6, 0.6, 0], [-1.6, 2.9, 0]],
  dct: [[-1.6, 2.9, 0], [-1.1, 3.5, 0], [-0.55, 2.95, 0], [0.0, 3.45, 0], [0.55, 3.0, 0], [1.2, 3.3, 0]],
  cd: [[1.2, 3.3, 0], [1.2, 0, 0], [1.2, -4.4, 0], [1.2, -5.1, 0]],
};
const RADIUS = { pct: 0.2, desc: 0.1, asc: 0.1, tal: 0.15, dct: 0.15, cd: 0.22 };
const KEYS = ['pct', 'desc', 'asc', 'tal', 'dct', 'cd'];

function drawGradient(g, w, h, st) {
  // The medulla behind the loop: saltier (redder) the deeper it goes.
  const top = 0.21 * h, tip = 0.8 * h;              // cortex / medulla boundary (y = 2.2) and loop tip (y = −4.1)
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(179,80,63,.35)'; g.fillRect(0, 0, w, top);
  const gr = g.createLinearGradient(0, top, 0, tip);
  const k = (st.medMax - 300) / 900;
  gr.addColorStop(0, 'rgba(120,40,50,.35)'); gr.addColorStop(1, `rgba(${Math.round(150 + 90 * k)},${Math.round(40 - 20 * k)},${Math.round(60 - 20 * k)},${0.45 + 0.4 * k})`);
  g.fillStyle = gr; g.fillRect(0, top, w, h - top);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '600 26px sans-serif';
  g.fillText('Cortex: 300', 14, top - 14);
  for (let i = 1; i <= 3; i++) { const y = top + (i / 3) * (tip - top); const v = Math.round((300 + (st.medMax - 300) * (i / 3)) / 10) * 10; g.fillText(`${v}`, 14, y + 8); }
  g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('mOsm/kg in the medulla', 14, top + 34);
}
function drawBoard(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; rrect(g, 0, 0, w, h, 18); g.fill();
  g.fillStyle = '#e8ecf4'; g.font = '600 28px sans-serif'; g.fillText('How concentrated is the fluid inside?', 22, 40);
  const pts = [['Capsule', 300], ['End of proximal', 300], ['Bottom of loop', st.medMax], ['Top of loop', 100], ['End of distal', lerp(100, 280, st.adh)], ['Urine', st.U]];
  const L = 90, R = w - 40, T = 70, B = h - 150, X = (i) => L + (i / (pts.length - 1)) * (R - L), Y = (v) => B - (v / 1300) * (B - T);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '17px sans-serif';
  [0, 300, 600, 900, 1200].forEach((v) => { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); g.fillText(v, 30, Y(v) + 6); });
  g.fillStyle = 'rgba(143,211,255,.8)'; g.fillText('blood 290', R - 90, Y(290) - 6);
  g.strokeStyle = '#ffd166'; g.lineWidth = 5; g.beginPath(); pts.forEach(([, v], i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)))); g.stroke();
  pts.forEach(([n, v], i) => { g.fillStyle = '#ffd166'; g.beginPath(); g.arc(X(i), Y(v), 7, 0, 7); g.fill(); g.save(); g.translate(X(i) - 6, B + 14); g.rotate(0.6); g.fillStyle = '#c9cfdb'; g.font = '17px sans-serif'; g.fillText(n, 0, 0); g.restore(); });
  g.fillStyle = '#e8ecf4'; g.font = '600 22px sans-serif';
  g.fillText(`Water left: 180 L → 63 → 36 → 27 → ${st.V.toFixed(1)} L a day`, 22, h - 22);
}

export default {
  id: 'reabsorb',
  short: 'Taking it back',
  title: '180 litres in, 1.5 litres out',
  subtitle: 'The tubule takes back 99% of the water, all the sugar and most of the salt.',
  view: { pos: [-4.6, 7.0, 17.4], target: [-5.0, 6.6, 0] },
  learn: `<p>Every day your kidneys make about <b>180 litres</b> of filtrate, but you only pass about <b>1 to 2 litres</b> of urine. The rest, about <b>99%</b>, is taken back into the blood. This is <b>reabsorption</b>.</p>
    <p>The <b>proximal tubule</b> does most of it. It takes back about <b>two thirds</b> of the salt and water, and <b>all</b> of the glucose, as long as blood sugar is normal. If blood glucose climbs above about <b>180 mg/dL</b>, as in untreated diabetes, the pumps can’t keep up and sugar spills into the urine, dragging water with it. That is why diabetes can make people thirsty and need the toilet often (see PancreasClear).</p>
    <p>The <b>loop of Henle</b> is a clever trick called a <b>countercurrent multiplier</b>. Its thick rising side pumps salt out but won’t let water follow. That makes the <b>medulla</b> around it salty, up to about <b>1,200 mOsm/kg</b>, four times saltier than blood. Water then leaves the falling side, and later the collecting duct, by <b>osmosis</b> (see OsmosisClear), pulled towards the salt.</p>
    <p>How much water the <b>collecting duct</b> takes back is set by a hormone, <b>ADH</b> (vasopressin), from the brain. Short of water? ADH rises, water channels open, and you make a little <b>dark</b> urine, down to about <b>0.5 litres</b> a day. Drunk plenty? ADH falls and you make lots of <b>pale</b> urine. The concentration can range from about <b>50 to 1,200 mOsm/kg</b>. Most of the water you drink is absorbed by your gut first (see <a href="/intestineclear/">IntestineClear</a>).</p>
    <p class="tip"><b>Try it:</b> drink less, then more, and watch ADH, the salty medulla and the colour of the urine. Then push blood sugar above about 180 mg/dL and watch glucose reach the urine.</p>`,
  terms: [
    { t: 'Reabsorption', d: 'Taking water and useful substances back from the tubule into the blood.' },
    { t: 'Countercurrent multiplier', d: 'The loop of Henle’s way of building a salty medulla, by pumping salt out of one side of a hairpin tube.' },
    { t: 'Osmolality', d: 'How much is dissolved in a litre of water, in milliosmoles per kg. Blood is about 290.' },
    { t: 'ADH (vasopressin)', d: 'A hormone from the pituitary gland that tells the collecting ducts to take back more water.' },
    { t: 'Aquaporin', d: 'A water channel in cell membranes. ADH adds aquaporins to the collecting duct.' },
    { t: 'Renal threshold for glucose', d: 'The blood sugar level, about 180 mg/dL, above which glucose starts to appear in urine.' },
  ],
  defaults: { drink: 2.1, bg: 100, labels: true },
  controls: [
    { key: 'drink', type: 'range', label: 'Water you drink and eat, a day', min: 0.6, max: 6, step: 0.05, ends: ['very little', 'lots'], fmt: (v) => v.toFixed(1) + ' L' },
    { key: 'bg', type: 'range', label: 'Blood glucose', min: 70, max: 400, step: 1, ends: ['70', '400 mg/dL'], fmt: (v) => Math.round(v) + ' mg/dL', hint: 'Normal fasting is about 70 to 100 mg/dL.' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Of about 180 litres filtered a day, how much becomes urine?', options: ['About 180 litres', 'About 90 litres', 'About 1 to 2 litres', 'None'], answer: 2, why: 'About 99% of the water is reabsorbed, so only about 1 to 2 litres leave as urine.' },
    { q: 'What does ADH do?', options: ['Makes the kidneys filter more', 'Tells the collecting ducts to take back more water', 'Removes glucose', 'Fills the bladder'], answer: 1, why: 'ADH adds water channels to the collecting ducts, so more water is pulled back into the salty medulla and urine gets darker.' },
    { q: 'Why can glucose appear in urine in untreated diabetes?', options: ['The filter lets in more sugar', 'Blood sugar is so high that the proximal tubule can’t take it all back', 'The bladder makes sugar', 'ADH turns into glucose'], answer: 1, why: 'Above about 180 mg/dL, more glucose is filtered than the tubule’s pumps can reclaim, so the rest spills into urine.' },
  ],
  reel: [
    { ms: 5000, caption: 'About 180 litres are filtered each day, and about 99% of the water is taken back.', set: { drink: 2.1, bg: 100, labels: false }, view: { pos: [-2.2, 7.2, 13], target: [-1.9, 7.0, 0] }, spin: 0 },
    { ms: 5600, caption: 'Short of water? The hormone ADH makes the kidney keep it, so urine turns dark.', set: { bg: 100, labels: false }, anim: { drink: [4.5, 0.9] }, view: { pos: [-1.2, 5.8, 12.5], target: [-0.6, 5.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = 7.4; stage.root.add(root);
    let st = kidneyState(2.1, 100);
    // ---- medulla background
    const grad = canvasTexture(420, 600, (g, w, h) => drawGradient(g, w, h, st));
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 10.6), new THREE.MeshBasicMaterial({ map: grad.tex, transparent: true, toneMapped: false, depthWrite: false }));
    bg.position.set(-1.6, -0.9, -0.9); root.add(bg);
    // ---- the tubule
    const curves = {}, meshes = {};
    KEYS.forEach((k) => {
      curves[k] = new THREE.CatmullRomCurve3(PATH[k].map((p) => new THREE.Vector3(...p)), false, 'centripetal');
      meshes[k] = new THREE.Mesh(new THREE.TubeGeometry(curves[k], 100, RADIUS[k], 12), tissue(NEPH.col[k], { opacity: 0.55, depthWrite: false })); meshes[k].renderOrder = 2; root.add(meshes[k]);
    });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 16), M.clear(0xffe7a8, 0.25)); cap.position.set(-5.0, 3.25, 0); root.add(cap);
    const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 2), tissue(C.artery)); tuft.position.copy(cap.position); root.add(tuft);
    // Peritubular capillary running alongside (behind).
    const capPts = [...PATH.pct, ...PATH.desc.slice(1), ...PATH.asc.slice(1), ...PATH.tal.slice(1), ...PATH.dct.slice(1)].map(([x, y]) => [x + 0.05, y - 0.05, -0.45]);
    root.add(tube(capPts, 0.06, M.ghost(C.vein, 0.5), false, 300));
    // Urine cup at the bottom.
    const cupMat = M.clear(0xdff3ff, 0.18);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.62, 1.5, 32, 1, true), cupMat); cup.position.set(1.2, -6.1, 0); root.add(cup);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.6, 1, 32), tissue(C.urine, { opacity: 0.9 })); root.add(liquid);
    // ---- arrows showing what leaves
    const mk = (col, x, y, dir) => { const a = arrow(col, 0.9, 0.22, 0.045); a.rotation.z = dir > 0 ? -Math.PI / 2 : Math.PI / 2; a.position.set(x, y, 0.1); root.add(a); return a; };
    const wDesc = [-0.8, -2.4].map((y) => mk(C.water, -2.55, y, -1));
    const nTal = [-1.0, 1.2].map((y) => mk(C.salt, -1.45, y, 1));
    const wCD = [-3.2, -1.6, 0.0, 1.6].map((y) => mk(C.water, 1.42, y, 1));
    const wPT = mk(C.water, -3.7, 2.55, -1); wPT.rotation.z = Math.PI; wPT.position.set(-3.5, 2.75, 0.1);
    // ---- particles along the tubule
    const segs = KEYS.map((k) => curves[k]), segL = segs.map((c) => c.getLength());
    const cum = []; segL.reduce((a, b, i) => { cum[i] = a; return a + b; }, 0);
    const totL = cum[5] + segL[5];
    const at = (s, out) => { let i = 0; while (i < 5 && s > cum[i] + segL[i]) i++; return segs[i].getPointAt(clamp((s - cum[i]) / segL[i], 0, 1), out); };
    const TYPES = [
      { key: 'water', col: C.water, r: 0.07, n: 90 },
      { key: 'salt', col: C.salt, r: 0.075, n: 60 },
      { key: 'glucose', col: C.glucose, r: 0.09, n: 40 },
      { key: 'urea', col: C.urea, r: 0.08, n: 30 },
    ];
    TYPES.forEach((T) => { T.m = swarmOf(T.n, new THREE.SphereGeometry(T.r, 8, 6), M.glow(T.col)); root.add(T.m); });
    // Cumulative share reabsorbed by the end of each segment [pct, desc, asc, tal, dct, cd].
    const fates = (key) => {
      if (key === 'water') return [0.65, 0.8, 0.8, 0.8, 0.85, 1 - st.V / 180];
      if (key === 'salt') return [0.65, 0.65, 0.72, 0.9, 0.95, 0.995];
      if (key === 'glucose') return [1 - st.spill, 1 - st.spill, 1 - st.spill, 1 - st.spill, 1 - st.spill, 1 - st.spill];
      return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5 + 0.1 * st.adh];
    };
    const _p = new THREE.Vector3();
    // ---- board
    const chart = canvasTexture(700, 520, (g, w, h) => drawBoard(g, w, h, st));
    const brd = board(chart, 6.6, 4.9); brd.position.set(-9.0, -3.0, -0.4); brd.rotation.y = 0.12; root.add(brd);
    // ---- labels
    const labs = [
      tint(stage.label('Proximal tubule: 65% of salt and water, all glucose', [-3.4, 4.95, 0.3], root), 'gold'),
      tint(stage.label('Water out (osmosis)', [-3.6, -1.6, 0.3], root), 'water'),
      tint(stage.label('Salt pumped out, water can’t follow', [-0.2, -2.6, 0.3], root), 'gold'),
      tint(stage.label('Collecting duct: ADH opens water channels', [-0.2, 1.3, 0.4], root), 'water'),
      tint(stage.label('Distal tubule', [0.4, 4.2, 0.3], root), 'hormone'),
      tint(stage.label('Loop of Henle', [-2.0, -4.7, 0.3], root), 'water'),
    ];
    const urineL = tint(stage.label('Urine', [2.35, -6.1, 0.3], root), 'urine');
    const key = tint(stage.label('<span style="color:#6fc3ff">●</span> water <span style="color:#ffd166">●</span> salt <span style="color:#6ee7a8">●</span> glucose <span style="color:#f4f4f4">●</span> urea', [-9.0, -0.15, 0], root), '');
    let t = 0, redraw = 0, last = '';
    const fit = fitNarrow(stage, { pos: [-1.8, 10.25, 20.5], target: [-1.8, 10.25, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        st = kidneyState(s.drink, s.bg);
        const sig = `${s.drink.toFixed(2)}|${Math.round(s.bg)}`;
        if (sig !== last) { last = sig; grad.redraw(); chart.redraw(); }
        // Particles: flow along; each leaves the tube where its fate says, towards the capillary.
        TYPES.forEach((T) => {
          const F = fates(T.key);
          for (let i = 0; i < T.n; i++) {
            const f = rnd(i * 3 + T.n), speed = 1.25;
            let si = F.findIndex((c) => f < c);
            const prev = si > 0 ? F[si - 1] : 0;
            const fate = si < 0 ? totL + 1 : cum[si] + segL[si] * clamp(0.08 + 0.84 * ((f - prev) / Math.max(1e-6, F[si] - prev)), 0, 1);
            const s0 = (rnd(i + T.n * 7) * (totL + 3) + t * speed) % (totL + 3);
            if (s0 > totL + 0.2) { T.m.hide(i); continue; }
            if (s0 > totL) { at(totL, _p); _p.y -= (s0 - totL) * 3; T.m.place(i, _p.toArray()); continue; }
            if (s0 <= fate) { at(s0, _p); _p.x += (rnd(i + 1) - 0.5) * 0.1; _p.z += (rnd(i + 2) - 0.5) * 0.1; T.m.place(i, _p.toArray()); }
            else {
              const k = (s0 - fate) / 1.0; if (k > 1) { T.m.hide(i); continue; }
              at(fate, _p); _p.z -= k * 0.45; _p.x += (rnd(i) > 0.5 ? 1 : -1) * k * 0.5;
              T.m.place(i, _p.toArray(), null, 1 - 0.6 * k);
            }
          }
          T.m.done();
        });
        // Arrows: collecting-duct water depends on ADH.
        wCD.forEach((a) => { a.set(0.25 + 0.75 * st.adh); });
        const col = urineColour(st.U);
        liquid.material.color.copy(col);
        const lv = clamp(st.V / 4, 0.08, 1.35); liquid.scale.y = lv; liquid.position.set(1.2, -6.85 + lv / 2, 0);
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !narrow; });
        urineL.visible = s.labels; key.visible = s.labels && !narrow;
        brd.visible = !narrow;
      },
      readout: (s) => {
        const S = kidneyState(s.drink, s.bg);
        return `<div class="big">Urine: ${S.V.toFixed(1)} L a day, ${colourName(S.U)}</div>
          <div class="row"><span>ADH level</span><b>${S.adh < 0.2 ? 'low' : S.adh < 0.6 ? 'medium' : 'high'} (${Math.round(S.adh * 100)}%)</b></div>
          <div class="row"><span>Urine concentration</span><b>${Math.round(S.U)} mOsm/kg</b></div>
          <div class="row"><span>Water taken back</span><b>${(100 * (1 - S.V / 180)).toFixed(1)}% of 180 L</b></div>
          <div class="row"><span>Glucose in urine</span><b class="${S.excG > 1 ? 'no' : 'ok'}">${S.excG > 1 ? `about ${Math.round(S.excG)} g a day` : 'none'}</b></div>
          <small>${S.short > 0.05 ? 'Not enough water: urine is as concentrated as it can get, and you feel thirsty. Drink more.' : S.excG > 1 ? 'Above about 180 mg/dL glucose spills into urine and takes water with it. A simple model: only a doctor can test for diabetes.' : 'A simple model of a healthy adult.'}</small>`;
      },
    });
  },
};
