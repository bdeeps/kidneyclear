// Chapter 2: the nephron, the kidney's working unit. A kidney cut open on the left, a box on its
// upper pole, and that box magnified into one nephron and its blood vessels.
// Facts:
//  - Number: about 1 million nephrons per kidney is the textbook figure (Guyton & Hall, 14th ed.,
//    ch. 26); autopsy counts average about 900,000 per kidney but range from about 200,000 to
//    more than 2.5 million (Bertram et al., "Human nephron number", Kidney Int Suppl 1:15, 2011).
//    Nephrons can't be regrown; after about age 40 their number slowly falls (Guyton & Hall).
//  - A glomerulus (with Bowman's capsule) is about 0.2 mm across (Guyton & Hall; Boron &
//    Boulpaep, Medical Physiology, 3rd ed., ch. 33).
//  - Cortical nephrons (about 70 to 80%) have short loops; juxtamedullary ones (about 20 to 30%)
//    have long loops that dip deep into the medulla (Guyton & Hall, ch. 26). The one drawn here is
//    a juxtamedullary nephron, with vasa recta.
//  - Filtration: about 125 mL/min for both kidneys (Guyton & Hall, ch. 27), so each nephron makes
//    about 125 mL/min ÷ 2 million ≈ 60 nanolitres a minute.
//  - Order of flow: afferent arteriole → glomerular capillaries → efferent arteriole →
//    peritubular capillaries (and vasa recta) → veins. Filtrate: Bowman's space → proximal tubule
//    → loop of Henle → distal tubule → collecting duct → papilla → calyx.
//  - Share of filtered water taken back by the end of each part (Guyton & Hall, ch. 28, fig. 28-1
//    and ch. 29): proximal tubule about 65%, descending limb about 15% more, ascending limbs
//    almost none, distal tubule a little, collecting ducts most of the rest when ADH is present,
//    so about 99% overall.
import { THREE, M, clamp, lerp } from '../kit.js';
import { makeKidney, makeNephron, NEPH, C, tint, fitNarrow, compactReadout, rnd, swarmOf, inReel } from '../kidney.js';

const V0 = { pos: [-7.6, 8.2, 30], target: [-8.6, 7.9, 0] };
const V1 = { pos: [-5.8, 8.0, 18.5], target: [-6.5, 7.5, 0] };
// In the video there is no readout to dodge, so frame the subject in the middle.
const R0 = { pos: [-6.4, 7.6, 19], target: [-6.4, 7.1, 0] }, R1 = { pos: [-0.8, 7.8, 13.5], target: [-0.8, 7.3, 0] };
const N0 = { pos: [-5.7, 12.5, 40], target: [-5.7, 12.5, 0] }, N1 = { pos: [-0.8, 11.2, 25], target: [-0.8, 11.2, 0] };
const viewAt = (k, mode) => { const [a, b] = mode === 'reel' ? [R0, R1] : mode === 'narrow' ? [N0, N1] : [V0, V1]; return { pos: a.pos.map((v, i) => lerp(v, b.pos[i], k)), target: a.target.map((v, i) => lerp(v, b.target[i], k)) }; };
const PART = {
  all: { name: 'The whole nephron', text: 'Blood is filtered in the glomerulus; the tubule takes back what the body needs.' },
  glom: { name: 'Glomerulus and Bowman’s capsule', text: 'A knot of capillaries where blood pressure pushes plasma out into the capsule.' },
  pct: { name: 'Proximal tubule', text: 'Takes back about two thirds of the water and salt, and all the glucose.' },
  loop: { name: 'Loop of Henle', text: 'Dips into the medulla and makes it salty, so water can be pulled out later.' },
  dct: { name: 'Distal tubule', text: 'Fine-tunes salt, potassium and acid, under the control of hormones.' },
  cd: { name: 'Collecting duct', text: 'Shared by many nephrons. ADH decides how much water it takes back.' },
};
const SEGS = { glom: [], pct: ['pct'], loop: ['desc', 'asc', 'tal'], dct: ['dct'], cd: ['cd'] };
// Cumulative share of filtered water reabsorbed by the end of each tubule part (see header).
const FATE = [['pct', 0.65], ['desc', 0.8], ['asc', 0.8], ['tal', 0.8], ['dct', 0.85], ['cd', 0.99]];

export default {
  id: 'nephron',
  short: 'The nephron',
  title: 'A million tiny filters',
  subtitle: 'Zoom from a kidney to one nephron, the unit that does the work.',
  view: V0,
  learn: `<p>A kidney is not one big filter. It is packed with about <b>a million</b> tiny units called <b>nephrons</b>. The real number varies a lot from person to person, from about <b>200,000</b> to more than <b>2.5 million</b> per kidney. Your body can’t grow new ones.</p>
    <p>Each nephron starts with a <b>glomerulus</b>, a knot of tiny blood vessels about <b>0.2 mm</b> across, sitting in a cup called <b>Bowman’s capsule</b>. Blood arrives through the <b>afferent arteriole</b> and leaves through the narrower <b>efferent arteriole</b>. On the way, blood pressure pushes some of the liquid part of blood, the <b>plasma</b>, into the capsule. This liquid is the <b>filtrate</b>.</p>
    <p>The filtrate then runs down a long, twisting tube. First the <b>proximal tubule</b>, then the hairpin-shaped <b>loop of Henle</b>, which dips deep into the <b>medulla</b>, then the <b>distal tubule</b>, which touches its own glomerulus again, and finally a <b>collecting duct</b> shared with many other nephrons. All along it, blood vessels called <b>peritubular capillaries</b> wrap the tube and take back what the body needs. Of every 100 drops filtered, about <b>99</b> go back into the blood.</p>
    <p class="tip"><b>Try it:</b> zoom in from the kidney to the nephron. Pick a part to light it up and watch the yellow drops of filtrate: most leave the tube and only a few reach the end.</p>`,
  terms: [
    { t: 'Nephron', d: 'The kidney’s working unit: a glomerulus plus a long tubule. About a million per kidney.' },
    { t: 'Glomerulus', d: 'A knot of capillaries where blood is filtered. Plural: glomeruli.' },
    { t: 'Bowman’s capsule', d: 'The cup around the glomerulus that catches the filtrate.' },
    { t: 'Filtrate', d: 'The liquid pushed out of the blood into the capsule: water with salts, sugar and wastes, but no cells or big proteins.' },
    { t: 'Loop of Henle', d: 'The hairpin part of the tubule that dips into the medulla and helps concentrate urine.' },
    { t: 'Collecting duct', d: 'The final tube, shared by many nephrons, that carries urine to the calyces.' },
    { t: 'Peritubular capillaries', d: 'Tiny blood vessels wrapped around the tubule that carry reabsorbed water and salts back into the blood.' },
  ],
  defaults: { zoom: 0, part: 'all', vessels: true, labels: true },
  controls: [
    { key: 'zoom', type: 'range', label: 'Zoom: kidney → nephron', min: 0, max: 1, step: 0.01, ends: ['whole kidney', 'one nephron'], fmt: (v) => (v < 0.5 ? 'kidney' : 'nephron') },
    { key: 'part', type: 'seg', label: 'Light up', options: [{ v: 'all', label: 'All' }, { v: 'glom', label: 'Glomerulus' }, { v: 'pct', label: 'Proximal' }, { v: 'loop', label: 'Loop' }, { v: 'dct', label: 'Distal' }, { v: 'cd', label: 'Collecting' }] },
    { key: 'vessels', type: 'toggle', label: 'Blood vessels' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'About how many nephrons does a typical kidney have?', options: ['About 100', 'About 10,000', 'About a million', 'About a billion'], answer: 2, why: 'About a million is the usual figure, though counts range from about 200,000 to over 2.5 million.' },
    { q: 'Where is blood filtered in a nephron?', options: ['In the collecting duct', 'In the glomerulus, into Bowman’s capsule', 'In the bladder', 'In the loop of Henle'], answer: 1, why: 'Blood pressure pushes plasma out of the glomerular capillaries into Bowman’s capsule. The rest of the nephron adjusts that filtrate.' },
    { q: 'Of the filtrate made, roughly how much goes back into the blood?', options: ['About 10%', 'About half', 'About 99%', 'None of it'], answer: 2, why: 'The tubule and its capillaries take back about 99% of the water, so about 180 litres of filtrate become only 1 to 2 litres of urine.' },
  ],
  reel: [
    { ms: 5600, caption: 'Each kidney holds about a million nephrons: a tiny filter joined to a long, looping tube.', set: { part: 'all', vessels: true, labels: false }, anim: { zoom: [0, 1] }, spin: 0 },
  ],

  build({ stage }) {
    stage.renderer.localClippingEnabled = true;
    const root = new THREE.Group(); root.position.y = 7.4; stage.root.add(root);
    // ---- the kidney, cut open, on the left
    const k = makeKidney(1); k.group.position.set(-12.5, -1.6, 0); k.group.scale.setScalar(3.1); root.add(k.group);
    const kl = [
      tint(stage.label('A kidney, cut open', [-12.5, -6.9, 0.5], root), 'pink'),
      tint(stage.label('Cortex', [-9.4, 1.6, 0.5], root), 'pink'),
      tint(stage.label('Medulla', [-12.0, -2.8, 1.6], root), 'pink'),
    ];
    // A box on the upper pole, where the cortex sits above a pyramid, like the nephron's frame.
    const bx = [-12.5 + 0.1 * 3.1, 1.05 * 3.1 - 1.6], bw = 0.42 * 3.1, bh = 0.5 * 3.1;
    const boxLine = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(bw, bh)), new THREE.LineBasicMaterial({ color: 0x8ef0ff }));
    boxLine.position.set(bx[0], bx[1], 0.05); root.add(boxLine);
    const F = { x0: -5.2, x1: 3.6, y0: -6.9, y1: 4.9 };
    const cp = [];
    [[-1, 1], [-1, -1]].forEach(([sx, sy]) => cp.push(bx[0] + (sx > 0 ? bw / 2 : bw / 2), bx[1] + (sy * bh) / 2, 0.05, F.x0, sy > 0 ? F.y1 : F.y0, 0));
    const conn = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)), new THREE.LineBasicMaterial({ color: 0x8ef0ff, transparent: true, opacity: 0.5 }));
    root.add(conn);
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(F.x1 - F.x0, F.y1 - F.y0)), new THREE.LineBasicMaterial({ color: 0x8ef0ff, transparent: true, opacity: 0.6 }));
    frame.position.set((F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, -1.3); root.add(frame);
    // ---- zones behind the nephron
    const zone = (y0, y1, col, op) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(F.x1 - F.x0, y1 - y0), M.ghost(col, op)); m.position.set((F.x0 + F.x1) / 2, (y0 + y1) / 2, -1.3); root.add(m); return m; };
    zone(0.5, F.y1, 0xb3503f, 0.22); zone(-2.5, 0.5, 0x8a2c33, 0.28); zone(F.y0, -2.5, 0x6e2028, 0.36);
    const zl = [
      tint(stage.label('Cortex', [F.x0 + 0.1, 4.4, -1.2], root), 'pink'),
      tint(stage.label('Outer medulla', [F.x0 + 0.1, -0.2, -1.2], root), 'pink'),
      tint(stage.label('Inner medulla', [F.x0 + 0.1, -5.9, -1.2], root), 'pink'),
      tint(stage.label('One nephron, magnified (not to scale)', [1.6, F.y0 - 0.5, 0], root), 'side'),
    ];
    zl.forEach((l) => l.center.set(0, 0.5));
    zl[3].center.set(0.5, 0.5);
    // ---- the nephron
    const n = makeNephron(stage); root.add(n.group);
    const toCalyx = tint(stage.label('→ to a calyx', [-3.9, -7.4, 0.3], root), 'urine');

    // ---- particles: filtrate along the tubule, blood along the vessels
    const tubeKeys = ['pct', 'desc', 'asc', 'tal', 'dct', 'cd'];
    const cdLow = new THREE.CatmullRomCurve3(NEPH.seg.cd.slice(1).map((p) => new THREE.Vector3(...p)));
    const segC = tubeKeys.map((kk) => (kk === 'cd' ? cdLow : n.curves[kk]));
    const segL = segC.map((c) => c.getLength()), totL = segL.reduce((a, b) => a + b, 0);
    const cum = []; segL.reduce((a, b, i) => { cum[i] = a; return a + b; }, 0);
    const _p = new THREE.Vector3();
    const tubeAt = (s) => { let i = 0; while (i < segL.length - 1 && s > cum[i] + segL[i]) i++; return { i, u: clamp((s - cum[i]) / segL[i], 0, 1) }; };
    const NF = 160, filt = swarmOf(NF, new THREE.SphereGeometry(0.06, 8, 6), M.glow(C.filtrate)); root.add(filt);
    // Each drop's fate: where along the tubule it is taken back into the blood.
    const fate = [];
    for (let i = 0; i < NF; i++) {
      const f = rnd(i + 11); let si = FATE.findIndex(([, c]) => f < c); if (si < 0) si = -1;
      const prev = si > 0 ? FATE[si - 1][1] : 0, frac = si < 0 ? 1 : (f - prev) / (FATE[si][1] - prev);
      fate.push(si < 0 ? totL + 1 : cum[si] + segL[si] * clamp(0.1 + 0.85 * frac, 0, 1));
    }
    const bloodPath = [n.vc.aff, n.tuftCurve, n.vc.eff, n.vc.recta];
    const bL = bloodPath.map((c) => c.getLength()), bTot = bL.reduce((a, b) => a + b, 0);
    const NB = 90, blood = swarmOf(NB, new THREE.SphereGeometry(0.065, 8, 6), M.glow(0xffffff)); root.add(blood);
    const bRed = new THREE.Color(0xff5a5a), bBlue = new THREE.Color(0x7f9dff);
    let t = 0, lastZoom = -1;
    const fit = fitNarrow(stage, N0);
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        k.setCut(1);
        if (Math.abs(s.zoom - lastZoom) > 0.001) { const v = viewAt(s.zoom, inReel() ? 'reel' : stage.host.clientWidth < 560 ? 'narrow' : ''); if (lastZoom >= 0 || inReel()) stage.setView(v.pos, v.target, lastZoom < 0 ? 0.01 : 0.35); lastZoom = s.zoom; }
        // Light up one part.
        const lit = s.part === 'all' ? null : SEGS[s.part];
        for (const kk of Object.keys(n.meshes)) { const on = !lit || lit.includes(kk); n.meshes[kk].material.opacity = on ? 0.85 : 0.12; n.meshes[kk].material.emissive?.set(on && lit ? 0x331a00 : 0x000000); }
        n.tuft.material.opacity = !lit || s.part === 'glom' ? 1 : 0.25;
        n.capsule.material.opacity = s.part === 'glom' ? 0.35 : 0.2;
        n.vessels.visible = s.vessels;
        // Filtrate: flows along the tubule; each drop leaves the tube at its fate and fades.
        const speed = 1.1;
        for (let i = 0; i < NF; i++) {
          const s0 = ((rnd(i) * totL + t * speed) % (totL + 4));
          if (s0 > totL) { filt.hide(i); continue; }
          const sf = fate[i];
          const sAt = Math.min(s0, sf), { i: si, u } = tubeAt(sAt);
          segC[si].getPointAt(u, _p);
          if (s0 > sf) {
            const k2 = (s0 - sf) / 0.9;
            if (k2 > 1) { filt.hide(i); continue; }
            _p.z -= k2 * 0.7; _p.x += Math.sin(i) * k2 * 0.3;
            filt.place(i, _p.toArray(), null, 1 - k2 * 0.8);
          } else {
            _p.x += (rnd(i + 5) - 0.5) * 0.08; _p.z += (rnd(i + 6) - 0.5) * 0.08;
            filt.place(i, _p.toArray());
          }
        }
        filt.done();
        blood.visible = s.vessels;
        for (let i = 0; i < NB; i++) {
          let b = (rnd(i + 300) * bTot + t * 1.6) % bTot, j = 0;
          while (j < bL.length - 1 && b > bL[j]) { b -= bL[j]; j++; }
          bloodPath[j].getPointAt(clamp(b / bL[j], 0, 1), _p);
          blood.place(i, _p.toArray());
          blood.setColorAt(i, j === 3 && b / bL[j] > 0.5 ? bBlue : bRed);
        }
        blood.instanceColor.needsUpdate = true; blood.done();
        const narrow = fit();
        n.labs.forEach((l) => { l.visible = s.labels && !narrow && s.zoom > 0.6; });
        kl.forEach((l) => { l.visible = s.labels && s.zoom < 0.6; });
        zl.forEach((l) => { l.visible = s.labels && !narrow; });
        toCalyx.visible = s.labels;
      },
      readout: (s) => {
        const P = PART[s.part] || PART.all;
        return `<div class="big">About a million nephrons per kidney</div>
          <div class="row"><span>Range between people</span><b>about 200,000 to 2.5 million+</b></div>
          <div class="row"><span>Glomerulus</span><b>about 0.2 mm across</b></div>
          <div class="row"><span>Filtrate per nephron</span><b>about 60 nL a minute</b></div>
          <div class="row"><span>Taken back into blood</span><b>about 99 of every 100 drops</b></div>
          <small><b>${P.name}.</b> ${P.text} Yellow: filtrate. Red to blue: blood.</small>`;
      },
    });
  },
};
