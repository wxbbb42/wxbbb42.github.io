// ─── State ────────────────────────────────────────────────────
const TOTAL = 3;
let current = 0;
let isAnimating = false;

// ─── Slide elements ────────────────────────────────────────────
const slideEls = () => [...document.querySelectorAll('.slide')];

// ─── Navigate ─────────────────────────────────────────────────
function goTo(next) {
  if (next === current || isAnimating) return;
  if (next < 0 || next >= TOTAL) return;

  isAnimating = true;
  const prev = current;
  const dir = next > prev ? 1 : -1;   // 1 = going right, -1 = going left
  current = next;

  const slides = slideEls();
  const leaving = slides[prev];
  const entering = slides[next];

  // 1. Position the entering slide off-screen (no transition yet)
  entering.style.transition = 'none';
  entering.querySelector('.slide-bg').style.transition = 'none';
  entering.querySelector('.slide-content').style.transition = 'none';

  if (dir > 0) {
    entering.classList.add('enter-from-right');
  } else {
    entering.classList.add('enter-from-left');
  }
  entering.classList.remove('active', 'slide-visible');

  // 2. Force reflow
  entering.getBoundingClientRect();

  // 3. Restore transitions
  entering.style.transition = '';
  entering.querySelector('.slide-bg').style.transition = '';
  entering.querySelector('.slide-content').style.transition = '';

  // 4. Animate leaving slide out
  leaving.classList.remove('active', 'slide-visible');
  if (dir > 0) {
    leaving.classList.add('leave-to-left');
  } else {
    leaving.classList.add('leave-to-right');
  }

  // 5. Animate entering slide in
  requestAnimationFrame(() => {
    entering.classList.remove('enter-from-right', 'enter-from-left');
    entering.classList.add('active');

    // content enters slightly after bg
    setTimeout(() => {
      entering.classList.add('slide-visible');
    }, 80);
  });

  // 6. Cleanup after transition
  const DUR = 800;
  setTimeout(() => {
    leaving.classList.remove('leave-to-left', 'leave-to-right');
    isAnimating = false;
    updateUI();
  }, DUR);

  updateUI();
}

function updateUI() {
  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach((b, i) => {
    b.classList.toggle('active', i === current);
  });

  // Progress bar
  document.querySelector('.nav-progress-bar').style.width =
    `${((current + 1) / TOTAL) * 100}%`;

  // Dots
  document.querySelectorAll('.footer-dot').forEach((d, i) => {
    d.classList.toggle('active', i === current);
  });

  // Nav dark mode (about slide)
  document.querySelector('.nav').classList.toggle('dark', current === 2);
  document.querySelector('.footer').classList.toggle('dark', current === 2);
}

// ─── Load Content ──────────────────────────────────────────────
async function loadContent() {
  const res = await fetch('./data/content.json');
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

  // Decorative rings behind the grid
  const slide = document.getElementById('slide-work');
  const rings = document.createElement('div');
  rings.className = 'deco-rings';
  rings.innerHTML = `
    <div class="deco-ring ring-1"></div>
    <div class="deco-ring ring-2"></div>
    <div class="deco-ring ring-3"></div>
  `;
  slide.appendChild(rings);

  // 3D tilt on cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top  - r.height/2) / (r.height/2)) * -5;
      const ry = ((e.clientX - r.left - r.width/2)  / (r.width/2))  *  5;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
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

// ─── Footer dots ───────────────────────────────────────────────
function renderDots() {
  const c = document.getElementById('footer-dots');
  c.innerHTML = Array.from({length: TOTAL}, (_, i) =>
    `<div class="footer-dot${i===0?' active':''}" data-target="${i}"></div>`
  ).join('');
  c.querySelectorAll('.footer-dot').forEach(d => {
    d.addEventListener('click', () => goTo(+d.dataset.target));
  });
}

// ─── Input handling ────────────────────────────────────────────
// Wheel / trackpad — robust cooldown-based
let wheelTimer = null;
let wheelAcc = 0;
let wheelLocked = false;

function onWheel(e) {
  if (wheelLocked) return;
  wheelAcc += e.deltaX + e.deltaY;
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    if (Math.abs(wheelAcc) > 20) {
      wheelLocked = true;
      goTo(wheelAcc > 0 ? current + 1 : current - 1);
      setTimeout(() => { wheelLocked = false; }, 900);
    }
    wheelAcc = 0;
  }, 50);
}

window.addEventListener('wheel', onWheel, { passive: false });

// Keyboard
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  goTo(current + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')    goTo(current - 1);
});

// Touch
let tx = 0, ty = 0;
window.addEventListener('touchstart', e => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    goTo(dx < 0 ? current + 1 : current - 1);
  } else {
    goTo(dy < 0 ? current + 1 : current - 1);
  }
}, { passive: true });

// Nav buttons
document.querySelectorAll('.nav-btn').forEach(b => {
  b.addEventListener('click', () => goTo(+b.dataset.target));
});

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderDots();

  // Set initial slide visible
  const first = slideEls()[0];
  first.classList.add('active');
  setTimeout(() => first.classList.add('slide-visible'), 100);

  document.querySelector('.nav-progress-bar').style.width = `${(1/TOTAL)*100}%`;

  await loadContent();
});
