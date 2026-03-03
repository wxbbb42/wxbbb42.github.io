// ─── Scenes ────────────────────────────────────────────────────
const scenes = [...document.querySelectorAll('.scene')];
const navBtns = [...document.querySelectorAll('.nav-btn')];
const navLineFill = document.querySelector('.nav-line-fill');
const TOTAL = scenes.length;
let activeScene = -1;

// ─── Scroll driver ─────────────────────────────────────────────
function onScroll() {
  const scrollY = window.scrollY;
  const winH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;

  // Progress bar (0→1 across full page)
  const totalScroll = docH - winH;
  const progress = Math.min(1, scrollY / totalScroll);
  navLineFill.style.height = (progress * 100) + '%';

  scenes.forEach((scene, i) => {
    const rect = scene.getBoundingClientRect();
    const sceneH = scene.offsetHeight;
    const scrollInScene = -rect.top; // how far we've scrolled into this scene
    const sceneProgress = scrollInScene / (sceneH - winH); // 0 → 1

    const isPresent  = sceneProgress >= 0 && sceneProgress <= 1;
    const isEntering = sceneProgress > -0.15 && sceneProgress < 0.15;
    const isLeaving  = sceneProgress > 0.85;

    scene.classList.toggle('present',  isPresent);
    scene.classList.toggle('entering', isEntering && !isLeaving);
    scene.classList.toggle('leaving',  isLeaving);

    // Reveal data-enter elements when scene is sufficiently entered
    if (sceneProgress > -0.05) {
      scene.querySelectorAll('[data-enter]').forEach(el => el.classList.add('visible'));
    } else {
      scene.querySelectorAll('[data-enter]').forEach(el => el.classList.remove('visible'));
    }

    // Reveal cards with stagger when entering
    if (sceneProgress > -0.02) {
      scene.querySelectorAll('.card, .lab-card').forEach((card, ci) => {
        setTimeout(() => card.classList.add('visible'), ci * 90);
      });
    } else {
      scene.querySelectorAll('.card, .lab-card').forEach(c => c.classList.remove('visible'));
    }

    // Active nav
    if (isPresent) {
      if (activeScene !== i) {
        activeScene = i;
        navBtns.forEach((b, bi) => b.classList.toggle('active', bi === i));
      }
    }
  });
}

// ─── Nav click → smooth scroll to scene ───────────────────────
navBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    const scene = scenes[i];
    // Scroll to slightly inside the scene (10% of scroll space)
    const sceneTop = scene.offsetTop;
    const sceneH   = scene.offsetHeight;
    const winH     = window.innerHeight;
    const target   = sceneTop + (sceneH - winH) * 0.12;
    window.scrollTo({ top: target, behavior: 'smooth' });
  });
});

// ─── Load content ──────────────────────────────────────────────
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

  // 3D tilt on cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top  - r.height/2) / (r.height/2)) * -4;
      const ry = ((e.clientX - r.left - r.width/2)  / (r.width/2))  *  4;
      card.style.transform = `translateY(-6px) rotate(-0.4deg) perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
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

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
});
