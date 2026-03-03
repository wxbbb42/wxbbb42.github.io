// ─── Load content and render ────────────────────────────────────
async function loadContent() {
  const res = await fetch('./data/content.json');
  const data = await res.json();
  renderWork(data.work);
  renderLab(data.ailab);
  renderAbout(data.meta);
}

// ─── Work Cards ─────────────────────────────────────────────────
function renderWork(projects) {
  const grid = document.getElementById('work-grid');
  grid.innerHTML = projects.map(p => `
    <a class="card reveal-up" href="${p.link}" data-id="${p.id}">
      <div class="card-year">${p.year}</div>
      <div class="card-title">${p.title}</div>
      <div class="card-desc">${p.description}</div>
      <div class="card-tags">
        ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <span class="card-arrow">↗</span>
    </a>
  `).join('');

  // 3D tilt on cards
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', handleTilt);
    card.addEventListener('mouseleave', resetTilt);
  });

  observeReveal();
}

// ─── Lab Cards ──────────────────────────────────────────────────
function renderLab(items) {
  const grid = document.getElementById('lab-grid');
  grid.innerHTML = items.map(item => `
    <div class="lab-card reveal-up" data-status="${item.status}" data-id="${item.id}">
      <div class="lab-status">
        <span class="status-dot"></span>
        ${item.status}
      </div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">${item.description}</div>
      <div class="card-tags">
        ${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        <span class="tag">${item.year}</span>
      </div>
    </div>
  `).join('');

  observeReveal();
}

// ─── About ──────────────────────────────────────────────────────
function renderAbout(meta) {
  document.getElementById('bio-text').textContent = meta.bio;
  document.getElementById('about-location').textContent = `📍 ${meta.location}`;

  const linksEl = document.getElementById('about-links');
  const links = [];
  if (meta.links.github) links.push({ label: 'GitHub', href: meta.links.github });
  if (meta.links.email)  links.push({ label: 'Email',  href: `mailto:${meta.links.email}` });

  linksEl.innerHTML = links.map(l => `
    <a class="about-link" href="${l.href}" target="_blank" rel="noopener">
      <span>${l.label}</span>
      <span class="about-link-arrow">↗</span>
    </a>
  `).join('');
}

// ─── 3D Tilt Effect ─────────────────────────────────────────────
function handleTilt(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const rotateX = ((y - cy) / cy) * -6;
  const rotateY = ((x - cx) / cx) *  6;
  card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
}

function resetTilt(e) {
  e.currentTarget.style.transform = '';
}

// ─── Scroll Reveal ───────────────────────────────────────────────
function observeReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.classList.add('visible');
        obs.unobserve(el.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal-up').forEach(el => obs.observe(el));
}

// ─── Nav scroll shadow ───────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.querySelector('.nav').classList.toggle('scrolled', window.scrollY > 40);
});

// ─── Typewriter for hero tagline ────────────────────────────────
function typewriter(el, text, delay = 60) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, delay);
}

// ─── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Reveal hero elements
  setTimeout(() => {
    document.querySelectorAll('.hero .reveal-up').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);

  await loadContent();
});
