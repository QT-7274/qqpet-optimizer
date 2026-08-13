/**
 * Menu Bar status windows stay fully opaque.
 * The setup opacity slider only affects the desktop pet window.
 * menu-bar-status-opacity.OPAQUE.1
 * menu-bar-status-opacity.OPAQUE.2
 * menu-bar-status-opacity.OPAQUE.3
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.windowOpacity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const OPAQUE_WINDOWS = [
    "setup",
    "rightMenu",
    "smallGame",
    "viewSwf",
    "stateInfo",
    "infoCard",
  ];

  function opaqueWindowNames() {
    return OPAQUE_WINDOWS.slice();
  }

  function resolveWindowOpacity(name, petOpacity) {
    if (OPAQUE_WINDOWS.indexOf(name) !== -1) return 1;
    const n = Number(petOpacity);
    if (!Number.isFinite(n) || n <= 0) return 0.1;
    return n;
  }

  return { opaqueWindowNames, resolveWindowOpacity };
});
