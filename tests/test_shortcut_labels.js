const test = require("node:test");
const assert = require("node:assert/strict");
const {
  formatToken,
  formatChoiceList,
  modifierTokens,
  normalizeCapturedKey,
  toAcceleratorToken,
  toAccelerator,
} = require("../qq-pet-macos/src/windows/util/shortcutLabels.js");

test("darwin shows Mac modifier labels", () => {
  assert.equal(formatToken("CONTROL", "darwin"), "Control(⌃)");
  assert.equal(formatToken("ALT", "darwin"), "Option(⌥)");
  assert.equal(formatToken("SHIFT", "darwin"), "Shift(⇧)");
  assert.equal(formatToken("META", "darwin"), "Command(⌘)");
  assert.equal(formatToken("A", "darwin"), "A");
  assert.equal(formatToken("", "darwin"), "''");
});

test("non-darwin keeps familiar Win-style labels", () => {
  assert.equal(formatToken("CONTROL", "win32"), "Ctrl");
  assert.equal(formatToken("ALT", "win32"), "Alt");
  assert.equal(formatToken("META", "win32"), "Win");
});

test("darwin modifier choices include Command/META", () => {
  assert.deepEqual(modifierTokens("darwin"), [
    "ALT",
    "SHIFT",
    "CONTROL",
    "META",
  ]);
  assert.deepEqual(modifierTokens("win32"), ["ALT", "SHIFT", "CONTROL"]);
});

test("choice tip uses display labels", () => {
  assert.equal(
    formatChoiceList(["ALT", "SHIFT", "CONTROL", "META"], "darwin"),
    "Option(⌥),Shift(⇧),Control(⌃),Command(⌘)"
  );
});

test("normalize captured KeyboardEvent.key values", () => {
  assert.equal(normalizeCapturedKey("Meta"), "META");
  assert.equal(normalizeCapturedKey("Control"), "CONTROL");
  assert.equal(normalizeCapturedKey("Alt"), "ALT");
  assert.equal(normalizeCapturedKey("a"), "A");
});

test("toAccelerator maps tokens for Electron globalShortcut", () => {
  assert.equal(toAcceleratorToken("CONTROL"), "Control");
  assert.equal(toAcceleratorToken("META"), "Command");
  assert.equal(toAcceleratorToken("ALT"), "Alt");
  assert.equal(toAccelerator(["CONTROL", "SHIFT", "A"]), "Control+Shift+A");
  assert.equal(toAccelerator(["META", "S"]), "Command+S");
});
