(function () {
  // ---- Toast Notification Function ----
  const toast = document.getElementById('toast');
  function showToast(msg, type = 'info') {
    if (!toast) return;
    const colors = { info: '#22e8ff', error: '#ff5577', success: '#2ee6a6' };
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      background: rgba(15,17,40,0.95); border:1px solid ${colors[type] || colors.info};
      color:#eef0ff; padding:12px 18px; border-radius:12px; margin-top:10px; font-size:0.85rem;
      box-shadow:0 0 20px ${colors[type] || colors.info}55; max-width:320px;`;
    toast.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  // ---- 1. Profile Photo Upload & Preview ----
  const photoInput = document.getElementById('profilePhotoInput');
  const avatarContainer = document.getElementById('avatarContainer');

  if (photoInput) {
    photoInput.addEventListener('change', function (event) {
      const file = event.target.files[0];
      if (!file) return;

      // File type check
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast('Please select a valid image (PNG, JPEG, WEBP)', 'error');
        return;
      }

      // 1. Instant local preview update
      const reader = new FileReader();
      reader.onload = function (e) {
        let currentPreview = document.getElementById('profilePreview');

        if (currentPreview && currentPreview.tagName === 'IMG') {
          currentPreview.src = e.target.result;
        } else if (avatarContainer) {
          // If previous avatar was text placeholder <div>, replace it with <img>
          const img = document.createElement('img');
          img.id = 'profilePreview';
          img.className = 'profile-photo';
          img.src = e.target.result;
          img.alt = 'Profile Photo';

          avatarContainer.innerHTML = '';
          avatarContainer.appendChild(img);
        }
      };
      reader.readAsDataURL(file);

      // 2. Upload photo to Flask backend
      uploadProfilePhoto(file);
    });
  }

  function setHeaderAvatar(url) {
    const ring = document.querySelector('.avatar-ring');
    if (!ring || !url) return;
    ring.innerHTML = '<img class="header-profile-photo" src="' + url + '?t=' + Date.now() + '" alt="profile">';
    const big = document.getElementById('profilePreview');
    if (big && big.tagName === 'IMG') big.src = url + '?t=' + Date.now();
  }

  async function uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    try {
      // Backend URL endpoint (/upload-profile-photo or /api/settings/upload-photo)
      const res = await fetch('/api/settings/profile-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Profile photo saved!', 'success');
        setHeaderAvatar(data.url);
      } else {
        showToast(data.error || data.message || 'Failed to upload profile photo', 'error');
      }
    } catch (err) {
      showToast('Network error while uploading photo', 'error');
    }
  }

  async function removeProfilePhoto() {
    try {
      const res = await fetch('/api/settings/profile-photo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not remove profile photo');
      if (avatarContainer) {
        avatarContainer.innerHTML = `<div id="profilePreview" class="profile-photo avatar-placeholder" style="width:100%;height:100%;background:#22e8ff;color:#0f1128;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.4rem;">${(window.RAGENIUS_USERNAME || '?').charAt(0).toUpperCase()}</div>`;
      }
      const ring = document.querySelector('.avatar-ring');
      if (ring) ring.innerHTML = `<span class="header-profile-photo avatar-letter">${(window.RAGENIUS_USERNAME || '?').charAt(0).toUpperCase()}</span>`;
      showToast('Profile photo removed. Your first-letter avatar is back.', 'success');
    } catch (err) { showToast(err?.message || 'Could not remove profile photo', 'error'); }
  }

  document.getElementById('removeProfilePhotoBtn')?.addEventListener('click', removeProfilePhoto);

  // ---- 2. Preferences (Persisted locally per-browser) ----
  const defaultLangSelect = document.getElementById('defaultLangSelect');
  const autoReadToggle = document.getElementById('autoReadToggle');
  const soundToggle = document.getElementById('soundToggle');

  if (defaultLangSelect) {
    defaultLangSelect.value = localStorage.getItem('ragenius_default_lang') || 'Auto';
    defaultLangSelect.addEventListener('change', () => {
      localStorage.setItem('ragenius_default_lang', defaultLangSelect.value);
      window.dispatchEvent(new Event('ragenius-language-changed'));
      showToast(`Default language set to ${defaultLangSelect.value}`, 'success');
    });
  }

  if (autoReadToggle) {
    autoReadToggle.checked = localStorage.getItem('ragenius_auto_read') === '1';
    autoReadToggle.addEventListener('change', () => {
      localStorage.setItem('ragenius_auto_read', autoReadToggle.checked ? '1' : '0');
    });
  }

  if (soundToggle) {
    soundToggle.checked = localStorage.getItem('ragenius_sound') !== '0';
    soundToggle.addEventListener('change', () => {
      localStorage.setItem('ragenius_sound', soundToggle.checked ? '1' : '0');
    });
  }

  // Theme buttons sync initial state
  document.querySelectorAll('.theme-choice-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === (localStorage.getItem('ragenius_theme') || 'dark'));
  });


  // ---- 3. Change Password (Backend integration) ----
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current_password = document.getElementById('currentPassword').value;
      const new_password = document.getElementById('newPassword').value;
      const confirm_password = document.getElementById('confirmPassword').value;

      if (new_password !== confirm_password) {
        showToast('New passwords do not match', 'error');
        return;
      }

      try {
        const res = await fetch('/api/settings/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password, new_password }),
        });
        const data = await res.json();
        if (data.success) {
          showToast('Password updated successfully', 'success');
          e.target.reset();
        } else {
          showToast(data.error || 'Could not update password', 'error');
        }
      } catch (err) {
        showToast('Network error', 'error');
      }
    });
  }

  // ---- 4. What RAGENIUS remembers (Memory Management) ----
  const memoryList = document.getElementById('memoryList');
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function loadMemory() {
    if (!memoryList) return;
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (!data.items || !data.items.length) {
        memoryList.innerHTML = '<div class="muted" style="font-size:.8rem;">Nothing yet. Tell RAGENIUS your name or interests while chatting.</div>';
        return;
      }
      memoryList.innerHTML = data.items.map(i =>
        `<div class="kv-row">
          <span>${esc(i.key.replace('_', ' '))}: <b>${esc(i.value)}</b></span>
          <button type="button" class="dropdown-item danger" data-mem="${i.id}" style="width:auto;">✕</button>
        </div>`
      ).join('');

      memoryList.querySelectorAll('[data-mem]').forEach(b => b.addEventListener('click', async () => {
        await fetch(`/api/memory?id=${b.dataset.mem}`, { method: 'DELETE' });
        loadMemory();
      }));
    } catch (e) {
      memoryList.innerHTML = '<div class="muted">Could not load memory.</div>';
    }
  }

  document.getElementById('memoryClear')?.addEventListener('click', async () => {
    if (!confirm('Forget everything RAGENIUS remembers about you?')) return;
    await fetch('/api/memory', { method: 'DELETE' });
    showToast('Memory cleared', 'success');
    loadMemory();
  });

  if (memoryList) loadMemory();
})();