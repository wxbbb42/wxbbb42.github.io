/* ─────────────────────────────────────────────────────────────
   app.js  —  Lenis + GSAP + SplitText + cursor + Flow Field canvas
───────────────────────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger, SplitText);

// ══════════════════════════════════════════════════════════════
// PERLIN NOISE (lightweight implementation)
// ══════════════════════════════════════════════════════════════
const P = (() => {
  const perm = new Uint8Array(512);
  const p256 = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p256[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p256[i], p256[j]] = [p256[j], p256[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p256[i & 255];

  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp  = (a, b, t) => a + t * (b - a);
  const grad  = (h, x, y) => {
    const g = h & 3;
    const u = g < 2 ? x : y, v = g < 2 ? y : x;
    return (g & 1 ? -u : u) + (g & 2 ? -v : v);
  };

  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(
      lerp(grad(perm[a],   x,   y), grad(perm[b],   x-1, y),   u),
      lerp(grad(perm[a+1], x,   y-1), grad(perm[b+1], x-1, y-1), u),
      v
    );
  };
})();

// ══════════════════════════════════════════════════════════════
// FLOW FIELD CANVAS
// ══════════════════════════════════════════════════════════════
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');
let bgW, bgH;
const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, px: -9999, py: -9999 };

// Per-section flow field configs
const SECTION_CFGS = [
  // Work: slow elegant spiral, dark ink trails
  {
    particleCount: 320,
    speed: 1.4,
    fieldScale: 0.0018,
    angleOffset: 0,
    angleMultiplier: Math.PI * 2.5,
    zStep: 0.0004,
    trailAlpha: 0.03,
    particleAlpha: 0.55,
    color: '26,26,24',
    lineWidth: 0.8,
    mouseInfluence: 120,
  },
  // Lab: faster turbulent flow, amber
  {
    particleCount: 280,
    speed: 2.0,
    fieldScale: 0.0025,
    angleOffset: Math.PI * 0.5,
    angleMultiplier: Math.PI * 3.5,
    zStep: 0.0007,
    trailAlpha: 0.025,
    particleAlpha: 0.5,
    color: '193,122,58',
    lineWidth: 0.7,
    mouseInfluence: 150,
  },
  // About: fine, calm, horizontal drift
  {
    particleCount: 260,
    speed: 0.9,
    fieldScale: 0.0013,
    angleOffset: Math.PI * 0.1,
    angleMultiplier: Math.PI * 1.8,
    zStep: 0.0002,
    trailAlpha: 0.035,
    particleAlpha: 0.45,
    color: '26,26,24',
    lineWidth: 0.6,
    mouseInfluence: 100,
  },
];

let cfg = { ...SECTION_CFGS[0] };
let tgtCfg = { ...SECTION_CFGS[0] };
let particles = [];
let zOff = 0;
let activeSection = 0;
let transitioning = false;

class Particle {
  constructor() { this.reset(true); }

  reset(random = false) {
    this.x  = random ? Math.random() * bgW : (Math.random() < 0.5 ? 0 : bgW);
    this.y  = random ? Math.random() * bgH : Math.random() * bgH;
    this.px = this.x;
    this.py = this.y;
    this.life    = Math.random() * 180 + 60;
    this.maxLife = this.life;
    this.speed   = cfg.speed * (0.6 + Math.random() * 0.8);
  }

  update() {
    this.px = this.x;
    this.py = this.y;

    // Flow field angle
    const nx    = this.x * cfg.fieldScale;
    const ny    = this.y * cfg.fieldScale;
    const noise = P(nx, ny + zOff);
    let angle   = noise * cfg.angleMultiplier + cfg.angleOffset;

    // Mouse vortex: nearby particles swirl around cursor
    const mdx  = this.x - mouse.x;
    const mdy  = this.y - mouse.y;
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
    if (mdist < cfg.mouseInfluence && mdist > 1) {
      const pull   = (1 - mdist / cfg.mouseInfluence) * 2.2;
      const vortex = Math.atan2(mdy, mdx) + Math.PI * 0.5;
      angle = angle + (vortex - angle) * pull * 0.6;
      // Also push away slightly
      this.x += (mdx / mdist) * pull * 0.8;
      this.y += (mdy / mdist) * pull * 0.8;
    }

    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;
    this.life--;

    if (this.life <= 0 || this.x < -10 || this.x > bgW + 10 || this.y < -10 || this.y > bgH + 10) {
      this.reset();
    }
  }

  draw() {
    const lifeRatio = this.life / this.maxLife;
    const a = Math.min(lifeRatio * 3, 1) * cfg.particleAlpha;
    if (a < 0.01) return;

    bgCtx.beginPath();
    bgCtx.moveTo(this.px, this.py);
    bgCtx.lineTo(this.x, this.y);
    bgCtx.strokeStyle = `rgba(${cfg.color},${a})`;
    bgCtx.lineWidth   = cfg.lineWidth;
    bgCtx.stroke();
  }
}

function buildParticles(count) {
  particles = Array.from({ length: count }, () => new Particle());
}

function resizeCanvas() {
  bgW = bgCanvas.offsetWidth;
  bgH = bgCanvas.offsetHeight;
  bgCanvas.width  = bgW * devicePixelRatio;
  bgCanvas.height = bgH * devicePixelRatio;
  bgCtx.scale(devicePixelRatio, devicePixelRatio);
  bgCtx.fillStyle = 'rgba(247,245,240,1)';
  bgCtx.fillRect(0, 0, bgW, bgH);
  buildParticles(cfg.particleCount);
}

function lerpCfg(key, speed = 0.03) {
  cfg[key] += (tgtCfg[key] - cfg[key]) * speed;
}

function tickFlow() {
  // Fade trail
  bgCtx.fillStyle = `rgba(247,245,240,${cfg.trailAlpha})`;
  bgCtx.fillRect(0, 0, bgW, bgH);

  // Lerp numeric config values
  ['speed','fieldScale','angleOffset','angleMultiplier','zStep',
   'trailAlpha','particleAlpha','lineWidth','mouseInfluence'].forEach(k => lerpCfg(k, 0.025));

  zOff += cfg.zStep;

  // Mouse velocity
  mouse.vx = mouse.x - mouse.px;
  mouse.vy = mouse.y - mouse.py;
  mouse.px = mouse.x;
  mouse.py = mouse.y;

  particles.forEach(p => { p.update(); p.draw(); });

  requestAnimationFrame(tickFlow);
}

window.addEventListener('mousemove', e => {
  const rect = bgCanvas.getBoundingClientRect();
  mouse.px = mouse.x;
  mouse.py = mouse.y;
  mouse.x  = e.clientX - rect.left;
  mouse.y  = e.clientY - rect.top;
});
window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
window.addEventListener('resize', () => { resizeCanvas(); });

function setBgSection(i) {
  if (i === activeSection && !transitioning) return;
  activeSection = i;
  tgtCfg = { ...SECTION_CFGS[Math.min(i, SECTION_CFGS.length - 1)] };
}

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
// LENIS
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
        type: 'lines',
        linesClass: 'split-line-wrap',
      });
    }
    if (eyebrow) gsap.set(eyebrow, { y: 16, opacity: 0 });

    ScrollTrigger.create({
      trigger: scene, start: 'top 80%',
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
// CARD ANIMATIONS  (LOCKED — Ben approved)
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
// CONTENT
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
  tickFlow();

  await loadContent();
  bindCursorHovers();

  await new Promise(r => setTimeout(r, 120));
  initSceneAnimations();
  initCardAnimations();
  ScrollTrigger.refresh();
});
