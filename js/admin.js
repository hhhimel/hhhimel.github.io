/* Admin-only page */
(function () {
  const Data = window.HimelData;
  const ADMIN_PASS = 'pswd.admin';
  const SESSION_KEY = 'himel_admin_session';

  let DB = Data.loadJournal();
  let settings = Data.loadSettings();
  let cloud = Data.loadCloudConfig();
  let isUnlocked = sessionStorage.getItem(SESSION_KEY) === '1';

  const gate = document.getElementById('adminGate');
  const panel = document.getElementById('adminPanel');
  const toastEl = document.getElementById('toast');

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function showPanel() {
    if (gate) gate.style.display = 'none';
    if (panel) panel.style.display = 'block';
    fillSettingsForm();
    fillCloudForm();
    renderPostList();
    renderInbox();
    renderCVStatus();
  }

  function showGate() {
    if (gate) gate.style.display = 'block';
    if (panel) panel.style.display = 'none';
  }

  if (isUnlocked) showPanel();
  else showGate();

  const unlockBtn = document.getElementById('unlockBtn');
  if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
      if (document.getElementById('adminPass').value === ADMIN_PASS) {
        sessionStorage.setItem(SESSION_KEY, '1');
        isUnlocked = true;
        showPanel();
        toast('Unlocked');
      } else toast('Incorrect passphrase');
    });
    document.getElementById('adminPass').addEventListener('keydown', e => {
      if (e.key === 'Enter') unlockBtn.click();
    });
  }

  document.getElementById('lockBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    isUnlocked = false;
    showGate();
    toast('Locked');
  });

  /* ---------- SETTINGS ---------- */
  function fillSettingsForm() {
    const s = settings;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    set('set-siteName', s.siteName);
    set('set-roleLine', s.roleLine);
    set('set-nowLine', s.nowLine);
    set('set-accent', s.accentGold || '#C4A35A');
    const c = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
    c('set-allowSuggest', s.allowSuggest);
    c('set-showWeather', s.showWeather !== false);
    c('set-showNews', s.showNews !== false);
  }

  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    settings = {
      siteName: document.getElementById('set-siteName').value.trim() || Data.DEFAULT_SETTINGS.siteName,
      roleLine: document.getElementById('set-roleLine').value.trim() || Data.DEFAULT_SETTINGS.roleLine,
      nowLine: document.getElementById('set-nowLine').value.trim() || Data.DEFAULT_SETTINGS.nowLine,
      accentGold: document.getElementById('set-accent').value || '#C4A35A',
      allowSuggest: document.getElementById('set-allowSuggest').checked,
      showWeather: document.getElementById('set-showWeather').checked,
      showNews: document.getElementById('set-showNews').checked
    };
    Data.saveSettings(settings);
    toast('Settings saved');
  });

  /* ---------- EXPORT / IMPORT ---------- */
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const includeCV = document.getElementById('exportIncludeCV')?.checked;
    const data = Data.exportAll(!!includeCV);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'himel-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
  });

  document.getElementById('importFile')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!confirm('Replace local journal, settings, and inbox with this backup?')) return;
        Data.importAll(data);
        DB = Data.loadJournal();
        settings = Data.loadSettings();
        cloud = Data.loadCloudConfig();
        fillSettingsForm();
        fillCloudForm();
        renderPostList();
        renderInbox();
        renderCVStatus();
        toast('Backup restored');
      } catch (err) {
        toast('Invalid backup file');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  /* ---------- CLOUD (JSONBin) ---------- */
  function fillCloudForm() {
    const elId = document.getElementById('cloud-binId');
    const elKey = document.getElementById('cloud-apiKey');
    const elEn = document.getElementById('cloud-enabled');
    if (elId) elId.value = cloud.binId || '';
    if (elKey) elKey.value = cloud.apiKey || '';
    if (elEn) elEn.checked = !!cloud.enabled;
  }

  document.getElementById('saveCloudBtn')?.addEventListener('click', () => {
    cloud = {
      binId: document.getElementById('cloud-binId').value.trim(),
      apiKey: document.getElementById('cloud-apiKey').value.trim(),
      enabled: document.getElementById('cloud-enabled').checked
    };
    Data.saveCloudConfig(cloud);
    // Also store public bin ID in settings so public site can read
    settings = Data.loadSettings();
    settings.publicBinId = cloud.enabled ? cloud.binId : '';
    Data.saveSettings(settings);
    toast('Cloud settings saved');
  });

  document.getElementById('cloudPushBtn')?.addEventListener('click', async () => {
    cloud = Data.loadCloudConfig();
    if (!cloud.binId || !cloud.apiKey) {
      toast('Save bin ID and API key first');
      return;
    }
    const btn = document.getElementById('cloudPushBtn');
    btn.disabled = true;
    btn.textContent = 'Pushing…';
    try {
      // Do not push full CV base64 to keep payload small; CV stays local or host as file
      const payload = {
        version: 1,
        updatedAt: new Date().toISOString(),
        journal: Data.loadJournal(),
        settings: Data.loadSettings()
      };
      await Data.cloudPush(cloud.binId, cloud.apiKey, payload);
      toast('Pushed to cloud — public site can load this data');
    } catch (err) {
      toast(String(err.message || err));
    }
    btn.disabled = false;
    btn.textContent = 'Push to cloud';
  });

  document.getElementById('cloudPullBtn')?.addEventListener('click', async () => {
    cloud = Data.loadCloudConfig();
    if (!cloud.binId) {
      toast('Enter bin ID first');
      return;
    }
    const btn = document.getElementById('cloudPullBtn');
    btn.disabled = true;
    btn.textContent = 'Pulling…';
    try {
      const record = await Data.cloudPull(cloud.binId);
      if (record.journal) {
        Data.saveJournal(record.journal);
        DB = record.journal;
      }
      if (record.settings) {
        Data.saveSettings(Object.assign({}, Data.DEFAULT_SETTINGS, record.settings));
        settings = Data.loadSettings();
        fillSettingsForm();
      }
      renderPostList();
      toast('Pulled from cloud');
    } catch (err) {
      toast(String(err.message || err));
    }
    btn.disabled = false;
    btn.textContent = 'Pull from cloud';
  });

  /* ---------- CV ---------- */
  function renderCVStatus() {
    const el = document.getElementById('cvStatus');
    if (!el) return;
    const cv = Data.loadCV();
    if (cv && cv.data) {
      el.innerHTML = `
        <p style="font-size:0.9rem;margin-bottom:8px">
          <strong>${escapeHtml(cv.name)}</strong>
          <span class="muted">(~${Math.round((cv.data.length * 0.75) / 1024)} KB)</span>
        </p>
        <button class="btn btn-sm btn-outline" id="removeCVBtn">Remove</button>
        <button class="btn btn-sm btn-primary" id="previewCVBtn" style="margin-left:8px">Download</button>
      `;
      document.getElementById('removeCVBtn').onclick = () => {
        Data.saveCV(null);
        renderCVStatus();
        toast('CV removed');
      };
      document.getElementById('previewCVBtn').onclick = () => {
        const a = document.createElement('a');
        a.href = cv.data;
        a.download = cv.name || 'Himel_CV.pdf';
        a.click();
      };
    } else {
      el.innerHTML = '<p class="muted" style="font-size:0.9rem">No CV uploaded. For GitHub Pages, you can also put a PDF in <code>assets/</code> and link it.</p>';
    }
  }

  document.getElementById('cvUpload')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast('Max ~4 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (Data.saveCV({ name: file.name, type: file.type || 'application/pdf', data: reader.result })) {
        renderCVStatus();
        toast('CV uploaded (this browser)');
      } else toast('Storage full — use a smaller file');
    };
    reader.readAsDataURL(file);
  });

  /* ---------- PUBLISH ---------- */
  document.getElementById('publishBtn')?.addEventListener('click', () => {
    if (!isUnlocked) return;
    const title = document.getElementById('np-title').value.trim();
    if (!title) { toast('Title required'); return; }
    const tags = document.getElementById('np-tags').value.split(',')
      .map(t => t.trim()).filter(Boolean)
      .map(t => t.startsWith('#') ? t : '#' + t);

    const imageUrl = document.getElementById('np-image').value.trim();
    const imgFile = document.getElementById('np-imageFile');

    const finish = (image) => {
      DB.posts.unshift({
        id: Date.now(),
        type: document.getElementById('np-type').value,
        date: new Date().toISOString().slice(0, 10),
        title,
        excerpt: document.getElementById('np-excerpt').value.trim() || title,
        tags,
        content: document.getElementById('np-content').value.trim() || title,
        image: image || '',
        video: document.getElementById('np-video').value.trim(),
        comments: []
      });
      Data.saveJournal(DB);
      ['np-title','np-excerpt','np-tags','np-content','np-image','np-video'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      if (imgFile) imgFile.value = '';
      renderPostList();
      toast('Published locally — push to cloud when ready');
    };

    if (imgFile && imgFile.files && imgFile.files[0]) {
      const f = imgFile.files[0];
      if (f.size > 1.5 * 1024 * 1024) {
        toast('Image max 1.5 MB or use URL');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => finish(reader.result);
      reader.readAsDataURL(f);
    } else {
      finish(imageUrl);
    }
  });

  function renderPostList() {
    const el = document.getElementById('adminPostList');
    if (!el) return;
    if (!DB.posts.length) {
      el.innerHTML = '<p class="muted">No posts yet.</p>';
      return;
    }
    el.innerHTML = DB.posts.map(p => `
      <div class="inbox-item" style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div>
          <div class="inbox-meta">${escapeHtml(p.type)} · ${escapeHtml(p.date)}</div>
          <strong>${escapeHtml(p.title)}</strong>
        </div>
        <button class="btn btn-sm btn-outline" data-del="${p.id}">Delete</button>
      </div>`).join('');
    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this post?')) return;
        DB.posts = DB.posts.filter(x => x.id !== +btn.dataset.del);
        Data.saveJournal(DB);
        renderPostList();
        toast('Deleted');
      });
    });
  }

  function renderInbox() {
    const el = document.getElementById('adminInbox');
    if (!el) return;
    const inbox = Data.loadInbox();
    if (!inbox.length) {
      el.innerHTML = '<p class="muted">No messages or suggestions yet.</p>';
      return;
    }
    el.innerHTML = inbox.map(m => {
      if (m.kind === 'suggest') {
        return `
          <div class="inbox-item">
            <div class="inbox-meta">Suggestion · ${escapeHtml(m.name || 'Anonymous')} · ${new Date(m.time).toLocaleString()}</div>
            <strong>${escapeHtml(m.title)}</strong>
            <p style="font-size:0.9rem;color:var(--muted);margin-top:4px">${escapeHtml(m.excerpt || m.body || '')}</p>
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-sm btn-primary" data-approve="${m.id}">Approve & publish</button>
              <button class="btn btn-sm btn-outline" data-dismiss="${m.id}">Dismiss</button>
            </div>
          </div>`;
      }
      return `
        <div class="inbox-item">
          <div class="inbox-meta">${escapeHtml(m.name || 'Anonymous')} · ${new Date(m.time).toLocaleString()}</div>
          <strong>${escapeHtml(m.subject || 'Message')}</strong>
          <p style="font-size:0.9rem;color:var(--muted);margin-top:4px">${escapeHtml(m.body || '')}</p>
          <button class="btn btn-sm btn-outline" style="margin-top:8px" data-dismiss="${m.id}">Dismiss</button>
        </div>`;
    }).join('');

    el.querySelectorAll('[data-dismiss]').forEach(btn => {
      btn.addEventListener('click', () => {
        Data.saveInbox(Data.loadInbox().filter(x => x.id !== +btn.dataset.dismiss));
        renderInbox();
        toast('Dismissed');
      });
    });

    el.querySelectorAll('[data-approve]').forEach(btn => {
      btn.addEventListener('click', () => {
        let list = Data.loadInbox();
        const item = list.find(x => x.id === +btn.dataset.approve);
        if (!item) return;
        DB.posts.unshift({
          id: Date.now(),
          type: item.type || 'note',
          date: new Date().toISOString().slice(0, 10),
          title: item.title,
          excerpt: item.excerpt || item.body || item.title,
          tags: item.tags || ['#suggestion'],
          content: item.body || item.excerpt || item.title,
          image: '', video: '', comments: []
        });
        Data.saveJournal(DB);
        Data.saveInbox(list.filter(x => x.id !== item.id));
        renderPostList();
        renderInbox();
        toast('Approved — remember to push to cloud');
      });
    });
  }
})();
