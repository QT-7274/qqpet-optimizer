const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  opaqueWindowNames,
  resolveWindowOpacity,
} = require("../qq-pet-macos/src/windows/windowOpacity.js");

const windowJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/window.js"),
  "utf8"
);

// menu-bar-status-opacity.OPAQUE.1
test("menu-bar-status-opacity.OPAQUE.1 stateInfo and infoCard stay fully opaque", () => {
  assert.equal(resolveWindowOpacity("stateInfo", 0.2), 1);
  assert.equal(resolveWindowOpacity("infoCard", 0.1), 1);
  assert.ok(opaqueWindowNames().includes("stateInfo"));
  assert.ok(opaqueWindowNames().includes("infoCard"));
});

// menu-bar-status-opacity.OPAQUE.2
test("menu-bar-status-opacity.OPAQUE.2 pet main window still follows the slider", () => {
  assert.equal(resolveWindowOpacity("main", 0.4), 0.4);
  assert.equal(resolveWindowOpacity("floatStyle", 0.3), 0.3);
  assert.equal(resolveWindowOpacity("control", 0.5), 0.5);
});

// menu-bar-status-opacity.OPAQUE.3
test("menu-bar-status-opacity.OPAQUE.3 setup rightMenu smallGame viewSwf stay opaque", () => {
  for (const name of ["setup", "rightMenu", "smallGame", "viewSwf"]) {
    assert.equal(resolveWindowOpacity(name, 0.2), 1);
  }
});

test("window.js uses the shared opacity helper for create and slider updates", () => {
  assert.match(windowJs, /windowOpacity\.js/);
  assert.match(windowJs, /resolveWindowOpacity/);
  assert.doesNotMatch(
    windowJs,
    /opt=\{names:\["setup","rightMenu","smallGame","viewSwf"\]\}/
  );
});
