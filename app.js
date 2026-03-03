/* ─────────────────────────────────────────────────────────────
   app.js  —  Lenis + GSAP + SplitText + cursor + Geometric canvas
───────────────────────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger, SplitText);

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

function resizeCanvas() {
  bgW = bgCanvas.offsetWidth;
  bgH = bgCanvas.offsetHeight;
  bgCanvas.width  = bgW * devicePixelRatio;
  bgCanvas.height = bgH * devicePixelRatio;
  bgCtx.scale(devicePixelRatio, devicePixelRatio);
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
function drawCoordinates(alpha) {
  if (alpha < 0.005) return;
  const cx = bgW * 0.5;
  const cy = bgH * 0.5;
  const size = Math.max(bgW, bgH) * 0.6; // fill the canvas

  const tickCount = 16;
  const tickSpacing = size / tickCount;

  // Full-canvas grid
  for (let i = -tickCount; i <= tickCount; i++) {
    const isMajor = i % 4 === 0;
    const a = isMajor ? alpha * 0.22 : alpha * 0.10;
    line(cx + i * tickSpacing, cy - size, cx + i * tickSpacing, cy + size, a, isMajor ? 0.8 : 0.5);
    line(cx - size, cy + i * tickSpacing, cx + size, cy + i * tickSpacing, a, isMajor ? 0.8 : 0.5);
  }

  // Main axes
  line(cx - size, cy, cx + size, cy, alpha * 0.45, 1.2);
  line(cx, cy - size, cx, cy + size, alpha * 0.45, 1.2);

  // Tick marks on axes
  for (let i = -tickCount; i <= tickCount; i++) {
    if (i === 0) continue;
    const isMajor = i % 4 === 0;
    const ts = isMajor ? 10 : 5;
    line(cx + i * tickSpacing, cy - ts, cx + i * tickSpacing, cy + ts, alpha * 0.40, 0.8);
    line(cx - ts, cy + i * tickSpacing, cx + ts, cy + i * tickSpacing, alpha * 0.40, 0.8);
  }

  // Arrowheads
  const aw = 7;
  [[cx + size, cy, 1, 0], [cx, cy - size, 0, -1]].forEach(([x, y, dx, dy]) => {
    bgCtx.beginPath();
    bgCtx.moveTo(x, y);
    bgCtx.lineTo(x - dx * 14 - dy * aw, y - dy * 14 + dx * aw);
    bgCtx.lineTo(x - dx * 14 + dy * aw, y - dy * 14 - dx * aw);
    bgCtx.fillStyle = `rgba(26,26,24,${alpha * 0.20})`;
    bgCtx.fill();
  });

  // Origin dot
  dot(cx, cy, 4, alpha * 0.35);

  // Mouse crosshair
  if (mouse.x > 0 && mouse.x < bgW) {
    bgCtx.setLineDash([4, 6]);
    line(mouse.x, 0, mouse.x, bgH, alpha * 0.12, 0.5);
    line(0, mouse.y, bgW, mouse.y, alpha * 0.12, 0.5);
    bgCtx.setLineDash([]);
    dot(mouse.x, mouse.y, 3, alpha * 0.6, '193,122,58');
    dot(mouse.x, cy, 2.5, alpha * 0.4, '193,122,58');
    dot(cx, mouse.y, 2.5, alpha * 0.4, '193,122,58');
  }

  // Floating measurement dots
  for (let i = 0; i < 6; i++) {
    const angle = (t * 0.003) + i * Math.PI / 3;
    const r = tickSpacing * (2.5 + i * 1.2);
    dot(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.5, 2, alpha * 0.28);
  }
}

// ── SECTION 1: Orbital System (Lab) ──────────────────────────
function drawOrbitals(alpha) {
  if (alpha < 0.005) return;

  // Mouse pull: shift the entire system center toward mouse
  const hasMouse = mouse.x > 0 && mouse.x < bgW;
  const pullX = hasMouse ? (mouse.x - bgW * 0.5) * 0.08 : 0;
  const pullY = hasMouse ? (mouse.y - bgH * 0.5) * 0.08 : 0;
  const cx = bgW * 0.5 + pullX;
  const cy = bgH * 0.5 + pullY;
  const scale = Math.min(bgW, bgH) * 0.48;

  // Mouse distance from center (normalized 0–1)
  const mouseDist = hasMouse
    ? Math.min(1, Math.sqrt((mouse.x - bgW*0.5)**2 + (mouse.y - bgH*0.5)**2) / (bgW * 0.4))
    : 0;
  const speedBoost = 1 + mouseDist * 2.5; // orbit faster when mouse is further from center

  const orbits = [
    { rx: scale * 0.18, ry: scale * 0.10, tilt: 0.25,  speed: 0.010, dotR: 4,   color: '193,122,58' },
    { rx: scale * 0.38, ry: scale * 0.24, tilt: -0.50, speed: 0.006, dotR: 3.5, color: '26,26,24' },
    { rx: scale * 0.58, ry: scale * 0.38, tilt: 0.65,  speed: 0.0038,dotR: 3,   color: '26,26,24' },
    { rx: scale * 0.80, ry: scale * 0.52, tilt: -0.28, speed: 0.0022,dotR: 2.5, color: '26,26,24' },
    { rx: scale * 1.00, ry: scale * 0.64, tilt: 0.48,  speed: 0.0014,dotR: 2,   color: '26,26,24' },
  ];

  // Star field
  for (let i = 0; i < 40; i++) {
    const sx = bgW * ((i * 137.508) % 1);
    const sy = bgH * ((i * 97.333) % 1);
    const pulse = 0.25 + 0.2 * Math.sin(t * 0.018 + i * 1.3);
    dot(sx, sy, 1, alpha * pulse * 0.5);
  }

  // Mouse → center attraction line
  if (hasMouse) {
    const mdist = Math.sqrt((mouse.x - cx)**2 + (mouse.y - cy)**2);
    const lineAlpha = alpha * Math.min(0.35, mdist / 300);
    line(mouse.x, mouse.y, cx, cy, lineAlpha, 0.6);
    dot(mouse.x, mouse.y, 3, alpha * 0.5, '193,122,58');
  }

  // Nucleus glow rings
  [20, 36, 56].forEach((r, i) => dot(cx, cy, r, alpha * [0.06, 0.04, 0.02][i], '193,122,58'));
  dot(cx, cy, 6, alpha * 0.65, '193,122,58');

  orbits.forEach((o, i) => {
    // Ellipse
    bgCtx.save();
    bgCtx.translate(cx, cy);
    bgCtx.rotate(o.tilt);
    bgCtx.beginPath();
    bgCtx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
    bgCtx.strokeStyle = `rgba(26,26,24,${alpha * 0.10})`;
    bgCtx.lineWidth = 0.6;
    bgCtx.stroke();
    bgCtx.restore();

    // Orbiting dot (speed boosted by mouse distance)
    const angle = t * o.speed * speedBoost + i * 1.4;
    const px = cx + Math.cos(angle) * o.rx * Math.cos(o.tilt) - Math.sin(angle) * o.ry * Math.sin(o.tilt);
    const py = cy + Math.cos(angle) * o.rx * Math.sin(o.tilt) + Math.sin(angle) * o.ry * Math.cos(o.tilt);

    // Trail
    for (let tr = 1; tr <= 8; tr++) {
      const ta = angle - tr * 0.10 * speedBoost;
      const tpx = cx + Math.cos(ta) * o.rx * Math.cos(o.tilt) - Math.sin(ta) * o.ry * Math.sin(o.tilt);
      const tpy = cy + Math.cos(ta) * o.rx * Math.sin(o.tilt) + Math.sin(ta) * o.ry * Math.cos(o.tilt);
      dot(tpx, tpy, o.dotR * (1 - tr * 0.1), alpha * 0.18 * (1 - tr * 0.11), o.color);
    }
    dot(px, py, o.dotR, alpha * 0.80, o.color);
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

function tickCanvas() {
  bgCtx.clearRect(0, 0, bgW, bgH);
  t++;

  const blend = easeInOut(Math.max(0, Math.min(1, scrollBlend)));

  if (scrollFrom === scrollTo || blend <= 0) {
    DRAW_FNS[scrollFrom](1);
  } else if (blend >= 1) {
    DRAW_FNS[scrollTo](1);
  } else {
    DRAW_FNS[scrollFrom](1 - blend);
    DRAW_FNS[scrollTo](blend);
  }

  requestAnimationFrame(tickCanvas);
}

window.addEventListener('mousemove', e => {
  const rect = bgCanvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('resize', resizeCanvas);

// ══════════════════════════════════════════════════════════════
// CURSOR
// ══════════════════════════════════════════════════════════════
const cursorEl    = document.querySelector('.cursor');
const cursorLabel = document.getElementById('cursor-label');

window.addEventListener('mousemove', e => gsap.set(cursorEl, { x: e.clientX, y: e.clientY }));

function bindCursorHovers() {
  const labelMap = [
    { selector: '.card',       label: 'View ↗' },
    { selector: '.lab-card',   label: 'View ↗' },
    { selector: '.nav-btn',    label: 'Go' },
    { selector: '.nav-logo',   label: 'Top' },
    { selector: '.about-link', label: 'Open ↗' },
  ];
  labelMap.forEach(({ selector, label }) => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => { document.body.classList.add('cursor-hover'); cursorLabel.textContent = label; });
      el.addEventListener('mouseleave', () => { document.body.classList.remove('cursor-hover'); cursorLabel.textContent = ''; });
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

// ══════════════════════════════════════════════════════════════
// NAV & PROGRESS
// ══════════════════════════════════════════════════════════════
const navBtns     = [...document.querySelectorAll('.nav-btn')];
const navLineFill = document.querySelector('.nav-line-fill');
const scenes      = [...document.querySelectorAll('.scene')];
let lastSection   = -1;

function setActiveNav(i) {
  navBtns.forEach((b, bi) => b.classList.toggle('active', bi === i));
  if (i !== lastSection) { lastSection = i; }
}

navBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    const sceneEl = scenes[i];
    lenis.scrollTo(sceneEl.offsetTop + (sceneEl.offsetHeight - window.innerHeight) * 0.12, { duration: 1.6 });
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

    // Progress bar
    ScrollTrigger.create({
      trigger: scene, start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        gsap.set(navLineFill, { height: `${((i + self.progress) / scenes.length) * 100}%` });
        if (self.progress > 0.05) setActiveNav(i);
      }
    });

    // ── Scroll-driven bg pattern transition ──────────────────
    // Between scene i and scene i+1: scrub controls scrollBlend
    if (i < scenes.length - 1) {
      ScrollTrigger.create({
        trigger: scene,
        start: 'bottom bottom',  // starts when bottom of scene hits bottom of viewport
        end:   'bottom top',     // ends when bottom of scene leaves top
        scrub: true,
        onUpdate: self => {
          scrollFrom  = i;
          scrollTo    = i + 1;
          scrollBlend = self.progress;
        },
        onLeaveBack: () => {
          scrollFrom  = i;
          scrollTo    = i;
          scrollBlend = 0;
        },
      });
    }

    // When fully in a section (not transitioning), lock it
    ScrollTrigger.create({
      trigger: scene, start: 'top bottom', end: 'bottom bottom',
      onUpdate: self => {
        if (self.progress < 1) {
          // Still entering — if previous transition done, lock to this section
          if (i === 0 || scrollBlend >= 1) {
            scrollFrom  = i;
            scrollTo    = i;
            scrollBlend = 0;
          }
        }
      }
    });
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

  document.querySelectorAll('.card, .lab-card').forEach(card => {
    card.addEventListener('mouseenter', () =>
      gsap.to(card, { y: -28, boxShadow: '0 12px 32px rgba(0,0,0,0.10)', duration: 0.45, ease: 'power3.out', overwrite: 'auto', zIndex: 2 }));
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      gsap.to(card, { rotationY: ((e.clientX-r.left-r.width/2)/(r.width/2))*4, rotationX: -((e.clientY-r.top-r.height/2)/(r.height/2))*3, transformPerspective: 900, duration: 0.3, ease: 'power2.out', overwrite: false });
    });
    card.addEventListener('mouseleave', () =>
      gsap.to(card, { y: 0, rotationX: 0, rotationY: 0, boxShadow: '0 0px 0px rgba(0,0,0,0)', duration: 0.55, ease: 'power3.out', overwrite: 'auto', zIndex: 1 }));
  });
}

// ══════════════════════════════════════════════════════════════
// CONTENT
// ══════════════════════════════════════════════════════════════
async function loadContent() {
  const res = await fetch('./data/content.json');
  const data = await res.json();
  renderWork(data.work); renderLab(data.ailab); renderAbout(data.meta);
}

function renderWork(projects) {
  document.getElementById('work-grid').innerHTML = projects.map(p => `
    <a class="card" href="${p.link}">
      <div class="card-year">${p.year}</div>
      <div class="card-title">${p.title}</div>
      <div class="card-desc">${p.description}</div>
      <div class="card-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <span class="card-arrow">↗</span>
    </a>`).join('');
}

function renderLab(items) {
  document.getElementById('lab-grid').innerHTML = items.map(item => `
    <div class="lab-card" data-status="${item.status}">
      <div class="lab-status"><span class="status-dot"></span>${item.status}</div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">${item.description}</div>
      <div class="card-tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}<span class="tag">${item.year}</span></div>
    </div>`).join('');
}

function renderAbout(meta) {
  document.getElementById('bio-text').textContent = meta.bio;
  document.getElementById('about-location').textContent = `📍 ${meta.location}`;
  const links = [];
  if (meta.links.github) links.push({ label: 'GitHub', href: meta.links.github });
  if (meta.links.email)  links.push({ label: 'Email',  href: `mailto:${meta.links.email}` });
  document.getElementById('about-links').innerHTML = links.map(l =>
    `<a class="about-link" href="${l.href}" target="_blank" rel="noopener"><span>${l.label}</span><span class="about-link-arrow">↗</span></a>`).join('');
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  resizeCanvas();
  tickCanvas();

  await loadContent();
  bindCursorHovers();

  await new Promise(r => setTimeout(r, 120));
  initSceneAnimations();
  initCardAnimations();
  ScrollTrigger.refresh();
});
