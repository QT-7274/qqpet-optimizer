/**
 * Open the pet-side control strip from Menu Bar status clicks.
 * Hidden controls must still show; mood/growth have no type and stay no-ops.
 * menu-bar-status-control.SHOW.1
 * menu-bar-status-control.SKIP.1
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.openControlActive = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ACTIVE_VALUES = {
    food: true,
    clean: true,
    cure: true,
    task: true,
  };

  function isUsableWindow(win) {
    if (!win) return false;
    if (typeof win.isDestroyed === "function" && win.isDestroyed()) return false;
    return true;
  }

  function openControlActive(control, value) {
    if (!control || !ACTIVE_VALUES[value]) return "ignore";
    if (!isUsableWindow(control.window)) return "missing";
    if (typeof control.useInState === "function") {
      control.useInState({ type: "active", opt: { value } });
    }
    return "opened";
  }

  return { openControlActive };
});
