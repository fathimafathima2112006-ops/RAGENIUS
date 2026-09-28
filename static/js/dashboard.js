// ============================================================
// RAGENIUS Dashboard — chat, uploads, voice input/output, insights
// ============================================================
(function () {
  let currentConversationId = null;
  let currentLanguage = 'English';
  let isRecording = false;
  let recognition = null;

  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const micBtn = document.getElementById('micBtn');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const docList = document.getElementById('docList');
  const contextList = document.getElementById('contextList');
  const chunksFoundLabel = document.getElementById('chunksFoundLabel');
  const insightList = document.getElementById('insightList');
  const chatTitle = document.getElementById('chatTitle');
  const toast = document.getElementById('toast');

  // ---------------- Toast ----------------
  function showToast(msg, type = 'info') {
    const colors = { info: '#22e8ff', error: '#ff5577', success: '#2ee6a6' };
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      background: rgba(15,17,40,0.95); border:1px solid ${colors[type] || colors.info};
      color:#eef0ff; padding:12px 18px; border-radius:12px; margin-top:10px; font-size:0.85rem;
      box-shadow:0 0 20px ${colors[type] || colors.info}55; animation: msgIn .3s ease;
      max-width:320px;`;
    toast.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  // ---------------- Language pills ----------------
  document.querySelectorAll('.lang-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLanguage = btn.dataset.lang;
      showToast(`Language set to ${currentLanguage}`, 'success');
    });
  });

  // ---------------- Chat rendering ----------------
  function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendMessage(role, content, sources, time) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${role === 'user' ? 'user' : 'bot'}`;

    const pre = document.createElement('pre');
    pre.textContent = content;
    wrap.appendChild(pre);

    if (sources && sources.length) {
      const box = document.createElement('div');
      box.className = 'sources-box';
      sources.forEach(s => {
        const chip = document.createElement('span');
        chip.className = 'source-chip';
        chip.innerHTML = `📄 ${s.filename} · Page ${s.page}`;
        box.appendChild(chip);
      });
      wrap.appendChild(box);
    }

    if (role !== 'user') {
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.innerHTML = `
        <button class="read-aloud-btn">🔊 Read Answer</button>
        <button class="copy-btn">📋 Copy</button>
        <button class="share-btn">🔗 Share</button>`;
      wrap.appendChild(actions);

      actions.querySelector('.read-aloud-btn').addEventListener('click', () => speak(content));
      actions.querySelector('.copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(content);
        showToast('Copied to clipboard', 'success');
      });
      actions.querySelector('.share-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(content);
        showToast('Answer copied — paste it anywhere to share', 'success');
      });
    }

    const timeEl = document.createElement('span');
    timeEl.className = 'time';
    timeEl.textContent = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    wrap.appendChild(timeEl);

    chatBody.appendChild(wrap);
    scrollToBottom();
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    wrap.id = 'typingIndicator';
    wrap.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
    chatBody.appendChild(wrap);
    scrollToBottom();
  }
  function hideTyping() {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  }

  function updateContextPanel(sources) {
    if (!sources || !sources.length) {
      contextList.innerHTML = `<div style="color:var(--text-dim);font-size:0.78rem;">No matching chunks found — I'll answer from general knowledge.</div>`;
      chunksFoundLabel.textContent = '0 Chunks Found';
      return;
    }
    chunksFoundLabel.textContent = `${sources.length} Chunks Found`;
    contextList.innerHTML = sources.map((s, i) => `
      <div class="context-item">
        <div class="num">${i + 1}</div>
        <div>
          <div class="meta-line">📄 ${s.filename} · Page ${s.page} · Chunk ${s.chunk}</div>
          <div>${s.snippet}...</div>
        </div>
      </div>`).join('');
  }

  function refreshInsights() {
    fetch('/api/insights').then(r => r.json()).then(data => {
      if (data.success) {
        insightList.innerHTML = data.insights.map(i => `<li>${i}</li>`).join('');
      }
    }).catch(() => {});
  }

  // ---------------- Sending messages ----------------
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    appendMessage('user', text);
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: currentConversationId,
          message: text,
          language: currentLanguage,
        }),
      });
      const data = await res.json();
      hideTyping();

      if (!data.success) {
        showToast(data.error || 'Something went wrong', 'error');
        return;
      }

      currentConversationId = data.conversation_id;
      chatTitle.textContent = data.title || 'Conversation';
      appendMessage('bot', data.answer, data.sources);
      updateContextPanel(data.sources);
      refreshInsights();
    } catch (e) {
      hideTyping();
      showToast('Network error — is the Flask server running?', 'error');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  document.getElementById('newChatBtn').addEventListener('click', () => {
    currentConversationId = null;
    chatTitle.textContent = 'New Conversation';
    chatBody.innerHTML = '';
    appendMessage('bot', 'New conversation started. Ask me anything!');
  });
  document.getElementById('qaNewChat').addEventListener('click', () => document.getElementById('newChatBtn').click());
  document.getElementById('qaNewConv').addEventListener('click', () => document.getElementById('newChatBtn').click());

  document.getElementById('deleteChatBtn').addEventListener('click', () => {
    if (!currentConversationId) { showToast('No conversation selected'); return; }
    fetch(`/api/conversations/${currentConversationId}`, { method: 'DELETE' })
      .then(r => r.json()).then(() => {
        showToast('Conversation deleted', 'success');
        document.getElementById('newChatBtn').click();
        setTimeout(() => location.reload(), 800);
      });
  });

  // Load a past conversation
  document.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;
      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();
      if (!data.success) return;
      currentConversationId = parseInt(id);
      chatTitle.textContent = data.title;
      chatBody.innerHTML = '';
      data.messages.forEach(m => appendMessage(m.role, m.content, m.sources, m.created_at));
      if (data.messages.length) {
        const lastBot = [...data.messages].reverse().find(m => m.role === 'assistant');
        if (lastBot) updateContextPanel(lastBot.sources);
      }
    });
  });

  // ---------------- PDF Upload ----------------
  uploadBtn.addEventListener('click', () => fileInput.click());
  document.getElementById('qaUpload').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    showToast(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Upload failed', 'error');
        return;
      }
      showToast(`${data.document.filename} indexed — ${data.document.chunk_count} chunks`, 'success');

      const emptyState = docList.querySelector('.empty-state');
      if (emptyState) emptyState.remove();

      const item = document.createElement('div');
      item.className = 'doc-item';
      item.dataset.name = data.document.filename.toLowerCase();
      item.innerHTML = `
        <span class="flag">📕</span>
        <div class="info">
          <div class="name">${data.document.filename}</div>
          <div class="meta">${data.document.pages} pages · ${data.document.chunk_count} chunks</div>
        </div>
        <span class="check">✅</span>
        <button class="del-btn" data-id="${data.document.id}" title="Delete">🗑️</button>`;
      docList.prepend(item);
      bindDeleteButton(item.querySelector('.del-btn'));
    } catch (e) {
      showToast('Upload error', 'error');
    }
    fileInput.value = '';
  });

  function bindDeleteButton(btn) {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      btn.closest('.doc-item').remove();
      showToast('Document removed', 'success');
    });
  }
  document.querySelectorAll('.del-btn').forEach(bindDeleteButton);

  document.getElementById('qaClear').addEventListener('click', async () => {
    if (!confirm('Clear your entire knowledge base? This cannot be undone.')) return;
    await fetch('/api/knowledge-base/clear', { method: 'POST' });
    location.reload();
  });

  document.getElementById('docSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.doc-item').forEach(item => {
      item.style.display = item.dataset.name.includes(q) ? 'flex' : 'none';
    });
  });

  // ---------------- Voice input (Web Speech API) ----------------
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LANG_CODES = {
    English: 'en-IN', Tamil: 'ta-IN', Tanglish: 'en-IN', Hindi: 'hi-IN',
    Telugu: 'te-IN', Malayalam: 'ml-IN', Kannada: 'kn-IN',
  };

  function initRecognition() {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      chatInput.value = transcript;
      showToast('Heard: ' + transcript, 'success');
    };
    r.onerror = () => showToast('Voice input error — check mic permissions', 'error');
    r.onend = () => { isRecording = false; micBtn.classList.remove('recording'); };
    return r;
  }

  function toggleVoiceInput() {
    if (!SpeechRecognition) {
      showToast('Voice input is not supported in this browser. Try Chrome.', 'error');
      return;
    }
    if (!recognition) recognition = initRecognition();
    recognition.lang = LANG_CODES[currentLanguage] || 'en-IN';

    if (isRecording) {
      recognition.stop();
      isRecording = false;
      micBtn.classList.remove('recording');
    } else {
      recognition.start();
      isRecording = true;
      micBtn.classList.add('recording');
      showToast('Listening... speak now 🎤');
    }
  }

  micBtn.addEventListener('click', toggleVoiceInput);
  document.getElementById('voiceQuickBtn').addEventListener('click', toggleVoiceInput);
  document.getElementById('qaVoice').addEventListener('click', toggleVoiceInput);
  document.getElementById('voiceNavBtn').addEventListener('click', toggleVoiceInput);

  // ---------------- Text-to-speech (read aloud) ----------------
  const TTS_LANG_CODES = { English: 'en-IN', Tamil: 'ta-IN', Tanglish: 'en-IN', Hindi: 'hi-IN', Telugu: 'te-IN', Malayalam: 'ml-IN', Kannada: 'kn-IN' };

  function speak(text) {
    if (!window.speechSynthesis) {
      showToast('Text-to-speech not supported in this browser', 'error');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = TTS_LANG_CODES[currentLanguage] || 'en-IN';
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  }

  document.getElementById('qaRead').addEventListener('click', () => {
    const bots = chatBody.querySelectorAll('.msg.bot pre');
    if (!bots.length) { showToast('No answer to read yet'); return; }
    speak(bots[bots.length - 1].textContent);
  });

  // ---------------- Analyze insights ----------------
  document.getElementById('analyzeBtn').addEventListener('click', refreshInsights);

  // ---------------- Global search Ctrl+K ----------------
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      document.getElementById('globalSearch').focus();
    }
  });

  refreshInsights();
})();
