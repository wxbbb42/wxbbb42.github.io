// ─── State ────────────────────────────────────────────────────
const TOTAL = 4;
let current = 0;
let isAnimating = false;

// ─── Elements ─────────────────────────────────────────────────
const track   = document.getElementById('slides-track');
const curtain = document.getElementById('curtain');
const slides  = () => document.querySelectorAll('.slide');
const navBtns = () => document.querySelectorAll('.nav-btn');
const dots    = () => document.querySelectorAll('.footer-dot');

// ─── Navigate ─────────────────────────────────────────────────
function goTo(index, skipCurtain = false) {
  if (index === current || isAnimating) return;
  if (index < 0 || index >= TOTAL) return;
  isAnimating = true;

  const prev = current;
  current = index;

  if (skipCurtain) {
    applySlide(prev);
    isAnimating = false;
    return;
  }

  // Curtain in
  curtain.classList.remove('leaving');
  curtain.classList.add('entering');

  setTimeout(() => {
    applySlide(prev);

    // Curtain out
    curtain.classList.remove('entering');
    curtain.classList.add('leaving');

    setTimeout(() => {
      curtain.classList.remove('leaving');
      isAnimating = false;
    }, 420);
  }, 420);
}

function applySlide(prev) {
  // Move track
  track.style.transform = `translateX(-${current * 100}vw)`;

  // Update slides active class
  slides().forEach((s, i) => {
    s.classList.toggle('active', i === current);
  });

  // Nav buttons
  navBtns().forEach((b, i) => b.classList.toggle('active', i === current));

  // Progress bar
  const bar = document.querySelector('.nav-progress-bar');
  bar.style.width = `${((current + 1) / TOTAL) * 100}%`;

  // Dots
  dots().forEach((d, i) => d.classList.toggle('active', i === current));
}

// ─── Load & Render Content ────────────────────────────────────
async function loadContent() {
  const res = await fetch('./data/content.json');
  const data = await res.json();
  renderWork(data.work);
  renderLab(data.ailab);
  renderAbout(data.meta);
  // Re-apply active so new cards animate
  slides().forEach((s, i) => s.classList.toggle('active', i === current));
}

function renderWork(projects) {
  const grid = document.getElementById('work-grid');
  grid.innerHTML = projects.map(p => `
    <a class="card anim-item" href="${p.link}" data-id="${p.id}">
      <div class="card-year">${p.year}</div>
      <div class="card-title">${p.title}</div>
      <div class="card-desc">${p.description}</div>
      <div class="card-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <span class="card-arrow">↗</span>
    </a>
  `).join('');

  // 3D tilt
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);
  });
}

function renderLab(items) {
  const grid = document.getElementById('lab-grid');
  grid.innerHTML = items.map(item => `
    <div class="lab-card anim-item" data-status="${item.status}">
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
  const linksEl = document.getElementById('about-links');
  const links = [];
  if (meta.links.github) links.push({ label: 'GitHub', href: meta.links.github });
  if (meta.links.email)  links.push({ label: 'Email',  href: `mailto:${meta.links.email}` });
  linksEl.innerHTML = links.map(l => `
    <a class="about-link" href="${l.href}" target="_blank" rel="noopener">
      <span>${l.label}</span><span class="about-link-arrow">↗</span>
    </a>
  `).join('');
}

// ─── 3D Tilt ──────────────────────────────────────────────────
function handleTilt(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const rx = ((y - rect.height/2) / (rect.height/2)) * -5;
  const ry = ((x - rect.width/2)  / (rect.width/2))  *  5;
  card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
}
function resetTilt(e) { e.currentTarget.style.transform = ''; }

// ─── Footer Dots ──────────────────────────────────────────────
function renderDots() {
  const container = document.getElementById('footer-dots');
  container.innerHTML = Array.from({ length: TOTAL }, (_, i) =>
    `<div class="footer-dot${i === 0 ? ' active' : ''}" data-target="${i}"></div>`
  ).join('');
  container.querySelectorAll('.footer-dot').forEach(d => {
    d.addEventListener('click', () => goTo(+d.dataset.target));
  });
}

// ─── Keyboard & Wheel ─────────────────────────────────────────
let wheelCooldown = false;
window.addEventListener('wheel', (e) => {
  if (wheelCooldown) return;
  wheelCooldown = true;
  setTimeout(() => wheelCooldown = false, 900);
  if (e.deltaX > 40 || e.deltaY > 40)  goTo(current + 1);
  if (e.deltaX < -40 || e.deltaY < -40) goTo(current - 1);
}, { passive: true });

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goTo(current - 1);
});

// Touch swipe
let touchStartX = 0;
window.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
window.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 60) goTo(dx < 0 ? current + 1 : current - 1);
}, { passive: true });

// ─── Nav clicks ───────────────────────────────────────────────
document.querySelectorAll('[data-target]').forEach(el => {
  el.addEventListener('click', () => goTo(+el.dataset.target));
});

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderDots();

  // Set initial state
  slides().forEach((s, i) => s.classList.toggle('active', i === 0));
  document.querySelector('.nav-progress-bar').style.width = `${(1/TOTAL)*100}%`;

  await loadContent();
});
