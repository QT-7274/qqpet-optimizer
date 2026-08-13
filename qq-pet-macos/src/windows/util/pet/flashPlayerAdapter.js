/**
 * Flash Player JS API on top of Ruffle.
 * swfPet polls CurrentFrame/TotalFrames/IsPlaying; Ruffle only has PercentLoaded.
 * pet-swf-runtime.FLASH_API.1
 * pet-swf-runtime.FLASH_API.2
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.flashPlayerAdapter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function hasNativeFlashApi(el) {
    return (
      el &&
      typeof el.CurrentFrame === "function" &&
      typeof el.TotalFrames === "function" &&
      typeof el.IsPlaying === "function" &&
      !el.__flashApiSynthetic
    );
  }

  function resolvePlayer(el) {
    if (!el) return null;
    if (el.metadata || typeof el.PercentLoaded === "function") return el;
    if (typeof el.querySelector === "function") {
      return el.querySelector("ruffle-player") || el;
    }
    return el;
  }

  function readSrc(el) {
    const player = resolvePlayer(el) || el;
    if (!player) return "";
    if (typeof player.getAttribute === "function") {
      return player.getAttribute("src") || player.src || "";
    }
    return player.src || "";
  }

  function createElement(tag, documentRef) {
    const doc =
      documentRef || (typeof document !== "undefined" ? document : null);
    if (doc && typeof doc.createElement === "function") {
      return doc.createElement(tag);
    }
    const attrs = {};
    return {
      tagName: String(tag).toUpperCase(),
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attrs, name)
          ? attrs[name]
          : null;
      },
      setAttribute(name, value) {
        attrs[name] = String(value);
      },
    };
  }

  function createPetEmbed(attributes, documentRef) {
    const el = createElement("embed", documentRef);
    const attrs = {
      name: "pet",
      class: "pet",
      wmode: "transparent",
      allowScriptAccess: "always",
      type: "application/x-shockwave-flash",
      ...(attributes || {}),
    };
    Object.keys(attrs).forEach(function (key) {
      if (attrs[key] != null && typeof el.setAttribute === "function") {
        el.setAttribute(key, attrs[key]);
      }
    });
    return el;
  }

  function installFlashPlayerApi(el, options) {
    if (!el) return el;
    if (hasNativeFlashApi(el)) {
      el.__flashApiInstalled = true;
      return el;
    }
    if (el.__flashApiInstalled) return el;

    const now = (options && options.now) || function () {
      return Date.now();
    };
    const state = {
      startedAt: now(),
      gotoFrame: 0,
      playing: true,
      pausedAt: null,
      armed: false,
    };

    const nativePercentLoaded =
      typeof el.PercentLoaded === "function" ? el.PercentLoaded.bind(el) : null;

    function player() {
      return resolvePlayer(el) || el;
    }

    function meta() {
      return player().metadata || {};
    }

    function isReady() {
      const loaded = nativePercentLoaded ? nativePercentLoaded() : el.PercentLoaded();
      const frames = Number(meta().numFrames);
      return loaded >= 100 && Number.isFinite(frames) && frames > 0;
    }

    function ensureArmed() {
      if (!isReady()) return false;
      if (!state.armed) {
        state.armed = true;
        state.startedAt = now();
        state.playing = true;
        state.pausedAt = null;
      }
      return true;
    }

    function totalFrames() {
      if (!ensureArmed()) return 0;
      const n = Number(meta().numFrames);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }

    function fps() {
      const n = Number(meta().frameRate);
      return Number.isFinite(n) && n > 0 ? n : 24;
    }

    function elapsedMs() {
      if (!state.playing && state.pausedAt != null) {
        return Math.max(0, state.pausedAt - state.startedAt);
      }
      return Math.max(0, now() - state.startedAt);
    }

    function currentFrame() {
      if (!ensureArmed()) return -1;
      const total = totalFrames();
      const frame =
        state.gotoFrame + Math.floor((elapsedMs() / 1000) * fps());
      const last = total - 1;
      if (frame >= last) {
        if (state.playing) {
          state.playing = false;
          state.pausedAt = now();
          const p = player();
          if (typeof p.pause === "function") p.pause();
        }
        return last;
      }
      return Math.max(0, frame);
    }

    function isPlaying() {
      const p = player();
      if (typeof p.isPlaying === "boolean") return p.isPlaying && state.playing;
      return state.playing;
    }

    el.CurrentFrame = function () {
      return currentFrame();
    };
    el.TotalFrames = function () {
      return totalFrames();
    };
    el.IsPlaying = function () {
      return isPlaying();
    };
    el.PercentLoaded = function () {
      if (nativePercentLoaded) return nativePercentLoaded();
      const p = player();
      if (p !== el && typeof p.PercentLoaded === "function") {
        return p.PercentLoaded();
      }
      if (p && p.metadata) return 100;
      return 0;
    };
    el.Play = function () {
      state.playing = true;
      state.startedAt = now();
      state.pausedAt = null;
      const p = player();
      if (typeof p.play === "function") p.play();
      return true;
    };
    el.StopPlay = function () {
      state.playing = false;
      state.pausedAt = now();
      const p = player();
      if (typeof p.pause === "function") p.pause();
      return true;
    };
    el.GotoFrame = function (frame) {
      const total = totalFrames();
      const next = Math.max(0, Math.min(Number(frame) || 0, total - 1));
      state.gotoFrame = next;
      state.startedAt = now();
      state.pausedAt = state.playing ? null : now();
      return true;
    };
    el.Rewind = function () {
      return el.GotoFrame(0);
    };
    el.__flashApiInstalled = true;
    el.__flashApiSynthetic = true;
    el.__flashApiState = state;
    ensureArmed();
    return el;
  }

  function describePlayer(el) {
    const player = resolvePlayer(el) || el;
    const src = readSrc(el);
    const snap = {
      src: src,
      percentLoaded: null,
      currentFrame: null,
      totalFrames: null,
      isPlaying: null,
      readyState: player && player.readyState,
    };
    try {
      if (!el.__flashApiInstalled) installFlashPlayerApi(el);
      snap.percentLoaded = el.PercentLoaded();
      snap.currentFrame = el.CurrentFrame();
      snap.totalFrames = el.TotalFrames();
      snap.isPlaying = el.IsPlaying();
    } catch (err) {
      snap.error = String(err && err.message ? err.message : err);
    }
    return snap;
  }

  return {
    installFlashPlayerApi,
    createPetEmbed,
    describePlayer,
  };
});
