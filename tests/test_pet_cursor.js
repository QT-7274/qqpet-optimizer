const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  PET_CURSOR,
  cursorFallback,
  followerBox,
} = require("../qq-pet-macos/src/windows/main/petCursor.js");
const {
  overlayBounds,
  shouldShowPetCursor,
  cursorKind,
  OVERLAY_PNG,
  OVERLAY_NAME,
  PET_HIT_INSET,
  PENETRATE_IPC,
  tightenPetHitRect,
  shouldIncludeFeatureWindow,
  isPenetrateWindowName,
  pointInRect,
  padRect,
  CANDO_UNION_SCRIPT,
  CANDO_CLUSTER_PAD,
  screenCandoRects,
} = require("../qq-pet-macos/src/windows/main/petCursorHost.js");
const {
  createCursorHide,
  createNativeCursorHide,
  JXA,
  NATIVE_CLANG_ARGS,
} = require("../qq-pet-macos/src/windows/main/macCursorHide.js");

const css = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/main/index.css"),
  "utf8"
);
const handDir = path.join(
  __dirname,
  "../qq-pet-macos/src/assets/img_res/hand/default"
);

function readCurHotspot(filename) {
  const buf = fs.readFileSync(path.join(handDir, filename));
  assert.ok(buf.length >= 14, filename);
  assert.equal(buf.readUInt16LE(0), 0, filename + " reserved");
  assert.equal(buf.readUInt16LE(2), 2, filename + " type");
  assert.ok(buf.readUInt16LE(4) >= 1, filename + " count");
  return [buf.readUInt16LE(10), buf.readUInt16LE(12)];
}

// pet-cursor.CURSOR.1
test("pet-cursor.CURSOR.1 idle and press hotspots match the CUR files", () => {
  assert.deepEqual(PET_CURSOR.normal.hotspot, readCurHotspot("normal.cur"));
  assert.deepEqual(PET_CURSOR.press.hotspot, readCurHotspot("press.cur"));
});

// pet-cursor.CURSOR.3
test("pet-cursor.CURSOR.3 pet window hides the system cursor over the pet", () => {
  assert.match(
    css,
    /#move,\s*#move:active,\s*#move \*\s*\{[^}]*cursor:\s*none\s*!important/
  );
});

test("pet-ruffle-chrome.SPLASH.1 ruffle host does not keep the default blue stage", () => {
  assert.match(css, /--ruffle-blue:\s*transparent/);
  assert.match(css, /--splash-screen-background:\s*transparent/);
});

// pet-cursor.CURSOR.2
test("pet-cursor.CURSOR.2 ruffle player does not force pointer cursor", () => {
  assert.doesNotMatch(css, /ruffle-player[^{]*\{[^}]*cursor:\s*pointer\s*!important/);
  assert.match(css, /ruffle-player,\s*ruffle-player \*\s*\{[^}]*cursor:\s*inherit/);
  assert.match(css, /pointer-events:\s*none\s*!important/);
});

test("pet-cursor.CURSOR.1 PNG fallbacks exist next to the CUR files", () => {
  for (const name of ["normal.png", "press.png", "normal.cur", "press.cur"]) {
    const full = path.join(handDir, name);
    assert.equal(fs.existsSync(full), true, full);
    assert.ok(fs.statSync(full).size > 32);
  }
});

test("Windows fallback keeps CUR first", () => {
  assert.equal(
    cursorFallback("win32"),
    'url("../../assets/img_res/hand/default/normal.cur"), default'
  );
  assert.match(cursorFallback("darwin"), /normal\.png"\) 4 12/);
});

// pet-cursor.CURSOR.3
test("pet-cursor.CURSOR.3 followerBox offsets by the CUR hotspot", () => {
  assert.deepEqual(followerBox(100, 80, "normal"), {
    left: 96,
    top: 68,
    src: "../assets/img_res/hand/default/normal.png",
    kind: "normal",
  });
  assert.deepEqual(followerBox(100, 80, "press"), {
    left: 94,
    top: 65,
    src: "../assets/img_res/hand/default/press.png",
    kind: "press",
  });
});

test("pet-cursor.CURSOR.3-1 overlay PNG resolves from overlay HTML", () => {
  assert.equal(OVERLAY_PNG.normal, PET_CURSOR.normal.png);
  const overlayHtml = path.join(
    __dirname,
    "../qq-pet-macos/src/windows/main/petCursorOverlay.html"
  );
  const html = fs.readFileSync(overlayHtml, "utf8");
  assert.match(html, /hand\/default\/normal\.png/);
  const fromOverlay = path.join(
    __dirname,
    "../qq-pet-macos/src/windows/main",
    OVERLAY_PNG.normal
  );
  assert.equal(fs.existsSync(fromOverlay), true, fromOverlay);
});

test("pet-cursor.CURSOR.3 overlay hotspot matches CUR files", () => {
  assert.deepEqual(overlayBounds({ x: 100, y: 80 }, "normal"), {
    x: 96,
    y: 68,
    width: 32,
    height: 32,
  });
  assert.equal(cursorKind(true), "press");
  assert.equal(cursorKind(false), "normal");
});

test("pet-cursor.CURSOR.3 hide helper only toggles on edge", () => {
  const writes = [];
  const api = createCursorHide(function () {
    return {
      stdin: { write(cmd) { writes.push(cmd); } },
      stdout: { on() {} },
      kill() {},
    };
  });
  api.hide();
  api.hide();
  api.show();
  api.show();
  assert.deepEqual(writes, ["h\n", "s\n"]);
  assert.match(JXA, /CGDisplayHideCursor/);
  assert.match(JXA, /CGDisplayShowCursor/);
  assert.match(JXA, /continue/);
  assert.doesNotMatch(JXA, /if \(!data \|\| data.length == 0\) \{ show\(\); break; \}/);
});

test("pet-cursor.CURSOR.4 only pet sprite and feature windows use the pet cursor", () => {
  const pet = { x: 100, y: 200, width: 144, height: 144 };
  const store = { x: 400, y: 120, width: 840, height: 640 };
  assert.equal(
    shouldShowPetCursor({
      point: { x: 120, y: 220 },
      petHitRect: pet,
      featureRects: [store],
    }),
    true
  );
  assert.equal(
    shouldShowPetCursor({
      point: { x: 500, y: 200 },
      petHitRect: pet,
      featureRects: [store],
    }),
    true
  );
});

test("pet-cursor.CURSOR.5 desktop menu bar and dock keep the system cursor", () => {
  const pet = { x: 100, y: 200, width: 144, height: 144 };
  assert.equal(
    shouldShowPetCursor({
      point: { x: 10, y: 10 },
      petHitRect: pet,
      featureRects: [],
    }),
    false
  );
  assert.equal(
    shouldShowPetCursor({
      point: { x: 800, y: 500 },
      petHitRect: pet,
      featureRects: [],
    }),
    false
  );
});

const windowJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/window.js"),
  "utf8"
);

test("pet-cursor.CURSOR.4 window open starts the overlay host", () => {
  assert.match(windowJs, /petCursorOverlay/);
  assert.match(windowJs, /ensureStarted/);
  assert.match(windowJs, /__qqpetName/);
  assert.equal(OVERLAY_NAME, "petCursorOverlay");
});

const mainJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/main/main.js"),
  "utf8"
);

test("pet-cursor.CURSOR.4 pet move updates the sprite hit rect", () => {
  assert.match(mainJs, /setPetHitRect/);
});

test("pet-cursor.CURSOR.4-1 penetrate windows are excluded until canDoType", () => {
  assert.equal(isPenetrateWindowName("control"), true);
  assert.equal(isPenetrateWindowName("store"), false);
  assert.equal(shouldIncludeFeatureWindow("control", {}), false);
  assert.equal(shouldIncludeFeatureWindow("control", { control: true }), true);
  assert.equal(shouldIncludeFeatureWindow("store", {}), true);
  assert.equal(PENETRATE_IPC["control_bus-Main_eventMouse"], "control");
  const pet = { x: 100, y: 200, width: 144, height: 144 };
  const control = { x: 0, y: 330, width: 1100, height: 505 };
  assert.equal(
    shouldShowPetCursor({
      point: { x: 550, y: 400 },
      petHitRect: pet,
      featureRects: [],
    }),
    false
  );
  assert.equal(
    shouldShowPetCursor({
      point: { x: 550, y: 400 },
      petHitRect: pet,
      featureRects: [control],
    }),
    true
  );
});

test("pet-cursor.CURSOR.4-2 pet hit rect insets SWF stage padding", () => {
  const stage = { x: 100, y: 200, width: 180, height: 180 };
  const visual = tightenPetHitRect(stage);
  assert.equal(visual.x, 100 + 180 * PET_HIT_INSET.left);
  assert.equal(visual.y, 200 + 180 * PET_HIT_INSET.top);
  assert.equal(
    shouldShowPetCursor({
      point: { x: 190, y: 210 },
      petHitRect: visual,
      featureRects: [],
    }),
    false
  );
  assert.equal(
    shouldShowPetCursor({
      point: { x: 190, y: 300 },
      petHitRect: visual,
      featureRects: [],
    }),
    true
  );
});

test("pet-cursor.CURSOR.4-3 menu gaps stay inside the cando cluster", () => {
  const button = { x: 100, y: 40, width: 50, height: 50 };
  const food = { x: 100, y: 98, width: 80, height: 28 };
  const gap = { x: 120, y: 94 };
  assert.equal(pointInRect(gap, button), false);
  assert.equal(pointInRect(gap, food), false);
  const padded = screenCandoRects([button, food], { x: 0, y: 0 }, CANDO_CLUSTER_PAD);
  assert.equal(padded.length, 2);
  assert.equal(pointInRect(gap, padRect(button, CANDO_CLUSTER_PAD)), true);
  assert.equal(
    shouldShowPetCursor({
      point: gap,
      petHitRect: { x: 0, y: 0, width: 10, height: 10 },
      featureRects: padded,
    }),
    true
  );
  assert.match(CANDO_UNION_SCRIPT, /querySelectorAll\('\[cando\], \[candoMust\]'\)/);
  assert.match(CANDO_UNION_SCRIPT, /out\.push/);
  const overlaySrc = fs.readFileSync(
    path.join(__dirname, "../qq-pet-macos/src/windows/main/petCursorOverlay.js"),
    "utf8"
  );
  assert.match(overlaySrc, /refreshCandoCluster/);
  assert.match(overlaySrc, /screenCandoRects/);
});

test("pet-cursor.CURSOR.3-2 native hide pulses while Chromium shows the arrow", () => {
  const calls = [];
  const api = createNativeCursorHide({
    hideIfVisible() {
      calls.push("h");
    },
    show() {
      calls.push("s");
    },
    isPressed() {
      return false;
    },
  });
  api.hide();
  api.hide();
  api.show();
  assert.deepEqual(calls, ["h", "h", "s"]);
  assert.match(JXA, /CGDisplayHideCursor/);
  assert.ok(NATIVE_CLANG_ARGS.includes("dynamic_lookup"));
  const nativeSrc = fs.readFileSync(
    path.join(__dirname, "../qq-pet-macos/src/windows/main/macCursorNative.c"),
    "utf8"
  );
  assert.match(nativeSrc, /napi_register_module_v1/);
  assert.match(nativeSrc, /initWithImage:hotSpot:/);
  assert.match(nativeSrc, /stacked_hidden/);
  assert.match(nativeSrc, /NSCursor/);
  const overlaySrc = fs.readFileSync(
    path.join(__dirname, "../qq-pet-macos/src/windows/main/petCursorOverlay.js"),
    "utf8"
  );
  assert.match(overlaySrc, /createNativeCursorHide/);
  assert.match(overlaySrc, /tightenPetHitRect/);
  assert.match(overlaySrc, /PENETRATE_IPC/);
});
