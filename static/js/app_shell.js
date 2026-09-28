(function () {
  'use strict';

  function closeDrawer() {
    document.body.classList.remove('nav-open');
    var toggle = document.getElementById('sidebarToggle');
    if (toggle) {
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function openDrawer() {
    document.body.classList.add('nav-open');
    var toggle = document.getElementById('sidebarToggle');
    if (toggle) {
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  function init() {
    var toggle = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('sidebar');

    function setTopbarHeight() {
      var topbar = document.querySelector('.topbar');
      var h = topbar ? topbar.offsetHeight : 64;
      document.documentElement.style.setProperty('--topbar-h', h + 'px');
    }

    setTopbarHeight();
    window.addEventListener('resize', setTopbarHeight, { passive: true });

    if (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (document.body.classList.contains('nav-open')) closeDrawer();
        else openDrawer();
      });
    }

    if (sidebar) {
      sidebar.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.stopPropagation();
      });
    }

    document.addEventListener('click', function (e) {
      if (!document.body.classList.contains('nav-open')) return;
      if (sidebar && sidebar.contains(e.target)) return;
      if (toggle && toggle.contains(e.target)) return;
      closeDrawer();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    // Theme
    function applyTheme(theme) {
      var light = theme === 'light';
      document.body.classList.toggle('light-mode', light);
      document.documentElement.dataset.theme = light ? 'light' : 'dark';
      localStorage.setItem('ragenius_theme', light ? 'light' : 'dark');
      var btn = document.getElementById('themeToggle');
      if (btn) {
        btn.textContent = light ? '🌙' : '☀️';
        btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      }
      document.querySelectorAll('.theme-choice-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.theme === theme);
      });
    }

    applyTheme(localStorage.getItem('ragenius_theme') || 'dark');

    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        applyTheme(document.body.classList.contains('light-mode') ? 'dark' : 'light');
      });
    }

    document.querySelectorAll('.theme-choice-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { applyTheme(btn.dataset.theme); });
    });

    window.ragSetTheme = applyTheme;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
