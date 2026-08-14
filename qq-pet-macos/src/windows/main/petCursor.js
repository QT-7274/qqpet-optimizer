/**
 * Pet cursor resources and a PNG follower for transparent windows.
 * CSS url() cursors are ignored on macOS transparent BrowserWindows.
 * pet-cursor.CURSOR.1
 * pet-cursor.CURSOR.2
 * pet-cursor.CURSOR.3
 * pet-cursor.CURSOR.3-1
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.petCursor = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CSS_BASE = "../../assets/img_res/hand/default/";
  const PAGE_BASE = "../assets/img_res/hand/default/";
  const PET_CURSOR = {
    normal: {
      cur: CSS_BASE + "normal.cur",
      png: CSS_BASE + "normal.png",
      pagePng: PAGE_BASE + "normal.png",
      hotspot: [4, 12],
    },
    press: {
      cur: CSS_BASE + "press.cur",
      png: CSS_BASE + "press.png",
      pagePng: PAGE_BASE + "press.png",
      hotspot: [6, 15],
    },
  };
  const FOLLOWER_ID = "pet-cursor-follower";

  function cursorFallback(platform, kind) {
    const asset = PET_CURSOR[kind || "normal"];
    const cur = 'url("' + asset.cur + '")';
    const png =
      'url("' + asset.png + '") ' + asset.hotspot[0] + " " + asset.hotspot[1];
    if (platform === "darwin") {
      return png + ", " + cur + ", none";
    }
    return cur + ", default";
  }

  function pagePngSrc(kind, documentRef) {
    // pet-cursor.CURSOR.3-1
    const asset = PET_CURSOR[kind] || PET_CURSOR.normal;
    const rel = asset.pagePng;
    const base =
      documentRef && documentRef.baseURI
        ? documentRef.baseURI
        : typeof document !== "undefined" && document.baseURI
          ? document.baseURI
          : null;
    if (base) {
      try {
        return new URL(rel, base).href;
      } catch (err) {}
    }
    return rel;
  }

  function setFollowerKind(img, kind, documentRef) {
    const asset = PET_CURSOR[kind] || PET_CURSOR.normal;
    img.src = pagePngSrc(kind, documentRef);
    img.dataset.kind = kind;
    img.dataset.hx = String(asset.hotspot[0]);
    img.dataset.hy = String(asset.hotspot[1]);
    return asset;
  }

  function followerHotspot(img) {
    return [
      Number(img.dataset.hx) || PET_CURSOR.normal.hotspot[0],
      Number(img.dataset.hy) || PET_CURSOR.normal.hotspot[1],
    ];
  }

  function isOverMove(target, moveEl) {
    if (!moveEl || !target) return false;
    if (target === moveEl) return true;
    if (typeof moveEl.contains === "function") return moveEl.contains(target);
    return false;
  }

  function followerBox(clientX, clientY, kind) {
    const asset = PET_CURSOR[kind] || PET_CURSOR.normal;
    return {
      left: clientX - asset.hotspot[0],
      top: clientY - asset.hotspot[1],
      src: asset.pagePng,
      kind: kind || "normal",
    };
  }

  function mountPetCursorFollower(doc) {
    // pet-cursor.CURSOR.3
    const documentRef = doc;
    if (!documentRef || typeof documentRef.createElement !== "function") {
      return null;
    }
    if (typeof documentRef.getElementById === "function") {
      const existing = documentRef.getElementById(FOLLOWER_ID);
      if (existing) return existing;
    }
    const img = documentRef.createElement("img");
    img.id = FOLLOWER_ID;
    img.alt = "";
    img.draggable = false;
    if (img.style) {
      img.style.position = "fixed";
      img.style.pointerEvents = "none";
      img.style.zIndex = "2147483647";
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.display = "none";
    }
    setFollowerKind(img, "normal", documentRef);
    const parent =
      documentRef.body ||
      documentRef.documentElement ||
      (typeof documentRef.getElementById === "function"
        ? documentRef.getElementById("app")
        : null);
    if (parent && typeof parent.appendChild === "function") {
      parent.appendChild(img);
    }

    function onMove(event) {
      const moveEl =
        typeof documentRef.getElementById === "function"
          ? documentRef.getElementById("move")
          : null;
      if (!isOverMove(event.target, moveEl)) {
        if (img.style) img.style.display = "none";
        return;
      }
      const hs = followerHotspot(img);
      if (img.style) img.style.display = "block";
      img.style.left = event.clientX - hs[0] + "px";
      img.style.top = event.clientY - hs[1] + "px";
    }
    function onDown() {
      setFollowerKind(img, "press", documentRef);
    }
    function onUp() {
      setFollowerKind(img, "normal", documentRef);
    }
    function onLeave(event) {
      const moveEl =
        typeof documentRef.getElementById === "function"
          ? documentRef.getElementById("move")
          : null;
      if (!isOverMove(event.relatedTarget, moveEl) && img.style) {
        img.style.display = "none";
      }
    }

    if (typeof documentRef.addEventListener === "function") {
      documentRef.addEventListener("mousemove", onMove, true);
      documentRef.addEventListener("mousedown", onDown, true);
      documentRef.addEventListener("mouseup", onUp, true);
      documentRef.addEventListener("mouseout", onLeave, true);
    }
    return img;
  }

  return {
    PET_CURSOR,
    cursorFallback,
    followerBox,
    pagePngSrc,
    mountPetCursorFollower,
  };
});
