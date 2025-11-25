// app.js (static GitHub Pages version)
(async function () {
  // Base path for GitHub Pages (repo site vs. root)
  const repoBase = location.pathname.includes('/Teammate-Database/')
    ? '/Teammate-Database'
    : '';

  // Data + images live in the repo
  const IMAGE_BASE = repoBase + '/images/';
  const DATA_CANDIDATES = [
    repoBase + '/data/team.json',
    repoBase + '/data/teammates.json',
  ];

  // Small DOM helpers
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const roleTint = { lead: '#E3F2FF', lo: '#D7E3FF', ops: '#FFE6C8' };
  let TEAM = [];

  // Accepts encoded or plain filenames and returns a single, correct encoding
  function safeFile(file) {
    if (!file) return 'placeholder.png';
    try {
      return encodeURIComponent(decodeURIComponent(file));
    } catch {
      return encodeURIComponent(file);
    }
  }

  function photoUrl(file) {
    return IMAGE_BASE + safeFile(file);
  }

  // Load team data from the first available JSON, cache-busted
  async function loadTeam() {
    let ok = null;
    for (const url of DATA_CANDIDATES) {
      try {
        const r = await fetch(url + '?v=' + Date.now(), { cache: 'no-store' });
        if (r.ok) { ok = r; break; }
      } catch {}
    }
    if (!ok) throw new Error('No team data found at ' + DATA_CANDIDATES.join(', '));
    TEAM = await ok.json();
    return TEAM;
  }

  function buildCard(p) {
    const url = './profile.html?slug=' + encodeURIComponent(p.slug);
    const photo = photoUrl(p.photoFile);
    const nmls = p.nmls ? `<p class="role">${p.nmls}</p>` : '';
    const phone = p.phone ? `<a href="tel:${p.phone}" aria-label="Call ${p.name}">📞</a>` : '';
    const email = p.email ? `<a href="mailto:${p.email}" aria-label="Email ${p.name}">✉️</a>` : '';
    const states = (p.states || []).slice(0, 6).map(s => `<span class="badge">${s}</span>`).join('');

    return `<a class="cardlink" href="${url}">
      <article class="card" style="--bg:${roleTint[p.role] || '#EEF2FF'}">
        <figure class="portrait"><img src="${photo}" alt="${p.name} — ${p.jobTitle || ''} ${p.nmls || ''}" loading="lazy" decoding="async"></figure>
        <div class="meta">
          <h3 class="name">${p.name}</h3>
          <p class="role">${p.jobTitle || ''}</p>
          ${nmls}
          <div class="badges">${states}</div>
          <div class="actions">${phone}${email}</div>
        </div>
      </article>
    </a>`;
  }

  function renderList() {
    const q = ($('#q')?.value || '').toLowerCase().trim();
    const role = $('#role')?.value || '';
    const st = $('#state')?.value || '';
    const sort = $('#sort')?.value || 'order';

    let items = TEAM.slice();

    if (q) {
      items = items.filter(p =>
        [p.name, p.jobTitle, p.nmls].filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    if (role) items = items.filter(p => p.role === role);
    if (st) items = items.filter(p => (p.states || []).includes(st));

    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') items.sort((a, b) => b.name.localeCompare(a.name));
    else items.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

    const grid = $('#grid');
    if (grid) grid.innerHTML = items.map(buildCard).join('');
  }

  function populateStates() {
    const set = new Set();
    TEAM.forEach(p => (p.states || []).forEach(s => set.add(s)));
    const sel = $('#state');
    if (!sel) return;
    sel.querySelectorAll('option[data-dynamic]').forEach(opt => opt.remove());
    Array.from(set).sort().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.dataset.dynamic = 'true';
      opt.textContent = s;
      sel.appendChild(opt);
    });
  }

  function renderProfile() {
    const slug = new URLSearchParams(location.search).get('slug') || '';
    const p = TEAM.find(x => x.slug === slug);
    const profile = $('#profile');
    if (!profile) return;
    if (!p) { profile.innerHTML = '<p>Profile not found.</p>'; return; }

    const photo = photoUrl(p.photoFile);
    const states = (p.states || []).map(s => `<span class="badge">${s}</span>`).join('');
    const links = p.links || {};
    const contact = `${p.phone ? `<a class="linkbtn" href="tel:${p.phone}">📞 Call</a>` : ''}${
      p.email ? `<a class="linkbtn" href="mailto:${p.email}">✉️ Email</a>` : ''
    }`;
    const link = (label, url) =>
      url ? `<a class="linkbtn" href="${url}" target="_blank" rel="noopener">${label}</a>` : '';

    profile.innerHTML = `
      <div class="hero">
        <img src="${photo}" alt="${p.name}">
        <div>
          <h2>${p.name}</h2>
          <p class="role">${p.jobTitle || ''} ${p.nmls ? '• ' + p.nmls : ''}
