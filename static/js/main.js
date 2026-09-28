// Shared bootstrap helpers. Theme + language are managed by app_shell.js / i18n.js.
document.addEventListener('DOMContentLoaded', () => {
  if (window.RAGENIUS_I18N) window.RAGENIUS_I18N.applyLanguage();
});
