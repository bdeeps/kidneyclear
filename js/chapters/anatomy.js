// Chapter 1: the urinary tract in the body. Two kidneys against the back wall of the abdomen
// (the right one lower, under the liver), the adrenal glands on top, the renal arteries and veins
// from the aorta and inferior vena cava, the ureters down to the bladder, and the urethra.
// X-ray cuts both kidneys open in coronal section: cortex, medulla (pyramids), calyces, pelvis.
// Facts:
//  - Size about 11 to 12 cm long, about 150 g each, "each about the size of a fist" (NIDDK, "Your
//    Kidneys & How They Work"; StatPearls "Anatomy, Abdomen and Pelvis: Kidneys"). The right
//    kidney usually sits 1 to 2 cm lower than the left because of the liver (Gray's Anatomy).
//  - Renal blood flow about 1.1 L/min for both kidneys, about 22% of cardiac output (Guyton &
//    Hall, Textbook of Medical Physiology, 14th ed., ch. 26; 20 to 25% is the usual range), so
//    about 1.1 × 1,440 ≈ 1,600 to 1,700 L of blood a day. The kidneys are only about 0.4% of body
//    weight (2 × 150 g of 70 kg).
//  - Urine output about 1 to 2 L a day in healthy adults (NIDDK; Guyton & Hall table 25-1 gives
//    1.4 L in a typical day). Ureters about 25 to 30 cm; bladder capacity about 400 to 600 mL
//    (StatPearls, "Physiology, Bladder").
import { THREE } from '../kit.js';
import { makeTract, sideLabels, tint, fitNarrow, compactReadout } from '../kidney.js';

export default {
  id: 'anatomy',
  short: 'Meet the kidneys',
  title: 'Two beans at your back',
  subtitle: 'Two fist-sized filters, four tubes of blood and a bag that stores the result.',
  view: { pos: [-4.5, 6.0, 19], target: [-5.3, 5.6, 0] },
  learn: `<p>You have two <b>kidneys</b>, each shaped like a bean and about the size of your fist: about <b>11 to 12 cm</b> long and about <b>150 g</b>. They are not in your belly at the front but high up against your <b>back</b>, either side of the spine, partly tucked under the lowest ribs. We are facing the patient, so the patient's <b>left</b> is on <b>your right</b>. The <b>right kidney sits a little lower</b> than the left, because the big <b>liver</b> is above it.</p>
    <p>Each kidney gets blood straight from the <b>aorta</b>, the body's main artery, through a short, wide <b>renal artery</b>, and sends it back through a <b>renal vein</b> to the <b>inferior vena cava</b>. The flow is huge: together the kidneys get about <b>1.1 to 1.2 litres a minute</b>, about a <b>fifth to a quarter</b> of everything the heart pumps (see <a href="/heartclear/">HeartClear</a>), though they are less than half a percent of your weight.</p>
    <p>What they make, <b>urine</b>, collects in the <b>renal pelvis</b> and is squeezed down the <b>ureters</b>, two muscular tubes about <b>25 to 30 cm</b> long, into the <b>bladder</b>, a stretchy bag that holds about <b>400 to 600 mL</b>. It leaves through the <b>urethra</b>. Sitting on top of each kidney is an <b>adrenal gland</b>, which makes hormones such as adrenaline and aldosterone.</p>
    <p>Cut a kidney open and you see an outer layer, the <b>cortex</b>, and an inner <b>medulla</b> made of cone-shaped <b>pyramids</b>. Their tips drip urine into cups called <b>calyces</b>, which join into the pelvis.</p>
    <p class="tip"><b>Try it:</b> switch on X-ray to cut both kidneys open. Then take everything apart, and fill the bladder.</p>`,
  terms: [
    { t: 'Kidney', d: 'One of two bean-shaped organs at the back of the abdomen that filter blood and make urine.' },
    { t: 'Renal', d: 'To do with the kidneys (from the Latin renes). “Nephro-” comes from the Greek word.' },
    { t: 'Cortex and medulla', d: 'The outer and inner layers of the kidney. Filtering happens in the cortex; the medulla concentrates urine.' },
    { t: 'Renal pelvis', d: 'The funnel inside the kidney where urine collects before it enters the ureter.' },
    { t: 'Ureter', d: 'A muscular tube, about 25 to 30 cm long, that squeezes urine from a kidney down to the bladder.' },
    { t: 'Bladder', d: 'A stretchy muscular bag that stores urine, comfortably about 400 to 600 mL in adults.' },
    { t: 'Adrenal gland', d: 'A small hormone gland that sits on top of each kidney.' },
  ],
  defaults: { explode: 0, xray: false, bladder: 300, flow: true, labels: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray: cut the kidneys open' },
    { key: 'bladder', type: 'range', label: 'Urine in the bladder', min: 50, max: 600, step: 10, ends: ['nearly empty', 'full'], fmt: (v) => Math.round(v) + ' mL' },
    { key: 'flow', type: 'toggle', label: 'Show blood and urine moving' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Where are your kidneys?', options: ['Low in the front of the belly', 'High at the back, either side of the spine', 'Inside the ribcage next to the heart', 'Just behind the belly button'], answer: 1, why: 'They lie against the back wall of the abdomen beside the spine, partly under the lowest ribs.' },
    { q: 'Why is the right kidney usually a little lower than the left?', options: ['The heart pushes it down', 'The liver sits above it', 'It is bigger', 'It isn’t: they are always level'], answer: 1, why: 'The large liver fills the upper right of the abdomen, so the right kidney sits about 1 to 2 cm lower.' },
    { q: 'About how much of the heart’s output goes through the kidneys?', options: ['About 1%', 'About 5%', 'About 20 to 25%', 'About 75%'], answer: 2, why: 'About 1.1 to 1.2 litres a minute, a fifth to a quarter of the heart’s output, for organs that weigh about 300 g together.' },
  ],
  reel: [
    { ms: 5200, caption: 'Your two kidneys sit high at your back, and the right one is a little lower, under the liver.', set: { explode: 0, xray: false, flow: true, labels: false, bladder: 300 }, view: { pos: [0, 7.4, 16], target: [0, 6.6, 0] }, spin: 0.3 },
    { ms: 5200, caption: 'A fifth of every heartbeat goes to them: about 1.2 litres of blood a minute.', set: { explode: 0, xray: true, flow: true, labels: false }, view: { pos: [0.4, 10.0, 9.5], target: [0.2, 9.7, -1] }, spin: 0 },
  ],

  build({ stage }) {
    stage.renderer.localClippingEnabled = true;
    const root = new THREE.Group(); root.position.set(0, 9.6, 0); stage.root.add(root);
    const tr = makeTract(stage); root.add(tr.root);
    const sides = sideLabels(stage, root, -9.4, 2.8, 0.8);
    const front = tint(stage.label('You are facing the patient', [0, -10.0, 0.8], root), 'side');
    let xr = 0;
    const fit = fitNarrow(stage, { pos: [0, 11.1, 22], target: [0, 11.1, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt);
        xr += ((s.xray ? 1 : 0) - xr) * Math.min(1, dt * 6);
        tr.setExplode(s.explode);
        tr.setXray(xr);
        tr.setBladder(s.bladder);
        tr.flow.step(s.flow ? dt : 0);
        tr.G.vessels.children.forEach((c) => { if (c.isInstancedMesh) c.visible = s.flow; });
        tr.G.ureter.children.forEach((c) => { if (c.isInstancedMesh) c.visible = s.flow; });
        const narrow = fit();
        tr.showLabels(s.labels && !narrow, s.xray, narrow);
        [...sides, front].forEach((l) => { l.visible = s.labels && !narrow; });
      },
      readout: (s) => `<div class="big">Two filters, 150 g each</div>
        <div class="row"><span>Each kidney</span><b>about 11 to 12 cm, 150 g</b></div>
        <div class="row"><span>Blood through both</span><b>about 1.1 to 1.2 L a minute</b></div>
        <div class="row"><span>Share of the heart’s output</span><b>about 20 to 25%</b></div>
        <div class="row"><span>Urine made a day</span><b>about 1 to 2 L</b></div>
        <div class="row"><span>In the bladder now</span><b>${Math.round(s.bladder)} mL of about 400 to 600</b></div>
        <small>${s.xray ? 'Cut open: the outer cortex, the dark pyramids of the medulla, and the pale calyces and pelvis that collect urine.' : 'Front view: the patient’s right is on your left. Spine, ribs, liver and muscles are ghosted.'}</small>`,
    });
  },
};
