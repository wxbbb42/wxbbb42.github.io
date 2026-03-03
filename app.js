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

let t = 0; // global time counter
let currentSection = 0;
let sectionProgress = 0; // 0→1 transition blend
const TRANSITION_SPEED = 0.018;

function resizeCanvas() {
  bgW = bgCanvas.offsetWidth;
  bgH = bgCanvas.offsetHeight;
  bgCanvas.width  = bgW * devicePixelRatio;
  bgCanvas.height = bgH * devicePixelRatio;
  bgCtx.scale(devicePixelRatio, devicePixelRatio);
}

// ── Helpers ───────────────────────────────────────────────────
function line(x1, y1, x2, y2, alpha, width = 0.5) {
  bgCtx.beginPath();
  bgCtx.moveTo(x1, y1);
  bgCtx.lineTo(x2, y2);
  bgCtx.strokeStyle = `rgba(26,26,24,${alpha})`;
  bgCtx.lineWidth = width;
  bgCtx.stroke();
}

function arc(cx, cy, r, startA, endA, alpha, width = 0.5) {
  bgCtx.beginPath();
  bgCtx.arc(cx, cy, r, startA, endA);
  bgCtx.strokeStyle = `rgba(26,26,24,${alpha})`;
  bgCtx.lineWidth = width;
  bgCtx.stroke();
}

function dot(x, y, r, alpha, color = '26,26,24') {
  bgCtx.beginPath();
  bgCtx.arc(x, y, r, 0, Math.PI * 2);
  bgCtx.fillStyle = `rgba(${color},${alpha})`;
  bgCtx.fill();
}

// ── SECTION 0: Coordinate System (Work) ───────────────────────
function drawCoordinates(alpha) {
  const cx = bgW * 0.62;
  const cy = bgH * 0.50;
  const size = Math.min(bgW, bgH) * 0.38;

  // Axis lines
  line(cx - size, cy, cx + size, cy, alpha * 0.18, 0.6);  // X axis
  line(cx, cy - size, cx, cy + size, alpha * 0.18, 0.6);  // Y axis

  // Tick marks
  const tickCount = 10;
  const tickSpacing = size / tickCount;
  for (let i = -tickCount; i <= tickCount; i++) {
    const tickSize = i === 0 ? 0 : (i % 5 === 0 ? 8 : 4);
    // X axis ticks
    line(cx + i * tickSpacing, cy - tickSize, cx + i * tickSpacing, cy + tickSize, alpha * 0.12, 0.5);
    // Y axis ticks
    line(cx - tickSize, cy + i * tickSpacing, cx + tickSize, cy + i * tickSpacing, alpha * 0.12, 0.5);
  }

  // Grid lines (faint)
  for (let i = -tickCount; i <= tickCount; i++) {
    if (i === 0) continue;
    const a = i % 5 === 0 ? alpha * 0.07 : alpha * 0.035;
    line(cx + i * tickSpacing, cy - size, cx + i * tickSpacing, cy + size, a, 0.4);
    line(cx - size, cy + i * tickSpacing, cx + size, cy + i * tickSpacing, a, 0.4);
  }

  // Arrow heads on axes
  const aw = 6, al = 10;
  // X arrow
  bgCtx.beginPath();
  bgCtx.moveTo(cx + size, cy);
  bgCtx.lineTo(cx + size - al, cy - aw);
  bgCtx.lineTo(cx + size - al, cy + aw);
  bgCtx.fillStyle = `rgba(26,26,24,${alpha * 0.18})`;
  bgCtx.fill();
  // Y arrow
  bgCtx.beginPath();
  bgCtx.moveTo(cx, cy - size);
  bgCtx.lineTo(cx - aw, cy - size + al);
  bgCtx.lineTo(cx + aw, cy - size + al);
  bgCtx.fill();

  // Mouse crosshair readout
  if (mouse.x > 0 && mouse.x < bgW) {
    const mx = mouse.x, my = mouse.y;
    // Dashed cross at mouse pos
    bgCtx.setLineDash([3, 5]);
    line(mx, cy - size, mx, cy + size, alpha * 0.10, 0.4);
    line(cx - size, my, cx + size, my, alpha * 0.10, 0.4);
    bgCtx.setLineDash([]);
    dot(mx, my, 2.5, alpha * 0.5, '193,122,58');
    // Intersection dot on axes
    dot(mx, cy, 2, alpha * 0.3, '193,122,58');
    dot(cx, my, 2, alpha * 0.3, '193,122,58');
  }

  // Slowly rotating label dots (decorative)
  for (let i = 0; i < 5; i++) {
    const angle = (t * 0.003) + i * Math.PI * 0.4;
    const r = tickSpacing * (2 + i * 1.5);
    const px = cx + Math.cos(angle) * r * 0.8;
    const py = cy + Math.sin(angle) * r * 0.4;
    dot(px, py, 1.5, alpha * 0.25);
  }
}

// ── SECTION 1: Orbital System (Lab) ──────────────────────────
function drawOrbitals(alpha) {
  const cx = bgW * 0.60;
  const cy = bgH * 0.50;

  const orbits = [
    { rx: 70,  ry: 40,  tilt: 0.2,  speed: 0.008,  dotR: 3,   dotColor: '193,122,58' },
    { rx: 130, ry: 80,  tilt: -0.5, speed: 0.005,  dotR: 2.5, dotColor: '26,26,24' },
    { rx: 190, ry: 115, tilt: 0.7,  speed: 0.003,  dotR: 2,   dotColor: '26,26,24' },
    { rx: 250, ry: 150, tilt: -0.3, speed: 0.0018, dotR: 1.5, dotColor: '26,26,24' },
  ];

  // Nucleus
  dot(cx, cy, 4, alpha * 0.5, '193,122,58');
  dot(cx, cy, 8, alpha * 0.08, '193,122,58');
  dot(cx, cy, 16, alpha * 0.04, '193,122,58');

  orbits.forEach((o, i) => {
    // Draw ellipse orbit
    bgCtx.save();
    bgCtx.translate(cx, cy);
    bgCtx.rotate(o.tilt);
    bgCtx.beginPath();
    bgCtx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
    bgCtx.strokeStyle = `rgba(26,26,24,${alpha * 0.08})`;
    bgCtx.lineWidth = 0.5;
    bgCtx.stroke();
    bgCtx.restore();

    // Orbiting dot
    const angle = t * o.speed + i * 1.3;
    const px = cx + Math.cos(angle + o.tilt) * o.rx * Math.cos(o.tilt)
                  - Math.sin(angle + o.tilt) * o.ry * Math.sin(o.tilt);
    const py = cy + Math.cos(angle + o.tilt) * o.rx * Math.sin(o.tilt)
                  + Math.sin(angle + o.tilt) * o.ry * Math.cos(o.tilt);
    dot(px, py, o.dotR, alpha * 0.7, o.dotColor);

    // Trailing glow
    for (let tr = 1; tr <= 5; tr++) {
      const ta = angle - tr * 0.12;
      const tpx = cx + Math.cos(ta + o.tilt) * o.rx * Math.cos(o.tilt)
                     - Math.sin(ta + o.tilt) * o.ry * Math.sin(o.tilt);
      const tpy = cy + Math.cos(ta + o.tilt) * o.rx * Math.sin(o.tilt)
                     + Math.sin(ta + o.tilt) * o.ry * Math.cos(o.tilt);
      dot(tpx, tpy, o.dotR * (1 - tr * 0.15), alpha * 0.15 * (1 - tr * 0.18), o.dotColor);
    }

    // Mouse gravity: draw pull line when close
    if (mouse.x > 0) {
      const dx = mouse.x - px, dy = mouse.y - py;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) {
        line(px, py, mouse.x, mouse.y, alpha * (1 - dist/120) * 0.2, 0.4);
      }
    }
  });

  // Star field (tiny static dots)
  for (let i = 0; i < 28; i++) {
    // Seeded positions using index
    const sx = cx + (((i * 137.5) % 500) - 250);
    const sy = cy + (((i * 97.3)  % 400) - 200);
    const pulse = 0.3 + 0.2 * Math.sin(t * 0.02 + i);
    dot(sx, sy, 0.8, alpha * pulse * 0.4);
  }
}

// ── SECTION 2: Radial Lines (About) ──────────────────────────
function drawRadial(alpha) {
  const cx = bgW * 0.60;
  const cy = bgH * 0.50;
  const maxR = Math.min(bgW, bgH) * 0.42;

  const lineCount = 36;
  const rot = t * 0.0015; // slow rotation

  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2 + rot;
    const isMajor = i % 6 === 0;
    const isMed   = i % 3 === 0;
    const len = isMajor ? maxR : isMed ? maxR * 0.75 : maxR * 0.5;
    const a   = isMajor ? alpha * 0.14 : isMed ? alpha * 0.08 : alpha * 0.05;
    const w   = isMajor ? 0.7 : 0.4;

    line(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len, a, w);
  }

  // Concentric circles
  [0.15, 0.30, 0.50, 0.72, 1.0].forEach((f, i) => {
    arc(cx, cy, maxR * f, rot, rot + Math.PI * 2, alpha * (i === 4 ? 0.10 : 0.06), 0.4);
  });

  // Center crosshair
  const cSize = 12;
  line(cx - cSize, cy, cx + cSize, cy, alpha * 0.3, 0.8);
  line(cx, cy - cSize, cx, cy + cSize, alpha * 0.3, 0.8);
  dot(cx, cy, 3, alpha * 0.5, '193,122,58');

  // Rotating accent dot on outer ring
  const accentAngle = t * 0.008;
  dot(cx + Math.cos(accentAngle) * maxR, cy + Math.sin(accentAngle) * maxR, 3, alpha * 0.6, '193,122,58');
  dot(cx + Math.cos(accentAngle + Math.PI) * maxR * 0.5,
      cy + Math.sin(accentAngle + Math.PI) * maxR * 0.5, 2, alpha * 0.4, '193,122,58');

  // Mouse: highlight nearest spoke
  if (mouse.x > 0) {
    const mouseAngle = Math.atan2(mouse.y - cy, mouse.x - cx);
    const nearest = Math.round(((mouseAngle - rot) / (Math.PI * 2)) * lineCount);
    const snapAngle = (nearest / lineCount) * Math.PI * 2 + rot;
    line(cx, cy, cx + Math.cos(snapAngle) * maxR, cy + Math.sin(snapAngle) * maxR, alpha * 0.4, 1);
    dot(cx + Math.cos(snapAngle) * maxR, cy + Math.sin(snapAngle) * maxR, 3, alpha * 0.6, '193,122,58');
  }
}

// ── Main render ───────────────────────────────────────────────
const DRAW_FNS = [drawCoordinates, drawOrbitals, drawRadial];

function tickCanvas() {
  bgCtx.clearRect(0, 0, bgW, bgH);

  t++;

  // Blend between sections during transition
  if (sectionProgress < 1) sectionProgress = Math.min(1, sectionProgress + TRANSITION_SPEED);

  const prev = (currentSection + 2) % 3; // previous
  const curr = currentSection;

  if (sectionProgress < 1) {
    DRAW_FNS[prev](1 - sectionProgress);
    DRAW_FNS[curr](sectionProgress);
  } else {
    DRAW_FNS[curr](1);
  }

  requestAnimationFrame(tickCanvas);
}

function setBgSection(i) {
  if (i === currentSection) return;
  currentSection  = i;
  sectionProgress = 0;
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
  if (i !== lastSection) { lastSection = i; setBgSection(i); }
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

    ScrollTrigger.create({
      trigger: scene, start: 'top top', end: 'bottom bottom',
      onUpdate: self => {
        gsap.set(navLineFill, { height: `${((i + self.progress) / scenes.length) * 100}%` });
        if (self.progress > 0.05) setActiveNav(i);
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
      gsap.to(card, { rotationY: ((e.clientX - r.left - r.width/2)/(r.width/2))*4, rotationX: -((e.clientY - r.top - r.height/2)/(r.height/2))*3, transformPerspective: 900, duration: 0.3, ease: 'power2.out', overwrite: false });
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
