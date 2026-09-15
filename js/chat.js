/* Realtime chat via Firebase Realtime Database */
(function () {
  const cfg = window.HimelFirebase || { enabled: false };
  const NAME_KEY = 'himel_chat_name';

  const listEl = document.getElementById('chatList');
  const setupEl = document.getElementById('chatSetup');
  const roomEl = document.getElementById('chatRoom');
  const statusEl = document.getElementById('chatStatus');
  const offlineEl = document.getElementById('chatOffline');
  const inputEl = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const nameInput = document.getElementById('chatNameInput');
  const joinBtn = document.getElementById('chatJoin');

  if (!listEl) return;

  let db = null;
  let myName = localStorage.getItem(NAME_KEY) || '';
  let messagesRef = null;

  function toast(msg) {
    if (window.himelToast) window.himelToast(msg);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setConnected(on) {
    if (statusEl) {
      statusEl.classList.toggle('off', !on);
      statusEl.title = on ? 'Connected' : 'Offline';
    }
  }

  function showSetup() {
    if (setupEl) setupEl.style.display = 'flex';
    if (roomEl) roomEl.style.display = 'none';
  }

  function showRoom() {
    if (setupEl) setupEl.style.display = 'none';
    if (roomEl) roomEl.style.display = 'flex';
  }

  function renderMessage(id, m) {
    if (!listEl || !m || !m.text) return;
    if (listEl.querySelector('[data-id="' + id + '"]')) return;
    const mine = m.author === myName;
    const div = document.createElement('div');
    div.className = 'chat-item ' + (mine ? 'me' : 'them');
    div.dataset.id = id;
    const time = m.time ? new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    div.innerHTML =
      (mine ? '' : '<div class="chat-author">' + escapeHtml(m.author || 'Guest') + '</div>') +
      '<div class="chat-bubble">' + escapeHtml(m.text) + '</div>' +
      (time ? '<div class="chat-time">' + time + '</div>' : '');
    listEl.appendChild(div);
    listEl.scrollTop = listEl.scrollHeight;
  }

  function initFirebase() {
    if (!cfg.enabled) {
      if (offlineEl) {
        offlineEl.style.display = 'block';
        offlineEl.innerHTML =
          'Chat is not connected yet.<br><span style="font-size:0.82rem">Owner: enable Firebase in <code>js/firebase-config.js</code> (see DEPLOY.md).</span>';
      }
      if (setupEl) setupEl.style.display = 'none';
      if (roomEl) roomEl.style.display = 'none';
      setConnected(false);
      return;
    }

    if (typeof firebase === 'undefined') {
      if (offlineEl) {
        offlineEl.style.display = 'block';
        offlineEl.textContent = 'Firebase SDK failed to load. Check your network.';
      }
      setConnected(false);
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg.config);
      }
      db = firebase.database();
      messagesRef = db.ref('chat/messages');
      setConnected(true);
      if (offlineEl) offlineEl.style.display = 'none';

      if (myName) showRoom();
      else showSetup();

      // Limit to last 80 messages
      messagesRef.limitToLast(80).on('child_added', (snap) => {
        renderMessage(snap.key, snap.val());
      });
    } catch (e) {
      console.error(e);
      setConnected(false);
      if (offlineEl) {
        offlineEl.style.display = 'block';
        offlineEl.textContent = 'Could not connect to chat. Check Firebase config.';
      }
    }
  }

  function sendMessage() {
    if (!messagesRef || !myName) return;
    const text = (inputEl && inputEl.value || '').trim();
    if (!text) return;
    messagesRef.push({
      author: myName,
      text: text.slice(0, 500),
      time: Date.now()
    }).catch((err) => {
      toast('Send failed — check database rules');
      console.error(err);
    });
    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }
  }

  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      const n = (nameInput && nameInput.value || '').trim().slice(0, 24);
      if (!n) {
        toast('Enter a display name');
        return;
      }
      myName = n;
      localStorage.setItem(NAME_KEY, myName);
      showRoom();
      if (inputEl) inputEl.focus();
    });
  }

  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinBtn && joinBtn.click();
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Wait for Firebase scripts if loading async
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    // Small delay so CDN scripts can finish
    setTimeout(initFirebase, 100);
  }
})();
