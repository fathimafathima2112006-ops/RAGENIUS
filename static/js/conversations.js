(function () {
  const convSearch = document.getElementById('convSearch');
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

  if (convSearch) convSearch.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.conv-card').forEach(item => {
      item.style.display = item.dataset.title.includes(q) ? '' : 'none';
    });
  });

  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      btn.closest('.conv-card').remove();
      showToast('Conversation deleted', 'success');
    });
  });
})();
