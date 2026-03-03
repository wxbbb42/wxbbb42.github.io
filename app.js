/* ─────────────────────────────────────────────────────────────
   app.js  —  Lenis + GSAP + SplitText + cursor + Geometric canvas
───────────────────────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ══════════════════════════════════════════════════════════════
// GEOMETRIC BACKGROUND CANVAS
// ══════════════════════════════════════════════════════════════
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');
let bgW, bgH;
const mouse = { x: -9999, y: -9999 };

let t = 0;

// scrollBlend: 0 = full section A, 1 = full section B
// scrollFrom / scrollTo: which sections are blending
let scrollBlend = 0;
let scrollFrom  = 0;
let scrollTo    = 0;

// Per-section scroll progress (0–1) for vertical parallax drift
const sectionProgress = [0, 0, 0];

// Card-grid edge positions (relative to canvas left), updated on load/resize
let cardEdges = [];  // x positions of card vertical edges on canvas

function updateCardEdges() {
  const grid = document.getElementById('work-grid');
  if (!grid) return;
  const canvasRect = bgCanvas.getBoundingClientRect();
  const cards = grid.querySelectorAll('.card');
  const edgeSet = new Set();
  cards.forEach(c => {
    const r = c.getBoundingClientRect();
    edgeSet.add(Math.round(r.left - canvasRect.left));
    edgeSet.add(Math.round(r.right - canvasRect.left));
  });
  cardEdges = [...edgeSet].sort((a, b) => a - b);
}

function resizeCanvas() {
  bgW = bgCanvas.offsetWidth;
  bgH = bgCanvas.offsetHeight;
  bgCanvas.width  = bgW * devicePixelRatio;
  bgCanvas.height = bgH * devicePixelRatio;
  bgCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

// ── Helpers ───────────────────────────────────────────────────
function line(x1, y1, x2, y2, alpha, width = 0.5) {
  if (alpha < 0.005) return;
  bgCtx.beginPath();
  bgCtx.moveTo(x1, y1);
  bgCtx.lineTo(x2, y2);
  bgCtx.strokeStyle = `rgba(26,26,24,${alpha})`;
  bgCtx.lineWidth = width;
  bgCtx.stroke();
}

function gradientLineH(y, alphaMin, alphaMax, width = 0.5) {
  if (alphaMax < 0.005) return;
  const grad = bgCtx.createLinearGradient(0, 0, bgW, 0);
  grad.addColorStop(0,   `rgba(26,26,24,${alphaMin})`);
  grad.addColorStop(0.5, `rgba(26,26,24,${(alphaMin + alphaMax) * 0.35})`);
  grad.addColorStop(1,   `rgba(26,26,24,${alphaMax})`);
  bgCtx.beginPath();
  bgCtx.moveTo(0, y);
  bgCtx.lineTo(bgW, y);
  bgCtx.strokeStyle = grad;
  bgCtx.lineWidth = width;
  bgCtx.stroke();
}

function arc(cx, cy, r, startA, endA, alpha, width = 0.5) {
  if (alpha < 0.005 || r <= 0) return;
  bgCtx.beginPath();
  bgCtx.arc(cx, cy, r, startA, endA);
  bgCtx.strokeStyle = `rgba(26,26,24,${alpha})`;
  bgCtx.lineWidth = width;
  bgCtx.stroke();
}

function dot(x, y, r, alpha, color = '26,26,24') {
  if (alpha < 0.005 || r <= 0) return;
  bgCtx.beginPath();
  bgCtx.arc(x, y, r, 0, Math.PI * 2);
  bgCtx.fillStyle = `rgba(${color},${alpha})`;
  bgCtx.fill();
}

// ── SECTION 0: Coordinate System (Work) ───────────────────────
// Smoothed mouse-parallax offsets for the coordinate grid
let coordParallaxX = 0, coordParallaxY = 0;

function drawCoordinates(alpha) {
  if (alpha < 0.005) return;
  const pad = PARALLAX_PX;

  // Mouse parallax: gently shift the whole grid toward the cursor
  const hasMouse = mouse.x > 0 && mouse.x < bgW;
  const targetPX = hasMouse ? (mouse.x - bgW * 0.5) * 0.005 : 0;
  const targetPY = hasMouse ? (mouse.y - bgH * 0.5) * 0.005 : 0;
  coordParallaxX += (targetPX - coordParallaxX) * 0.08;
  coordParallaxY += (targetPY - coordParallaxY) * 0.08;

  bgCtx.save();
  bgCtx.translate(coordParallaxX, coordParallaxY);

  // Derive tick spacing from card edges so grid aligns with cards
  // Use the gap between first two card edges as the canonical spacing
  let tickSpacing;
  if (cardEdges.length >= 2) {
    // Find the smallest gap between adjacent edges (= card column width)
    let minGap = Infinity;
    for (let e = 1; e < cardEdges.length; e++) {
      const gap = cardEdges[e] - cardEdges[e - 1];
      if (gap > 2) minGap = Math.min(minGap, gap);
    }
    tickSpacing = minGap < Infinity ? minGap : bgW / 8;
  } else {
    tickSpacing = bgW / 8;
  }

  // Anchor: first card edge (grid-left)
  const anchorX = cardEdges.length > 0 ? cardEdges[0] : 60;

  // Origin / main axes — upper-right, away from content
  const cx = bgW * 0.82;
  const cy = bgH * 0.28;

  // Subdivision: 4 fine lines between each major grid line
  const subDiv = 4;
  const subSpacing = tickSpacing / subDiv;

  // ── Vertical grid lines — major (card-aligned) + subdivisions ──
  const countLeft  = Math.ceil(anchorX / subSpacing) + 1;
  const countRight = Math.ceil((bgW - anchorX) / subSpacing) + 1;

  for (let i = -countLeft; i <= countRight; i++) {
    const gx = anchorX + i * subSpacing;
    if (gx < -subSpacing || gx > bgW + subSpacing) continue;
    const xRatio = Math.max(0, Math.min(1, gx / bgW));
    const fadeA = 0.15 + xRatio * 0.85;

    const isCardEdge = cardEdges.some(e => Math.abs(gx - e) < 1.5);
    const isMajorSub = (i % subDiv === 0);

    if (isCardEdge) {
      line(gx, -pad, gx, bgH + pad, alpha * 0.35 * fadeA, 1.0);
    } else if (isMajorSub) {
      line(gx, -pad, gx, bgH + pad, alpha * 0.22 * fadeA, 0.5);
    } else {
      line(gx, -pad, gx, bgH + pad, alpha * 0.14 * fadeA, 0.35);
    }
  }

  // ── Horizontal grid lines — major + subdivisions ──
  const countUp   = Math.ceil((cy + pad) / subSpacing) + 1;
  const countDown = Math.ceil((bgH - cy + pad) / subSpacing) + 1;

  for (let i = -countUp; i <= countDown; i++) {
    const gy = cy + i * subSpacing;
    if (gy < -pad - subSpacing || gy > bgH + pad + subSpacing) continue;
    const isMajorSub = (i % subDiv === 0);
    const isAxis = (i === 0);

    if (isAxis) {
      gradientLineH(gy, alpha * 0.35 * 0.08, alpha * 0.35, 1.0);
    } else if (isMajorSub) {
      const baseA = alpha * 0.22;
      gradientLineH(gy, baseA * 0.08, baseA, 0.5);
    } else {
      const baseA = alpha * 0.14;
      gradientLineH(gy, baseA * 0.08, baseA, 0.35);
    }
  }

  // Main axes
  gradientLineH(cy, alpha * 0.04, alpha * 0.45, 1.2);
  line(cx, -pad, cx, bgH + pad, alpha * 0.45, 1.2);

  // Tick marks on main axes
  for (let i = -countLeft; i <= countRight; i++) {
    if (i === 0) continue;
    const gx = anchorX + i * subSpacing;
    if (gx < -subSpacing || gx > bgW + subSpacing) continue;
    const isMajorSub = (i % subDiv === 0);
    if (!isMajorSub) continue;
    const xRatio = Math.max(0, Math.min(1, gx / bgW));
    const isCardEdge = cardEdges.some(e => Math.abs(gx - e) < 1.5);
    const ts = isCardEdge ? 10 : 5;
    line(gx, cy - ts, gx, cy + ts, alpha * 0.40 * (0.15 + xRatio * 0.85), 0.8);
  }
  for (let i = -countUp; i <= countDown; i++) {
    if (i === 0 || i % subDiv !== 0) continue;
    const gy = cy + i * subSpacing;
    line(cx - 5, gy, cx + 5, gy, alpha * 0.40, 0.8);
  }

  // Arrowheads
  const aw = 7;
  const size = Math.max(bgW, bgH) * 0.7;
  [[cx + size * 0.2, cy, 1, 0], [cx, cy - size * 0.3, 0, -1]].forEach(([x, y, dx, dy]) => {
    if (x > bgW + 20 || y < -20) return;
    bgCtx.beginPath();
    bgCtx.moveTo(x, y);
    bgCtx.lineTo(x - dx * 14 - dy * aw, y - dy * 14 + dx * aw);
    bgCtx.lineTo(x - dx * 14 + dy * aw, y - dy * 14 - dx * aw);
    bgCtx.fillStyle = `rgba(26,26,24,${alpha * 0.30})`;
    bgCtx.fill();
  });

  // Origin dot
  dot(cx, cy, 5, alpha * 0.45, '193,122,58');

  // Floating measurement dots
  for (let i = 0; i < 6; i++) {
    const angle = (t * 0.003) + i * Math.PI / 3;
    const r = tickSpacing * (2.5 + i * 1.2);
    dot(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.5, 2, alpha * 0.28);
  }

  bgCtx.restore();

  // Mouse crosshair (not parallaxed — stays locked to cursor)
  if (mouse.x > 0 && mouse.x < bgW) {
    bgCtx.setLineDash([4, 6]);
    line(mouse.x, -pad, mouse.x, bgH + pad, alpha * 0.12, 0.5);
    line(0, mouse.y, bgW, mouse.y, alpha * 0.12, 0.5);
    bgCtx.setLineDash([]);
    dot(mouse.x, mouse.y, 3, alpha * 0.6, '193,122,58');
    dot(mouse.x, cy + coordParallaxY, 2.5, alpha * 0.4, '193,122,58');
    dot(cx + coordParallaxX, mouse.y, 2.5, alpha * 0.4, '193,122,58');
  }
}

// ── SECTION 1: Orbital System (Lab) ──────────────────────────

// Bullet-time: tracks smoothed slowdown factor (1 = normal, → 0 = frozen)
let bulletTime = 1;
let prevMouseX = -9999, prevMouseY = -9999;
// Accumulated orbital angle (decoupled from frame count so bullet-time works)
let orbitalT = 0;

function drawOrbitals(alpha) {
  if (alpha < 0.005) return;

  // Mouse pull: shift the entire system center toward mouse
  const hasMouse = mouse.x > 0 && mouse.x < bgW;
  const pullX = hasMouse ? (mouse.x - bgW * 0.65) * 0.012 : 0;
  const pullY = hasMouse ? (mouse.y - bgH * 0.50) * 0.012 : 0;
  const cx = bgW * 0.65 + pullX;
  const cy = bgH * 0.50 + pullY;
  const scale = Math.min(bgW, bgH) * 0.48;

  // ── Bullet-time: mouse movement → slowdown ──
  const dx = mouse.x - prevMouseX;
  const dy = mouse.y - prevMouseY;
  const mouseSpeed = Math.sqrt(dx * dx + dy * dy);
  prevMouseX = mouse.x;
  prevMouseY = mouse.y;

  // Map mouse speed to a target slowdown (fast mouse → near 0, still → 1)
  const targetBullet = hasMouse ? Math.max(0.04, 1 - Math.min(1, mouseSpeed / 30) * 0.96) : 1;
  // Smooth interpolation: slow down quickly, recover slowly
  const lerpSpeed = bulletTime > targetBullet ? 0.18 : 0.03;
  bulletTime += (targetBullet - bulletTime) * lerpSpeed;

  // Advance orbital clock by bullet-time-scaled delta
  orbitalT += bulletTime;

  const orbits = [
    { rx: scale * 0.18, ry: scale * 0.10, tilt: 0.25,  speed: 0.010, dotR: 4,   color: '193,122,58', alphaM: 1.0 },
    { rx: scale * 0.38, ry: scale * 0.24, tilt: -0.50, speed: 0.006, dotR: 3.5, color: '26,26,24',   alphaM: 0.95 },
    { rx: scale * 0.58, ry: scale * 0.38, tilt: 0.65,  speed: 0.0038,dotR: 3,   color: '26,26,24',   alphaM: 0.85 },
    { rx: scale * 0.80, ry: scale * 0.52, tilt: -0.28, speed: 0.0022,dotR: 2.5, color: '26,26,24',   alphaM: 0.75 },
    { rx: scale * 1.00, ry: scale * 0.64, tilt: 0.48,  speed: 0.0014,dotR: 2.2, color: '26,26,24',   alphaM: 0.65 },
    { rx: scale * 1.25, ry: scale * 0.80, tilt: -0.15, speed: 0.0009,dotR: 2.0, color: '26,26,24',   alphaM: 0.50 },
    { rx: scale * 1.55, ry: scale * 1.00, tilt: 0.35,  speed: 0.0006,dotR: 1.8, color: '26,26,24',   alphaM: 0.35 },
    { rx: scale * 1.90, ry: scale * 1.22, tilt: -0.55, speed: 0.0004,dotR: 1.5, color: '26,26,24',   alphaM: 0.22 },
  ];

  // Star field
  for (let i = 0; i < 40; i++) {
    const sx = bgW * ((i * 137.508) % 1);
    const sy = bgH * ((i * 97.333) % 1);
    const pulse = 0.25 + 0.2 * Math.sin(t * 0.018 + i * 1.3);
    dot(sx, sy, 1, alpha * pulse * 0.5);
  }

  // Nucleus glow rings
  [20, 36, 56].forEach((r, i) => dot(cx, cy, r, alpha * [0.06, 0.04, 0.02][i], '193,122,58'));
  dot(cx, cy, 6, alpha * 0.65, '193,122,58');

  orbits.forEach((o, i) => {
    const oa = alpha * o.alphaM;

    // Ellipse — outer rings get a stronger line to stay visible
    bgCtx.save();
    bgCtx.translate(cx, cy);
    bgCtx.rotate(o.tilt);
    bgCtx.beginPath();
    bgCtx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
    bgCtx.strokeStyle = `rgba(26,26,24,${alpha * 0.12})`;
    bgCtx.lineWidth = 0.6;
    bgCtx.stroke();
    bgCtx.restore();

    // Orbiting dot — uses orbitalT (bullet-time aware)
    const angle = orbitalT * o.speed + i * 1.4;
    const px = cx + Math.cos(angle) * o.rx * Math.cos(o.tilt) - Math.sin(angle) * o.ry * Math.sin(o.tilt);
    const py = cy + Math.cos(angle) * o.rx * Math.sin(o.tilt) + Math.sin(angle) * o.ry * Math.cos(o.tilt);

    // Trail
    for (let tr = 1; tr <= 8; tr++) {
      const ta = angle - tr * 0.10;
      const tpx = cx + Math.cos(ta) * o.rx * Math.cos(o.tilt) - Math.sin(ta) * o.ry * Math.sin(o.tilt);
      const tpy = cy + Math.cos(ta) * o.rx * Math.sin(o.tilt) + Math.sin(ta) * o.ry * Math.cos(o.tilt);
      dot(tpx, tpy, o.dotR * (1 - tr * 0.1), oa * 0.18 * (1 - tr * 0.11), o.color);
    }
    dot(px, py, o.dotR, oa * 0.80, o.color);
  });
}

// ── SECTION 2: Radial / Compass (About) ──────────────────────
function drawRadial(alpha) {
  if (alpha < 0.005) return;
  const cx = bgW * 0.5;
  const cy = bgH * 0.5;
  const maxR = Math.max(bgW, bgH) * 0.55; // extend beyond canvas edge

  const lineCount = 48;
  const rot = t * 0.0012;

  // Radial lines
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2 + rot;
    const isMajor = i % 8 === 0;
    const isMed   = i % 4 === 0;
    const len = isMajor ? maxR : isMed ? maxR * 0.82 : maxR * 0.62;
    const a   = isMajor ? alpha * 0.16 : isMed ? alpha * 0.09 : alpha * 0.05;
    const w   = isMajor ? 0.8 : 0.4;
    line(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len, a, w);
  }

  // Concentric circles — also beyond canvas for immersion
  [0.12, 0.24, 0.38, 0.55, 0.75, 1.0].forEach((f, i) => {
    arc(cx, cy, maxR * f, 0, Math.PI * 2, alpha * (i >= 4 ? 0.11 : 0.06), i >= 4 ? 0.6 : 0.35);
  });

  // Center cross + dot
  line(cx - 18, cy, cx + 18, cy, alpha * 0.35, 1);
  line(cx, cy - 18, cx, cy + 18, alpha * 0.35, 1);
  dot(cx, cy, 4, alpha * 0.6, '193,122,58');

  // Two accent dots orbiting
  const a1 = t * 0.009, a2 = t * 0.005 + Math.PI;
  dot(cx + Math.cos(a1) * maxR * 0.75, cy + Math.sin(a1) * maxR * 0.75, 4, alpha * 0.7, '193,122,58');
  dot(cx + Math.cos(a2) * maxR * 0.38, cy + Math.sin(a2) * maxR * 0.38, 3, alpha * 0.5, '193,122,58');

  // Mouse: highlight nearest spoke + draw radius line
  if (mouse.x > 0) {
    const mouseAngle = Math.atan2(mouse.y - cy, mouse.x - cx);
    const nearestI = Math.round(((mouseAngle - rot) / (Math.PI * 2)) * lineCount);
    const snapAngle = (nearestI / lineCount) * Math.PI * 2 + rot;
    line(cx, cy, cx + Math.cos(snapAngle) * maxR, cy + Math.sin(snapAngle) * maxR, alpha * 0.45, 1.2);
    dot(cx + Math.cos(snapAngle) * maxR * 0.75, cy + Math.sin(snapAngle) * maxR * 0.75, 4, alpha * 0.7, '193,122,58');
  }
}

// ── Render loop ───────────────────────────────────────────────
const DRAW_FNS = [drawCoordinates, drawOrbitals, drawRadial];

// Ease function for blend
function easeInOut(x) { return x < 0.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2; }

// How many px the pattern drifts up over a full section scroll
const PARALLAX_PX = 120;
// Extra px the incoming pattern rises from below during fade-in
const ENTRANCE_PX = 60;

function drawWithOffset(index, alpha, entranceBlend) {
  if (alpha < 0.005) return;
  // entranceBlend: 0 = just entering (offset below), 1 = fully settled
  const parallaxY = -sectionProgress[index] * PARALLAX_PX;
  const entranceY = (1 - entranceBlend) * ENTRANCE_PX;
  bgCtx.save();
  bgCtx.translate(0, parallaxY + entranceY);
  DRAW_FNS[index](alpha);
  bgCtx.restore();
}

function tickCanvas() {
  bgCtx.clearRect(0, 0, bgW, bgH);
  t++;

  const blend = easeInOut(Math.max(0, Math.min(1, scrollBlend)));

  if (scrollFrom === scrollTo || blend <= 0) {
    drawWithOffset(scrollFrom, 1, 1);
  } else if (blend >= 1) {
    drawWithOffset(scrollTo, 1, 1);
  } else {
    // Outgoing: fully settled (entranceBlend=1), fading out
    drawWithOffset(scrollFrom, 1 - blend, 1);
    // Incoming: rising up from below as it fades in
    drawWithOffset(scrollTo, blend, blend);
  }

  requestAnimationFrame(tickCanvas);
}

window.addEventListener('mousemove', e => {
  const rect = bgCanvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('resize', () => { resizeCanvas(); updateCardEdges(); });

// ══════════════════════════════════════════════════════════════
// CURSOR
// ══════════════════════════════════════════════════════════════
const cursorEl    = document.querySelector('.cursor');
const cursorLabel = document.getElementById('cursor-label');

// Magnetic cursor: snaps to logo center when nearby
let logoMagnet = false;
let rawMouseX = -100, rawMouseY = -100;

window.addEventListener('mousemove', e => {
  rawMouseX = e.clientX;
  rawMouseY = e.clientY;
});

// Smoothed cursor position for magnetic lerp
let cursorPosX = -100, cursorPosY = -100, cursorInited = false;

gsap.ticker.add(() => {
  if (!cursorInited && rawMouseX > -50) { cursorPosX = rawMouseX; cursorPosY = rawMouseY; cursorInited = true; }

  let tx = rawMouseX, ty = rawMouseY;
  let lerpSpeed = 0.35; // default: fast follow
  const logoSvg = document.querySelector('.nav-logo svg');

  if (logoSvg) {
    const r = logoSvg.getBoundingClientRect();
    const logoCX = r.left + r.width / 2;
    const logoCY = r.top + r.height / 2;
    const dx = rawMouseX - logoCX;
    const dy = rawMouseY - logoCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 60;

    if (dist < radius) {
      // Snap directly to logo center; lerp provides the smooth animation
      tx = logoCX;
      ty = logoCY;
      lerpSpeed = 0.12; // slower lerp = smooth magnetic glide
      if (!logoMagnet) {
        logoMagnet = true;
        document.body.classList.add('cursor-hover');
        cursorLabel.textContent = 'Top';
      }
    } else if (logoMagnet) {
      logoMagnet = false;
      document.body.classList.remove('cursor-hover');
      cursorLabel.textContent = '';
    }
  }

  cursorPosX += (tx - cursorPosX) * lerpSpeed;
  cursorPosY += (ty - cursorPosY) * lerpSpeed;
  gsap.set(cursorEl, { x: cursorPosX, y: cursorPosY });
});

function bindCursorHovers() {
  const labelMap = [
    { selector: '.card',       label: 'View ↗' },
    { selector: '.lab-card',   label: 'View ↗' },
    { selector: '.nav-btn',    label: 'Go' },
    { selector: '.about-link', label: 'Open ↗' },
  ];
  labelMap.forEach(({ selector, label }) => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => { if (!logoMagnet) { document.body.classList.add('cursor-hover'); cursorLabel.textContent = label; } });
      el.addEventListener('mouseleave', () => { if (!logoMagnet) { document.body.classList.remove('cursor-hover'); cursorLabel.textContent = ''; } });
    });
  });
}

window.addEventListener('mousedown', () => document.body.classList.add('cursor-active'));
window.addEventListener('mouseup',   () => document.body.classList.remove('cursor-active'));

// ══════════════════════════════════════════════════════════════
// LENIS
// ══════════════════════════════════════════════════════════════
const lenis = new Lenis({ duration: 1.4, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

document.querySelector('.nav-logo')?.addEventListener('click', e => {
  e.preventDefault();
  lenis.scrollTo(0, { duration: 1.6 });
});

// ══════════════════════════════════════════════════════════════
// NAV & PROGRESS
// ══════════════════════════════════════════════════════════════
const navBtns        = [...document.querySelectorAll('.nav-btn')];
const mobileNavBtns  = [...document.querySelectorAll('.mobile-nav-btn')];
const navLineFill    = document.querySelector('.nav-line-fill');
const scenes         = [...document.querySelectorAll('.scene')];
let lastSection      = -1;

function setActiveNav(i) {
  navBtns.forEach((b, bi) => b.classList.toggle('active', bi === i));
  mobileNavBtns.forEach((b, bi) => b.classList.toggle('active', bi === i));
  if (i !== lastSection) { lastSection = i; }
}

[navBtns, mobileNavBtns].forEach(btns => {
  btns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const sceneEl = scenes[i];
      lenis.scrollTo(sceneEl.offsetTop + (sceneEl.offsetHeight - window.innerHeight) * 0.12, { duration: 1.6 });
    });
  });
});

document.addEventListener('mousemove', e => {
  const nx = (e.clientX / window.innerWidth  - 0.5);
  const ny = (e.clientY / window.innerHeight - 0.5);
  document.querySelectorAll('.scene.active .scene-content').forEach(el =>
    gsap.to(el, { x: nx * 8, y: ny * 5, duration: 1.2, ease: 'power2.out' }));
});

// ══════════════════════════════════════════════════════════════
// SCENE ANIMATIONS
// ══════════════════════════════════════════════════════════════
function initSceneAnimations() {
  scenes.forEach((scene, i) => {
    const eyebrow = scene.querySelector('.scene-eyebrow');
    const titleEl = scene.querySelector('.scene-title, .about-name');
    const note    = scene.querySelector('.scene-note');
    let splitTitle;
    if (titleEl) splitTitle = SplitText.create(titleEl, { type: 'lines', linesClass: 'split-line-wrap' });
    if (eyebrow) gsap.set(eyebrow, { y: 16, opacity: 0 });

    ScrollTrigger.create({
      trigger: scene, start: 'top 80%',
      onEnter: () => {
        scene.classList.add('active'); setActiveNav(i);
        if (eyebrow) gsap.to(eyebrow, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 });
        if (splitTitle) gsap.fromTo(splitTitle.lines,
          { y: '100%', opacity: 0 }, { y: '0%', opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.12, delay: 0.2 });
        if (note) gsap.fromTo(note, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.55 });
      },
      onLeaveBack: () => {
        scene.classList.remove('active');
        if (eyebrow) gsap.to(eyebrow, { y: 16, opacity: 0, duration: 0.4 });
        if (splitTitle) gsap.to(splitTitle.lines, { y: '100%', opacity: 0, duration: 0.4, stagger: 0.06 });
        if (note) gsap.to(note, { y: 14, opacity: 0, duration: 0.3 });
      }
    });

    // Progress bar + canvas parallax offset
    ScrollTrigger.create({
      trigger: scene, start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        gsap.set(navLineFill, { height: `${((i + self.progress) / scenes.length) * 100}%` });
        if (self.progress > 0.05) setActiveNav(i);
        sectionProgress[i] = self.progress;
      }
    });

    // ── Scroll-driven bg pattern transition ──────────────────
    // Between scene i and scene i+1: scrub controls scrollBlend
    if (i < scenes.length - 1) {
      ScrollTrigger.create({
        trigger: scene,
        start: 'bottom-=15% bottom',  // blend starts late — short overlap
        end:   'bottom top+=15%',
        scrub: 0.5,
        onUpdate: self => {
          scrollFrom  = i;
          scrollTo    = i + 1;
          scrollBlend = self.progress;
        },
        onLeave: () => {
          scrollFrom  = i + 1;
          scrollTo    = i + 1;
          scrollBlend = 0;
        },
        onLeaveBack: () => {
          scrollFrom  = i;
          scrollTo    = i;
          scrollBlend = 0;
        },
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════
// CARD ANIMATIONS  (LOCKED — Ben approved)
// ══════════════════════════════════════════════════════════════
function initCardAnimations() {
  ScrollTrigger.create({ trigger: '#work-grid', start: 'top 85%', onEnter: () =>
    gsap.fromTo('.card', { y: 40, opacity: 0, rotation: 0.4 }, { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: 'power3.out', stagger: 0.10 }) });
  ScrollTrigger.create({ trigger: '#lab-grid', start: 'top 85%', onEnter: () =>
    gsap.fromTo('.lab-card', { y: 36, opacity: 0, rotation: 0.3 }, { y: 0, opacity: 1, rotation: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }) });
  ScrollTrigger.create({ trigger: '.about-right', start: 'top 80%', onEnter: () => {
    gsap.fromTo('.about-right', { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' });
    gsap.fromTo('.about-bio, .about-loc', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.15, delay: 0.25 });
    gsap.fromTo('.about-link', { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.5 });
  }});

  document.querySelectorAll('.card-slot').forEach(slot => {
    const card = slot.querySelector('.card, .lab-card');
    if (!card) return;
    slot.addEventListener('mouseenter', () =>
      gsap.to(card, { y: -28, boxShadow: '0 12px 32px rgba(0,0,0,0.10)', duration: 0.45, ease: 'power3.out', overwrite: 'auto', zIndex: 2 }));
    slot.addEventListener('mousemove', e => {
      const r = slot.getBoundingClientRect();
      gsap.to(card, { rotationY: ((e.clientX-r.left-r.width/2)/(r.width/2))*4, rotationX: -((e.clientY-r.top-r.height/2)/(r.height/2))*3, transformPerspective: 900, duration: 0.3, ease: 'power2.out', overwrite: false });
    });
    slot.addEventListener('mouseleave', () =>
      gsap.to(card, { y: 0, rotationX: 0, rotationY: 0, boxShadow: '0 0px 0px rgba(0,0,0,0)', duration: 0.55, ease: 'power3.out', overwrite: 'auto', zIndex: 1 }));
  });
}

// ══════════════════════════════════════════════════════════════
// CONTENT
// ══════════════════════════════════════════════════════════════
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escAttr(str) {
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadContent() {
  try {
    const res = await fetch('./data/content.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderWork(data.work); renderLab(data.ailab); renderAbout(data.meta);
  } catch (e) {
    console.error('Failed to load content:', e);
    document.getElementById('work-grid').innerHTML =
      '<p style="grid-column:1/-1;padding:40px;color:var(--ink-muted);font-size:14px;">Could not load projects. Please refresh.</p>';
  }
}

function renderWork(projects) {
  document.getElementById('work-grid').innerHTML = projects.map(p => `
    <div class="card-slot">
      <a class="card" href="${escAttr(p.link)}" aria-label="${esc(p.title)}">
        <div class="card-year">${esc(p.year)}</div>
        <div class="card-title">${esc(p.title)}</div>
        <div class="card-desc">${esc(p.description)}</div>
        <div class="card-tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </a>
    </div>`).join('');
}

function renderLab(items) {
  document.getElementById('lab-grid').innerHTML = items.map(item => `
    <div class="card-slot">
      <div class="lab-card" data-status="${escAttr(item.status)}">
        <div class="lab-status"><span class="status-dot"></span>${esc(item.status)}</div>
        <div class="card-title">${esc(item.title)}</div>
        <div class="card-desc">${esc(item.description)}</div>
        <div class="card-tags">${item.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}<span class="tag">${esc(item.year)}</span></div>
      </div>
    </div>`).join('');
}

function renderAbout(meta) {
  document.getElementById('bio-text').textContent = meta.bio;
  document.getElementById('about-location').textContent = `📍 ${meta.location}`;
  const links = [];
  if (meta.links.github) links.push({ label: 'GitHub', href: meta.links.github });
  if (meta.links.email)  links.push({ label: 'Email',  href: `mailto:${meta.links.email}` });
  document.getElementById('about-links').innerHTML = links.map(l =>
    `<a class="about-link" href="${escAttr(l.href)}" target="_blank" rel="noopener"><span>${esc(l.label)}</span><span class="about-link-arrow" aria-hidden="true">↗</span></a>`).join('');
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();

  if (prefersReducedMotion) {
    // Show all content immediately, no animations
    document.querySelectorAll('.scene-eyebrow').forEach(el => { el.style.opacity = 1; });
    document.querySelectorAll('.card, .lab-card').forEach(el => { el.style.opacity = 1; });
    document.querySelectorAll('.about-right, .about-bio, .about-loc, .about-link').forEach(el => { el.style.opacity = 1; });
    return;
  }

  resizeCanvas();
  updateCardEdges();
  tickCanvas();
  bindCursorHovers();

  await new Promise(r => setTimeout(r, 120));
  initSceneAnimations();
  initCardAnimations();
  ScrollTrigger.refresh();
});
