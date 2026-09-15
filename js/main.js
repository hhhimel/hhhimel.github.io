/* Public site logic */
(function () {
  const Data = window.HimelData;

  /* After you create a JSONBin and push once, paste the Bin ID here
     so every visitor on GitHub Pages loads the same journal. */
  const PUBLIC_BIN_ID = ''; // e.g. '67f1a2b3c4d5e6f7a8b9c0d1'

  let DB = Data.loadJournal();
  let notes = Data.loadNotes();
  let settings = Data.loadSettings();
  let currentFilter = 'all';
  let searchQuery = '';
  let calcExpr = '';
  let calcDisplay = '0';

  async function tryLoadFromCloud() {
    const binId = PUBLIC_BIN_ID || settings.publicBinId || '';
    if (!binId) return false;
    try {
      const record = await Data.cloudPull(binId);
      if (record && record.journal && Array.isArray(record.journal.posts)) {
        DB = record.journal;
        Data.saveJournal(DB); // cache locally
      }
      if (record && record.settings) {
        settings = Object.assign({}, Data.DEFAULT_SETTINGS, record.settings);
        Data.saveSettings(settings);
      }
      return true;
    } catch (e) {
      console.warn('Cloud load failed, using local data', e);
      return false;
    }
  }

  // Apply settings to page
  function applySettings() {
    const s = settings;
    const nameEl = document.querySelector('.hero h1');
    if (nameEl) nameEl.textContent = s.siteName || 'Md. Habib Hasan Himel';
    const roleEl = document.querySelector('.hero .role');
    if (roleEl) roleEl.textContent = s.roleLine || '';
    const nowEl = document.querySelector('.now-line');
    if (nowEl) nowEl.textContent = s.nowLine || '';
    if (s.accentGold) {
      document.documentElement.style.setProperty('--gold', s.accentGold);
    }
    // Toggle sections
    const weatherSec = document.getElementById('weather');
    const newsSec = document.getElementById('news');
    if (weatherSec) weatherSec.style.display = s.showWeather === false ? 'none' : '';
    if (newsSec) newsSec.style.display = s.showNews === false ? 'none' : '';
    // Suggest form visibility
    const suggestBox = document.getElementById('suggestBox');
    if (suggestBox) suggestBox.style.display = s.allowSuggest ? '' : 'none';
  }
  applySettings();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));

  // Scrollspy
  const sectionIds = ['about','research','field','skills','work','education','journal','tools','weather','news','messages','contact'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
  const navAnchors = links ? Array.from(links.querySelectorAll('a')) : [];
  const spyObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => spyObs.observe(s));

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2300);
  }

  // Copy email
  const copyBtn = document.getElementById('copyEmailBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const email = this.getAttribute('data-email');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => toast('Email copied'));
      } else {
        const ta = document.createElement('textarea');
        ta.value = email; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        toast('Email copied');
      }
    });
  }

  // CV download — always works via static file (no upload required)
  function downloadCV(e) {
    if (e) e.preventDefault();
    // 1) Prefer the CV hosted with the site (assets/Himel_CV.pdf)
    // 2) Optional: admin-uploaded override in this browser only
    const cv = Data.loadCV();
    if (cv && cv.data) {
      const link = document.createElement('a');
      link.href = cv.data;
      link.download = cv.name || 'Md_Habib_Hasan_Himel_CV.pdf';
      link.click();
      toast('Downloading CV');
      return;
    }
    const a = document.createElement('a');
    a.href = 'assets/Himel_CV.pdf';
    a.download = 'Md_Habib_Hasan_Himel_CV.pdf';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Downloading CV');
  }
  document.querySelectorAll('[data-cv]').forEach(btn => btn.addEventListener('click', downloadCV));


  // Contact message
  const sendAskBtn = document.getElementById('sendAskBtn');
  if (sendAskBtn) {
    sendAskBtn.addEventListener('click', () => {
      const name = document.getElementById('ask-name').value.trim();
      const subject = document.getElementById('ask-subject').value.trim() || 'Message from website';
      const body = document.getElementById('ask-body').value.trim();
      if (!body) { toast('Please write a message'); return; }
      const inbox = Data.loadInbox();
      inbox.unshift({
        id: Date.now(),
        kind: 'message',
        name: name || 'Anonymous',
        subject,
        body,
        time: new Date().toISOString()
      });
      Data.saveInbox(inbox.slice(0, 50));
      const fullBody = (name ? 'From: ' + name + '\n\n' : '') + body;
      window.location.href = 'mailto:hh.himel.m@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(fullBody);
    });
  }

  // Suggest a post (optional)
  const suggestBtn = document.getElementById('suggestBtn');
  if (suggestBtn) {
    suggestBtn.addEventListener('click', () => {
      if (!settings.allowSuggest) return;
      const name = document.getElementById('sg-name').value.trim();
      const title = document.getElementById('sg-title').value.trim();
      const body = document.getElementById('sg-body').value.trim();
      if (!title || !body) { toast('Title and content required'); return; }
      const inbox = Data.loadInbox();
      inbox.unshift({
        id: Date.now(),
        kind: 'suggest',
        name: name || 'Anonymous',
        title,
        excerpt: body.slice(0, 140),
        body,
        type: 'note',
        time: new Date().toISOString()
      });
      Data.saveInbox(inbox.slice(0, 50));
      document.getElementById('sg-title').value = '';
      document.getElementById('sg-body').value = '';
      toast('Suggestion sent for review');
    });
  }

  // ---------- JOURNAL ----------
  function formatDate(d) {
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[+m - 1] + ' ' + parseInt(day) + ', ' + y;
  }
  function typeLabel(t) {
    return { learn: 'Learning', fix: 'Fix guide', search: 'Search log', note: 'Note' }[t] || t;
  }
  function typeClass(t) { return 'type-' + (t || 'note'); }
  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function renderContent(raw) {
    return raw
      .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
      .split('\n')
      .map(line => line.startsWith('<') ? line : (line.trim() ? '<p>' + line + '</p>' : ''))
      .join('');
  }

  function getFiltered() {
    return DB.posts.filter(p => {
      const matchType = currentFilter === 'all' || p.type === currentFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }

  function renderList() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    const filtered = getFiltered();
    if (!filtered.length) {
      container.innerHTML = '<div class="empty">No entries match this filter.</div>';
      return;
    }
    container.innerHTML = filtered.map(p => {
      let media = '';
      if (p.image) {
        media = `<div class="post-media-thumb"><img src="${escapeHtml(p.image)}" alt="" loading="lazy"></div>`;
      } else if (p.video) {
        media = `<div class="post-media-thumb"><video src="${escapeHtml(p.video)}" muted playsinline></video></div>`;
      }
      return `
        <article class="post-card" data-id="${p.id}">
          <div class="post-meta">
            <span class="post-type ${typeClass(p.type)}">${typeLabel(p.type)}</span>
            <span>${formatDate(p.date)}</span>
          </div>
          <h3 class="post-title">${escapeHtml(p.title)}</h3>
          <p class="post-excerpt">${escapeHtml(p.excerpt)}</p>
          ${(p.tags && p.tags.length) ? `<div class="post-tags">${p.tags.map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          ${media}
        </article>`;
    }).join('');
    container.querySelectorAll('.post-card').forEach(card => {
      card.addEventListener('click', () => openPost(+card.dataset.id));
    });
  }

  function openPost(id) {
    const p = DB.posts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('journal-list').classList.remove('active');
    document.getElementById('journal-single').classList.add('active');
    const el = document.getElementById('single-content');
    let mediaHtml = '';
    if (p.image) mediaHtml = `<div class="sp-media"><img src="${escapeHtml(p.image)}" alt=""></div>`;
    if (p.video) {
      const isYt = /youtube\.com|youtu\.be/.test(p.video);
      if (isYt) {
        mediaHtml += `<div class="sp-media"><iframe width="100%" height="320" src="${escapeHtml(p.video)}" frameborder="0" allowfullscreen style="border:0"></iframe></div>`;
      } else {
        mediaHtml += `<div class="sp-media"><video src="${escapeHtml(p.video)}" controls playsinline style="width:100%"></video></div>`;
      }
    }
    el.innerHTML = `
      <span class="post-type ${typeClass(p.type)}" style="margin-bottom:12px">${typeLabel(p.type)}</span>
      <h2 class="sp-title">${escapeHtml(p.title)}</h2>
      <div class="post-meta" style="margin-bottom:20px">
        <span>${formatDate(p.date)}</span>
        ${(p.tags || []).map(t => `<span>${escapeHtml(t)}</span>`).join('')}
      </div>
      ${mediaHtml}
      <div class="sp-body">${renderContent(p.content)}</div>
      <div class="comment-box">
        <h4>Comments (${(p.comments || []).length})</h4>
        <div class="comment-list">
          ${(p.comments || []).map(c => `
            <div class="comment-item">
              <div class="comment-author">${escapeHtml(c.author)}</div>
              <div class="comment-text">${escapeHtml(c.text)}</div>
              <div class="comment-time">${new Date(c.time).toLocaleString()}</div>
            </div>`).join('') || '<p class="muted" style="font-size:0.9rem">No comments yet.</p>'}
        </div>
        <div class="form-row" style="margin-top:14px">
          <input class="form-input" id="c-name" placeholder="Your name" style="flex:1">
        </div>
        <textarea class="form-textarea" id="c-text" placeholder="Write a comment..."></textarea>
        <button class="btn btn-primary" style="margin-top:10px" id="addCommentBtn">Post comment</button>
      </div>`;
    document.getElementById('addCommentBtn').addEventListener('click', () => addComment(id));
  }

  function addComment(id) {
    const p = DB.posts.find(x => x.id === id);
    if (!p) return;
    const name = document.getElementById('c-name').value.trim();
    const text = document.getElementById('c-text').value.trim();
    if (!name || !text) { toast('Name and comment required'); return; }
    p.comments = p.comments || [];
    p.comments.push({ author: name, text, time: new Date().toISOString() });
    Data.saveJournal(DB);
    openPost(id);
    toast('Comment added');
  }

  const backBtn = document.getElementById('backToList');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('journal-single').classList.remove('active');
      document.getElementById('journal-list').classList.add('active');
    });
  }

  document.querySelectorAll('.filter-pill[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  const searchInput = document.getElementById('journalSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      renderList();
    });
  }

  // Notepad
  const notepad = document.getElementById('notepad');
  function renderSavedNotes() {
    const el = document.getElementById('savedNotes');
    if (!el) return;
    if (!notes.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<div style="font-size:0.74rem;color:var(--muted);margin-bottom:8px;font-family:var(--mono)">Saved</div>' +
      notes.slice(0, 6).map((n, i) => `
        <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--line);font-size:0.84rem">
          <span style="flex:1;color:var(--muted);cursor:pointer" data-load="${i}">${escapeHtml(n.text.slice(0, 80))}${n.text.length > 80 ? '…' : ''}</span>
          <button style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:0.8rem" data-del="${i}">✕</button>
        </div>`).join('');
    el.querySelectorAll('[data-load]').forEach(b => {
      b.addEventListener('click', () => { if (notepad) notepad.value = notes[+b.dataset.load].text; });
    });
    el.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', () => {
        notes.splice(+b.dataset.del, 1);
        Data.saveNotes(notes);
        renderSavedNotes();
      });
    });
  }
  const saveNoteBtn = document.getElementById('saveNoteBtn');
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', () => {
      const v = notepad ? notepad.value.trim() : '';
      if (!v) { toast('Nothing to save'); return; }
      notes.unshift({ text: v, time: new Date().toISOString() });
      notes = notes.slice(0, 20);
      Data.saveNotes(notes);
      if (notepad) notepad.value = '';
      renderSavedNotes();
      toast('Note saved');
    });
  }
  const clearNoteBtn = document.getElementById('clearNoteBtn');
  if (clearNoteBtn) clearNoteBtn.addEventListener('click', () => { if (notepad) notepad.value = ''; });
  renderSavedNotes();

  // Calculator
  const calcBtns = [
    ['AC','(',')','/'], ['7','8','9','*'], ['4','5','6','-'],
    ['1','2','3','+'], ['0','.','⌫','=']
  ];
  const calcGrid = document.getElementById('calcGrid');
  if (calcGrid) {
    calcGrid.innerHTML = calcBtns.flat().map(b => {
      let cls = 'calc-btn';
      if (['/','*','-','+','(',')'].includes(b)) cls += ' op';
      if (b === '=') cls += ' eq';
      if (b === 'AC') cls += ' ac';
      return `<button class="${cls}" data-k="${b}">${b}</button>`;
    }).join('');
    calcGrid.addEventListener('click', e => {
      const btn = e.target.closest('[data-k]');
      if (!btn) return;
      const k = btn.dataset.k;
      if (k === 'AC') { calcExpr = ''; calcDisplay = '0'; }
      else if (k === '⌫') { calcExpr = calcExpr.slice(0, -1); calcDisplay = calcExpr || '0'; }
      else if (k === '=') {
        try {
          const res = Function('"use strict"; return (' + calcExpr + ')')();
          calcDisplay = String(Math.round(res * 1e10) / 1e10);
          calcExpr = '';
        } catch { calcDisplay = 'Error'; calcExpr = ''; }
      } else {
        calcExpr += k;
        calcDisplay = calcExpr;
      }
      const exprEl = document.getElementById('calcExpr');
      const resEl = document.getElementById('calcResult');
      if (exprEl) exprEl.textContent = calcExpr;
      if (resEl) resEl.textContent = calcDisplay;
    });
  }

  // Weather
  const weatherBtn = document.getElementById('weatherBtn');
  if (weatherBtn) {
    weatherBtn.addEventListener('click', () => fetchWeather());
    const cityInput = document.getElementById('weatherCity');
    if (cityInput) cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') fetchWeather(); });
  }
  function fetchWeather() {
    const city = document.getElementById('weatherCity').value.trim();
    if (!city) return;
    const result = document.getElementById('weatherResult');
    result.innerHTML = '<div class="empty">Loading…</div>';
    fetch('https://wttr.in/' + encodeURIComponent(city) + '?format=j1')
      .then(r => r.json())
      .then(data => {
        const c = data.current_condition[0];
        const area = data.nearest_area[0];
        const areaName = area.areaName[0].value + ', ' + area.country[0].value;
        result.innerHTML = `
          <div class="weather-card">
            <div class="weather-city">${escapeHtml(city)}</div>
            <div style="font-size:0.8rem;color:var(--muted);margin-bottom:6px">${escapeHtml(areaName)}</div>
            <div class="weather-temp">${c.temp_C}°C</div>
            <div class="weather-desc">${escapeHtml(c.weatherDesc[0].value)}</div>
            <div class="weather-details">
              <div><div class="weather-detail-val">${c.FeelsLikeC}°C</div><div class="weather-detail-lbl">feels like</div></div>
              <div><div class="weather-detail-val">${c.humidity}%</div><div class="weather-detail-lbl">humidity</div></div>
              <div><div class="weather-detail-val">${c.windspeedKmph} km/h</div><div class="weather-detail-lbl">wind</div></div>
            </div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:12px;font-family:var(--mono)">Data via wttr.in</div>
          </div>`;
      })
      .catch(() => {
        result.innerHTML = '<div class="empty">Could not fetch weather.</div>';
      });
  }

  // News
  const NEWS = {
    technology: [
      { title: 'Open-source models continue to close the gap', source: 'Tech', time: '2h ago' },
      { title: 'New tooling for local-first development', source: 'DevTools', time: '5h ago' }
    ],
    science: [
      { title: 'Advances in plant genomics and breeding tools', source: 'Nature Plants', time: '1d ago' },
      { title: 'Climate-resilient crops research update', source: 'CGIAR', time: '2d ago' }
    ],
    agriculture: [
      { title: 'Blackgram and pulse breeding priorities', source: 'ICAR', time: '3d ago' },
      { title: 'Sustainable supply chains for smallholders', source: 'FAO', time: '4d ago' }
    ],
    programming: [
      { title: 'TypeScript and modern frontend patterns', source: 'Dev', time: '6h ago' },
      { title: 'Linux and container best practices', source: 'Ops', time: '1d ago' }
    ]
  };
  let newsCat = 'agriculture';
  function renderNews() {
    const list = document.getElementById('newsList');
    if (!list) return;
    const items = NEWS[newsCat] || [];
    list.innerHTML = items.map(n => `
      <div class="news-card">
        <div class="news-source">${escapeHtml(n.source)}</div>
        <div class="news-title">${escapeHtml(n.title)}</div>
        <div class="news-time">${escapeHtml(n.time)}</div>
      </div>`).join('');
  }
  document.querySelectorAll('[data-news]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-news]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      newsCat = btn.dataset.news;
      renderNews();
    });
  });
  renderNews();

  // Load cloud data then render journal
  (async function init() {
    await tryLoadFromCloud();
    applySettings();
    renderList();
  })();
})();
