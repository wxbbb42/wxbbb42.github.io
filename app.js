/* ─────────────────────────────────────────────────────────────
   app.js  —  Lenis + GSAP ScrollTrigger + SplitText + cursor + canvas
───────────────────────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger, SplitText);

// ══════════════════════════════════════════════════════════════
// BACKGROUND CANVAS
// ══════════════════════════════════════════════════════════════
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');
let bgW, bgH;
const mouse = { x: -9999, y: -9999 };

// ── Grid config per section ───────────────────────────────────
const gridCfgs = [
  { spacing: 34, dotSize: 2.0, dotAlpha: 0.12, lineAlpha: 0.05 },
  { spacing: 34, dotSize: 2.0, dotAlpha: 0.10, lineAlpha: 0.04 },
  { spacing: 34, dotSize: 2.0, dotAlpha: 0.12, lineAlpha: 0.05 },
];
const INK    = '26,26,24';
let curGrid  = { ...gridCfgs[0] };
let tgtGrid  = { ...gridCfgs[0] };

// ── Background dots (tiny, at every intersection) ─────────────
let bgDots = [];
function buildBgDots(sp) {
  bgDots = [];
  const cols = Math.ceil(bgW / sp) + 2;
  const rows = Math.ceil(bgH / sp) + 2;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      bgDots.push({ x: c * sp, y: r * sp });
}

// ── Pixel shapes (bitmap → world positions) ───────────────────
const CELL = 30; // px per pixel-art cell

const BITMAPS = [
  // 0 · Work — arrow ↗
  [
    [0,0,0,0,0,1,1,1,1,1],
    [0,0,0,0,0,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,1,1],
    [0,1,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,0,1],
    [0,1,1,1,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0],
  ],
  // 1 · Lab — hexagon ring
  [
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,1,1],
    [0,1,1,0,0,1,1,0],
    [0,0,1,1,1,1,0,0],
  ],
  // 2 · About — letter X
  [
    [1,1,0,0,0,0,1,1],
    [0,1,1,0,0,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,0,0,0,0,1,1],
  ],
];

// Pixel particle state
let pixels     = [];    // { tx, ty, x, y, vx, vy, alpha }
let activeShape = -1;

function buildShape(idx) {
  const bm    = BITMAPS[idx];
  const rows  = bm.length;
  const cols  = bm[0].length;
  const shapeW = cols * CELL;
  const shapeH = rows * CELL;
  // Place shape: center-right of canvas
  const originX = bgW * 0.62 - shapeW / 2;
  const originY = bgH * 0.5  - shapeH / 2;

  const targets = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (bm[r][c])
        targets.push({
          tx: originX + c * CELL + CELL / 2,
          ty: originY + r * CELL + CELL / 2,
        });
  return targets;
}

function scatterPixels(onDone) {
  pixels.forEach(p => {
    // Explode outward from center
    const cx = bgW * 0.62, cy = bgH * 0.5;
    const angle = Math.atan2(p.ty - cy, p.tx - cx) + (Math.random() - 0.5) * 1.2;
    const dist  = 300 + Math.random() * 400;
    gsap.to(p, {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      alpha: 0,
      duration: 0.7 + Math.random() * 0.4,
      ease: 'power3.in',
    });
  });
  setTimeout(onDone, 900);
}

function assembleShape(idx) {
  const targets = buildShape(idx);
  const cx = bgW * 0.62, cy = bgH * 0.5;

  pixels = targets.map(t => ({
    tx: t.tx, ty: t.ty,
    x: cx + (Math.random() - 0.5) * bgW * 0.9,
    y: cy + (Math.random() - 0.5) * bgH * 0.9,
    vx: 0, vy: 0,
    alpha: 0,
  }));

  // Stagger fly-in
  pixels.forEach((p, i) => {
    gsap.to(p, {
      x: p.tx, y: p.ty, alpha: 1,
      duration: 0.9 + Math.random() * 0.3,
      ease: 'power3.out',
      delay: i * 0.012,
    });
  });
}

let transitioning = false;
function setBgSection(idx) {
  tgtGrid = { ...gridCfgs[Math.min(idx, gridCfgs.length - 1)] };

  if (idx === activeShape) return;
  if (transitioning) return;
  transitioning = true;

  if (activeShape === -1) {
    activeShape = idx;
    transitioning = false;
    assembleShape(idx);
  } else {
    scatterPixels(() => {
      activeShape = idx;
      transitioning = false;
      assembleShape(idx);
    });
  }
}

// ── Physics constants ─────────────────────────────────────────
const REPEL_R  = 90;
const REPEL_F  = 0.18;
const RETURN_S = 0.07;
const DAMP     = 0.78;

// ── Main render loop ─────────────────────────────────────────
function tickCanvas() {
  bgCtx.clearRect(0, 0, bgW, bgH);

  // Lerp grid config
  curGrid.spacing   += (tgtGrid.spacing   - curGrid.spacing)   * 0.04;
  curGrid.dotAlpha  += (tgtGrid.dotAlpha  - curGrid.dotAlpha)  * 0.04;
  curGrid.lineAlpha += (tgtGrid.lineAlpha - curGrid.lineAlpha) * 0.04;

  const sp = curGrid.spacing;

  // Grid lines
  bgCtx.strokeStyle = `rgba(${INK},${curGrid.lineAlpha})`;
  bgCtx.lineWidth = 0.5;
  for (let x = 0; x <= bgW + sp; x += sp) {
    bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, bgH); bgCtx.stroke();
  }
  for (let y = 0; y <= bgH + sp; y += sp) {
    bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgW, y); bgCtx.stroke();
  }

  // Tiny background intersection dots
  bgCtx.fillStyle = `rgba(${INK},${curGrid.dotAlpha})`;
  bgDots.forEach(d => {
    bgCtx.beginPath();
    bgCtx.arc(d.x, d.y, curGrid.dotSize, 0, Math.PI * 2);
    bgCtx.fill();
  });

  // Pixel particles (the shape) with mouse repulsion
  const ACCENT = '193,122,58';
  pixels.forEach(p => {
    if (p.alpha <= 0.01) return;

    // Mouse repulsion
    const dx   = p.x - mouse.x;
    const dy   = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < REPEL_R && dist > 0) {
      const force = (1 - dist / REPEL_R) * REPEL_F;
      p.vx += (dx / dist) * force * REPEL_R;
      p.vy += (dy / dist) * force * REPEL_R;
    }

    // Spring back to target
    p.vx += (p.tx - p.x) * RETURN_S;
    p.vy += (p.ty - p.y) * RETURN_S;
    p.vx *= DAMP;
    p.vy *= DAMP;
    p.x  += p.vx;
    p.y  += p.vy;

    // Rotation from displacement
    const disp = Math.sqrt((p.x - p.tx) ** 2 + (p.y - p.ty) ** 2);
    const rot  = Math.min(disp * 0.035, 0.8);

    bgCtx.save();
    bgCtx.translate(p.x, p.y);
    bgCtx.rotate(rot);
    bgCtx.fillStyle = `rgba(${ACCENT},${p.alpha * 0.9})`;
    bgCtx.fillRect(-CELL * 0.38, -CELL * 0.38, CELL * 0.76, CELL * 0.76);
    bgCtx.restore();
  });

  requestAnimationFrame(tickCanvas);
}

function resizeCanvas() {
  bgW = bgCanvas.offsetWidth;
  bgH = bgCanvas.offsetHeight;
  bgCanvas.width  = bgW * devicePixelRatio;
  bgCanvas.height = bgH * devicePixelRatio;
  bgCtx.scale(devicePixelRatio, devicePixelRatio);
  buildBgDots(gridCfgs[0].spacing);
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

window.addEventListener('mousemove', e => {
  gsap.set(cursorEl, { x: e.clientX, y: e.clientY });
});

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
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
        cursorLabel.textContent = label;
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
        cursorLabel.textContent = '';
      });
    });
  });
}

window.addEventListener('mousedown', () => document.body.classList.add('cursor-active'));
window.addEventListener('mouseup',   () => document.body.classList.remove('cursor-active'));

// ══════════════════════════════════════════════════════════════
// LENIS SMOOTH SCROLL
// ══════════════════════════════════════════════════════════════
const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});
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
  if (i !== lastSection) {
    lastSection = i;
    setBgSection(i);
  }
}

navBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    const sceneEl = scenes[i];
    const offset  = sceneEl.offsetTop + (sceneEl.offsetHeight - window.innerHeight) * 0.12;
    lenis.scrollTo(offset, { duration: 1.6 });
  });
});

// Mouse parallax on active scene content
document.addEventListener('mousemove', e => {
  const nx = (e.clientX / window.innerWidth  - 0.5);
  const ny = (e.clientY / window.innerHeight - 0.5);
  document.querySelectorAll('.scene.active .scene-content').forEach(el => {
    gsap.to(el, { x: nx * 8, y: ny * 5, duration: 1.2, ease: 'power2.out' });
  });
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
    if (titleEl) {
      splitTitle = SplitText.create(titleEl, {
        type: 'lines', mask: 'lines', linesClass: 'split-line-wrap',
      });
    }
    if (eyebrow) gsap.set(eyebrow, { y: 16, opacity: 0 });

    ScrollTrigger.create({
      trigger: scene,
      start: 'top 80%',
      onEnter: () => {
        scene.classList.add('active');
        setActiveNav(i);
        if (eyebrow) gsap.to(eyebrow, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 });
        if (splitTitle) gsap.fromTo(splitTitle.lines,
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.12, delay: 0.2 });
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
        const progress = (i + self.progress) / scenes.length;
        gsap.set(navLineFill, { height: `${progress * 100}%` });
        if (self.progress > 0.05) setActiveNav(i);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
// CARD ANIMATIONS  (LOCKED — Ben approved exact behaviour)
// ══════════════════════════════════════════════════════════════
function initCardAnimations() {
  ScrollTrigger.create({
    trigger: '#work-grid', start: 'top 85%',
    onEnter: () => gsap.fromTo('.card',
      { y: 40, opacity: 0, rotation: 0.4 },
      { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: 'power3.out', stagger: 0.10 })
  });
  ScrollTrigger.create({
    trigger: '#lab-grid', start: 'top 85%',
    onEnter: () => gsap.fromTo('.lab-card',
      { y: 36, opacity: 0, rotation: 0.3 },
      { y: 0, opacity: 1, rotation: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 })
  });
  ScrollTrigger.create({
    trigger: '.about-right', start: 'top 80%',
    onEnter: () => {
      gsap.fromTo('.about-right', { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' });
      gsap.fromTo('.about-bio, .about-loc', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.15, delay: 0.25 });
      gsap.fromTo('.about-link', { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.5 });
    }
  });

  // Card lift + tilt
  document.querySelectorAll('.card, .lab-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -28, boxShadow: '0 12px 32px rgba(0,0,0,0.10)', duration: 0.45, ease: 'power3.out', overwrite: 'auto', zIndex: 2 });
    });
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const nx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const ny = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      gsap.to(card, { rotationY: nx * 4, rotationX: -ny * 3, transformPerspective: 900, duration: 0.3, ease: 'power2.out', overwrite: false });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, rotationX: 0, rotationY: 0, boxShadow: '0 0px 0px rgba(0,0,0,0)', duration: 0.55, ease: 'power3.out', overwrite: 'auto', zIndex: 1 });
    });
  });
}

// ══════════════════════════════════════════════════════════════
// CONTENT LOADING
// ══════════════════════════════════════════════════════════════
async function loadContent() {
  const res  = await fetch('./data/content.json');
  const data = await res.json();
  renderWork(data.work);
  renderLab(data.ailab);
  renderAbout(data.meta);
}

function renderWork(projects) {
  document.getElementById('work-grid').innerHTML = projects.map(p => `
    <a class="card" href="${p.link}">
      <div class="card-year">${p.year}</div>
      <div class="card-title">${p.title}</div>
      <div class="card-desc">${p.description}</div>
      <div class="card-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <span class="card-arrow">↗</span>
    </a>
  `).join('');
}

function renderLab(items) {
  document.getElementById('lab-grid').innerHTML = items.map(item => `
    <div class="lab-card" data-status="${item.status}">
      <div class="lab-status"><span class="status-dot"></span>${item.status}</div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">${item.description}</div>
      <div class="card-tags">
        ${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        <span class="tag">${item.year}</span>
      </div>
    </div>
  `).join('');
}

function renderAbout(meta) {
  document.getElementById('bio-text').textContent = meta.bio;
  document.getElementById('about-location').textContent = `📍 ${meta.location}`;
  const links = [];
  if (meta.links.github) links.push({ label: 'GitHub', href: meta.links.github });
  if (meta.links.email)  links.push({ label: 'Email',  href: `mailto:${meta.links.email}` });
  document.getElementById('about-links').innerHTML = links.map(l => `
    <a class="about-link" href="${l.href}" target="_blank" rel="noopener">
      <span>${l.label}</span><span class="about-link-arrow">↗</span>
    </a>
  `).join('');
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
