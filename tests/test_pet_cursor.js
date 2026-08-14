const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  PET_CURSOR,
  cursorFallback,
} = require("../qq-pet-macos/src/windows/main/petCursor.js");

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

// pet-cursor.CURSOR.1
test("pet-cursor.CURSOR.1 macOS CSS lists PNG hotspot then does not use pointer", () => {
  assert.match(
    css,
    /#move\s*\{[^}]*cursor:\s*url\("\.\.\/\.\.\/assets\/img_res\/hand\/default\/normal\.png"\) 4 12,\s*url\("\.\.\/\.\.\/assets\/img_res\/hand\/default\/normal\.cur"\),/
  );
  assert.match(
    css,
    /#move:active\s*\{[^}]*cursor:\s*url\("\.\.\/\.\.\/assets\/img_res\/hand\/default\/press\.png"\) 6 15,\s*url\("\.\.\/\.\.\/assets\/img_res\/hand\/default\/press\.cur"\),/
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
