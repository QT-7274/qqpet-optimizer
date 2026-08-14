/**
 * Pet cursor resources and CSS fallbacks.
 * Windows keeps .cur; macOS uses PNG with the same hotspot.
 * pet-cursor.CURSOR.1
 * pet-cursor.CURSOR.2
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.petCursor = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const BASE = "../../assets/img_res/hand/default/";
  const PET_CURSOR = {
    normal: { cur: BASE + "normal.cur", png: BASE + "normal.png", hotspot: [4, 12] },
    press: { cur: BASE + "press.cur", png: BASE + "press.png", hotspot: [6, 15] },
  };

  function cursorFallback(platform, kind) {
    const asset = PET_CURSOR[kind || "normal"];
    const cur = 'url("' + asset.cur + '")';
    const png =
      'url("' + asset.png + '") ' + asset.hotspot[0] + " " + asset.hotspot[1];
    if (platform === "darwin") {
      return png + ", " + cur + ", default";
    }
    return cur + ", default";
  }

  return { PET_CURSOR, cursorFallback };
});
