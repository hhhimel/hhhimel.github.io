/* Shared data layer — localStorage + optional JSONBin cloud */
window.HimelData = (function () {
  const JOURNAL_KEY = 'himel_journal_v3';
  const NOTES_KEY = 'himel_notes_v1';
  const INBOX_KEY = 'himel_inbox_v1';
  const SETTINGS_KEY = 'himel_settings_v1';
  const CV_KEY = 'himel_cv_v1';
  const CLOUD_KEY = 'himel_cloud_v1';

  const DEFAULT_SETTINGS = {
    siteName: 'Md. Habib Hasan Himel',
    roleLine: 'Genetics researcher & self-taught developer · Dhaka, Bangladesh',
    nowLine: 'Now: writing up genetic variability and path coefficient analysis for my MS thesis.',
    accentGold: '#C4A35A',
    allowSuggest: false,
    showWeather: true,
    showNews: true
  };

  const SEED_POSTS = [
    {
      id: 1, type: 'fix', date: '2025-12-04',
      title: 'Fixed: nginx 502 after Docker restart',
      excerpt: 'Upstream kept failing — DNS resolution inside the container network was the culprit.',
      tags: ['#nginx', '#docker', '#devops'],
      content: 'After restarting Docker, nginx kept returning 502. The upstream service was running but nginx could not resolve the hostname.\n\n<h3>The problem</h3>\nDocker assigns new IPs on restart. nginx caches DNS at startup, so the old IP became stale.\n\n<h3>The fix</h3>\n<pre>resolver 127.0.0.11 valid=10s;\nset $upstream http://api:3000;\nproxy_pass $upstream;</pre>\n\nThe set trick forces nginx to re-resolve on every request.',
      image: '', video: '', comments: []
    },
    {
      id: 2, type: 'learn', date: '2025-11-18',
      title: 'Understanding CSS cascade layers (@layer)',
      excerpt: 'Finally wrapped my head around why @layer exists and when it actually helps.',
      tags: ['#css', '#frontend'],
      content: 'CSS <code>@layer</code> lets you control specificity at scale without fighting selector wars.\n\n<h3>Basic idea</h3>\nYou declare layers in order; later layers win regardless of specificity inside them.\n\n<pre>@layer base, components, utilities;</pre>\n\nUseful when integrating third-party styles — put the library in a low-priority layer so your overrides always win.',
      image: '', video: '', comments: []
    },
    {
      id: 3, type: 'search', date: '2025-11-02',
      title: 'How to run a cron job inside a Docker container',
      excerpt: 'Searched this three times. Writing it down properly this time.',
      tags: ['#docker', '#linux', '#cron'],
      content: 'Every few months I need this and forget. Here’s the clean version.\n\n<pre>FROM ubuntu:22.04\nRUN apt-get update && apt-get install -y cron\nCOPY crontab /etc/cron.d/mycron\nRUN chmod 0644 /etc/cron.d/mycron\nRUN crontab /etc/cron.d/mycron\nCMD cron -f</pre>\n\nRoute output to Docker logs with <code>/proc/1/fd/1</code>.',
      image: '', video: '', comments: []
    },
    {
      id: 4, type: 'note', date: '2025-10-20',
      title: 'Field note — blackgram trial plot layout',
      excerpt: 'Quick reminder of spacing and replication layout used in the current season trials.',
      tags: ['#field', '#blackgram', '#trial'],
      content: 'Plot size 4 m × 2.5 m. Row-to-row 30 cm, plant-to-plant 10 cm. Three replications in RCBD. Border rows excluded from data. Data collection dates logged in the field book.',
      image: '', video: '', comments: []
    }
  ];

  function loadJournal() {
    try {
      const raw = localStorage.getItem(JOURNAL_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { posts: SEED_POSTS.slice() };
  }

  function saveJournal(db) {
    try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(db)); } catch (e) {}
  }

  function loadNotes() {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveNotes(notes) {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch (e) {}
  }

  function loadInbox() {
    try {
      const raw = localStorage.getItem(INBOX_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveInbox(items) {
    try { localStorage.setItem(INBOX_KEY, JSON.stringify(items)); } catch (e) {}
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
    } catch (e) {}
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function loadCV() {
    try {
      const raw = localStorage.getItem(CV_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveCV(cv) {
    try {
      if (cv) localStorage.setItem(CV_KEY, JSON.stringify(cv));
      else localStorage.removeItem(CV_KEY);
    } catch (e) {
      return false;
    }
    return true;
  }

  function loadCloudConfig() {
    try {
      const raw = localStorage.getItem(CLOUD_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { binId: '', apiKey: '', enabled: false };
  }

  function saveCloudConfig(cfg) {
    try { localStorage.setItem(CLOUD_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  /* Full snapshot for export (CV base64 can be large — optional) */
  function exportAll(includeCV) {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      journal: loadJournal(),
      settings: loadSettings(),
      inbox: loadInbox(),
      notes: loadNotes(),
      cloud: loadCloudConfig(),
      cv: includeCV ? loadCV() : null
    };
  }

  function importAll(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
    if (data.journal) saveJournal(data.journal);
    if (data.settings) saveSettings(Object.assign({}, DEFAULT_SETTINGS, data.settings));
    if (data.inbox) saveInbox(data.inbox);
    if (data.notes) saveNotes(data.notes);
    if (data.cloud) saveCloudConfig(data.cloud);
    if (data.cv) saveCV(data.cv);
  }

  /* JSONBin helpers — free tier: https://jsonbin.io */
  async function cloudPull(binId) {
    if (!binId) throw new Error('No bin ID');
    const res = await fetch('https://api.jsonbin.io/v3/b/' + encodeURIComponent(binId) + '/latest', {
      headers: { 'X-Bin-Meta': 'false' }
    });
    if (!res.ok) throw new Error('Pull failed (' + res.status + ')');
    const json = await res.json();
    return json.record || json;
  }

  async function cloudPush(binId, apiKey, payload) {
    if (!binId || !apiKey) throw new Error('Bin ID and API key required');
    const res = await fetch('https://api.jsonbin.io/v3/b/' + encodeURIComponent(binId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('Push failed (' + res.status + '): ' + t.slice(0, 120));
    }
    return true;
  }

  return {
    loadJournal, saveJournal,
    loadNotes, saveNotes,
    loadInbox, saveInbox,
    loadSettings, saveSettings,
    loadCV, saveCV,
    loadCloudConfig, saveCloudConfig,
    exportAll, importAll,
    cloudPull, cloudPush,
    DEFAULT_SETTINGS,
    SEED_POSTS
  };
})();
