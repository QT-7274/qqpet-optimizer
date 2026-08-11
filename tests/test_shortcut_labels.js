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

// menu-settings-ux-fixes.SETUP_SHORTCUTS.1
test("menu-settings-ux-fixes.SETUP_SHORTCUTS.1 darwin shows Mac modifier labels", () => {
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

// menu-settings-ux-fixes.SETUP_SHORTCUTS.2
test("menu-settings-ux-fixes.SETUP_SHORTCUTS.2 darwin modifier choices include Command/META", () => {
  assert.deepEqual(modifierTokens("darwin"), [
    "ALT",
    "SHIFT",
    "CONTROL",
    "META",
  ]);
  assert.deepEqual(modifierTokens("win32"), ["ALT", "SHIFT", "CONTROL"]);
});

// menu-settings-ux-fixes.SETUP_SHORTCUTS.1
test("menu-settings-ux-fixes.SETUP_SHORTCUTS.1 choice tip uses display labels", () => {
  assert.equal(
    formatChoiceList(["ALT", "SHIFT", "CONTROL", "META"], "darwin"),
    "Option(⌥),Shift(⇧),Control(⌃),Command(⌘)"
  );
});

// menu-settings-ux-fixes.SETUP_SHORTCUTS.2
test("menu-settings-ux-fixes.SETUP_SHORTCUTS.2 normalize captured KeyboardEvent.key values", () => {
  assert.equal(normalizeCapturedKey("Meta"), "META");
  assert.equal(normalizeCapturedKey("Control"), "CONTROL");
  assert.equal(normalizeCapturedKey("Alt"), "ALT");
  assert.equal(normalizeCapturedKey("a"), "A");
});

// menu-settings-ux-fixes.SETUP_SHORTCUTS.3
test("menu-settings-ux-fixes.SETUP_SHORTCUTS.3 toAccelerator maps tokens for Electron globalShortcut", () => {
  assert.equal(toAcceleratorToken("CONTROL"), "Control");
  assert.equal(toAcceleratorToken("META"), "Command");
  assert.equal(toAcceleratorToken("ALT"), "Alt");
  assert.equal(toAccelerator(["CONTROL", "SHIFT", "A"]), "Control+Shift+A");
  assert.equal(toAccelerator(["META", "S"]), "Command+S");
});
