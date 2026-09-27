// Chapter 3: filtration. A magnified slice of the glomerular filter: blood in a capillary on top,
// then the three layers (fenestrated endothelium, glomerular basement membrane, podocyte foot
// processes with slit diaphragms), and Bowman's space underneath.
// Facts:
//  - Layers: endothelial fenestrae about 70 to 100 nm across; a basement membrane of collagen and
//    negatively charged proteoglycans about 300 nm thick; podocyte foot processes with slit pores
//    about 25 to 60 nm wide bridged by the slit diaphragm (Guyton & Hall, 14th ed., ch. 27, fig.
//    27-6; Boron & Boulpaep, ch. 33).
//  - Filterability by size (Guyton & Hall, table 27-1): water, sodium, glucose, inulin (5,200 Da)
//    1.0; myoglobin (17,000 Da) 0.75; albumin (69,000 Da) about 0.005. Albumin is held back by
//    size and by its negative charge. Cells never pass.
//  - Starling forces: a net filtration pressure of about 10 mmHg from glomerular hydrostatic
//    pressure (about 55 to 60) minus Bowman's capsule pressure (about 15 to 18) minus plasma
//    oncotic pressure (about 30 to 32). We use the round textbook values 55, 15 and 30 (Costanzo,
//    Physiology, 6th ed., ch. 6); Guyton & Hall give 60, 18 and 32, also a net of 10.
//  - GFR = Kf × net pressure, Kf ≈ 12.5 mL/min per mmHg for both kidneys (Guyton & Hall), so
//    GFR ≈ 125 mL/min ≈ 180 L/day. Plasma volume is about 3 L, so the whole plasma is filtered
//    about 60 times a day.
//  - Autoregulation (myogenic response and tubuloglomerular feedback) keeps GFR nearly steady
//    for mean arterial pressures of about 80 to 170-180 mmHg (Guyton & Hall, ch. 27, fig. 27-15).
//    The curves here are a simple teaching model of that behaviour, not measured data.
//  - RO comparison: a home RO purifier's pump gives about 5 bar ≈ 3,750 mmHg and holds back
//    95 to 99% of dissolved salts (see ROClear); the glomerulus works on about 10 mmHg net and
//    lets salts through, then the tubule reabsorbs what the body needs.
import { THREE, M, arrow, canvasTexture, clamp, lerp } from '../kit.js';
import { C, tissue, tint, board, fitNarrow, compactReadout, rnd, swarmOf, rrect } from '../kidney.js';

export const P_BOW = 15, P_ONC = 30, KF = 12.5;
export function glomP(map, auto) {
  if (!auto) return 55 * (map / 93);
  if (map < 80) return 55 - (80 - map) * 0.3;
  if (map > 180) return 55 + (map - 180) * 0.3;
  return 55 + (map - 93) * 0.004;
}
export const gfrOf = (pgc) => Math.max(0, KF * (pgc - P_BOW - P_ONC));

function drawBoard(g, w, h, st) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; rrect(g, 0, 0, w, h, 18); g.fill();
  g.fillStyle = '#e8ecf4'; g.font = '600 30px sans-serif'; g.fillText('Forces across the filter (mmHg)', 24, 44);
  const rows = [
    { n: 'Blood pressure pushes out', v: st.pgc, c: '#ff6b6b', sign: '+' },
    { n: 'Capsule fluid pushes back', v: P_BOW, c: '#ffd166', sign: '−' },
    { n: 'Proteins in blood pull back', v: P_ONC, c: '#ff9f43', sign: '−' },
  ];
  const X0 = 330, S = 4.2;
  rows.forEach((r, i) => {
    const y = 90 + i * 58;
    g.fillStyle = '#c9cfdb'; g.font = '22px sans-serif'; g.fillText(r.n, 24, y + 24);
    g.fillStyle = r.c; g.fillRect(X0, y + 4, r.v * S, 28);
    g.fillStyle = '#fff'; g.font = '600 22px sans-serif'; g.fillText(`${r.sign}${Math.round(r.v)}`, X0 + r.v * S + 10, y + 26);
  });
  const net = st.pgc - P_BOW - P_ONC, y = 270;
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(24, y - 12); g.lineTo(w - 24, y - 12); g.stroke();
  g.fillStyle = '#c9cfdb'; g.font = '22px sans-serif'; g.fillText('Net push out of the blood', 24, y + 24);
  g.fillStyle = net > 0 ? '#6ee7a8' : '#ff6b6b'; g.fillRect(X0, y + 4, Math.max(2, Math.abs(net) * S), 28);
  g.fillStyle = '#fff'; g.font = '600 22px sans-serif'; g.fillText(`${net >= 0 ? '' : '−'}${Math.abs(net).toFixed(0)}`, X0 + Math.abs(net) * S + 10, y + 26);
  // GFR gauge.
  const gfr = gfrOf(st.pgc);
  g.fillStyle = '#e8ecf4'; g.font = '600 26px sans-serif'; g.fillText('Filtration rate (GFR)', 24, 360);
  g.font = '600 54px sans-serif'; g.fillStyle = '#8ef0ff'; g.fillText(`${Math.round(gfr)} mL/min`, 24, 420);
  g.font = '22px sans-serif'; g.fillStyle = '#c9cfdb'; g.fillText(`= ${Math.round(gfr * 1.44)} litres a day`, 24, 455);
  const BX = 24, BW = w - 48, by = 480;
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(BX, by, BW, 16);
  g.fillStyle = 'rgba(110,231,168,.35)'; g.fillRect(BX + (90 / 250) * BW, by, ((140 - 90) / 250) * BW, 16);
  g.fillStyle = '#8ef0ff'; g.fillRect(BX + clamp(gfr / 250, 0, 1) * BW - 3, by - 6, 6, 28);
  g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '17px sans-serif'; g.fillText('0', BX, by + 40); g.fillText('healthy young adult ~90–140', BX + (80 / 250) * BW, by + 40); g.fillText('250', BX + BW - 34, by + 40);
  // RO comparison.
  g.fillStyle = '#ffd166'; g.font = '600 20px sans-serif'; g.fillText('vs a home RO purifier (ROClear)', 24, 560);
  g.fillStyle = '#c9cfdb'; g.font = '19px sans-serif';
  g.fillText('RO: ~3,750 mmHg (5 bar), holds salts back.', 24, 590);
  g.fillText('Kidney: ~10 mmHg, lets salts through, then takes back', 24, 616);
  g.fillText('what the body needs.', 24, 640);
}

export default {
  id: 'filter',
  short: 'Filtration',
  title: 'A filter pushed by blood pressure',
  subtitle: 'About 180 litres a day squeezed through a three-layer sieve.',
  view: { pos: [2.4, 5.6, 14.6], target: [2.0, 4.4, 0] },
  learn: `<p>Filtering starts in the <b>glomerulus</b>. The wall of its capillaries is a sieve with <b>three layers</b>. The inner lining, the <b>endothelium</b>, is full of holes about <b>70 to 100 nanometres</b> across. Next is a mesh of protein, the <b>basement membrane</b>, which carries negative charge. Outside it, cells called <b>podocytes</b> wrap the capillary with interlocking “feet”, leaving thin <b>slits</b> covered by a very fine filter, the <b>slit diaphragm</b>.</p>
    <p>What gets through? <b>Water</b>, <b>salts</b>, <b>glucose</b>, <b>urea</b> and other small molecules pass almost freely. <b>Blood cells</b> are far too big. Most <b>proteins</b>, like albumin, are held back by their size and their negative charge. Protein in the urine is one of the first signs that the filter is damaged.</p>
    <p>The push comes from <b>blood pressure</b> (see <a href="/heartclear/#pressure">HeartClear</a>). About <b>55 mmHg</b> pushes out, the fluid already in the capsule pushes back with about <b>15</b>, and the proteins left in the blood pull water back with about <b>30</b>. The net push is only about <b>10 mmHg</b>, but the filter is so leaky and so large that it makes about <b>125 mL a minute</b>: about <b>180 litres a day</b>. Your kidneys filter all of your blood plasma about <b>60 times a day</b>.</p>
    <p>A <b>reverse osmosis</b> purifier also filters with pressure (see <a href="/roclear/">ROClear</a>), but it is very different. It pushes about <b>375 times harder</b> and holds salts <b>back</b>. The glomerulus lets salts <b>through</b>, then the tubule takes back what the body needs. That way the kidney can get rid of any waste, even ones it has never met, as long as they are small.</p>
    <p class="tip"><b>Try it:</b> change the body’s blood pressure and watch the filtration rate. Then switch off autoregulation to see how much the kidney protects itself. Finally, damage the filter and watch protein leak.</p>`,
  terms: [
    { t: 'Filtration', d: 'Pushing a liquid through a barrier that holds back bigger things.' },
    { t: 'Podocyte', d: 'A cell with foot-like arms that wraps the glomerular capillaries and forms the last layer of the filter.' },
    { t: 'Basement membrane', d: 'A thin, negatively charged mesh of proteins between the capillary lining and the podocytes.' },
    { t: 'GFR', d: 'Glomerular filtration rate: how much filtrate both kidneys make each minute, about 125 mL in a young adult.' },
    { t: 'Oncotic pressure', d: 'The pull of proteins in the blood, which draws water back into the capillaries.' },
    { t: 'Autoregulation', d: 'The kidney tightening or relaxing its own arterioles to keep filtration steady when blood pressure changes.' },
    { t: 'Proteinuria', d: 'Protein in the urine, often an early sign of kidney damage.' },
  ],
  defaults: { map: 93, auto: true, leaky: false, labels: true },
  controls: [
    { key: 'map', type: 'range', label: 'Body blood pressure (mean)', min: 50, max: 200, step: 1, ends: ['50 mmHg', '200 mmHg'], fmt: (v) => Math.round(v) + ' mmHg', hint: 'A reading of 120/80 is a mean of about 93 mmHg.' },
    { key: 'auto', type: 'toggle', label: 'Autoregulation (the kidney’s own pressure control)' },
    { key: 'leaky', type: 'toggle', label: 'Damaged filter (lets protein through)' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which of these normally passes through the glomerular filter?', options: ['Red blood cells', 'Albumin (a big protein)', 'Glucose and salt', 'Platelets'], answer: 2, why: 'Small molecules like water, salts, glucose and urea pass almost freely. Cells and most proteins are held back.' },
    { q: 'What pushes fluid through the filter?', options: ['A pump in the bladder', 'Blood pressure in the glomerular capillaries', 'Osmosis from the urine', 'Gravity'], answer: 1, why: 'Glomerular blood pressure, about 55 mmHg, outweighs the capsule pressure and protein pull by about 10 mmHg.' },
    { q: 'How is the kidney different from an RO purifier?', options: ['It uses much higher pressure', 'It holds all salts back', 'It lets small things through, then takes back what the body needs', 'There is no difference'], answer: 2, why: 'RO pushes hard and blocks salts. The glomerulus uses a gentle push and lets salts through; the tubule then reabsorbs what is useful.' },
  ],
  reel: [
    { ms: 5000, caption: 'Blood pressure squeezes water, salt, sugar and wastes through a three-layer filter. Cells stay in.', set: { map: 93, auto: true, leaky: false, labels: false }, view: { pos: [0.4, 3.9, 9.5], target: [0.2, 2.9, 0] }, spin: 0.2 },
    { ms: 5200, caption: 'A net push of just 10 mmHg makes about 180 litres of filtrate a day.', set: { auto: true, leaky: false, labels: false }, anim: { map: [60, 120] }, view: { pos: [3.0, 4.4, 14.5], target: [2.6, 3.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = 1.4; stage.root.add(root);
    const W = 6, D = 2.4, SP = 0.5, NX = 12, NZ = 5;
    const hx = (i) => -W / 2 + SP / 2 + i * SP, hz = (j) => -D / 2 + 0.2 + j * SP;
    // ---- capillary lumen (blood plasma)
    const lumen = new THREE.Mesh(new THREE.BoxGeometry(W, 1.9, D), M.ghost(0xff7070, 0.07)); lumen.position.y = 2.3; root.add(lumen);
    // ---- endothelium with fenestrae (holes cut with an alpha map)
    const holes = canvasTexture(600, 240, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { g.beginPath(); g.arc(((hx(i) + W / 2) / W) * w, ((hz(j) + D / 2) / D) * h, 13, 0, 7); g.fill(); } });
    const endo = new THREE.Mesh(new THREE.BoxGeometry(W, 0.2, D), new THREE.MeshStandardMaterial({ color: 0xe98f8f, roughness: 0.6, alphaMap: holes.tex, alphaTest: 0.5, side: THREE.DoubleSide }));
    endo.position.y = 1.2; endo.castShadow = true; root.add(endo);
    // ---- basement membrane
    const gbm = new THREE.Mesh(new THREE.BoxGeometry(W, 0.42, D), tissue(0x9fb4d8, { opacity: 0.45, depthWrite: false })); gbm.position.y = 0.84; gbm.renderOrder = 2; root.add(gbm);
    // ---- podocyte foot processes (from two podocytes, interdigitating) and slit diaphragms
    const feet = [], slits = [];
    for (let i = 0; i < NX; i++) {
      const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, D - 0.4, 6, 12), tissue(i % 2 ? 0x7fc3a0 : 0x9ad68f, { roughness: 0.55 }));
      f.rotation.x = Math.PI / 2; f.position.set(hx(i), 0.44, 0); f.castShadow = true; root.add(f); feet.push(f);
      if (i < NX - 1) { const sd = new THREE.Mesh(new THREE.PlaneGeometry(0.12, D - 0.2), M.ghost(0xffffff, 0.35)); sd.rotation.x = -Math.PI / 2; sd.position.set(hx(i) + SP / 2, 0.35, 0); root.add(sd); slits.push(sd); }
    }
    const podMat = [tissue(0x9ad68f), tissue(0x7fc3a0)];
    [[-1.4, 0], [1.3, 1]].forEach(([x, k]) => {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), podMat[k]); body.scale.set(1.2, 0.8, 1); body.position.set(x, -0.55, 0.2); root.add(body);
      for (let i = k; i < NX; i += 2) { if (Math.abs(hx(i) - x) > 2.4) continue; const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1, 8), podMat[k]); const a = new THREE.Vector3(x, -0.35, 0.2), b = new THREE.Vector3(hx(i), 0.3, 0.3); arm.position.copy(a).add(b).multiplyScalar(0.5); arm.scale.y = a.distanceTo(b); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); root.add(arm); }
    });
    const space = new THREE.Mesh(new THREE.BoxGeometry(W, 1.2, D), M.ghost(0xffe27a, 0.05)); space.position.y = -0.4; root.add(space);

    // ---- particles
    const NS = 132, NA = 16, NR = 9;
    const kinds = [{ c: C.water, r: 0.05 }, { c: C.salt, r: 0.055 }, { c: C.glucose, r: 0.07 }, { c: C.urea, r: 0.06 }];
    const small = kinds.map((k) => { const m = swarmOf(NS / 4, new THREE.SphereGeometry(k.r, 8, 6), M.glow(k.c)); root.add(m); return m; });
    const alb = swarmOf(NA, new THREE.SphereGeometry(0.13, 12, 8), M.glow(C.protein)); root.add(alb);
    const rbc = swarmOf(NR, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 20), tissue(C.rbc, { roughness: 0.4 })); root.add(rbc);
    // A particle's path through a pore: lumen → hole (hx, hz) → basement membrane → slit → space.
    const through = (i, p, x0, z0, out) => {
      const ix = i % NX, jz = (i * 7) % NZ, X = hx(ix), Z = hz(jz), sx = X + (i % 2 ? SP / 2 : -SP / 2);
      if (p < 0.35) { const k = p / 0.35; out[0] = lerp(x0, X, k); out[1] = lerp(3.0, 1.3, k); out[2] = lerp(z0, Z, k); }
      else if (p < 0.5) { const k = (p - 0.35) / 0.15; out[0] = lerp(X, sx, k); out[1] = lerp(1.3, 0.6, k); out[2] = Z; }
      else if (p < 0.6) { const k = (p - 0.5) / 0.1; out[0] = sx; out[1] = lerp(0.6, 0.15, k); out[2] = Z; }
      else { const k = (p - 0.6) / 0.4; out[0] = sx + k * 2.4; out[1] = 0.1 - k * 0.8; out[2] = Z + Math.sin(i) * 0.3 * k; }
      if (out[0] > W / 2 - 0.05) out[1] = -99;
      return out;
    };
    const wander = (i, t, out, top = 3.1, bot = 1.45) => { out[0] = -W / 2 + ((rnd(i) * W + t * 0.35) % W); out[1] = lerp(bot, top, (Math.sin(t * 0.7 + i * 1.7) + 1) / 2); out[2] = -D / 2 + 0.2 + rnd(i + 9) * (D - 0.4); return out; };

    // ---- force arrows at the side
    const aOut = arrow(0xff6b6b, 1, 0.3, 0.06), aBow = arrow(0xffd166, 1, 0.3, 0.06), aOnc = arrow(0xff9f43, 1, 0.3, 0.06);
    aOut.rotation.z = Math.PI; aOut.position.set(-3.7, 3.3, 0.6); aBow.position.set(-4.1, -1.2, 0.6); aOnc.position.set(-4.5, 1.25, 0.6);
    root.add(aOut, aBow, aOnc);
    const fl = [tint(stage.label('Blood pressure: out', [-3.7, 3.65, 0.6], root), 'blood'), tint(stage.label('Capsule: back', [-4.1, -1.5, 0.6], root), 'gold'), tint(stage.label('Proteins: pull back', [-4.5, 1.0, 0.6], root), 'gold')];
    // ---- board
    const st = { pgc: 55 };
    const chart = canvasTexture(640, 680, (g, w, h) => drawBoard(g, w, h, st));
    const brd = board(chart, 4.9, 5.2); brd.position.set(6.9, 4.5, -0.3); brd.rotation.y = -0.12; root.add(brd);
    // ---- labels
    const labs = [
      tint(stage.label('Blood in a glomerular capillary', [0.2, 3.6, 0.2], root), 'blood'),
      tint(stage.label('1. Endothelium: holes 70–100 nm', [3.4, 1.35, 1.2], root), 'pink'),
      tint(stage.label('2. Basement membrane (negative charge)', [3.4, 0.86, 1.2], root), 'water'),
      tint(stage.label('3. Podocyte feet, slits 25–60 nm', [3.4, 0.35, 1.2], root), 'good'),
      tint(stage.label('Bowman’s space: filtrate → tubule', [1.2, -1.25, 1.0], root), 'urine'),
    ];
    labs.slice(1, 4).forEach((l) => l.center.set(0, 0.5));
    const leakL = tint(stage.label('Protein leaking into the filtrate', [-1.0, -0.2, 1.3], root), 'gold');
    const key = tint(stage.label('<span style="color:#6fc3ff">●</span> water <span style="color:#ffd166">●</span> salt <span style="color:#6ee7a8">●</span> glucose <span style="color:#f4f4f4">●</span> urea <span style="color:#ff9f43">●</span> protein', [0.2, -1.85, 1.0], root), '');

    let t = 0, redraw = 0;
    const o = [0, 0, 0];
    const fit = fitNarrow(stage, { pos: [-0.5, 5.0, 12.5], target: [-0.5, 4.6, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const pgc = glomP(s.map, s.auto); st.pgc = pgc;
        const gfr = gfrOf(pgc), frac = clamp(gfr / 125, 0, 2);
        // Small solutes: the share crossing the filter follows the filtration rate.
        small.forEach((m, k) => {
          const n = NS / 4;
          for (let j = 0; j < n; j++) {
            const i = j * 4 + k, active = j / n < frac * 0.55;
            if (active) { const p = (rnd(i + 40) + t * 0.16 * Math.max(0.4, frac)) % 1; through(i, p, -W / 2 + rnd(i) * W, -D / 2 + 0.2 + rnd(i + 3) * (D - 0.4), o); }
            else wander(i, t, o);
            m.place(j, o);
          }
          m.done();
        });
        // Albumin: bounces off the filter unless it is damaged.
        for (let i = 0; i < NA; i++) {
          if (s.leaky && i < 6 && gfr > 1) through(i * 5 + 1, (rnd(i + 70) + t * 0.12) % 1, -W / 2 + rnd(i + 2) * W, 0, o);
          else wander(i + 200, t * 0.8, o, 3.0, 1.5);
          alb.place(i, o);
        }
        alb.done();
        for (let i = 0; i < NR; i++) { const x = -W / 2 + 0.3 + ((rnd(i + 90) * W + t * 0.6) % (W - 0.6)); rbc.place(i, [x, 2.0 + rnd(i + 91) * 1.0, -0.8 + rnd(i + 92) * 1.6], [0.4 + i, 0.3 * i, 0.9 + Math.sin(t + i) * 0.3]); }
        rbc.done();
        slits.forEach((sd) => { sd.visible = !s.leaky; });
        feet.forEach((f) => { f.scale.x = s.leaky ? 0.75 : 1; });
        aOut.set(pgc / 25); aBow.set(P_BOW / 25); aOnc.set(P_ONC / 25);
        redraw += dt; if (redraw > 0.12) { redraw = 0; chart.redraw(); }
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !narrow; });
        fl.forEach((l) => { l.visible = s.labels && !narrow; });
        key.visible = s.labels && !narrow; brd.visible = !narrow;
        leakL.visible = s.labels && s.leaky;
      },
      readout: (s) => {
        const pgc = glomP(s.map, s.auto), gfr = gfrOf(pgc), net = pgc - P_BOW - P_ONC;
        return `<div class="big">Filtering ${Math.round(gfr)} mL a minute</div>
          <div class="row"><span>Pressure in the glomerulus</span><b>${Math.round(pgc)} mmHg</b></div>
          <div class="row"><span>Net push out</span><b>${net.toFixed(0)} mmHg</b></div>
          <div class="row"><span>Filtrate a day (both kidneys)</span><b>${Math.round(gfr * 1.44)} L</b></div>
          <div class="row"><span>Protein in the filtrate</span><b class="${s.leaky ? 'no' : 'ok'}">${s.leaky ? 'leaking: proteinuria' : 'almost none'}</b></div>
          <small>${s.auto ? (s.map < 80 ? 'Below about 80 mmHg autoregulation can’t keep up and filtering falls.' : s.map > 180 ? 'Above about 180 mmHg the pressure gets through. Long-term high blood pressure damages glomeruli.' : 'Autoregulation holds the pressure steady across a wide range of blood pressure.') : 'Without autoregulation every change in blood pressure reaches the filter.'} A simple model.</small>`;
      },
    });
  },
};
