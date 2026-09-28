(function () {
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const docList = document.getElementById('docList');
  const docSearch = document.getElementById('docSearch');
  const qaClear = document.getElementById('qaClear');
  const toast = document.getElementById('toast');

  function showToast(msg, type = 'info') {
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

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    showToast(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.success) { showToast(data.error || 'Upload failed', 'error'); return; }
      showToast(`${data.document.filename} indexed`, 'success');
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      showToast('Upload error', 'error');
    }
    fileInput.value = '';
  });

  function bindDeleteButton(btn) {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (!confirm('Delete this document? This cannot be undone.')) return;
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      (btn.closest('.document-row') || btn.closest('.doc-card'))?.remove();
      showToast('Document removed', 'success');
    });
  }
  document.querySelectorAll('.del-btn').forEach(bindDeleteButton);

  // Documents page: per-row action dropdown (Manage / Re-index / Export Chunks / Delete)
  document.querySelectorAll('[data-menu-toggle]').forEach(toggleBtn => {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrap = toggleBtn.closest('.action-dropdown');
      const wasOpen = wrap.classList.contains('open');
      document.querySelectorAll('.action-dropdown.open').forEach(w => w.classList.remove('open'));
      if (!wasOpen) wrap.classList.add('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.action-dropdown.open').forEach(w => w.classList.remove('open'));
  });

  document.querySelectorAll('.dropdown-item[data-action]').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = item.dataset.id;
      const action = item.dataset.action;
      const row = item.closest('.document-row');
      const name = row?.querySelector('.source-cell b')?.textContent || 'Document';
      if (action === 'manage') {
        showToast(`Opening manage view for ${name}`);
      } else if (action === 'reindex') {
        showToast(`Re-indexing ${name}...`);
        try {
          const res = await fetch(`/api/documents/${id}/reindex`, { method: 'POST' });
          if (res.ok) showToast(`${name} re-indexed`, 'success');
          else showToast('Re-index not available yet', 'error');
        } catch (err) { showToast('Re-index not available yet', 'error'); }
      } else if (action === 'export') {
        showToast(`Preparing chunk export for ${name}...`);
        window.location.href = `/api/documents/${id}/export-chunks`;
      }
    });
  });

  if (docSearch) docSearch.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.doc-card').forEach(item => {
      item.style.display = item.dataset.name.includes(q) ? '' : 'none';
    });
  });


  // Documents page: filter by source type and keep visible count in sync.
  const filterButtons = document.querySelectorAll('.doc-filter');
  const countEl = document.getElementById('docVisibleCount');
  let activeFilter = 'all';
  function applyDocFilters() {
    const q = (docSearch?.value || '').toLowerCase().trim();
    let visible = 0;
    document.querySelectorAll('.document-row').forEach(row => {
      const matchesText = (row.dataset.name || '').includes(q);
      const matchesType = activeFilter === 'all' || row.dataset.type === activeFilter;
      row.style.display = matchesText && matchesType ? '' : 'none';
      if (matchesText && matchesType) visible++;
    });
    if (countEl) countEl.textContent = visible;
  }
  filterButtons.forEach(btn => btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter || 'all';
    applyDocFilters();
  }));
  if (docSearch) docSearch.addEventListener('input', applyDocFilters);
  applyDocFilters();

  if (qaClear) qaClear.addEventListener('click', async () => {
    if (!confirm('Clear your entire knowledge base? This cannot be undone.')) return;
    await fetch('/api/knowledge-base/clear', { method: 'POST' });
    location.reload();
  });
})();