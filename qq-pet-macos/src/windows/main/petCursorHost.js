/**
 * Pure pet-cursor overlay rules (no Electron).
 * pet-cursor.CURSOR.3
 * pet-cursor.CURSOR.4
 * pet-cursor.CURSOR.4-1
 * pet-cursor.CURSOR.4-2
 * pet-cursor.CURSOR.4-3
 * pet-cursor.CURSOR.5
 */
(function (root, factory) {
  const petCursor =
    typeof module === "object" && module.exports
      ? require("./petCursor.js")
      : root.petCursor;
  const api = factory(petCursor);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.petCursorHost = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (petCursor) {
  const PET_CURSOR = petCursor.PET_CURSOR;
  const OVERLAY_SIZE = 32;
  const OVERLAY_NAME = "petCursorOverlay";
  const OVERLAY_PNG = {
    normal: PET_CURSOR.normal.png,
    press: PET_CURSOR.press.png,
  };

  function overlayBounds(point, kind) {
    const asset = PET_CURSOR[kind] || PET_CURSOR.normal;
    const x = point && point.x;
    const y = point && point.y;
    return {
      x: Math.round(Number(x) || 0) - asset.hotspot[0],
      y: Math.round(Number(y) || 0) - asset.hotspot[1],
      width: OVERLAY_SIZE,
      height: OVERLAY_SIZE,
    };
  }

  function isInWorkArea(point, workArea) {
    if (!point || !workArea) return false;
    const x = Number(point.x);
    const y = Number(point.y);
    const left = Number(workArea.x) || 0;
    const top = Number(workArea.y) || 0;
    const width = Number(workArea.width);
    const height = Number(workArea.height);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    if (!Number.isFinite(width) || !Number.isFinite(height)) return false;
    return x >= left && y >= top && x < left + width && y < top + height;
  }

  const MAIN_WINDOW_NAME = "main";
  const PENETRATE_WINDOW_NAMES = {
    control: true,
    rightMenu: true,
    floatStyle: true,
    urlWindow: true,
  };
  const PENETRATE_IPC = {
    "control_bus-Main_eventMouse": "control",
    "rightMenu_h_eventMouse_m": "rightMenu",
    "floatStyle_bus-Main_eventMouse": "floatStyle",
    "urlWindow_h_bus_m_eventMouse": "urlWindow",
  };
  // SWF stage (144/180) is larger than the drawn penguin.
  const PET_HIT_INSET = { top: 0.22, right: 0.16, bottom: 0.08, left: 0.16 };

  function isPenetrateWindowName(name) {
    return !!PENETRATE_WINDOW_NAMES[name];
  }

  function shouldIncludeFeatureWindow(name, penetrateHover) {
    if (name === MAIN_WINDOW_NAME || name === OVERLAY_NAME) return false;
    if (isPenetrateWindowName(name) && !(penetrateHover && penetrateHover[name])) {
      return false;
    }
    return true;
  }

  const CANDO_CLUSTER_PAD = 12;
  const CANDO_UNION_SCRIPT = [
    "(function(){",
    "  var nodes = document.querySelectorAll('[cando], [candoMust]');",
    "  var out = [];",
    "  for (var i = 0; i < nodes.length; i++) {",
    "    var r = nodes[i].getBoundingClientRect();",
    "    if (r.width <= 0 || r.height <= 0) continue;",
    "    out.push({ x: r.left, y: r.top, width: r.width, height: r.height });",
    "  }",
    "  return out;",
    "})()",
  ].join("");

  function unionRects(rects) {
    // pet-cursor.CURSOR.4-3
    const list = rects || [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let found = false;
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (!r) continue;
      const x = Number(r.x);
      const y = Number(r.y);
      const w = Number(r.width);
      const h = Number(r.height);
      if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) continue;
      found = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    }
    if (!found) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  function offsetRect(rect, origin) {
    if (!rect || !origin) return null;
    const x = Number(rect.x);
    const y = Number(rect.y);
    const w = Number(rect.width);
    const h = Number(rect.height);
    const ox = Number(origin.x);
    const oy = Number(origin.y);
    if (![x, y, w, h, ox, oy].every(Number.isFinite)) return null;
    return { x: ox + x, y: oy + y, width: w, height: h };
  }

  function padRect(rect, pad) {
    if (!rect) return null;
    const p = Number(pad);
    const x = Number(rect.x);
    const y = Number(rect.y);
    const w = Number(rect.width);
    const h = Number(rect.height);
    if (![x, y, w, h].every(Number.isFinite)) return null;
    const n = Number.isFinite(p) ? p : 0;
    return {
      x: x - n,
      y: y - n,
      width: w + n * 2,
      height: h + n * 2,
    };
  }

  function screenCandoRects(clientRects, windowBounds, pad) {
    const list = clientRects || [];
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const r = padRect(offsetRect(list[i], windowBounds), pad);
      if (r) out.push(r);
    }
    return out;
  }

  function tightenPetHitRect(rect, inset) {
    // pet-cursor.CURSOR.4-2
    if (!rect) return null;
    const i = inset || PET_HIT_INSET;
    const x = Number(rect.x);
    const y = Number(rect.y);
    const width = Number(rect.width);
    const height = Number(rect.height);
    if (![x, y, width, height].every(Number.isFinite)) return null;
    if (width <= 0 || height <= 0) return null;
    const left = width * (Number(i.left) || 0);
    const right = width * (Number(i.right) || 0);
    const top = height * (Number(i.top) || 0);
    const bottom = height * (Number(i.bottom) || 0);
    const w = width - left - right;
    const h = height - top - bottom;
    if (w <= 0 || h <= 0) return { x: x, y: y, width: width, height: height };
    return {
      x: x + left,
      y: y + top,
      width: w,
      height: h,
    };
  }

  function pointInRect(point, rect) {
    if (!point || !rect) return false;
    const x = Number(point.x);
    const y = Number(point.y);
    const left = Number(rect.x);
    const top = Number(rect.y);
    const width = Number(rect.width);
    const height = Number(rect.height);
    if (![x, y, left, top, width, height].every(Number.isFinite)) return false;
    if (width <= 0 || height <= 0) return false;
    return x >= left && y >= top && x < left + width && y < top + height;
  }

  function shouldShowPetCursor({ point, petHitRect, featureRects, enabled }) {
    // pet-cursor.CURSOR.4
    // pet-cursor.CURSOR.5
    if (enabled === false) return false;
    if (pointInRect(point, petHitRect)) return true;
    const rects = featureRects || [];
    for (let i = 0; i < rects.length; i++) {
      if (pointInRect(point, rects[i])) return true;
    }
    return false;
  }

  function cursorKind(pressed) {
    return pressed ? "press" : "normal";
  }

  return {
    OVERLAY_NAME,
    MAIN_WINDOW_NAME,
    OVERLAY_SIZE,
    OVERLAY_PNG,
    PENETRATE_WINDOW_NAMES,
    PENETRATE_IPC,
    PET_HIT_INSET,
    CANDO_CLUSTER_PAD,
    CANDO_UNION_SCRIPT,
    overlayBounds,
    isInWorkArea,
    pointInRect,
    unionRects,
    offsetRect,
    padRect,
    screenCandoRects,
    isPenetrateWindowName,
    shouldIncludeFeatureWindow,
    tightenPetHitRect,
    shouldShowPetCursor,
    cursorKind,
  };
});
