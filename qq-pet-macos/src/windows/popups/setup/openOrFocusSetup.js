/**
 * menu-bar-status-settings.OPEN.1
 * menu-bar-status-settings.OPEN.2
 * menu-bar-status-settings.MENU.1
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.openOrFocusSetup = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function isUsableWindow(win) {
    if (!win) return false;
    if (typeof win.isDestroyed === "function" && win.isDestroyed()) return false;
    return true;
  }

  function openOrFocusSetup(setup) {
    if (!setup) return "missing";
    if (isUsableWindow(setup.window)) {
      if (typeof setup.window.show === "function") setup.window.show();
      if (typeof setup.window.focus === "function") setup.window.focus();
      return "focus";
    }
    if (typeof setup.cleate === "function") setup.cleate();
    return "create";
  }

  return { openOrFocusSetup };
});
