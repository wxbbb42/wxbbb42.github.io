/* ─────────────────────────────────────────────────────────────
   app.js  —  Lenis + GSAP ScrollTrigger + SplitText + cursor
───────────────────────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger, SplitText);

// ─── Crosshair cursor ─────────────────────────────────────────
const cursorEl    = document.querySelector('.cursor');
const cursorLabel = document.getElementById('cursor-label');

let mx = window.innerWidth / 2, my = window.innerHeight / 2;

window.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  // cursor snaps directly — no lag, precision feel
  gsap.set(cursorEl, { x: mx, y: my });
});

// ─── Cursor hover binding (call after dynamic content renders) ─
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

// ─── Lenis smooth scroll ───────────────────────────────────────
const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

// Tie Lenis to GSAP ticker
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Sync Lenis scroll → ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

// ─── Background dot-grid canvas ────────────────────────────────
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');

// Dot config per section (0=Work, 1=Lab, 2=About)
const sectionConfigs = [
  { spacing: 28, radius: 1.2, color: '26,26,24' },   // Work: dense grid
  { spacing: 40, radius: 1.5, color: '193,122,58' },  // Lab: sparser, amber
  { spacing: 22, radius: 1.0, color: '26,26,24' },    // About: tight fine grid
];

let dots = [];
let bgW, bgH;
let mouse = { x: -999, y: -999 };
let currentConfig = { ...sectionConfigs[0] };
let targetConfig  = { ...sectionConfigs[0] };

function buildDots(cfg) {
  dots = [];
  const cols = Math.ceil(bgW / cfg.spacing) + 1;
  const rows = Math.ceil(bgH / cfg.spacing) + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({
        ox: c * cfg.spacing,  // origin x
        oy: r * cfg.spacing,  // origin y
        x:  c * cfg.spacing,  // current x
        y:  r * cfg.spacing,  // current y
        vx: 0, vy: 0,
      });
    }
  }
}

function resizeCanvas() {
  bgW = bgCanvas.offsetWidth;
  bgH = bgCanvas.offsetHeight;
  bgCanvas.width  = bgW * devicePixelRatio;
  bgCanvas.height = bgH * devicePixelRatio;
  bgCtx.scale(devicePixelRatio, devicePixelRatio);
  buildDots(currentConfig);
}

const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 0.18;
const RETURN_STRENGTH = 0.06;
const DAMPING = 0.82;

function tickDots() {
  bgCtx.clearRect(0, 0, bgW, bgH);

  // Lerp config values
  currentConfig.spacing  += (targetConfig.spacing  - currentConfig.spacing)  * 0.03;
  currentConfig.radius   += (targetConfig.radius   - currentConfig.radius)   * 0.03;

  dots.forEach(d => {
    // Mouse repulsion
    const dx = d.x - mouse.x;
    const dy = d.y - mouse.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < REPEL_RADIUS && dist > 0) {
      const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
      d.vx += (dx / dist) * force * REPEL_RADIUS;
      d.vy += (dy / dist) * force * REPEL_RADIUS;
    }

    // Spring back to origin
    d.vx += (d.ox - d.x) * RETURN_STRENGTH;
    d.vy += (d.oy - d.y) * RETURN_STRENGTH;

    // Dampen
    d.vx *= DAMPING;
    d.vy *= DAMPING;

    d.x += d.vx;
    d.y += d.vy;

    // Draw dot
    bgCtx.beginPath();
    bgCtx.arc(d.x, d.y, currentConfig.radius, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(${currentConfig.color},0.35)`;
    bgCtx.fill();
  });

  requestAnimationFrame(tickDots);
}

// Track mouse relative to canvas
window.addEventListener('mousemove', e => {
  const rect = bgCanvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
window.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

// Switch dot config when section changes
function setBgSection(i) {
  const cfg = sectionConfigs[Math.min(i, sectionConfigs.length - 1)];
  targetConfig = { ...cfg };
  // Rebuild grid at new spacing after a beat
  setTimeout(() => {
    buildDots(targetConfig);
  }, 600);
}

window.addEventListener('resize', resizeCanvas);

// ─── Nav & progress bar ───────────────────────────────────────
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

// Nav click → scroll to scene
navBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    const sceneEl = scenes[i];
    const offset  = sceneEl.offsetTop + (sceneEl.offsetHeight - window.innerHeight) * 0.12;
    lenis.scrollTo(offset, { duration: 1.6 });
  });
});

// ─── Mouse parallax on scene content only ────────────────────
document.addEventListener('mousemove', e => {
  const nx = (e.clientX / window.innerWidth  - 0.5);
  const ny = (e.clientY / window.innerHeight - 0.5);
  document.querySelectorAll('.scene.active .scene-content').forEach(el => {
    gsap.to(el, { x: nx * 8, y: ny * 5, duration: 1.2, ease: 'power2.out' });
  });
});

// ─── Per-scene ScrollTrigger animations ──────────────────────
function initSceneAnimations() {
  scenes.forEach((scene, i) => {
    const content  = scene.querySelector('.scene-content');
    const eyebrow  = scene.querySelector('.scene-eyebrow');
    const titleEl  = scene.querySelector('.scene-title, .about-name');
    const note     = scene.querySelector('.scene-note');

    // ── 1. SplitText on heading
    let splitTitle;
    if (titleEl) {
      splitTitle = SplitText.create(titleEl, {
        type: 'lines',
        mask: 'lines',        // clip overflow per-line for reveal
        linesClass: 'split-line-wrap',
      });
    }

    // ── 3. Eyebrow
    if (eyebrow) {
      gsap.set(eyebrow, { y: 16, opacity: 0 });
    }

    // ── 4. ScrollTrigger: enter
    ScrollTrigger.create({
      trigger: scene,
      start: 'top 80%',
      onEnter: () => {
        scene.classList.add('active');
        setActiveNav(i);
        // eyebrow fade
        if (eyebrow) gsap.to(eyebrow, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 });
        // title lines slide up
        if (splitTitle) {
          gsap.fromTo(splitTitle.lines,
            { y: '100%', opacity: 0 },
            { y: '0%', opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.12, delay: 0.2 }
          );
        }
        // note
        if (note) gsap.fromTo(note, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.55 });
      },
      onLeaveBack: () => {
        scene.classList.remove('active');
        if (eyebrow) gsap.to(eyebrow, { y: 16, opacity: 0, duration: 0.4 });
        if (splitTitle) gsap.to(splitTitle.lines, { y: '100%', opacity: 0, duration: 0.4, stagger: 0.06 });
        if (note) gsap.to(note, { y: 14, opacity: 0, duration: 0.3 });
      }
    });

    // ── 5. Nav progress via continuous scrub
    ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => {
        // weight each scene's contribution equally
        const progress = (i + self.progress) / scenes.length;
        gsap.set(navLineFill, { height: `${progress * 100}%` });
        if (self.progress > 0.05) setActiveNav(i);
      }
    });
  });
}

// ─── Card animations ──────────────────────────────────────────
function initCardAnimations() {
  // Work cards: staggered float-up
  ScrollTrigger.create({
    trigger: '#work-grid',
    start: 'top 85%',
    onEnter: () => {
      gsap.fromTo('.card',
        { y: 40, opacity: 0, rotation: 0.4 },
        { y: 0,  opacity: 1, rotation: 0, duration: 0.8, ease: 'power3.out', stagger: 0.10 }
      );
    }
  });

  // Lab cards
  ScrollTrigger.create({
    trigger: '#lab-grid',
    start: 'top 85%',
    onEnter: () => {
      gsap.fromTo('.lab-card',
        { y: 36, opacity: 0, rotation: 0.3 },
        { y: 0,  opacity: 1, rotation: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }
      );
    }
  });

  // About right column
  ScrollTrigger.create({
    trigger: '.about-right',
    start: 'top 80%',
    onEnter: () => {
      gsap.fromTo('.about-right',
        { x: 30, opacity: 0 },
        { x: 0,  opacity: 1, duration: 1.0, ease: 'power3.out' }
      );
      gsap.fromTo('.about-bio, .about-loc',
        { y: 20, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.15, delay: 0.25 }
      );
      gsap.fromTo('.about-link',
        { x: -10, opacity: 0 },
        { x: 0,   opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.5 }
      );
    }
  });

  // Cards: GSAP controls lift + shadow + tilt
  document.querySelectorAll('.card, .lab-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -28,
        boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
        zIndex: 2,
      });
    });

    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const nx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2); // -1 to 1
      const ny = (e.clientY - r.top  - r.height / 2) / (r.height / 2); // -1 to 1
      gsap.to(card, {
        rotationY:  nx * 4,   // ±4° horizontal
        rotationX: -ny * 3,   // ±3° vertical
        transformPerspective: 900,
        duration: 0.3,
        ease: 'power2.out',
        // don't overwrite y/shadow — only touch rotation
        overwrite: false,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        rotationX: 0,
        rotationY: 0,
        boxShadow: '0 0px 0px rgba(0,0,0,0)',
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto',
        zIndex: 1,
      });
    });
  });
}

// ─── Load Content ─────────────────────────────────────────────
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

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Init canvas background
  resizeCanvas();
  tickDots();

  await loadContent();
  bindCursorHovers(); // bind after cards are in DOM

  // Small delay so fonts + layout are settled before GSAP measures
  await new Promise(r => setTimeout(r, 120));

  initSceneAnimations();
  initCardAnimations();

  ScrollTrigger.refresh();
});
