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

// Context labels per element type
const labelMap = [
  { selector: '.card',      label: 'View ↗' },
  { selector: '.lab-card',  label: 'View ↗' },
  { selector: '.nav-btn',   label: 'Go' },
  { selector: '.nav-logo',  label: 'Top' },
  { selector: '.about-link',label: 'Open ↗' },
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

// ─── Nav & progress bar ───────────────────────────────────────
const navBtns    = [...document.querySelectorAll('.nav-btn')];
const navLineFill = document.querySelector('.nav-line-fill');
const scenes     = [...document.querySelectorAll('.scene')];

function setActiveNav(i) {
  navBtns.forEach((b, bi) => b.classList.toggle('active', bi === i));
}

// Nav click → scroll to scene
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
  document.querySelectorAll('.scene-wordmark').forEach(el => {
    gsap.to(el, { x: nx * 18, y: ny * 10, duration: 1.2, ease: 'power2.out' });
  });
  document.querySelectorAll('.scene.active .scene-content').forEach(el => {
    gsap.to(el, { x: nx * 8, y: ny * 5, duration: 1.2, ease: 'power2.out' });
  });
});

// ─── Per-scene ScrollTrigger animations ──────────────────────
function initSceneAnimations() {
  scenes.forEach((scene, i) => {
    const wordmark = scene.querySelector('.scene-wordmark');
    const content  = scene.querySelector('.scene-content');
    const eyebrow  = scene.querySelector('.scene-eyebrow');
    const titleEl  = scene.querySelector('.scene-title, .about-name');
    const note     = scene.querySelector('.scene-note');

    // ── 1. Wordmark: parallax slide in on enter, slide out on leave
    const tlWord = gsap.timeline({ paused: true });
    tlWord.fromTo(wordmark,
      { x: 80, opacity: 0 },
      { x: 0,  opacity: 1, duration: 1.2, ease: 'power3.out' }
    );

    // ── 2. SplitText on heading
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
        // wordmark in
        tlWord.play();
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
        // wordmark out (reverse)
        tlWord.reverse();
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

  // Card 3D tilt on hover
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top  - r.height/2) / (r.height/2)) * -5;
      const ry = ((e.clientX - r.left - r.width/2)  / (r.width/2))  *  5;
      gsap.to(card, {
        y: -7, rotation: -0.4,
        rotationX: rx, rotationY: ry,
        transformPerspective: 700,
        duration: 0.4, ease: 'power2.out',
        overwrite: 'auto'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, rotation: 0, rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    });
  });

  // Lab card hover
  document.querySelectorAll('.lab-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -5, rotation: -0.3, duration: 0.35, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, rotation: 0, duration: 0.5, ease: 'power3.out' });
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
  await loadContent();

  // Small delay so fonts + layout are settled before GSAP measures
  await new Promise(r => setTimeout(r, 120));

  initSceneAnimations();
  initCardAnimations();

  ScrollTrigger.refresh();
});
