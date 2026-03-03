/* ─────────────────────────────────────────────────────────────
   app.js  —  Lenis + GSAP ScrollTrigger + SplitText + cursor + grid canvas
───────────────────────────────────────────────────────────── */

gsap.registerPlugin(ScrollTrigger, SplitText);

// ─── Background canvas: grid lines + square dots ───────────────
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');

const sectionConfigs = [
  { spacing: 32, size: 2.5, color: '26,26,24',   alpha: 0.18, lineAlpha: 0.06 },
  { spacing: 44, size: 3.5, color: '193,122,58',  alpha: 0.20, lineAlpha: 0.05 },
  { spacing: 26, size: 2.0, color: '26,26,24',   alpha: 0.14, lineAlpha: 0.07 },
];

let dots = [];
let bgW, bgH;
const mouse = { x: -9999, y: -9999 };
let curCfg = { ...sectionConfigs[0] };
let tgtCfg = { ...sectionConfigs[0] };

function buildDots(spacing) {
  dots = [];
  const cols = Math.ceil(bgW / spacing) + 2;
  const rows = Math.ceil(bgH / spacing) + 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = c * spacing;
      const oy = r * spacing;
      dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 });
    }
  }
}

function resizeCanvas() {
  bgW = bgCanvas.offsetWidth;
  bgH = bgCanvas.offsetHeight;
  bgCanvas.width  = bgW * devicePixelRatio;
  bgCanvas.height = bgH * devicePixelRatio;
  bgCtx.scale(devicePixelRatio, devicePixelRatio);
  buildDots(curCfg.spacing);
}

const REPEL_R = 110;
const REPEL_F = 0.20;
const RETURN  = 0.055;
const DAMP    = 0.80;

function tickDots() {
  bgCtx.clearRect(0, 0, bgW, bgH);

  // Lerp config
  curCfg.spacing   += (tgtCfg.spacing   - curCfg.spacing)   * 0.025;
  curCfg.size      += (tgtCfg.size      - curCfg.size)       * 0.04;
  curCfg.alpha     += (tgtCfg.alpha     - curCfg.alpha)       * 0.04;
  curCfg.lineAlpha += (tgtCfg.lineAlpha - curCfg.lineAlpha)   * 0.04;

  // Grid lines
  bgCtx.strokeStyle = `rgba(${curCfg.color},${curCfg.lineAlpha})`;
  bgCtx.lineWidth = 0.5;
  const sp = curCfg.spacing;
  for (let x = 0; x < bgW + sp; x += sp) {
    bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, bgH); bgCtx.stroke();
  }
  for (let y = 0; y < bgH + sp; y += sp) {
    bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgW, y); bgCtx.stroke();
  }

  // Square dots at intersections
  const half = curCfg.size / 2;
  dots.forEach(d => {
    const dx   = d.x - mouse.x;
    const dy   = d.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < REPEL_R && dist > 0) {
      const force = (1 - dist / REPEL_R) * REPEL_F;
      d.vx += (dx / dist) * force * REPEL_R;
      d.vy += (dy / dist) * force * REPEL_R;
    }

    d.vx += (d.ox - d.x) * RETURN;
    d.vy += (d.oy - d.y) * RETURN;
    d.vx *= DAMP;
    d.vy *= DAMP;
    d.x  += d.vx;
    d.y  += d.vy;

    // Rotate square proportional to displacement
    const disp = Math.sqrt((d.x - d.ox) ** 2 + (d.y - d.oy) ** 2);
    const rot  = Math.min(disp * 0.04, 0.7);

    bgCtx.save();
    bgCtx.translate(d.x, d.y);
    bgCtx.rotate(rot);
    bgCtx.fillStyle = `rgba(${curCfg.color},${curCfg.alpha})`;
    bgCtx.fillRect(-half, -half, curCfg.size, curCfg.size);
    bgCtx.restore();
  });

  requestAnimationFrame(tickDots);
}

window.addEventListener('mousemove', e => {
  const rect = bgCanvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

function setBgSection(i) {
  tgtCfg = { ...sectionConfigs[Math.min(i, sectionConfigs.length - 1)] };
  setTimeout(() => buildDots(tgtCfg.spacing), 500);
}

window.addEventListener('resize', resizeCanvas);

// ─── Crosshair cursor ──────────────────────────────────────────
const cursorEl    = document.querySelector('.cursor');
const cursorLabel = document.getElementById('cursor-label');

let mx = window.innerWidth / 2, my = window.innerHeight / 2;

window.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  gsap.set(cursorEl, { x: mx, y: my });
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

// ─── Lenis smooth scroll ───────────────────────────────────────
const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

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

navBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    const sceneEl = scenes[i];
    const offset  = sceneEl.offsetTop + (sceneEl.offsetHeight - window.innerHeight) * 0.12;
    lenis.scrollTo(offset, { duration: 1.6 });
  });
});

// ─── Mouse parallax on scene content ─────────────────────────
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
    const eyebrow = scene.querySelector('.scene-eyebrow');
    const titleEl = scene.querySelector('.scene-title, .about-name');
    const note    = scene.querySelector('.scene-note');

    let splitTitle;
    if (titleEl) {
      splitTitle = SplitText.create(titleEl, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line-wrap',
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
        if (splitTitle) {
          gsap.fromTo(splitTitle.lines,
            { y: '100%', opacity: 0 },
            { y: '0%', opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.12, delay: 0.2 }
          );
        }
        if (note) gsap.fromTo(note, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.55 });
      },
      onLeaveBack: () => {
        scene.classList.remove('active');
        if (eyebrow) gsap.to(eyebrow, { y: 16, opacity: 0, duration: 0.4 });
        if (splitTitle) gsap.to(splitTitle.lines, { y: '100%', opacity: 0, duration: 0.4, stagger: 0.06 });
        if (note) gsap.to(note, { y: 14, opacity: 0, duration: 0.3 });
      }
    });

    // Progress line scrub
    ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => {
        const progress = (i + self.progress) / scenes.length;
        gsap.set(navLineFill, { height: `${progress * 100}%` });
        if (self.progress > 0.05) setActiveNav(i);
      }
    });
  });
}

// ─── Card animations ──────────────────────────────────────────
function initCardAnimations() {
  ScrollTrigger.create({
    trigger: '#work-grid',
    start: 'top 85%',
    onEnter: () => {
      gsap.fromTo('.card',
        { y: 40, opacity: 0, rotation: 0.4 },
        { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: 'power3.out', stagger: 0.10 }
      );
    }
  });

  ScrollTrigger.create({
    trigger: '#lab-grid',
    start: 'top 85%',
    onEnter: () => {
      gsap.fromTo('.lab-card',
        { y: 36, opacity: 0, rotation: 0.3 },
        { y: 0, opacity: 1, rotation: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }
      );
    }
  });

  ScrollTrigger.create({
    trigger: '.about-right',
    start: 'top 80%',
    onEnter: () => {
      gsap.fromTo('.about-right',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' }
      );
      gsap.fromTo('.about-bio, .about-loc',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.15, delay: 0.25 }
      );
      gsap.fromTo('.about-link',
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.5 }
      );
    }
  });

  // Card lift + tilt (LOCKED — Ben approved this exact behaviour)
  document.querySelectorAll('.card, .lab-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -28,
        boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
        duration: 0.45, ease: 'power3.out', overwrite: 'auto', zIndex: 2,
      });
    });
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const nx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const ny = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      gsap.to(card, {
        rotationY: nx * 4, rotationX: -ny * 3,
        transformPerspective: 900,
        duration: 0.3, ease: 'power2.out', overwrite: false,
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0, rotationX: 0, rotationY: 0,
        boxShadow: '0 0px 0px rgba(0,0,0,0)',
        duration: 0.55, ease: 'power3.out', overwrite: 'auto', zIndex: 1,
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
  resizeCanvas();
  tickDots();

  await loadContent();
  bindCursorHovers();

  await new Promise(r => setTimeout(r, 120));
  initSceneAnimations();
  initCardAnimations();
  ScrollTrigger.refresh();
});
