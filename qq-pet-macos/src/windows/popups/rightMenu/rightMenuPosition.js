/**
 * Tray right-click menu uses the same workArea placement as left-click stateInfo.
 * Pet-local right-click (followMain) keeps the offset next to the pet.
 * tray-rightmenu-position.TRAY.1
 * tray-rightmenu-position.PET.1
 */
(function (root, factory) {
  const trayPopupPosition =
    typeof module === "object" && module.exports
      ? require("../../util/trayPopupPosition.js")
      : root.trayPopupPosition;
  const api = factory(trayPopupPosition);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.rightMenuPosition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (
  trayPopupPosition
) {
  function resolveRightMenuPosition({
    positionType,
    nowPosition,
    trayBounds,
    windowSize,
    workArea,
  }) {
    const width = Number(windowSize && windowSize.width) || 0;
    const height = Number(windowSize && windowSize.height) || 0;
    const point = Array.isArray(nowPosition) ? nowPosition : [0, 0];

    if (positionType === "followMain") {
      return {
        x: Math.trunc(point[0] - width / 2 + width / 4),
        y: Math.trunc(point[1] - height + 80),
      };
    }

    const bounds = trayBounds || {
      x: point[0],
      y: point[1],
      width: 0,
      height: 0,
    };
    return trayPopupPosition.computeTrayPopupPosition({
      trayBounds: bounds,
      windowSize: { width, height },
      workArea,
    });
  }

  return {
    resolveRightMenuPosition,
    applyPositionToWindow: trayPopupPosition.applyPositionToWindow,
  };
});
