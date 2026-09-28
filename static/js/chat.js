// RAGENIUS Chat — text chat, PDF grounding, best-effort web sources, voice input and read-aloud.
(function () {
  // Keep the active conversation across page navigation. A new chat is only
  // created when the user explicitly presses "New Chat".
  const SAVED_CONVERSATION_KEY = 'ragenius_current_conversation_id';
  const urlConversationId = (typeof window.RAGENIUS_LOAD_CONVERSATION_ID !== 'undefined') ? window.RAGENIUS_LOAD_CONVERSATION_ID : null;
  let currentConversationId = urlConversationId || localStorage.getItem(SAVED_CONVERSATION_KEY) || null;

  function saveCurrentConversation() {
    if (currentConversationId !== null && currentConversationId !== undefined && String(currentConversationId) !== '') {
      localStorage.setItem(SAVED_CONVERSATION_KEY, String(currentConversationId));
    } else {
      localStorage.removeItem(SAVED_CONVERSATION_KEY);
    }
    const nav = document.getElementById('chatNavLink');
    if (nav) nav.href = currentConversationId ? `/dashboard?conv=${encodeURIComponent(currentConversationId)}` : '/dashboard';
  }

  // If the server explicitly opened a conversation, make it the active one.
  if (urlConversationId) saveCurrentConversation();
  let currentLanguage = localStorage.getItem('ragenius_default_lang') || 'Auto';
  let isRecording = false;
  let recognition = null;
  let voices = [];

  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const micBtn = document.getElementById('micBtn');
  const fileInput = document.getElementById('fileInput');
  const attachBtn = document.getElementById('attachBtn');
  const contextList = document.getElementById('contextList');
  const chunksFoundLabel = document.getElementById('chunksFoundLabel');
  const chatTitle = document.getElementById('chatTitle');
  const toast = document.getElementById('toast');
  const aiStatus = document.getElementById('aiStatus');
  const aiStatusText = document.getElementById('aiStatusText');

  function setAIStatus(text, visible = true) {
    if (!aiStatus) return;
    aiStatus.hidden = !visible;
    if (aiStatusText) aiStatusText.textContent = text;
  }
  function statusForQuery(text) {
    const n = String(text || '').toLowerCase().trim();
    if (/^(h+a*i+|h+e+l+o+|h+e+y+|hlo|yo|sup|gm|gn|ga|ge|vanakkam|vanakam|வணக்கம்|thanks|thank you|thx|bye|good\s*(morning|mrng|evening|afternoon|night)|gud\s*\w+)\b/.test(n)) return ['Understanding your message…','Keeping it conversational…'];
    if (/\b(talk|speak|reply|answer|respond|use)\s+(in\s+)?(english|tamil|tanglish|hindi|telugu|malayalam|kannada)\b/.test(n) || /தமிழில்|हिंदी में|తెలుగులో|മലയാളത്തിൽ|ಕನ್ನಡದಲ್ಲಿ/.test(n)) return ['Understanding your language request…','Applying the requested language…','Writing the answer…'];
    if (/\b(very\s+small|very\s+short|short|small|mini|tiny)\s+(story|stories|kathai|kadhai)\b/.test(n) || /\b(write|create|generate|make|tell|give)\b.*\b(story|poem|poetry|joke|dialogue|script|caption)\b/.test(n)) return ['Understanding your creative request…','Keeping unrelated knowledge out…','Writing an original response…'];
    if (/\b(compare|difference|different|vs|versus)\b/.test(n)) return ['Understanding your comparison…','Checking relevant knowledge…','Writing a clear comparison…'];
    if (/\b(detail|explain|how|why|formula|calculate|solve|code|debug|steps|process)\b/.test(n)) return ['Understanding your request…','Selecting relevant knowledge…','Building the answer…'];
    return ['Understanding your question…','Deciding whether knowledge lookup is needed…','Writing the answer…'];
  }
  async function runStatusStages(stages) {
    for (let i=0;i<stages.length;i++) { setAIStatus(stages[i], true); await new Promise(r=>setTimeout(r, i===stages.length-1 ? 180 : 320)); }
  }

  if (!chatBody) return;

  function showToast(msg, type = 'info') {
    const colors = { info: '#22e8ff', error: '#ff5577', success: '#2ee6a6' };
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `background:rgba(15,17,40,.96);border:1px solid ${colors[type] || colors.info};color:#eef0ff;padding:12px 18px;border-radius:12px;margin-top:10px;font-size:.85rem;box-shadow:0 0 20px ${colors[type] || colors.info}55;max-width:340px;animation:msgIn .3s ease;`;
    if (toast) toast.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }
  window.ragShowToast = showToast;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function inlineMarkdown(value) {
    let out = escapeHtml(value);
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    return out;
  }

  function isTableSeparator(line) {
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
    return cells.length >= 2 && cells.every(c => /^\s*:?-{3,}:?\s*$/.test(c));
  }

  function tableHtml(rows) {
    if (rows.length < 2) return '';
    const cells = row => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    const header = cells(rows[0]);
    const body = rows.slice(2).map(cells);
    let html = '<div class="answer-table-wrap"><table class="answer-table"><thead><tr>';
    header.forEach(c => html += `<th>${inlineMarkdown(c)}</th>`);
    html += '</tr></thead><tbody>';
    body.forEach(r => {
      html += '<tr>';
      header.forEach((_, i) => html += `<td>${inlineMarkdown(r[i] || '')}</td>`);
      html += '</tr>';
    });
    return html + '</tbody></table></div>';
  }

  function flowHtml(lines) {
    // Each line is one chain:  Step A -> Step B -> Step C   (branches go on separate lines)
    const chains = lines.map(l => l.trim()).filter(Boolean).map(l => l.split(/\s*(?:->|→|=>|➜|➡️)\s*/).map(x => x.trim()).filter(Boolean));
    let html = '<div class="answer-flow">';
    chains.forEach(chain => {
      html += '<div class="flow-chain">';
      chain.forEach((step, i) => {
        html += `<span class="flow-node${i === 0 ? ' start' : ''}${i === chain.length - 1 && chain.length > 1 ? ' end' : ''}">${inlineMarkdown(step)}</span>`;
        if (i < chain.length - 1) html += '<span class="flow-arrow">➜</span>';
      });
      html += '</div>';
    });
    return html + '</div>';
  }

  function formatAnswer(text) {
    // Some models still emit literal <br>. Treat it as a line break, never as HTML.
    const normalized = String(text || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    let html = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Fenced blocks: ```flow ... ```  (visual flowchart)  or  ```lang ... ```  (code)
      const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
      if (fence) {
        const lang = (fence[1] || '').toLowerCase();
        const block = []; let j = i + 1;
        while (j < lines.length && !/^\s*```\s*$/.test(lines[j])) { block.push(lines[j]); j++; }
        if (lang === 'flow' || lang === 'flowchart') html += flowHtml(block);
        else html += `<div class="answer-code"><div class="code-lang">${escapeHtml(lang || 'code')}</div><pre><code>${escapeHtml(block.join('\n'))}</code></pre></div>`;
        i = j; continue;
      }

      if (!line.trim()) { html += '<div class="answer-spacer"></div>'; continue; }

      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html += '<hr class="answer-hr">'; continue; }

      if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const rows = [line, lines[i + 1]];
        let j = i + 2;
        while (j < lines.length && lines[j].includes('|') && lines[j].trim()) { rows.push(lines[j]); j++; }
        html += tableHtml(rows);
        i = j - 1;
        continue;
      }

      const heading = line.match(/^#{1,4}\s+(.+)$/);
      if (heading) { html += `<h4>${inlineMarkdown(heading[1])}</h4>`; continue; }

      const quote = line.match(/^\s*>\s?(.*)$/);
      if (quote) { html += `<div class="answer-quote">${inlineMarkdown(quote[1])}</div>`; continue; }

      const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
      if (bullet) { html += `<div class="answer-bullet"><i></i><span>${inlineMarkdown(bullet[1])}</span></div>`; continue; }

      const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
      if (numbered) { html += `<div class="answer-step"><span>${numbered[1]}</span><div>${inlineMarkdown(numbered[2])}</div></div>`; continue; }

      html += `<div class="answer-line">${inlineMarkdown(line)}</div>`;
    }
    return html;
  }

  let lastUserText = '';
  let animateNext = false;
  function scrollToBottom() { chatBody.scrollTop = chatBody.scrollHeight; }

  function openSourceDetails(kind, list) {
    // kind: 'web' | 'pdf'.  Details are shown ONLY after the user taps the chip.
    let modal = document.getElementById('sourceDetailsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sourceDetailsModal';
      modal.className = 'source-details-modal';
      modal.innerHTML = `
        <div class="source-details-backdrop"></div>
        <div class="source-details-card" role="dialog" aria-modal="true" aria-labelledby="sourceDetailsTitle">
          <button class="source-details-close" type="button" aria-label="Close">×</button>
          <div class="source-details-type" id="sourceDetailsType"></div>
          <div id="sourceDetailsBody"></div>
        </div>`;
      document.body.appendChild(modal);
      const close = () => modal.classList.remove('show');
      modal.querySelector('.source-details-close').addEventListener('click', close);
      modal.querySelector('.source-details-backdrop').addEventListener('click', close);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    modal.querySelector('#sourceDetailsType').textContent = kind === 'web' ? '🌐 WEB SOURCE' + (list.length > 1 ? 'S' : '') : '📄 DOCUMENT SOURCE' + (list.length > 1 ? 'S' : '');
    modal.querySelector('#sourceDetailsBody').innerHTML = list.map(s => kind === 'web' ? `
      <div class="source-item">
        <h3>${escapeHtml(s.title || 'Web source')}</h3>
        <p>${escapeHtml(s.snippet || 'No preview available.')}</p>
        <div class="source-details-url">${escapeHtml(s.url || '')}</div>
        ${s.url ? `<a class="source-details-open" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>` : ''}
      </div>` : `
      <div class="source-item">
        <h3>📄 ${escapeHtml(s.filename || 'Document')}</h3>
        <div class="source-details-url">Page ${escapeHtml(s.page ?? '—')} · Chunk ${escapeHtml(s.chunk ?? '—')}</div>
        <p>${escapeHtml(s.snippet || 'No preview available.')}…</p>
      </div>`).join('');
    modal.classList.add('show');
  }

  function appendMessage(role, content, sources, time, messageId, confidence) {
    const wrap = document.createElement('div');
    wrap.className = `msg ${role === 'user' ? 'user' : 'bot'}`;

    if (role === 'user') {
      const pre = document.createElement('pre');
      pre.textContent = content;
      wrap.appendChild(pre);
    } else {
      const answer = document.createElement('div');
      answer.className = 'answer-content';
      const decorateCode = () => answer.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.code-copy-btn')) return;
        const b = document.createElement('button'); b.type = 'button'; b.className = 'code-copy-btn'; b.textContent = 'Copy code';
        b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(pre.innerText.replace(/Copy code$/, '').trim()); b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy code', 1500); } catch (_) {} });
        pre.style.position = 'relative'; pre.appendChild(b);
      });
      const fullText = String(content || '');
      if (animateNext && fullText.length < 3500) {
        // ChatGPT-style typing: reveal the answer progressively, tap the bubble to skip.
        wrap.classList.add('typing-reveal');
        let shown = 0, done = false;
        const step = Math.max(2, Math.ceil(fullText.length / 140));
        const finish = () => { if (done) return; done = true; answer.innerHTML = formatAnswer(fullText); decorateCode(); wrap.classList.remove('typing-reveal'); scrollToBottom(); };
        wrap.addEventListener('click', finish, { once: true });
        (function tick() {
          if (done) return;
          shown = Math.min(fullText.length, shown + step);
          answer.innerHTML = formatAnswer(fullText.slice(0, shown));
          scrollToBottom();
          if (shown >= fullText.length) finish(); else setTimeout(tick, 16);
        })();
      } else {
        answer.innerHTML = formatAnswer(fullText);
        decorateCode();
      }
      wrap.appendChild(answer);
    }

    if (role !== 'user' && sources && sources.length) {
      const webs = sources.filter(x => x.type === 'web');
      const docs = sources.filter(x => x.type !== 'web');
      const box = document.createElement('div');
      box.className = 'sources-box';
      // One compact chip per kind — no details visible until the user taps it.
      if (webs.length) {
        const chip = document.createElement('button');
        chip.type = 'button'; chip.className = 'source-chip source-web'; chip.textContent = '🌐 Web';
        chip.setAttribute('aria-label', 'Show web source details');
        chip.addEventListener('click', () => openSourceDetails('web', webs));
        box.appendChild(chip);
      }
      if (docs.length) {
        const chip = document.createElement('button');
        chip.type = 'button'; chip.className = 'source-chip source-pdf'; chip.textContent = '📄 Source';
        chip.setAttribute('aria-label', 'Show document source details');
        chip.addEventListener('click', () => openSourceDetails('pdf', docs));
        box.appendChild(chip);
      }
      wrap.appendChild(box);
    }

    if (role !== 'user') {
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      actions.innerHTML = `
        <button class="read-aloud-btn" type="button" title="Read aloud"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg><span>Read</span></button>
        <button class="copy-btn" type="button" title="Copy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span></button>
        <button class="share-btn" type="button" title="Share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4M12 2v14"/></svg><span>Share</span></button>
        <button class="regen-btn" type="button" title="Regenerate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg><span>Retry</span></button>
        <button class="feedback-btn up" type="button" title="Helpful"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.5l-1.7 7A2 2 0 0 1 18.1 21H7V10l4-8a2 2 0 0 1 4 1.9z"/></svg></button>
        <button class="feedback-btn down" type="button" title="Not helpful"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.5l1.7-7A2 2 0 0 1 5.9 3H17v11l-4 8a2 2 0 0 1-4-1.9z"/></svg></button>`;
      wrap.appendChild(actions);

      const readBtn = actions.querySelector('.read-aloud-btn');
      readBtn.addEventListener('click', () => {
        if (readBtn.classList.contains('speaking')) { stopSpeaking(); return; }
        stopSpeaking(); readBtn.classList.add('speaking'); readBtn.querySelector('span').textContent = 'Stop'; speak(content);
      });
      actions.querySelector('.regen-btn').addEventListener('click', () => { if (lastUserText) sendMessage(lastUserText); });
      actions.querySelector('.copy-btn').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(content); showToast('Answer copied', 'success'); }
        catch { showToast('Copy was blocked by the browser', 'error'); }
      });
      actions.querySelector('.share-btn').addEventListener('click', async () => {
        try {
          if (navigator.share) await navigator.share({ title: chatTitle?.textContent || 'RAGENIUS Answer', text: content });
          else { await navigator.clipboard.writeText(content); showToast('Answer copied — sharing is not available here', 'success'); }
        } catch (err) { if (err?.name !== 'AbortError') showToast('Could not share this answer', 'error'); }
      });
      async function rate(rating) {
        if (!messageId) { showToast('Send the message first, then rate the answer'); return; }
        try {
          const res = await fetch('/api/feedback', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message_id:messageId, rating})});
          const data = await res.json();
          if (data.success) { actions.querySelectorAll('.feedback-btn').forEach(b=>b.classList.remove('selected')); actions.querySelector('.'+(rating==='up'?'up':'down')).classList.add('selected'); showToast(rating==='up'?'Thanks for the feedback 👍':'Thanks — I’ll use that feedback to improve.', 'success'); }
        } catch { showToast('Could not save feedback', 'error'); }
      }
      actions.querySelector('.feedback-btn.up').addEventListener('click',()=>rate('up'));
      actions.querySelector('.feedback-btn.down').addEventListener('click',()=>rate('down'));
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
    wrap.className = 'msg bot'; wrap.id = 'typingIndicator';
    wrap.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatBody.appendChild(wrap); scrollToBottom();
  }
  function hideTyping() { document.getElementById('typingIndicator')?.remove(); }

  function updateAIActivity(items) {
    const panel = document.getElementById('aiActivity');
    if (!panel) return;
    if (!items || !items.length) {
      panel.innerHTML = '<div class="activity-empty">No activity details for this message.</div>';
      return;
    }
    panel.innerHTML = items.map(item => `
      <div class="activity-row">
        <span class="activity-icon">${escapeHtml(item.icon || '•')}</span>
        <div class="activity-copy"><span>${escapeHtml(item.label || '')}</span><strong>${escapeHtml(item.value || '')}</strong></div>
      </div>`).join('');
  }

  function updateContextPanel() { /* right panel removed — sources now live under each answer */ }

  async function sendMessage(prefilledText) {
    const text = (prefilledText !== undefined ? prefilledText : chatInput.value).trim();
    if (!text) return;
    if (prefilledText === undefined) { chatInput.value = ''; chatInput.style.height = 'auto'; }
    lastUserText = text; stopSpeaking();
    appendMessage('user', text);
    showTyping();
    const statusPromise = runStatusStages(statusForQuery(text));
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: currentConversationId, message: text, language: currentLanguage, client_time: (() => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`; })() })
      });
      const data = await res.json(); await statusPromise; hideTyping(); setAIStatus('', false);
      if (!data.success) { showToast(data.error || 'Something went wrong', 'error'); return; }
      currentConversationId = data.conversation_id;
      saveCurrentConversation();
      if (data.language?.auto_follow_after_turn) {
        currentLanguage = 'Auto';
        localStorage.setItem('ragenius_default_lang', 'Auto');
        window.dispatchEvent(new Event('ragenius-language-changed'));
      }
      if (chatTitle) chatTitle.textContent = data.title || 'Conversation';
      animateNext = true;
      appendMessage('bot', data.answer, data.sources, null, data.assistant_message_id, data.confidence);
      animateNext = false;
      updateContextPanel(data.sources);
      updateAIActivity(data.ai_activity || []);
      if (document.getElementById('retrievalMs')) document.getElementById('retrievalMs').textContent = data.retrieval?.retrieval_ms ? `${data.retrieval.retrieval_ms} ms` : '—';
      if (document.getElementById('llmMs')) document.getElementById('llmMs').textContent = data.retrieval?.llm_ms ? `${data.retrieval.llm_ms} ms` : '—';
      if (document.getElementById('confidenceScore')) document.getElementById('confidenceScore').textContent = data.confidence != null ? `${data.confidence}%` : '—';
      history.replaceState({}, '', `/dashboard?conv=${currentConversationId}`);
      if (localStorage.getItem('ragenius_auto_read') === '1') speak(data.answer);
    } catch (e) { hideTyping(); setAIStatus('', false); showToast('Network error — is the Flask server running?', 'error'); }
  }
  window.ragSendMessage = sendMessage;

  sendBtn?.addEventListener('click', () => sendMessage());
  function autoGrow() { if (!chatInput) return; chatInput.style.height = 'auto'; chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px'; }
  chatInput?.addEventListener('input', autoGrow);
  chatInput?.addEventListener('keydown', e => {
    // Enter = send, Shift+Enter = new line (like ChatGPT). IME composition is ignored.
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMessage(); setTimeout(autoGrow, 0); }
  });
  document.querySelectorAll('.quick-prompt-chip').forEach(chip => chip.addEventListener('click', () => sendMessage(chip.dataset.prompt)));

  function startNewChat() {
    currentConversationId = null;
    saveCurrentConversation();
    history.replaceState({}, '', '/dashboard');
    if (chatTitle) chatTitle.textContent = 'New Conversation';
    chatBody.innerHTML = '';
    appendMessage('bot', 'New conversation started. Ask me anything!');
    updateContextPanel([]);
    updateAIActivity([]);
    chatInput?.focus();
  }
  document.getElementById('newChatBtn')?.addEventListener('click', startNewChat);
  document.getElementById('qaNewChat')?.addEventListener('click', startNewChat);

  document.getElementById('deleteChatBtn')?.addEventListener('click', async () => {
    if (!currentConversationId) { showToast('No conversation selected'); return; }
    try {
      const res = await fetch(`/api/conversations/${currentConversationId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Conversation deleted', 'success'); startNewChat(); }
    } catch { showToast('Could not delete conversation', 'error'); }
  });

  // Restore the same conversation after visiting another page.
  if (currentConversationId) {
    saveCurrentConversation();
    fetch(`/api/conversations/${currentConversationId}/messages`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          // Conversation was deleted or is no longer available.
          currentConversationId = null;
          saveCurrentConversation();
          return;
        }
        if (chatTitle) chatTitle.textContent = data.title || 'Conversation';
        chatBody.innerHTML = '';
        data.messages.forEach(m => appendMessage(m.role, m.content, m.sources, m.created_at, m.id));
        const lastBot = [...data.messages].reverse().find(m => m.role === 'assistant');
        if (lastBot) { updateContextPanel(lastBot.sources); updateAIActivity([{icon:'📚',label:'Knowledge',value:(lastBot.sources && lastBot.sources.length) ? `${lastBot.sources.length} source(s) in saved answer` : 'Not needed'}, {icon:'🧭',label:'Route',value:'Loaded from chat history'}]); }
      })
      .catch(() => showToast('Could not load this conversation', 'error'));
  }

  // PDF upload
  const uploadBtn = document.getElementById('uploadBtn');
  uploadBtn?.addEventListener('click', () => fileInput?.click());
  attachBtn?.addEventListener('click', () => fileInput?.click());
  document.getElementById('qaUpload')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0]; if (!file) return;
    showToast(`Indexing ${file.name}...`);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) showToast(data.error || 'Upload failed', 'error');
      else showToast(`${data.document.filename} indexed`, 'success');
    } catch { showToast('Upload error', 'error'); }
    fileInput.value = '';
  });

  // Voice input inside Chat only.
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LANG_CODES = { Auto:'en-IN', English:'en-IN', Tamil:'ta-IN', Tanglish:'en-IN', Hindi:'hi-IN', Telugu:'te-IN', Malayalam:'ml-IN', Kannada:'kn-IN' };
  function initRecognition() {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition(); r.continuous = false; r.interimResults = false;
    r.onresult = e => { chatInput.value = e.results[0][0].transcript; showToast('Voice captured', 'success'); };
    r.onerror = () => showToast('Voice input error — check microphone permission', 'error');
    r.onend = () => { isRecording = false; micBtn?.classList.remove('recording'); };
    return r;
  }
  function toggleVoiceInput() {
    if (!SpeechRecognition) { showToast('Voice input is not supported in this browser. Try Chrome or Edge.', 'error'); return; }
    if (!recognition) recognition = initRecognition();
    currentLanguage = localStorage.getItem('ragenius_default_lang') || 'Auto';
    recognition.lang = LANG_CODES[currentLanguage] || 'en-IN';
    if (isRecording) { recognition.stop(); isRecording = false; micBtn?.classList.remove('recording'); }
    else { recognition.start(); isRecording = true; micBtn?.classList.add('recording'); showToast('Listening... speak now 🎤'); }
  }
  micBtn?.addEventListener('click', toggleVoiceInput);

  // Read answer — robust voice loading for Chrome/Edge/Android.
  const TTS_LANG_CODES = { Auto:'en-IN', English:'en-IN', Tamil:'ta-IN', Tanglish:'en-IN', Hindi:'hi-IN', Telugu:'te-IN', Malayalam:'ml-IN', Kannada:'kn-IN' };
  function refreshVoices() { voices = window.speechSynthesis?.getVoices?.() || []; }
  refreshVoices();
  if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = refreshVoices;

  // Remove emoji, markdown, links, dashes and symbols so the voice never says "dash dash" or emoji names.
  function cleanForSpeech(text) {
    return String(text || '')
      .replace(/<br\s*\/?\s*>/gi, '. ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/```[\s\S]*?```/g, ' code block. ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ' link ')
      .replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, ' ')
      .replace(/\|/g, ', ')
      .replace(/^\s{0,3}#{1,6}\s*/gm, '')
      .replace(/^\s*[-*+•▪●◦]\s+/gm, '')
      .replace(/^\s*\d+[.)]\s+/gm, '')
      .replace(/(\*\*|__|\*|_|~~)/g, '')
      .replace(/[\u2014\u2013\u2015]+/g, ', ')
      .replace(/(^|\s)-{1,}(\s|$)/g, ' ')
      .replace(/-{2,}/g, ' ')
      .replace(/[=~^<>{}\[\]\\\/#@]+/g, ' ')
      .replace(/(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\uFE0F\u200D\u20E3])/gu, '')
      .replace(/[\u2190-\u21FF\u2500-\u27BF\u2B00-\u2BFF]/g, ' ')
      .replace(/\s*\n+\s*/g, '. ')
      .replace(/([.,!?;:])(\s*[.,;:])+/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  window.ragCleanForSpeech = cleanForSpeech;

  function stopSpeaking() { try { window.speechSynthesis?.cancel(); } catch (_) {} document.querySelectorAll('.read-aloud-btn.speaking').forEach(b => { b.classList.remove('speaking'); b.querySelector('span').textContent = 'Read'; }); }

  function speak(text) {
    if (!window.speechSynthesis) { showToast('Text-to-speech is not supported in this browser', 'error'); return; }
    currentLanguage = localStorage.getItem('ragenius_default_lang') || 'Auto';
    const clean = cleanForSpeech(text);
    if (!clean) { showToast('Nothing to read'); return; }
    window.speechSynthesis.cancel(); refreshVoices();
    const scriptLang = /[\u0B80-\u0BFF]/.test(clean) ? 'ta-IN' : /[\u0900-\u097F]/.test(clean) ? 'hi-IN' : /[\u0C00-\u0C7F]/.test(clean) ? 'te-IN' : /[\u0D00-\u0D7F]/.test(clean) ? 'ml-IN' : /[\u0C80-\u0CFF]/.test(clean) ? 'kn-IN' : null;
    const wanted = (scriptLang || TTS_LANG_CODES[currentLanguage] || 'en-IN').toLowerCase();
    const base = wanted.split('-')[0];
    const voice = voices.find(v => v.lang?.toLowerCase() === wanted) || voices.find(v => v.lang?.toLowerCase().startsWith(base)) || voices.find(v => v.lang?.toLowerCase().startsWith('en'));
    const run = () => {
      const utter = new SpeechSynthesisUtterance(clean); utter.lang = wanted; utter.rate = .94; utter.pitch = 1;
      if (voice) utter.voice = voice;
      utter.onend = stopSpeaking;
      utter.onstart = () => {};
      utter.onerror = () => showToast('Could not read the answer. Try again.', 'error');
      window.speechSynthesis.speak(utter);
    };
    if (!voices.length) setTimeout(() => { refreshVoices(); run(); }, 250); else run();
  }
  window.ragSpeak = speak;
  document.getElementById('qaRead')?.addEventListener('click', () => {
    const bots = chatBody.querySelectorAll('.msg.bot .answer-content');
    if (!bots.length) { showToast('No answer to read yet'); return; }
    speak(bots[bots.length - 1].textContent);
  });

  window.addEventListener('ragenius-language-changed', () => { currentLanguage = localStorage.getItem('ragenius_default_lang') || 'Auto'; });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('globalSearch')?.focus(); }
  });

  // ---- Chat upgrades: suggestion chips, scroll-to-bottom, Esc to stop voice, stop voice on leave ----
  (function upgrades() {
    if (!chatBody) return;
    const first = chatBody.querySelector('.msg.bot');
    if (first && !chatBody.querySelector('.suggest-row') && !window.RAGENIUS_LOAD_CONVERSATION_ID) {
      const row = document.createElement('div'); row.className = 'suggest-row';
      [['Summarize my document','Summarize my uploaded document in simple points'],
       ['Explain like I am 10','Explain the main topic of my document like I am 10 years old'],
       ['Make a quiz','Create 5 quiz questions with answers from my document'],
       ['Tamil-la sollu','Tamil-la simple-ah explain pannu']].forEach(([label, prompt]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'suggest-chip'; b.textContent = label;
        b.addEventListener('click', () => { row.remove(); sendMessage(prompt); }); row.appendChild(b);
      });
      chatBody.appendChild(row);
    }
    const down = document.createElement('button');
    down.type = 'button'; down.className = 'scroll-down-btn'; down.setAttribute('aria-label', 'Scroll to latest');
    down.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    down.addEventListener('click', () => chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' }));
    chatBody.parentElement.style.position = 'relative';
    chatBody.parentElement.appendChild(down);
    chatBody.addEventListener('scroll', () => {
      down.classList.toggle('show', chatBody.scrollHeight - chatBody.scrollTop - chatBody.clientHeight > 160);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') stopSpeaking(); });
    window.addEventListener('beforeunload', stopSpeaking);
  })();
})();
