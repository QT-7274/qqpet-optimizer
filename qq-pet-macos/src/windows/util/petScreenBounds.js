/**
 * Clamp the pet window to the current display workArea and detect left/right hide edges.
 * pet-edge-hide.EDGE.1
 * pet-edge-hide.EDGE.2
 * pet-edge-hide.EDGE.3
 * pet-edge-hide.EDGE.4
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.petScreenBounds = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const EDGE_PX = 3;

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  function clampPetPosition({ x, y, width, height, workArea }) {
    const winW = toNumber(width, 0);
    const winH = toNumber(height, 0);
    const areaX = toNumber(workArea?.x, 0);
    const areaY = toNumber(workArea?.y, 0);
    const areaW = toNumber(workArea?.width, winW);
    const areaH = toNumber(workArea?.height, winH);
    return {
      x: Math.trunc(clamp(toNumber(x, 0), areaX, areaX + areaW - winW)),
      y: Math.trunc(clamp(toNumber(y, 0), areaY, areaY + areaH - winH)),
    };
  }

  function detectPetEdge({ x, y, width, height, workArea, threshold }) {
    const edge = toNumber(threshold, EDGE_PX);
    const winW = toNumber(width, 0);
    const areaX = toNumber(workArea?.x, 0);
    const areaW = toNumber(workArea?.width, winW);
    const left = toNumber(x, 0);
    if (left <= areaX + edge) return "left";
    if (left >= areaX + areaW - winW - edge) return "right";
    return "center";
  }

  function workAreaFromDisplay(display) {
    if (!display || !display.workArea) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    const area = display.workArea;
    return {
      x: toNumber(area.x, 0),
      y: toNumber(area.y, 0),
      width: toNumber(area.width, 0),
      height: toNumber(area.height, 0),
    };
  }

  function overlapArea(a, b) {
    const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    if (width <= 0 || height <= 0) return 0;
    return width * height;
  }

  function distanceToRectSq(px, py, rect) {
    const nearestX = clamp(px, rect.x, rect.x + rect.width);
    const nearestY = clamp(py, rect.y, rect.y + rect.height);
    const dx = px - nearestX;
    const dy = py - nearestY;
    return dx * dx + dy * dy;
  }

  function pickDisplayWorkArea(bounds, displays) {
    const box = {
      x: toNumber(bounds?.x, 0),
      y: toNumber(bounds?.y, 0),
      width: toNumber(bounds?.width, 0),
      height: toNumber(bounds?.height, 0),
    };
    const list = Array.isArray(displays) ? displays : [];
    let bestOverlap = null;
    let bestOverlapArea = 0;
    let nearest = { x: 0, y: 0, width: 0, height: 0 };
    let nearestDist = Infinity;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (let i = 0; i < list.length; i++) {
      const area = workAreaFromDisplay(list[i]);
      const overlap = overlapArea(box, area);
      if (overlap > bestOverlapArea) {
        bestOverlapArea = overlap;
        bestOverlap = area;
      }
      const dist = distanceToRectSq(cx, cy, area);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = area;
      }
    }
    return bestOverlap || nearest;
  }

  return { clampPetPosition, detectPetEdge, workAreaFromDisplay, pickDisplayWorkArea };
});
