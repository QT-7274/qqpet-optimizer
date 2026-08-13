/**
 * Place a tray popup inside the display workArea.
 * macOS menu bar sits above workArea, so y = trayY - height goes off-screen.
 * tray-stateinfo-position.POSITION.1
 * tray-stateinfo-position.POSITION.2
 * tray-stateinfo-position.POSITION.3
 * tray-stateinfo-position.POSITION.4
 * tray-stateinfo-position.TOGGLE.1
 * tray-stateinfo-position.TOGGLE.2
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.trayPopupPosition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  function computeTrayPopupPosition({ trayBounds, windowSize, workArea }) {
    const trayX = toNumber(trayBounds?.x, 0);
    const trayY = toNumber(trayBounds?.y, 0);
    const trayW = toNumber(trayBounds?.width, 0);
    const trayH = toNumber(trayBounds?.height, 0);
    const winW = toNumber(windowSize?.width, 0);
    const winH = toNumber(windowSize?.height, 0);
    const areaX = toNumber(workArea?.x, 0);
    const areaY = toNumber(workArea?.y, 0);
    const areaW = toNumber(workArea?.width, winW);
    const areaH = toNumber(workArea?.height, winH);

    let x = trayX + trayW / 2 - winW / 2;
    let y = trayY - winH;

    if (y < areaY) {
      y = trayY + trayH;
    }

    x = clamp(x, areaX, areaX + areaW - winW);
    y = clamp(y, areaY, areaY + areaH - winH);

    return { x: Math.trunc(x), y: Math.trunc(y) };
  }

  function applyPositionToWindow(win, position, size) {
    if (!win) return false;
    if (typeof win.isDestroyed === "function" && win.isDestroyed()) return false;
    if (typeof win.setBounds === "function") {
      win.setBounds({
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      });
    }
    if (typeof win.show === "function") win.show();
    return true;
  }

  return { computeTrayPopupPosition, applyPositionToWindow };
});
