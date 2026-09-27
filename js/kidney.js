// KidneyClear's shared models: the urinary tract in the body (two kidneys, adrenal glands, renal
// arteries and veins, aorta and inferior vena cava, ureters, bladder and urethra), a kidney cut in
// coronal section, and a single nephron with its blood vessels.
//
// Orientation: we face the patient (anterior view), as in an anatomy atlas, so the patient's
// RIGHT is on YOUR LEFT. Axes: +x = patient's left, +y = up (towards the head), +z = forwards
// (towards you). One model unit is 4 cm.
// Placement and sizes (Gray's Anatomy, 42nd ed.; StatPearls "Anatomy, Abdomen and Pelvis:
// Kidneys"; NIDDK "Your Kidneys & How They Work"; Britannica "Kidney"):
//  - each kidney is about 11 to 12 cm long, 5 to 7 cm wide, 3 cm thick and weighs about 150 g
//    (roughly the size of a fist, NIDDK); they lie against the back wall of the abdomen, behind
//    the peritoneum (retroperitoneal), beside the spine from about T12 to L3;
//  - the RIGHT kidney sits about 1 to 2 cm LOWER than the left, pushed down by the liver;
//  - upper poles lean in towards the spine and back; the hilum faces forwards and inwards, with
//    (front to back) the renal vein, renal artery and renal pelvis;
//  - the left renal vein is longer and crosses in front of the aorta to the inferior vena cava;
//    the right renal artery is longer and passes behind the inferior vena cava;
//  - the adrenal (suprarenal) glands sit on top: the right one pyramid-shaped, the left one
//    crescent-shaped;
//  - the ureters are about 25 to 30 cm long, run down on the psoas muscles, cross the iliac
//    vessels at the pelvic brim and enter the back of the bladder at an angle;
//  - the bladder comfortably holds about 400 to 600 mL in adults (StatPearls "Physiology,
//    Bladder").
import { THREE, M, tube, torus, clamp, lerp, smooth, canvasTexture } from './kit.js';

export const CM = 0.25;                          // model units per centimetre
const v3 = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));

// ---------------------------------------------------------------- colours
export const C = {
  kidney: 0x9e3d34, capsule: 0xd79a8a, cortex: 0xb04a3c, medulla: 0x6e2028, pelvis: 0xf1dca6,
  adrenal: 0xe2a94a, artery: 0xd8353c, vein: 0x4468d0, ureter: 0xe8c690, bladder: 0xe7b08e,
  bone: 0xefe6d6, liver: 0x7d2f25, psoas: 0xb5504c, spleen: 0x7a3350,
  urine: 0xf2d24b, filtrate: 0xffe27a, water: 0x6fc3ff, salt: 0xffd166, glucose: 0x6ee7a8,
  urea: 0xf4f4f4, protein: 0xff9f43, rbc: 0xd8323c, pct: 0xe8b04a, thin: 0x8fc9ff, tal: 0x5fd0a0,
  dct: 0xc98bff, cd: 0xf1f1f1, renin: 0x6ee7a8, aldo: 0xc9a7ff, adh: 0x8ef0ff, epo: 0xff6b9a,
};
export const tissue = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 1, ...o });

// ---------------------------------------------------------------- labels and layout helpers
const TINT = { blood: '#ff8a8a', vein: '#9db4ff', urine: '#ffd166', side: '#8ef0ff', gold: '#ffd166', good: '#6ee7a8', hormone: '#c9a7ff', water: '#8fd3ff', pink: '#ff9fc0' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export function sideLabels(stage, parent, y, x, z = 0.8) {
  return [tint(stage.label("← Patient's right", [-x, y, z], parent), 'side'), tint(stage.label("Patient's left →", [x, y, z], parent), 'side')];
}
// On a phone-width stage the readout covers the upper left: re-centre once, unless orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !document.body.classList.contains('gb-reel')) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
// A flat board with a canvas chart on it.
export function board(canvasTex, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
}
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const inReel = () => document.body.classList.contains('gb-reel');
// Urine colour from concentration (mOsm/kg): pale straw when dilute, dark amber when concentrated.
export function urineColour(osm) {
  const k = clamp((Math.log(osm) - Math.log(50)) / (Math.log(1200) - Math.log(50)), 0, 1);
  return new THREE.Color().setHSL(lerp(0.16, 0.09, k), lerp(0.55, 0.95, k), lerp(0.86, 0.42, k));
}
// A rounded box path for canvas boards.
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------------------------------------------------------------- the kidney's shape
// A bean: an ellipse (half-length 1.45 = 5.8 cm, half-width 0.78 = 3.1 cm) with the hilum dented
// in on the inner (medial) side, and 0.42 (1.7 cm) half-thickness. In the kidney's own frame the
// medial side is −x; the right kidney is mirrored.
export const KR = { x: 0.78, y: 1.45, z: 0.42 };
export const beanR = (a) => { const d = Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI)); return 1 - 0.42 * Math.exp(-(d * d) / (2 * 0.3 * 0.3)); };
export const beanXY = (a, k = 1) => { const r = beanR(a) * k; return [KR.x * Math.cos(a) * r, KR.y * Math.sin(a) * r]; };
export const HILUM = -KR.x * (1 - 0.42);           // x of the dent's deepest point (−0.45)

function mirrorGeo(g) {
  g.scale(-1, 1, 1);
  const idx = g.index.array;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  g.index.needsUpdate = true; g.computeVertexNormals();
  return g;
}
function kidneyGeo(side) {
  const g = new THREE.SphereGeometry(1, 64, 40), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(y, x), r = beanR(a);
    // A slightly fuller upper pole, as in most kidneys.
    const up = 1 + 0.05 * Math.max(0, y);
    p.setXYZ(i, KR.x * x * r * up, KR.y * y * r, KR.z * z * lerp(1, 0.75, Math.exp(-((Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) ** 2) / 0.18)));
  }
  g.computeVertexNormals();
  return side < 0 ? mirrorGeo(g) : g;
}

// The coronal section, drawn once: capsule, cortex, renal columns, 8 medullary pyramids whose
// tips (papillae) drain into minor calyces, 2 to 3 major calyces, the renal pelvis leaving at the
// hilum, and the renal artery and vein branching between the pyramids (interlobar vessels) and
// arching along their bases (arcuate vessels). Gray's Anatomy, 42nd ed., ch. 74.
const SX = 0.9, SY = 1.58;                        // section canvas spans x ∈ [−SX, SX], y ∈ [−SY, SY]
export const PYR = [-1.5, -1.12, -0.72, -0.28, 0.2, 0.62, 1.05, 1.45].map((th) => th);   // pyramid directions (radians from +x)
const SO = [-0.3, 0];                             // the sinus centre, where the calyces gather
function pyramidGeom(th) {
  const [px, py] = beanXY(th < 0 ? th + Math.PI * 2 : th, 1);
  const dx = px - SO[0], dy = py - SO[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const base = [SO[0] + dx * 0.74, SO[1] + dy * 0.74], apex = [SO[0] + dx * 0.36, SO[1] + dy * 0.36], hw = 0.2 * L * 0.5;
  return { base, apex, ux, uy, hw, L };
}
function drawSection(g, w, h) {
  const X = (x) => ((x + SX) / (2 * SX)) * w, Y = (y) => ((SY - y) / (2 * SY)) * h;
  g.clearRect(0, 0, w, h);
  g.save();
  g.beginPath();
  for (let i = 0; i <= 200; i++) { const [x, y] = beanXY((i / 200) * Math.PI * 2, 0.995); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
  g.closePath(); g.clip();
  g.fillStyle = '#b3503f'; g.fillRect(0, 0, w, h);                         // cortex
  // Granular look of the cortex (millions of glomeruli are in here).
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? '120,30,30' : '220,120,100'},0.35)`; g.beginPath(); g.arc(rnd(i + 3) * w, rnd(i + 7) * h, 1.5 + rnd(i + 9) * 1.5, 0, 7); g.fill(); }
  // Sinus fat around the calyces and pelvis.
  g.fillStyle = '#e8cf8e'; g.beginPath(); g.ellipse(X(-0.42), Y(0), (0.33 / (2 * SX)) * w, (0.72 / (2 * SY)) * h, 0, 0, 7); g.fill();
  // Pyramids with their striations.
  PYR.forEach((th) => {
    const P = pyramidGeom(th), nx = -P.uy, ny = P.ux;
    const b1 = [P.base[0] + nx * P.hw * 2.2, P.base[1] + ny * P.hw * 2.2], b2 = [P.base[0] - nx * P.hw * 2.2, P.base[1] - ny * P.hw * 2.2];
    g.fillStyle = '#6e2028'; g.beginPath(); g.moveTo(X(P.apex[0]), Y(P.apex[1])); g.lineTo(X(b1[0]), Y(b1[1]));
    g.quadraticCurveTo(X(P.base[0] + P.ux * 0.06), Y(P.base[1] + P.uy * 0.06), X(b2[0]), Y(b2[1])); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(200,90,90,.45)'; g.lineWidth = 1.5;
    for (let k = -3; k <= 3; k++) { const f = k / 3.5; g.beginPath(); g.moveTo(X(P.apex[0]), Y(P.apex[1])); g.lineTo(X(P.base[0] + nx * P.hw * 2 * f), Y(P.base[1] + ny * P.hw * 2 * f)); g.stroke(); }
    // Arcuate vessels along the base.
    g.strokeStyle = '#e0484a'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(b1[0] + P.ux * 0.02), Y(b1[1] + P.uy * 0.02)); g.quadraticCurveTo(X(P.base[0] + P.ux * 0.09), Y(P.base[1] + P.uy * 0.09), X(b2[0] + P.ux * 0.02), Y(b2[1] + P.uy * 0.02)); g.stroke();
  });
  // Interlobar vessels between pyramids, from the sinus out to the arcuate arches.
  for (let i = 0; i < PYR.length - 1; i++) {
    const th = (PYR[i] + PYR[i + 1]) / 2, P = pyramidGeom(th);
    g.lineWidth = 4; g.strokeStyle = '#d8353c'; g.beginPath(); g.moveTo(X(SO[0] + P.ux * 0.1), Y(SO[1] + P.uy * 0.1)); g.lineTo(X(P.base[0] + P.ux * 0.05), Y(P.base[1] + P.uy * 0.05)); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#4468d0'; g.beginPath(); g.moveTo(X(SO[0] + P.ux * 0.1 - P.uy * 0.03), Y(SO[1] + P.uy * 0.1 + P.ux * 0.03)); g.lineTo(X(P.base[0] - P.uy * 0.03), Y(P.base[1] + P.ux * 0.03)); g.stroke();
  }
  // Minor calyces cupping each papilla, joined into major calyces and the pelvis.
  const majors = [[-0.28, 0.62], [-0.18, 0.02], [-0.28, -0.6]];
  g.strokeStyle = '#f1dca6'; g.fillStyle = '#f1dca6'; g.lineCap = 'round';
  PYR.forEach((th) => {
    const P = pyramidGeom(th), m = majors[th > 0.5 ? 0 : th < -0.5 ? 2 : 1];
    g.lineWidth = 14; g.beginPath(); g.moveTo(X(P.apex[0] - P.ux * 0.02), Y(P.apex[1] - P.uy * 0.02)); g.lineTo(X(m[0]), Y(m[1])); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.arc(X(P.apex[0]), Y(P.apex[1]), 14, Math.atan2(P.uy, -P.ux) - 1.4 + Math.PI, Math.atan2(P.uy, -P.ux) + 1.4 + Math.PI); g.stroke();
  });
  majors.forEach((m) => { g.lineWidth = 26; g.beginPath(); g.moveTo(X(m[0]), Y(m[1])); g.lineTo(X(-0.5), Y(-0.12)); g.stroke(); });
  g.beginPath(); g.moveTo(X(-0.28), Y(0.35)); g.quadraticCurveTo(X(-0.62), Y(0.12), X(-0.95), Y(-0.28)); g.lineTo(X(-0.95), Y(-0.42)); g.quadraticCurveTo(X(-0.55), Y(-0.45), X(-0.28), Y(-0.35)); g.closePath(); g.fill();
  // Renal artery and vein in the hilum.
  g.lineWidth = 12; g.strokeStyle = '#d8353c'; g.beginPath(); g.moveTo(X(-1), Y(0.3)); g.quadraticCurveTo(X(-0.45), Y(0.3), X(-0.22), Y(0.08)); g.stroke();
  g.strokeStyle = '#4468d0'; g.beginPath(); g.moveTo(X(-1), Y(0.5)); g.quadraticCurveTo(X(-0.45), Y(0.5), X(-0.24), Y(0.28)); g.stroke();
  g.restore();
  // Capsule.
  g.strokeStyle = '#e6b2a2'; g.lineWidth = 6; g.beginPath();
  for (let i = 0; i <= 200; i++) { const [x, y] = beanXY((i / 200) * Math.PI * 2, 0.99); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
  g.closePath(); g.stroke();
}
let sectionTex = null;
export function sectionTexture() { if (!sectionTex) sectionTex = canvasTexture(560, 980, drawSection); return sectionTex; }
function sectionGeo(side) {
  const sh = new THREE.Shape();
  for (let i = 0; i <= 160; i++) { const [x, y] = beanXY((i / 160) * Math.PI * 2, 0.995); i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const g = new THREE.ShapeGeometry(sh, 4), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + SX) / (2 * SX), (p.getY(i) + SY) / (2 * SY));
  if (side < 0) g.scale(-1, 1, 1);
  return g;
}

// One kidney: shell, section and pelvis stub, in its own frame (hilum towards −x for side +1).
// side = +1 is the patient's left kidney (on your right), −1 the right kidney.
export function makeKidney(side = 1) {
  const g = new THREE.Group();
  const mat = tissue(C.kidney, { roughness: 0.42, clearcoat: 0.7 });
  const shell = new THREE.Mesh(kidneyGeo(side), mat); shell.castShadow = true; g.add(shell);
  const sec = new THREE.Mesh(sectionGeo(side), new THREE.MeshStandardMaterial({ map: sectionTexture().tex, roughness: 0.7, side: THREE.DoubleSide, transparent: true, alphaTest: 0.05 }));
  sec.visible = false; g.add(sec);
  const plane = new THREE.Plane();
  const tmp = new THREE.Plane();
  // Hilum points in the kidney frame (front to back: vein, artery, pelvis).
  const hx = side * HILUM;
  const hil = { vein: new THREE.Vector3(hx - side * 0.02, 0.2, 0.2), artery: new THREE.Vector3(hx - side * 0.02, 0.24, 0.02), pelvis: new THREE.Vector3(hx - side * 0.05, -0.18, -0.12) };
  return {
    group: g, shell, sec, mat, hil, side,
    // Cut the front half away and show the section (k 0 → 1).
    setCut(k) {
      const on = k > 0.5;
      sec.visible = on;
      if (on) { g.updateMatrixWorld(true); tmp.set(new THREE.Vector3(0, 0, -1), 0.001); plane.copy(tmp).applyMatrix4(g.matrixWorld); mat.clippingPlanes = [plane]; }
      else mat.clippingPlanes = null;
      mat.opacity = on ? 1 : lerp(1, 0.55, k * 2);
      mat.depthWrite = !(k > 0 && !on);
    },
    world(v) { g.updateMatrixWorld(true); return g.localToWorld(v.clone()); },
  };
}

// ---------------------------------------------------------------- the whole urinary tract
// Kidney centres (units of 4 cm): about 7 cm either side of the midline, the left a little
// higher; tilted so the upper poles lean in (about 12°) and the hilum faces forwards (about 30°).
export const KPOS = { L: [1.75, 0.15, -1.2], R: [-1.75, -0.35, -1.2] };
export function makeTract(stage, opts = {}) {
  const o = { labels: true, context: true, flow: true, ...opts };
  const root = new THREE.Group();
  const G = {}; ['kL', 'kR', 'adrenal', 'vessels', 'ureter', 'bladder', 'spine', 'ribs', 'liver', 'psoas'].forEach((k) => { G[k] = new THREE.Group(); root.add(G[k]); });
  const kid = { L: makeKidney(1), R: makeKidney(-1) };
  const place = (k, grp, pos, side) => { k.group.position.set(...pos); k.group.rotation.set(0, side * 0.5, side * 0.2); grp.add(k.group); };
  place(kid.L, G.kL, KPOS.L, 1); place(kid.R, G.kR, KPOS.R, -1);
  root.updateMatrixWorld(true);
  const H = { L: {}, R: {} };
  for (const s of ['L', 'R']) for (const k of ['vein', 'artery', 'pelvis']) { kid[s].group.updateMatrixWorld(true); H[s][k] = kid[s].group.localToWorld(kid[s].hil[k].clone()); }

  // ---- adrenal glands on the upper poles: right pyramidal, left crescent-shaped
  const adMat = tissue(C.adrenal, { roughness: 0.6 });
  const adR = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.62, 3), adMat); adR.scale.set(1, 1, 0.45); adR.position.set(-1.35, 1.52, -1.25); adR.rotation.z = -0.25; G.adrenal.add(adR);
  const adL = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 10, 24, Math.PI * 0.9), adMat); adL.scale.set(1, 1.25, 0.6); adL.position.set(1.25, 1.55, -1.15); adL.rotation.z = 2.3; G.adrenal.add(adL);

  // ---- great vessels and renal vessels
  const art = tissue(C.artery), vein = tissue(C.vein);
  const AO = (y) => [0.3, y, -0.62], IVC = (y) => [-0.45, y, -0.58];
  const aorta = tube([AO(2.7), AO(1), AO(-1), [0.25, -3.0, -0.55]], 0.3, art, false, 60); G.vessels.add(aorta);
  const ivc = tube([IVC(3.2), IVC(1), IVC(-1), [-0.4, -3.3, -0.5]], 0.32, vein, false, 60); G.vessels.add(ivc);
  const iliacA = [1, -1].map((sx) => tube([[0.25, -3.0, -0.55], [0.25 + sx * 0.6, -3.8, -0.45], [sx * 1.3, -5.0, -0.2], [sx * 1.75, -6.1, 0.1]], 0.19, art, false, 40));
  const iliacV = [1, -1].map((sx) => tube([[-0.4, -3.3, -0.5], [-0.3 + sx * 0.7, -4.0, -0.6], [sx * 1.25, -5.1, -0.45], [sx * 1.65, -6.2, -0.15]], 0.2, vein, false, 40));
  G.vessels.add(...iliacA, ...iliacV);
  const rArtPts = {
    L: [[0.3, 0.45, -0.62], [0.9, 0.42, -0.72], H.L.artery.toArray()],
    R: [[0.3, 0.45, -0.62], [-0.1, 0.4, -0.98], [-0.8, 0.2, -1.0], H.R.artery.toArray()],            // behind the IVC
  };
  const rVeinPts = {
    L: [H.L.vein.toArray(), [0.9, 0.25, -0.35], [0.3, 0.22, -0.2], [-0.45, 0.2, -0.58]],              // in front of the aorta
    R: [H.R.vein.toArray(), [-0.95, -0.05, -0.62], [-0.45, 0.02, -0.58]],
  };
  const rA = {}, rV = {};
  for (const s of ['L', 'R']) { rA[s] = tube(rArtPts[s], 0.11, art, false, 40); rV[s] = tube(rVeinPts[s], 0.13, vein, false, 40); G.vessels.add(rA[s], rV[s]); }

  // ---- ureters: down along the psoas, over the iliac vessels at the pelvic brim, into the back
  // of the bladder at an angle (about 25 to 30 cm, Gray's).
  const BL = [0, -7.05, 0.3];
  const ureterPts = (s, sx) => [H[s].pelvis.toArray(), [sx * 1.25, H[s].pelvis.y - 0.6, -1.1], [sx * 1.08, -2.2, -0.95], [sx * 1.15, -4.3, -0.55], [sx * 1.3, -5.4, -0.35], [sx * 1.0, -6.4, -0.15], [sx * 0.5, -6.75, 0.0]];
  const urMat = tissue(C.ureter);
  const ureterCurve = {}, ureter = {};
  for (const [s, sx] of [['L', 1], ['R', -1]]) {
    ureterCurve[s] = new THREE.CatmullRomCurve3(ureterPts(s, sx).map(v3), false, 'centripetal');
    ureter[s] = new THREE.Mesh(new THREE.TubeGeometry(ureterCurve[s], 120, 0.08, 10), urMat); ureter[s].castShadow = true; G.ureter.add(ureter[s]);
    // The renal pelvis: a funnel from the hilum into the ureter.
    const pel = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), tissue(C.pelvis)); pel.scale.set(1.2, 0.9, 0.8); pel.position.copy(H[s].pelvis); G.ureter.add(pel);
  }

  // ---- bladder and urethra
  const blMat = tissue(C.bladder, { opacity: 0.92 });
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), blMat); bladder.position.set(...BL); bladder.castShadow = true; G.bladder.add(bladder);
  const urineIn = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), M.ghost(C.urine, 0.55)); urineIn.position.set(...BL); G.bladder.add(urineIn);
  const urethra = tube([[0, -7.6, 0.35], [0, -8.4, 0.45], [0, -9.0, 0.55]], 0.07, tissue(C.bladder), false, 20); G.bladder.add(urethra);
  const setBladder = (mL) => {
    // A sphere of the same volume (1 unit³ = 64 mL), a little flattened, never quite empty.
    const r = Math.cbrt((3 * Math.max(60, mL)) / (4 * Math.PI * 64));
    bladder.scale.set(r * 1.15, r * 0.9, r); bladder.position.y = -6.6 - r * 0.85;
    urineIn.scale.set(r * 1.05, r * 0.8, r * 0.9); urineIn.position.y = bladder.position.y;
  };
  setBladder(300);

  // ---- context: spine, back ribs, liver, spleen, psoas muscles (ghosted)
  const ghosts = [];
  if (o.context) {
    const boneMat = M.ghost(C.bone, 0.2);
    for (let i = 0; i < 7; i++) {                   // T11 … L5 (about 4 cm each with its disc)
      const y = 2.2 - i * 1.02, r = 0.5 + i * 0.03;
      const vb = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.72, 24), boneMat); vb.position.set(0, y, -1.6); G.spine.add(vb); ghosts.push(vb);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.9), boneMat); sp.position.set(0, y - 0.1, -2.5); G.spine.add(sp); ghosts.push(sp);
      const tp = new THREE.Mesh(new THREE.BoxGeometry(1.8 + (i > 1 ? 0.3 : 0), 0.16, 0.2), boneMat); tp.position.set(0, y, -2.1); G.spine.add(tp); ghosts.push(tp);
    }
    const sac = tube([[0, -5.0, -1.5], [0, -5.8, -1.8], [0, -6.6, -1.7]], 0.55, boneMat, false, 20); G.spine.add(sac); ghosts.push(sac);
    // The 11th and 12th ribs curve round the back; the 12th crosses the upper left kidney.
    for (const sx of [1, -1]) {
      const r11 = tube([[sx * 0.5, 2.5, -2.1], [sx * 1.6, 2.1, -2.2], [sx * 2.7, 1.4, -1.9], [sx * 3.3, 0.8, -1.2]], 0.07, boneMat, false, 40);
      const r12 = tube([[sx * 0.5, 1.5, -2.1], [sx * 1.4, 1.1, -2.15], [sx * 2.3, 0.6, -1.9]], 0.07, boneMat, false, 40);
      G.ribs.add(r11, r12); ghosts.push(r11, r12);
      const ps = tube([[sx * 0.65, 1.1, -1.55], [sx * 1.0, -1.5, -1.35], [sx * 1.4, -4.2, -0.9], [sx * 1.7, -5.8, -0.4]], 0.34, M.ghost(C.psoas, 0.16), false, 40); G.psoas.add(ps); ghosts.push(ps);
    }
    const liver = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), tissue(C.liver, { opacity: 0.28, depthWrite: false })); liver.scale.set(2.3, 1.05, 1.6); liver.position.set(-1.3, 2.55, 0.05); G.liver.add(liver);
    const spleen = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), tissue(C.spleen, { opacity: 0.3, depthWrite: false })); spleen.scale.set(0.5, 0.95, 0.4); spleen.position.set(2.75, 2.1, -1.25); spleen.rotation.z = -0.5; G.liver.add(spleen);
  }

  // ---- flow: blood in the renal arteries and veins, urine down the ureters in little squirts
  const flow = { t: 0 };
  let bloodA = null, bloodV = null, drops = null;
  const cA = { L: new THREE.CatmullRomCurve3(rArtPts.L.map(v3)), R: new THREE.CatmullRomCurve3(rArtPts.R.map(v3)) };
  const cV = { L: new THREE.CatmullRomCurve3(rVeinPts.L.map(v3)), R: new THREE.CatmullRomCurve3(rVeinPts.R.map(v3)) };
  const NB = 24, ND = 12;
  if (o.flow) {
    bloodA = swarmOf(NB * 2, new THREE.SphereGeometry(0.06, 8, 6), M.glow(0xff6b6b)); bloodV = swarmOf(NB * 2, new THREE.SphereGeometry(0.06, 8, 6), M.glow(0x7f9dff));
    drops = swarmOf(ND * 2, new THREE.SphereGeometry(0.075, 8, 6), M.glow(C.urine));
    G.vessels.add(bloodA, bloodV); G.ureter.add(drops);
  }
  const _p = new THREE.Vector3();
  flow.step = (dt, speed = 1) => {
    if (!o.flow) return;
    flow.t += dt * speed;
    const t = flow.t;
    ['L', 'R'].forEach((s, j) => {
      for (let i = 0; i < NB; i++) {
        const u = (i / NB + t * 0.45) % 1; cA[s].getPointAt(u, _p); bloodA.place(j * NB + i, _p.toArray());
        const w = (i / NB + t * 0.35) % 1; cV[s].getPointAt(w, _p); bloodV.place(j * NB + i, _p.toArray());
      }
      // Peristalsis: urine moves down in boluses, a few waves a minute (speeded up here).
      for (let i = 0; i < ND; i++) {
        const u = ((Math.floor(i / 3) / 4 + (i % 3) * 0.012 + t * 0.12) % 1);
        ureterCurve[s].getPointAt(u, _p); drops.place(j * ND + i, _p.toArray());
      }
    });
    bloodA.done(); bloodV.done(); drops.done();
  };

  // ---- labels
  const labels = [], minor = [], xrLabels = [];
  const L = (html, pos, parent, cls = '', main = false, xrKeep = false) => { const l = tint(stage.label(html, pos, parent), cls); l.userData.xrKeep = xrKeep; labels.push(l); if (!main) minor.push(l); return l; };
  if (o.labels) {
    L('Left kidney (higher)', [2.35, 2.05, -0.8], G.kL, 'pink', true);
    L('Right kidney (lower)', [-2.2, -1.75, -0.6], G.kR, 'pink', true);
    L('Adrenal glands', [-1.1, 2.35, -0.9], G.adrenal, 'gold', true);
    L('Renal artery', [1.05, 0.85, -0.2], G.vessels, 'blood');
    L('Renal vein', [0.55, -0.55, 0.3], G.vessels, 'vein');
    L('Aorta', [0.95, -2.2, -0.4], G.vessels, 'blood');
    L('Inferior vena cava', [-0.95, -2.6, -0.3], G.vessels, 'vein');
    L('Ureter (25 to 30 cm)', [2.05, -3.3, -0.5], G.ureter, 'urine', true, true);
    L('Bladder', [1.75, -7.2, 0.4], G.bladder, 'urine', true, true);
    L('Urethra', [0.8, -8.8, 0.5], G.bladder, 'urine', false, true);
    if (o.context) {
      L('Liver', [-3.2, 2.2, 0.2], G.liver, '');
      L('12th rib', [2.9, 0.35, -1.6], G.ribs, '');
      L('Spine', [0, -5.3, -1.4], G.spine, '', false, true);
      L('Psoas muscle', [-2.1, -4.6, -0.6], G.psoas, '', false, true);
    }
    const secL = (html, local, cls) => { const l = tint(stage.label(html, local, kid.L.group), cls); xrLabels.push(l); return l; };
    secL('Cortex', [0.95, 0.9, 0.1], 'pink'); secL('Medulla: pyramids', [0.95, -0.35, 0.1], 'pink');
    secL('Calyces', [0.2, 1.75, 0.1], 'urine'); secL('Renal pelvis', [-0.9, -0.95, 0.4], 'urine');
  }

  const api = {
    root, G, kid, H, bladder, setBladder, labels, minor, xrLabels, flow, ureterCurve, rA, rV, aorta, ivc,
    setXray(k) { kid.L.setCut(k); kid.R.setCut(k); },
    setExplode(k) {
      const e = smooth(k);
      const off = { kL: [1.4, 0.5, 0.6], kR: [-1.4, 0.2, 0.6], adrenal: [0, 1.2, 0.2], vessels: [0, 0, 0.9], ureter: [0, -0.4, 0.5], bladder: [0, -1.4, 0.9], spine: [0, 0, -1.6], ribs: [0, 0.6, -1.9], liver: [-0.8, 1.6, 0.4], psoas: [0, 0, -1.2] };
      for (const [n, v] of Object.entries(off)) G[n].position.set(...v).multiplyScalar(e);
    },
    showLabels(on, xr = false, narrow = false) {
      labels.forEach((l) => { l.visible = on && (!xr || l.userData.xrKeep); });
      xrLabels.forEach((l) => { l.visible = on && xr; });
      if (on && narrow) minor.forEach((l) => { l.visible = false; });
    },
  };
  api.setExplode(0);
  return api;
}

export function swarmOf(n, geo, mat) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false;
  const o = new THREE.Object3D();
  m.place = (i, pos, rot = null, scale = 1) => { o.position.set(...pos); o.rotation.set(0, 0, 0); if (rot) o.rotation.set(...rot); o.scale.setScalar(scale); o.updateMatrix(); m.setMatrixAt(i, o.matrix); };
  m.hide = (i) => { o.position.set(0, -999, 0); o.scale.setScalar(0.0001); o.updateMatrix(); m.setMatrixAt(i, o.matrix); };
  m.done = () => { m.instanceMatrix.needsUpdate = true; };
  return m;
}

// ---------------------------------------------------------------- a nephron
// One juxtamedullary nephron (the long-looped kind), not to scale, with its blood supply:
// afferent arteriole → glomerulus (a knot of capillaries inside Bowman's capsule) → efferent
// arteriole → peritubular capillaries and vasa recta. The tubule: proximal convoluted tubule
// (gold) → loop of Henle, thin descending and thin ascending limbs (blue) → thick ascending limb
// (green), which touches its own glomerulus at the macula densa → distal convoluted tubule
// (violet) → connecting tubule → collecting duct (white), shared by many nephrons.
// Zones: cortex y > 0.5, outer medulla 0.5 > y > −2.5, inner medulla below. Gray's Anatomy;
// Guyton & Hall, 14th ed., ch. 26; Boron & Boulpaep, Medical Physiology, ch. 33.
export const NEPH = {
  G: [-1.2, 2.9, 0], capR: 0.62, tuftR: 0.42,
  seg: {
    pct: [[-0.75, 2.42, 0.05], [-0.1, 2.05, 0.35], [0.45, 2.55, 0.1], [0.15, 3.25, -0.2], [0.8, 3.65, 0.15], [1.5, 3.1, 0.0], [1.15, 2.4, -0.3], [1.75, 1.75, 0.0], [1.82, 0.9, 0.0], [1.8, 0.25, 0]],
    desc: [[1.8, 0.25, 0], [1.78, -1.8, 0.05], [1.72, -4.0, 0.05], [1.58, -5.55, 0], [1.3, -5.9, 0]],
    asc: [[1.3, -5.9, 0], [1.03, -5.55, 0], [0.97, -4.0, 0], [0.95, -2.5, 0]],
    tal: [[0.95, -2.5, 0], [0.92, -0.5, 0.05], [0.88, 1.2, 0.2], [0.55, 2.6, 0.55], [-0.1, 3.45, 0.55], [-0.62, 3.62, 0.35]],
    dct: [[-0.62, 3.62, 0.35], [-1.3, 4.05, 0.45], [-2.05, 3.85, 0.3], [-2.5, 3.2, 0.1], [-2.05, 2.55, 0.35], [-2.55, 1.9, 0.1], [-3.2, 1.75, 0]],
    cd: [[-3.2, 4.3, 0], [-3.2, 1.75, 0], [-3.22, -1.0, 0], [-3.25, -4.0, 0], [-3.3, -6.4, 0]],
  },
  R: { pct: 0.15, desc: 0.07, asc: 0.075, tal: 0.11, dct: 0.12, cd: 0.17 },
  col: { pct: C.pct, desc: C.thin, asc: C.thin, tal: C.tal, dct: C.dct, cd: C.cd },
  name: { pct: 'Proximal tubule', desc: 'Loop of Henle: thin descending limb', asc: 'Loop of Henle: thin ascending limb', tal: 'Thick ascending limb', dct: 'Distal tubule', cd: 'Collecting duct' },
};
export function makeNephron(stage, { labels = true } = {}) {
  const g = new THREE.Group(), N = NEPH;
  const curves = {}, meshes = {};
  for (const k of Object.keys(N.seg)) {
    curves[k] = new THREE.CatmullRomCurve3(N.seg[k].map(v3), false, 'centripetal');
    meshes[k] = new THREE.Mesh(new THREE.TubeGeometry(curves[k], 140, N.R[k], 14), tissue(N.col[k], { opacity: 0.8, depthWrite: false }));
    meshes[k].renderOrder = 2; g.add(meshes[k]);
  }
  // Other nephrons' connecting tubules joining the collecting duct (stubs).
  [[3.9, 0.4], [2.9, -0.3], [0.6, 0.3]].forEach(([y, z]) => g.add(tube([[-4.3, y + 0.3, z], [-3.8, y + 0.1, z], [-3.25, y, 0]], 0.08, M.ghost(C.dct, 0.3), false, 20)));
  // Glomerulus: a knot of capillary loops inside Bowman's capsule.
  const G0 = v3(N.G), pts = [];
  for (let i = 0; i < 70; i++) {
    const a = i * 2.4, b = i * 1.3 + Math.sin(i * 0.7) * 2;
    const r = N.tuftR * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.9)));
    pts.push(G0.clone().add(new THREE.Vector3(Math.cos(a) * Math.sin(b) * r, Math.cos(b) * r, Math.sin(a) * Math.sin(b) * r)));
  }
  const vp = G0.clone().add(new THREE.Vector3(0.3, 0.52, 0.2));             // vascular pole
  const tuftCurve = new THREE.CatmullRomCurve3([vp.clone(), ...pts, vp.clone().add(new THREE.Vector3(0.08, 0, -0.05))]);
  const tuft = new THREE.Mesh(new THREE.TubeGeometry(tuftCurve, 700, 0.05, 8), tissue(C.artery, { roughness: 0.4 })); g.add(tuft);
  const capsule = new THREE.Mesh(new THREE.SphereGeometry(N.capR, 36, 24), M.clear(0xffe7a8, 0.22)); capsule.position.copy(G0); g.add(capsule);
  const capsuleRim = new THREE.Mesh(new THREE.SphereGeometry(N.capR * 1.04, 36, 24), M.ghost(0xffe7a8, 0.08)); capsuleRim.position.copy(G0); g.add(capsuleRim);
  // Blood vessels: interlobular artery → afferent → glomerulus → efferent → peritubular
  // capillaries and vasa recta → interlobular vein.
  const art = tissue(C.artery, { opacity: 0.9 }), vein = tissue(C.vein, { opacity: 0.75, depthWrite: false });
  const vessels = new THREE.Group(); g.add(vessels);
  const P = {
    interA: [[-2.3, 0.5, -0.9], [-2.3, 2.3, -0.9], [-2.25, 4.4, -0.9]],
    aff: [[-2.3, 3.3, -0.9], [-1.8, 3.55, -0.4], [-1.25, 3.6, 0.1], vp.toArray()],
    eff: [vp.clone().add(new THREE.Vector3(0.08, 0, -0.05)).toArray(), [-0.5, 3.95, -0.3], [0.3, 3.85, -0.6], [1.2, 3.5, -0.55], [1.2, 2.2, -0.6], [0.2, 1.6, -0.6], [-0.9, 2.0, -0.55], [-1.6, 1.1, -0.5], [-0.4, 0.9, -0.55]],
    recta: [[-0.4, 0.9, -0.55], [2.2, 0.6, -0.4], [2.25, -3, -0.35], [2.1, -5.9, -0.3], [1.4, -6.3, -0.3], [0.6, -5.8, -0.3], [0.5, -3, -0.35], [0.45, 0.3, -0.4], [2.6, 0.4, -0.9], [2.65, 4.2, -0.9]],
  };
  const vc = {};
  for (const [k, p] of Object.entries(P)) { vc[k] = new THREE.CatmullRomCurve3(p.map(v3), false, 'centripetal'); vessels.add(new THREE.Mesh(new THREE.TubeGeometry(vc[k], 160, k === 'interA' ? 0.13 : k === 'recta' ? 0.06 : 0.08, 10), k === 'recta' ? vein : art)); }
  // The vasa recta start out red (efferent blood) and return blue; colour the returning half.
  const labs = [];
  if (labels) {
    const Lb = (html, pos, cls) => { const l = tint(stage.label(html, pos, g), cls); labs.push(l); return l; };
    Lb('Glomerulus in Bowman’s capsule', [-1.6, 1.75, 0.8], 'blood');
    Lb('Afferent arteriole (in)', [-3.3, 5.0, 0.2], 'blood');
    Lb('Efferent arteriole (out)', [0.6, 4.6, 0.2], 'blood');
    Lb('Proximal tubule', [2.0, 1.2, 0.6], 'gold');
    Lb('Loop of Henle', [1.4, -6.5, 0.3], 'water');
    Lb('Thick ascending limb', [-0.3, -1.4, 0.4], 'good');
    Lb('Distal tubule', [-4.3, 2.7, 0.5], 'hormone');
    Lb('Collecting duct', [-3.3, -4.3, 0.3], '');
    Lb('Capillaries (vasa recta)', [1.6, -2.2, 0.3], 'vein');
  }
  return { group: g, curves, meshes, tuft, tuftCurve, capsule, vessels, vc, labs, G0, vp };
}
