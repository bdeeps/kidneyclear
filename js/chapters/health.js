// Chapter 6: keeping kidneys healthy and what goes wrong. General facts only, never medical advice.
// Scene 1, kidney stones: hard crystals, most often calcium oxalate, that form when urine holds
//   more of a substance than it can keep dissolved (supersaturation); low urine volume is a major
//   risk. About 1 in 10 people get one at some point; pain comes when a stone moves into the
//   ureter (NIDDK "Kidney Stones"). The ureter is narrowest where it leaves the kidney
//   (pelviureteric junction), where it crosses the iliac vessels at the pelvic brim, and where it
//   enters the bladder (vesicoureteric junction) (Gray's Anatomy). Many stones smaller than about
//   5 mm pass on their own; larger ones more often need treatment such as shock-wave lithotripsy
//   or ureteroscopy (NIDDK; American Urological Association guideline, 2016). For people who
//   have had stones, guidelines suggest drinking enough to make at least about 2.5 L of urine a
//   day (AUA "Medical Management of Kidney Stones", 2014). The growth rate here is a teaching
//   rule of thumb, not a prediction.
// Scene 2, chronic kidney disease (CKD): kidney damage or a GFR below 60 mL/min/1.73 m² for more
//   than 3 months; stages G1 (≥ 90) to G5 (< 15, kidney failure) (KDIGO 2012 and 2024 CKD
//   guidelines). Diabetes and high blood pressure are the most common causes; CKD often has no
//   symptoms until it is advanced, so people at risk are tested with a blood test (eGFR) and a
//   urine albumin test (NIDDK "Chronic Kidney Disease"). GBD 2023 (Lancet, 2025; IHME): about
//   788 million adults had CKD worldwide in 2023 (378 million in 1990), about 138 million of them
//   in India, and CKD caused about 1.48 million deaths, the 9th leading cause of death. Regular or
//   heavy use of NSAID painkillers (such as ibuprofen) can harm the kidneys, especially with
//   dehydration or existing kidney disease (NIDDK; National Kidney Foundation).
// Scene 3, dialysis: haemodialysis filters blood through a dialyser (an artificial kidney of
//   thousands of hollow fibres, with dialysate flowing the other way) usually about 4 hours,
//   3 times a week, in a centre or at home; peritoneal dialysis uses the lining of the belly as
//   the filter, with fluid exchanged several times a day or overnight by a machine (NIDDK
//   "Hemodialysis", "Peritoneal Dialysis"). Wastes such as urea and potassium diffuse from blood
//   into the dialysate down their concentration gradients; extra water is removed by pressure
//   (ultrafiltration). About 2.2 lakh (220,000) people develop kidney failure in India each year
//   (Ministry of Health and Family Welfare, quoted in Kidney360, 2025).
// Scene 4, transplant: a donated kidney is usually placed low in the front of the abdomen (the
//   iliac fossa) and joined to the iliac artery and vein and the bladder; the old kidneys are
//   usually left in place. A person can live a normal life with one healthy kidney, which is why
//   living donation is possible (NIDDK "Kidney Transplant"; NHS). India did about 13,400 kidney
//   transplants in 2023, most from living donors (NOTTO data, WHO Global Observatory on Donation
//   and Transplantation). Organ donation in India is governed by the Transplantation of Human
//   Organs Act, 1994.
import { THREE, M, clamp, lerp, tube, smooth } from '../kit.js';
import { makeKidney, makeTract, C, tissue, tint, fitNarrow, compactReadout, rnd, swarmOf, inReel, urineColour } from '../kidney.js';

const VIEWS = {
  stones: { pos: [-2.6, 6.2, 15], target: [-3.6, 5.6, 0] },
  ckd: { pos: [1.8, 7.9, 17], target: [1.6, 7.4, 0] },
  dialysis: { pos: [1.4, 7.3, 16], target: [1.2, 6.9, 0] },
  transplant: { pos: [-3.8, 8.4, 20], target: [-4.5, 8.0, 0] },
};
export const stageOf = (e) => (e >= 90 ? 'G1' : e >= 60 ? 'G2' : e >= 45 ? 'G3a' : e >= 30 ? 'G3b' : e >= 15 ? 'G4' : 'G5');
const STAGE_TXT = { G1: 'normal filtering (kidney damage may still be present)', G2: 'mildly reduced', G3a: 'mildly to moderately reduced', G3b: 'moderately to severely reduced', G4: 'severely reduced', G5: 'kidney failure: dialysis or a transplant is needed' };
const urineV = (drink) => Math.max(0.5, drink - 0.7);
const growRate = (V) => 0.3 * Math.max(0, 2.0 / V - 1.0);          // mm per second of the model clock

export default {
  id: 'health',
  short: 'Healthy kidneys',
  title: 'Keeping kidneys healthy, and what goes wrong',
  subtitle: 'Stones, chronic kidney disease, dialysis and transplants.',
  view: VIEWS.stones,
  learn: `<p>Kidney problems are common, and many can be prevented or slowed if they are found early. This chapter shares general facts only: for anything about your own health, <b>talk to a doctor</b>.</p>
    <p><b>Kidney stones.</b> If urine holds more of a substance than it can keep dissolved, crystals form, most often <b>calcium oxalate</b>, and can grow into a stone. About <b>1 in 10</b> people get one. A stone hurts when it moves into the ureter, especially at its three narrow points. Many small stones, under about <b>5 mm</b>, pass on their own; bigger ones may need treatment, such as <b>shock waves</b> that break them up. Dilute urine makes crystals less likely, which is why doctors tell people who have had stones to drink plenty of water.</p>
    <p><b>Chronic kidney disease (CKD)</b> means the kidneys slowly lose nephrons over months or years. The most common causes are <b>diabetes</b> and <b>high blood pressure</b>. It usually causes <b>no symptoms</b> until it is advanced, so people at risk get a simple blood test (<b>eGFR</b>) and a urine test for protein. About <b>788 million</b> adults worldwide have CKD, about <b>138 million</b> of them in India. Taking painkillers such as ibuprofen (NSAIDs) often, or in large doses, can also harm the kidneys.</p>
    <p><b>Dialysis</b> takes over when the kidneys fail. In <b>haemodialysis</b>, blood flows through a machine filter made of thousands of hollow fibres, usually about <b>4 hours, 3 times a week</b>. Wastes like urea and potassium diffuse into a cleaning fluid flowing the other way. <b>Peritoneal dialysis</b> uses the lining of your own belly as the filter. A <b>kidney transplant</b> puts a donated kidney low in the belly. You can live well with <b>one</b> healthy kidney, so a living person can donate one.</p>
    <p>See a doctor for blood in the urine, pain in the side or back, swelling of the legs or face, foamy urine, or big changes in how often you pass urine. If you have diabetes or high blood pressure, ask about kidney tests.</p>
    <p class="tip"><b>Try it:</b> grow a stone, then drink more and see what changes. Pass it and watch it squeeze down the ureter. Then lower the eGFR through the CKD stages, and watch dialysis clean the blood.</p>`,
  terms: [
    { t: 'Kidney stone', d: 'A hard lump of crystals that forms in the kidney when urine is too concentrated in some substances.' },
    { t: 'CKD', d: 'Chronic kidney disease: kidney damage or low filtering that lasts more than three months.' },
    { t: 'eGFR', d: 'Estimated glomerular filtration rate, worked out from a blood test. Below 60 for three months is CKD; below 15 is kidney failure.' },
    { t: 'Haemodialysis', d: 'Cleaning the blood by passing it through a filter outside the body.' },
    { t: 'Peritoneal dialysis', d: 'Cleaning the blood using the lining of the belly as a filter, with fluid put in and drained out.' },
    { t: 'Transplant', d: 'Placing a healthy kidney from a donor into someone whose kidneys have failed.' },
    { t: 'NSAIDs', d: 'Painkillers such as ibuprofen. Heavy or regular use can harm the kidneys.' },
  ],
  defaults: { scene: 'stones', drink: 1.5, stone: 3, stoneAt: 0, passing: false, egfr: 100, labels: true },
  controls: [
    { key: 'scene', type: 'seg', label: 'Show', options: [{ v: 'stones', label: 'Stones' }, { v: 'ckd', label: 'CKD' }, { v: 'dialysis', label: 'Dialysis' }, { v: 'transplant', label: 'Transplant' }] },
    { key: 'drink', type: 'range', label: 'Stones: water you drink a day', min: 0.8, max: 4, step: 0.05, ends: ['little', 'plenty'], fmt: (v) => v.toFixed(1) + ' L' },
    { key: 'go', type: 'buttons', label: 'Stones', items: [{ label: 'Pass the stone', act: (s) => { s.scene = 'stones'; s.passing = true; } }, { label: 'Start again', act: (s) => { s.scene = 'stones'; s.stone = 3; s.stoneAt = 0; s.passing = false; } }] },
    { key: 'egfr', type: 'range', label: 'CKD: kidney filtering (eGFR)', min: 5, max: 120, step: 1, ends: ['5', '120'], fmt: (v) => `${Math.round(v)} (${stageOf(v)})` },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'What makes kidney stones more likely to form?', options: ['Very dilute urine', 'Concentrated urine, for example from not drinking enough', 'Having two kidneys', 'Walking a lot'], answer: 1, why: 'When urine carries more of a substance than it can keep dissolved, crystals form. More dilute urine makes that less likely.' },
    { q: 'What are the two most common causes of chronic kidney disease?', options: ['Stones and infections', 'Diabetes and high blood pressure', 'Drinking water and exercise', 'Cold weather and stress'], answer: 1, why: 'Diabetes and high blood pressure damage the glomeruli over years. CKD is often silent, so people at risk get tested.' },
    { q: 'Why can a living person donate a kidney?', options: ['Kidneys grow back', 'One healthy kidney can do the work of two', 'Kidneys are not needed', 'The donor gets a machine'], answer: 1, why: 'A single healthy kidney can filter enough for a normal life, so living donation is possible. The new kidney goes low in the recipient’s belly.' },
  ],
  reel: [
    { ms: 5400, caption: 'Stones form when urine is too concentrated. Water helps keep crystals dissolved.', set: { scene: 'stones', drink: 1.0, stone: 3, stoneAt: 0, passing: false, labels: false }, anim: { stone: [2, 7] }, view: { pos: [-0.8, 6.0, 11.5], target: [-0.9, 5.4, 0] }, spin: 0 },
    { ms: 5600, caption: 'When kidneys fail, a dialysis machine filters the blood, about 4 hours, 3 times a week.', set: { scene: 'dialysis', labels: false }, view: { pos: [2.2, 5.6, 11], target: [2.2, 5.0, 0] }, spin: 0.2 },
  ],

  build({ stage }) {
    stage.renderer.localClippingEnabled = true;
    const root = new THREE.Group(); root.position.y = 1.2; stage.root.add(root);
    const G = { stones: new THREE.Group(), ckd: new THREE.Group(), dialysis: new THREE.Group(), transplant: new THREE.Group() };
    Object.values(G).forEach((g) => root.add(g));
    G.dialysis.position.set(1.8, -1.6, 0);
    const _p = new THREE.Vector3();

    // ================================================================ stones
    const kid = makeKidney(1); kid.group.position.set(0.6, 6.0, 0); kid.group.scale.setScalar(2.3); G.stones.add(kid.group);
    G.stones.updateMatrixWorld(true);
    const pel = kid.group.localToWorld(kid.hil.pelvis.clone()).sub(root.position);
    const urPts = [pel.toArray(), [pel.x - 0.7, pel.y - 0.9, 0], [pel.x - 0.95, pel.y - 2.6, 0], [pel.x - 0.8, pel.y - 4.3, 0.1], [pel.x - 0.4, pel.y - 5.4, 0.2]];
    const urCurve = new THREE.CatmullRomCurve3(urPts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    const urMesh = new THREE.Mesh(new THREE.TubeGeometry(urCurve, 120, 0.16, 12), tissue(C.ureter, { opacity: 0.5, depthWrite: false })); G.stones.add(urMesh);
    const blad = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 16), tissue(C.bladder, { opacity: 0.55, depthWrite: false })); blad.scale.set(1.2, 0.8, 1); blad.position.set(pel.x - 0.1, pel.y - 6.0, 0.2); G.stones.add(blad);
    const NARROW = [0.04, 0.5, 0.96];
    const narrowL = NARROW.map((u, i) => { urCurve.getPointAt(u, _p); return tint(stage.label(['1. Leaving the kidney', '2. Crossing the iliac vessels', '3. Entering the bladder'][i], [_p.x - 1.9, _p.y, 0.3], G.stones), 'gold'); });
    const stoneMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xcdb36a, roughness: 0.9, flatShading: true }));
    { const p = stoneMesh.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.75 + 0.5 * rnd(i % 42); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } stoneMesh.geometry.computeVertexNormals(); }
    G.stones.add(stoneMesh);
    const calyx = kid.group.localToWorld(new THREE.Vector3(-0.08, -0.5, 0.06)).sub(root.position);
    const crystals = swarmOf(40, new THREE.OctahedronGeometry(0.05, 0), M.glow(0xfff1b8)); G.stones.add(crystals);
    const stoneL = tint(stage.label('Stone', [0, 0, 0], G.stones), 'gold');
    const stonesLabs = [tint(stage.label('Kidney, cut open', [2.6, 8.9, 0.3], G.stones), 'pink'), tint(stage.label('Ureter', [pel.x + 0.9, pel.y - 3.0, 0.3], G.stones), 'urine')];

    // ================================================================ CKD
    const NGX = 14, NGY = 8, glom = swarmOf(NGX * NGY, new THREE.SphereGeometry(0.17, 12, 8), M.glow(0xffffff)); G.ckd.add(glom);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(NGX * 0.46 + 0.6, NGY * 0.46 + 0.6), M.ghost(0x2a1a22, 0.6)); panel.position.set(1.2, 4.6, -0.3); G.ckd.add(panel);
    const ckdKid = makeKidney(1); ckdKid.group.position.set(7.0, 4.6, 0); ckdKid.group.scale.setScalar(1.6); G.ckd.add(ckdKid.group);
    const ckdLabs = [tint(stage.label('Each dot stands for thousands of nephrons', [1.2, 6.95, 0], G.ckd), 'pink'), tint(stage.label('Common causes: diabetes, high blood pressure', [1.2, 2.2, 0], G.ckd), 'gold'), tint(stage.label('Damaged kidneys often shrink', [7.0, 2.1, 0], G.ckd), 'pink')];
    const live = new THREE.Color(0xff6b8a), dead = new THREE.Color(0x4a4650);

    // ================================================================ dialysis
    const dz = new THREE.Group(); dz.position.set(0.6, 6.2, 0); G.dialysis.add(dz);
    const LEN = 5, R = 0.75;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, LEN, 40, 1, true), M.clear(0xdff3ff, 0.16)); shell.rotation.z = Math.PI / 2; dz.add(shell);
    [-1, 1].forEach((sx) => { const capM = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), tissue(0xe0e4ea, { opacity: 0.5, depthWrite: false })); capM.rotation.z = -sx * Math.PI / 2; capM.scale.y = 0.4; capM.position.x = sx * LEN / 2; dz.add(capM); });
    const FIB = []; for (let r = 0; r < 3; r++) { const n = r === 0 ? 1 : r * 6; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + r * 0.3; FIB.push([Math.cos(a) * r * 0.24, Math.sin(a) * r * 0.24]); } }
    FIB.forEach(([y, z]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, LEN, 8, 1, true), tissue(0xff9a9a, { opacity: 0.45, depthWrite: false })); f.rotation.z = Math.PI / 2; f.position.set(0, y, z); dz.add(f); });
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 3.2, 8, 20), M.ghost(0xe8c3a8, 0.25)); arm.rotation.z = Math.PI / 2; arm.position.set(-4.6, 2.6, 0.2); G.dialysis.add(arm);
    const lineIn = tube([[-4.0, 2.8, 0.5], [-3.6, 4.3, 0.5], [-2.6, 6.6, 0.3], [-2.25, 6.3, 0]], 0.08, tissue(C.artery), false, 60); G.dialysis.add(lineIn);
    const lineOut = tube([[3.5, 6.2, 0], [4.2, 5.0, 0.4], [2.0, 2.4, 0.8], [-3.2, 2.5, 0.6]], 0.08, tissue(C.vein), false, 80); G.dialysis.add(lineOut);
    const dIn = tube([[2.4, 5.35, 0], [2.6, 4.2, -0.5], [3.4, 3.6, -0.8]], 0.08, tissue(0x8fd3ff), false, 40), dOut = tube([[-1.4, 5.35, 0], [-1.6, 4.3, -0.5], [-2.4, 3.8, -0.8]], 0.08, tissue(0xbfb38a), false, 40);
    G.dialysis.add(dIn, dOut);
    const NBd = 60, NDd = 50, NU = 36;
    const bDots = swarmOf(NBd, new THREE.SphereGeometry(0.05, 8, 6), M.glow(0xff5a5a)); dz.add(bDots);
    const dDots = swarmOf(NDd, new THREE.SphereGeometry(0.045, 8, 6), M.glow(0x8fd3ff)); dz.add(dDots);
    const uDots = swarmOf(NU, new THREE.SphereGeometry(0.055, 8, 6), M.glow(C.urea)); dz.add(uDots);
    const dialLabs = [
      tint(stage.label('Dialyser: thousands of hollow fibres', [0.6, 7.45, 0], G.dialysis), 'side'),
      tint(stage.label('Blood from the arm (fistula)', [-4.4, 4.5, 0.6], G.dialysis), 'blood'),
      tint(stage.label('Cleaned blood back', [4.6, 4.2, 0.6], G.dialysis), 'vein'),
      tint(stage.label('Fresh dialysate in', [3.7, 3.2, -0.6], G.dialysis), 'water'),
      tint(stage.label('Used dialysate out, with urea', [-2.4, 3.3, -0.6], G.dialysis), 'gold'),
    ];

    // ================================================================ transplant
    const tr = makeTract(stage, { labels: false, context: false, flow: true });
    tr.root.position.set(0, 9.3, 0); tr.root.scale.setScalar(0.85); G.transplant.add(tr.root);
    [tr.kid.L, tr.kid.R].forEach((k) => { k.mat.opacity = 0.35; k.mat.depthWrite = false; });
    const nk = makeKidney(-1); nk.group.position.set(-1.9, -4.6, 0.6); nk.group.rotation.set(0, -0.3, -0.5); tr.root.add(nk.group);
    nk.mat.color.set(0xc4574a);
    tr.root.updateMatrixWorld(true);
    const nkH = (k) => nk.group.position.clone().add(nk.hil[k].clone().applyEuler(nk.group.rotation));
    const joinA = tube([nkH('artery').toArray(), [-1.35, -4.9, 0.1], [-1.3, -5.0, -0.2]], 0.1, tissue(C.artery), false, 20);
    const joinV = tube([nkH('vein').toArray(), [-1.3, -4.8, 0.2], [-1.25, -5.1, -0.45]], 0.11, tissue(C.vein), false, 20);
    const newUr = tube([nkH('pelvis').toArray(), [-1.3, -5.6, 0.7], [-0.9, -6.3, 0.6], [-0.55, -6.6, 0.35]], 0.08, tissue(C.ureter), false, 30);
    tr.root.add(joinA, joinV, newUr);
    const txLabs = [tint(stage.label('Donated kidney, low in the belly', [-3.9, 4.6, 0.9], G.transplant), 'good'), tint(stage.label('Old kidneys usually stay', [2.7, 10.4, 0], G.transplant), 'pink'), tint(stage.label('Joined to the iliac artery, vein and bladder', [-1.3, 2.9, 0.9], G.transplant), 'gold')];

    let t = 0, sceneWas = '', stoneWas = -1;
    const NVIEWS = {
      stones: { pos: [0.4, 9.1, 18.5], target: [0.4, 9.1, 0] },
      ckd: { pos: [3.2, 8.6, 18], target: [3.2, 8.6, 0] },
      dialysis: { pos: [1.4, 6.8, 15], target: [1.4, 6.8, 0] },
      transplant: { pos: [0, 11.6, 18.5], target: [0, 11.6, 0] },
    };
    const fit = fitNarrow(stage, NVIEWS.stones);
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        for (const k of Object.keys(G)) G[k].visible = s.scene === k;
        const narrow = fit();
        if (s.scene !== sceneWas) { if (sceneWas && !inReel()) { const v = (narrow ? NVIEWS : VIEWS)[s.scene]; stage.setView(v.pos, v.target, 0.9); } sceneWas = s.scene; }
        // ---- stones
        if (s.scene === 'stones') {
          kid.setCut(1);
          const V = urineV(s.drink);
          if (s.passing) { s.stoneAt = Math.min(1, s.stoneAt + dt * 0.1); if (s.stoneAt >= 1) s.passing = false; }
          else if (s.stoneAt <= 0) s.stone = clamp(s.stone + growRate(V) * dt, 1, 12);
          if (s.stone !== stoneWas) stoneWas = s.stone;
          let pos;
          if (s.stoneAt <= 0.12) { const k = s.stoneAt / 0.12; pos = calyx.clone().lerp(pel, smooth(k)); }
          else { urCurve.getPointAt((s.stoneAt - 0.12) / 0.88, _p); pos = _p.clone(); }
          const r = s.stone * 0.038;                                     // 1 unit ≈ 1.7 cm here, drawn a little big
          stoneMesh.position.copy(pos); stoneMesh.scale.setScalar(Math.max(0.05, r)); stoneMesh.rotation.set(t * 0.2, t * 0.3, 0);
          stoneL.position.copy(pos).add(new THREE.Vector3(0.9, 0.35, 0.3));
          // The ureter bulges where the stone is (a squeeze at the narrow points).
          urMesh.material.color.set(s.stoneAt > 0.12 ? 0xf0a070 : C.ureter);
          const nC = Math.round(40 * clamp(growRate(V) / 0.4, 0, 1));
          for (let i = 0; i < 40; i++) {
            if (i >= nC || s.stoneAt > 0) { crystals.hide(i); continue; }
            const a = rnd(i) * 6.28, k = (rnd(i + 5) + t * 0.3) % 1;
            crystals.place(i, [calyx.x + Math.cos(a) * (0.9 - 0.8 * k), calyx.y + Math.sin(a) * (0.9 - 0.8 * k), calyx.z + 0.15], [t + i, i, 0]);
          }
          crystals.done();
          narrowL.forEach((l) => { l.visible = s.labels && !narrow; });
          stonesLabs.forEach((l) => { l.visible = s.labels && !narrow; });
          stoneL.visible = s.labels;
        }
        // ---- CKD
        if (s.scene === 'ckd') {
          const n = NGX * NGY, alive = Math.round(n * clamp(s.egfr / 120, 0, 1));
          for (let i = 0; i < n; i++) {
            const gx = i % NGX, gy = Math.floor(i / NGX);
            const idx = Math.floor(rnd(i + 31) * 1e6) % n;          // lose nephrons scattered, not in rows
            const ok = (idx * 7919) % n < alive;
            glom.place(i, [1.2 + (gx - (NGX - 1) / 2) * 0.46, 4.6 + (gy - (NGY - 1) / 2) * 0.46, 0], null, ok ? 1 + 0.08 * Math.sin(t * 3 + i) : 0.6);
            glom.setColorAt(i, ok ? live : dead);
          }
          glom.instanceColor.needsUpdate = true; glom.done();
          ckdKid.setCut(1);
          ckdKid.group.scale.setScalar(1.6 * lerp(0.72, 1, clamp(s.egfr / 90, 0, 1)));
          ckdLabs.forEach((l) => { l.visible = s.labels && !narrow; });
        }
        // ---- dialysis
        if (s.scene === 'dialysis') {
          for (let i = 0; i < NBd; i++) { const f = FIB[i % FIB.length], u = (rnd(i) + t * 0.18) % 1; bDots.place(i, [-LEN / 2 + u * LEN, f[0], f[1]]); }
          bDots.done();
          for (let i = 0; i < NDd; i++) { const a = rnd(i + 3) * 6.28, rr = 0.35 + rnd(i + 4) * 0.33, u = (rnd(i + 5) + t * 0.22) % 1; dDots.place(i, [LEN / 2 - u * LEN, Math.cos(a) * rr, Math.sin(a) * rr]); }
          dDots.done();
          // Urea: carried along a fibre, then diffuses out and is swept away by the dialysate.
          for (let i = 0; i < NU; i++) {
            const f = FIB[(i * 5) % FIB.length], ph = (rnd(i + 9) + t * 0.14) % 1, x0 = -LEN / 2 + rnd(i + 11) * LEN * 0.7;
            if (ph < 0.3) uDots.place(i, [x0 + ph * 2, f[0], f[1]]);
            else { const k = (ph - 0.3) / 0.7, a = Math.atan2(f[1], f[0] + 1e-3) + rnd(i) * 2, rr = lerp(Math.hypot(f[0], f[1]), 0.62, Math.min(1, k * 3)); uDots.place(i, [x0 + 0.6 - k * 3.2, Math.cos(a) * rr, Math.sin(a) * rr]); }
          }
          uDots.done();
          dialLabs.forEach((l) => { l.visible = s.labels && !narrow; });
        }
        // ---- transplant
        if (s.scene === 'transplant') {
          tr.flow.step(dt);
          txLabs.forEach((l) => { l.visible = s.labels && !narrow; });
        }
        if (s.scene !== 'stones') { narrowL.forEach((l) => { l.visible = false; }); stonesLabs.forEach((l) => { l.visible = false; }); stoneL.visible = false; }
        if (s.scene !== 'ckd') ckdLabs.forEach((l) => { l.visible = false; });
        if (s.scene !== 'dialysis') dialLabs.forEach((l) => { l.visible = false; });
        if (s.scene !== 'transplant') txLabs.forEach((l) => { l.visible = false; });
      },
      readout: (s) => {
        if (s.scene === 'stones') {
          const V = urineV(s.drink), g = growRate(V), mm = s.stone;
          const where = s.stoneAt <= 0 ? 'in a calyx (often painless here)' : s.stoneAt < 1 ? 'moving down the ureter: this is when it hurts' : 'reached the bladder';
          return `<div class="big">A ${mm.toFixed(1)} mm stone</div>
            <div class="row"><span>Urine a day</span><b>about ${V.toFixed(1)} L</b></div>
            <div class="row"><span>Crystals forming</span><b class="${g > 0.02 ? 'no' : 'ok'}">${g > 0.25 ? 'fast' : g > 0.02 ? 'slowly' : 'hardly at all'}</b></div>
            <div class="row"><span>Where it is</span><b>${where}</b></div>
            <div class="row"><span>Size</span><b>${mm < 5 ? 'small: many pass on their own' : mm < 10 ? 'medium: may need help' : 'large: usually needs treatment'}</b></div>
            <small>A simple model of how dilution slows crystal growth. Pain in the side or back, or blood in the urine, needs a doctor.</small>`;
        }
        if (s.scene === 'ckd') {
          const st = stageOf(s.egfr);
          return `<div class="big">eGFR ${Math.round(s.egfr)}: stage ${st}</div>
            <div class="row"><span>Meaning</span><b>${STAGE_TXT[st]}</b></div>
            <div class="row"><span>Adults with CKD, world (2023)</span><b>about 788 million</b></div>
            <div class="row"><span>In India</span><b>about 138 million</b></div>
            <div class="row"><span>Deaths a year, world</span><b>about 1.5 million</b></div>
            <small>Stages from KDIGO. CKD is usually silent until late: people with diabetes or high blood pressure should ask a doctor about kidney tests.</small>`;
        }
        if (s.scene === 'dialysis') {
          return `<div class="big">An artificial kidney</div>
            <div class="row"><span>Haemodialysis</span><b>usually about 4 h, 3 times a week</b></div>
            <div class="row"><span>How it cleans</span><b>diffusion across fibre walls</b></div>
            <div class="row"><span>Removes</span><b>urea, potassium, extra water</b></div>
            <div class="row"><span>Kidney failure a year, India</span><b>about 2.2 lakh new people</b></div>
            <small>Red: blood inside the fibres. Blue: dialysate flowing the other way. White: urea leaving the blood. Peritoneal dialysis uses the belly’s own lining instead.</small>`;
        }
        return `<div class="big">A new kidney</div>
          <div class="row"><span>Where it goes</span><b>low in the front of the belly</b></div>
          <div class="row"><span>Living donors</span><b>can live well with one kidney</b></div>
          <div class="row"><span>Kidney transplants in India, 2023</span><b>about 13,400</b></div>
          <div class="row"><span>First successful one</span><b>Boston, 1954; India, Vellore, 1971</b></div>
          <small>Recipients take medicines for life to stop the immune system rejecting the kidney.</small>`;
      },
    });
  },
};
