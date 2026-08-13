const test = require("node:test");
const assert = require("node:assert/strict");
const { openOrFocusSetup } = require("../qq-pet-macos/src/windows/popups/setup/openOrFocusSetup.js");

function fakeSetup({ show = false, destroyed = false, hasWindow = true } = {}) {
  const calls = [];
  const window = {
    isDestroyed() {
      return destroyed;
    },
    show() {
      calls.push("show");
    },
    focus() {
      calls.push("focus");
    },
  };
  return {
    calls,
    setup: {
      show,
      window: hasWindow ? window : null,
      cleate() {
        calls.push("cleate");
      },
    },
  };
}

// menu-bar-status-settings.OPEN.1
test("menu-bar-status-settings.OPEN.1 hidden setup creates the settings window", () => {
  const { setup, calls } = fakeSetup({ show: false, hasWindow: false });
  assert.equal(openOrFocusSetup(setup), "create");
  assert.deepEqual(calls, ["cleate"]);
});

// menu-bar-status-settings.OPEN.2
test("menu-bar-status-settings.OPEN.2 shown setup is focused and not created again", () => {
  const { setup, calls } = fakeSetup({ show: true });
  assert.equal(openOrFocusSetup(setup), "focus");
  assert.deepEqual(calls, ["show", "focus"]);
  assert.equal(openOrFocusSetup(setup), "focus");
  assert.deepEqual(calls, ["show", "focus", "show", "focus"]);
});

// menu-bar-status-settings.OPEN.2
test("menu-bar-status-settings.OPEN.2 destroyed shown window creates instead of focusing", () => {
  const { setup, calls } = fakeSetup({ show: true, destroyed: true });
  assert.equal(openOrFocusSetup(setup), "create");
  assert.deepEqual(calls, ["cleate"]);
});

test("missing setup is a no-op", () => {
  assert.equal(openOrFocusSetup(null), "missing");
  assert.equal(openOrFocusSetup(undefined), "missing");
});
