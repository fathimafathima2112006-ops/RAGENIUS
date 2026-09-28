(function () {
  'use strict';

  let currentLanguage = localStorage.getItem('ragenius_default_lang') || 'Auto';
  let isRecording = false;
  let recognition = null;
  let lastAnswer = '';

  const orbBtn = document.getElementById('voiceOrbBtn');
  const statusEl = document.getElementById('voiceStatus');
  const supportNote = document.getElementById('voiceSupportNote');
  const transcriptBox = document.getElementById('voiceTranscriptBox');
  const transcriptText = document.getElementById('voiceTranscriptText');
  const answerBox = document.getElementById('voiceAnswerBox');
  const answerText = document.getElementById('voiceAnswerText');
  const sourcesBox = document.getElementById('voiceSourcesBox');
  const replayBtn = document.getElementById('voiceReplayBtn');
  const copyBtn = document.getElementById('voiceCopyBtn');
  const shareBtn = document.getElementById('voiceShareBtn');
  const fallbackInput = document.getElementById('voiceFallbackInput');
  const fallbackSend = document.getElementById('voiceFallbackSend');
  const orbWrap = document.querySelector('.voice-orb-wrap');

  const LANG_CODES = {
    Auto: 'en-IN', English: 'en-IN', Tamil: 'ta-IN', Tanglish: 'en-IN',
    Hindi: 'hi-IN', Telugu: 'te-IN', Malayalam: 'ml-IN', Kannada: 'kn-IN'
  };
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function showToast(msg, type) {
    if (window.ragShowToast) {
      window.ragShowToast(msg, type || 'info');
      return;
    }
    statusEl.textContent = msg;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function formatAnswer(text) {
    // Escape first, then support the common markdown that RAGENIUS emits.
    const escaped = String(text || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
    return escaped
      .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/^##\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/^#\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\s*[-*]\s+(.+)$/gm, '<span class="answer-bullet">• $1</span>')
      .replace(/\n/g, '<br>');
  }

  function pickVoice(langOrCode) {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const wanted = (LANG_CODES[langOrCode] || langOrCode || 'en-IN').toLowerCase();
    const base = wanted.split('-')[0];
    return voices.find(v => v.lang && v.lang.toLowerCase() === wanted) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith(base)) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      showToast('Read-aloud is not supported in this browser.', 'error');
      return;
    }

    const clean = String(text || '').replace(/[*_#`]/g, '');
    window.speechSynthesis.cancel();

    const scriptLang = /[\u0B80-\u0BFF]/.test(clean) ? 'ta-IN' :
      /[\u0900-\u097F]/.test(clean) ? 'hi-IN' :
      /[\u0C00-\u0C7F]/.test(clean) ? 'te-IN' :
      /[\u0D00-\u0D7F]/.test(clean) ? 'ml-IN' :
      /[\u0C80-\u0CFF]/.test(clean) ? 'kn-IN' : null;
    const wantedLang = scriptLang || LANG_CODES[currentLanguage] || 'en-IN';

    const run = () => {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = wantedLang;
      utter.rate = 0.94;
      utter.pitch = 1;
      const voice = pickVoice(wantedLang);
      if (voice) utter.voice = voice;
      utter.onstart = () => setStatus('🔊 Reading the answer…');
      utter.onend = () => setStatus('Done. Tap the mic to ask another question.');
      utter.onerror = () => setStatus('Could not play audio. Tap Read Answer to try again.');
      window.speechSynthesis.speak(utter);
    };

    // Mobile browsers often populate voices asynchronously.
    if (!window.speechSynthesis.getVoices().length) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        run();
      };
      setTimeout(() => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) run();
      }, 350);
    } else {
      run();
    }
  }

  function syncLanguageButtons() {
    document.querySelectorAll('#voiceLangRow .lang-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
  }

  document.querySelectorAll('#voiceLangRow .lang-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLanguage = btn.dataset.lang;
      localStorage.setItem('ragenius_default_lang', currentLanguage);
      syncLanguageButtons();
      showToast(`Voice language: ${currentLanguage}`, 'success');
    });
  });
  syncLanguageButtons();

  function renderAnswer(data) {
    lastAnswer = data.answer || '';
    answerText.innerHTML = formatAnswer(lastAnswer);
    sourcesBox.innerHTML = (data.sources || []).map(s =>
      `<span class="source-chip">📄 ${String(s.filename).replace(/[<>&"]/g,'')} · Page ${s.page}</span>`
    ).join('');
    answerBox.classList.remove('hidden');
    setStatus('Answer ready. Tap Read Answer to hear it again.');
  }

  async function askQuestion(text) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return;

    transcriptText.textContent = cleanText;
    transcriptBox.classList.remove('hidden');
    answerBox.classList.add('hidden');
    setStatus('🧠 Understanding…');
    orbWrap.classList.add('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: null,
          message: cleanText,
          language: currentLanguage
        })
      });
      const data = await res.json();
      orbWrap.classList.remove('thinking');

      if (!data.success) {
        setStatus(data.error || 'Something went wrong. Try again.');
        showToast(data.error || 'Something went wrong.', 'error');
        return;
      }

      renderAnswer(data);
      // Auto read is opt-in; the voice page still offers one-tap Read Answer.
      if (localStorage.getItem('ragenius_auto_read') === '1') speak(lastAnswer);
    } catch (e) {
      orbWrap.classList.remove('thinking');
      setStatus('Network error. Please check that the RAGENIUS server is running.');
      showToast('Network error', 'error');
    }
  }

  function initRecognition() {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => {
      isRecording = true;
      orbBtn.classList.add('recording');
      setStatus('🎙️ Listening… speak now');
    };
    r.onresult = e => {
      const transcript = e.results?.[0]?.[0]?.transcript || '';
      if (transcript) askQuestion(transcript);
    };
    r.onerror = e => {
      isRecording = false;
      orbBtn.classList.remove('recording');
      const msg = e.error === 'not-allowed'
        ? 'Microphone permission was blocked. Allow mic access or use the text box below.'
        : 'Voice input had a problem. Try again or use the text box.';
      setStatus(msg);
      showToast(msg, 'error');
    };
    r.onend = () => {
      isRecording = false;
      orbBtn.classList.remove('recording');
      if (!answerBox.classList.contains('hidden')) return;
      if (!transcriptBox.classList.contains('hidden')) setStatus('Processing your voice…');
    };
    return r;
  }

  if (!SpeechRecognition) {
    supportNote.textContent = '⌨️ Voice recognition is unavailable in this browser. The assistant still works fully with the text box and Read Answer button.';
    orbBtn.classList.add('voice-disabled');
  }

  orbBtn.addEventListener('click', () => {
    if (!SpeechRecognition) {
      fallbackInput.focus();
      setStatus('Type your question below, then tap Ask.');
      return;
    }

    if (!recognition) recognition = initRecognition();
    recognition.lang = LANG_CODES[currentLanguage] || 'en-IN';

    try {
      if (isRecording) {
        recognition.stop();
      } else {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        recognition.start();
      }
    } catch (err) {
      setStatus('Microphone is busy. Please try again.');
    }
  });

  fallbackSend.addEventListener('click', () => {
    const text = fallbackInput.value.trim();
    if (!text) {
      fallbackInput.focus();
      return;
    }
    fallbackInput.value = '';
    askQuestion(text);
  });

  fallbackInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') fallbackSend.click();
  });

  replayBtn.addEventListener('click', () => {
    if (lastAnswer) speak(lastAnswer);
    else showToast('No answer to read yet.');
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastAnswer) return showToast('No answer to copy yet.');
    try {
      await navigator.clipboard.writeText(lastAnswer);
      showToast('Answer copied.', 'success');
    } catch {
      showToast('Copy was blocked by the browser.', 'error');
    }
  });

  shareBtn.addEventListener('click', async () => {
    if (!lastAnswer) return showToast('No answer to share yet.');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'RAGENIUS Answer', text: lastAnswer });
      } else {
        await navigator.clipboard.writeText(lastAnswer);
        showToast('Share is unavailable here — answer copied instead.', 'success');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('Could not share this answer.', 'error');
    }
  });
})();
