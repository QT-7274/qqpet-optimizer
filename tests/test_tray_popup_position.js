const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeTrayPopupPosition,
  applyPositionToWindow,
} = require("../qq-pet-macos/src/windows/util/trayPopupPosition.js");

const STATE_INFO = { width: 190, height: 290 };

function assertInsideWorkArea(pos, size, workArea) {
  assert.ok(pos.x >= workArea.x);
  assert.ok(pos.y >= workArea.y);
  assert.ok(pos.x + size.width <= workArea.x + workArea.width);
  assert.ok(pos.y + size.height <= workArea.y + workArea.height);
}

// tray-stateinfo-position.POSITION.1
// tray-stateinfo-position.TESTS.1
test("tray-stateinfo-position.POSITION.1 macOS menu bar opens stateInfo below tray", () => {
  const workArea = { x: 0, y: 25, width: 1440, height: 875 };
  const trayBounds = { x: 700, y: 2, width: 22, height: 22 };
  const pos = computeTrayPopupPosition({
    trayBounds,
    windowSize: STATE_INFO,
    workArea,
  });

  assert.deepEqual(pos, { x: 616, y: 25 });
  assert.ok(pos.y >= trayBounds.y + trayBounds.height - 1);
  assertInsideWorkArea(pos, STATE_INFO, workArea);
});

// tray-stateinfo-position.POSITION.4
// tray-stateinfo-position.TESTS.1
test("tray-stateinfo-position.POSITION.4 Windows bottom taskbar opens stateInfo above tray", () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
  const trayBounds = { x: 1800, y: 1044, width: 24, height: 40 };
  const pos = computeTrayPopupPosition({
    trayBounds,
    windowSize: STATE_INFO,
    workArea,
  });

  assert.deepEqual(pos, { x: 1717, y: 750 });
  assert.ok(pos.y + STATE_INFO.height <= workArea.y + workArea.height);
  assert.ok(pos.y < trayBounds.y);
  assertInsideWorkArea(pos, STATE_INFO, workArea);
});

// tray-stateinfo-position.POSITION.2
// tray-stateinfo-position.TESTS.1
test("tray-stateinfo-position.POSITION.2 left edge stays inside workArea", () => {
  const workArea = { x: 0, y: 25, width: 1440, height: 875 };
  const trayBounds = { x: 8, y: 2, width: 22, height: 22 };
  const pos = computeTrayPopupPosition({
    trayBounds,
    windowSize: STATE_INFO,
    workArea,
  });

  assert.deepEqual(pos, { x: 0, y: 25 });
  assertInsideWorkArea(pos, STATE_INFO, workArea);
});

// tray-stateinfo-position.POSITION.2
// tray-stateinfo-position.TESTS.1
test("tray-stateinfo-position.POSITION.2 right edge stays inside workArea", () => {
  const workArea = { x: 0, y: 25, width: 1440, height: 875 };
  const trayBounds = { x: 1410, y: 2, width: 22, height: 22 };
  const pos = computeTrayPopupPosition({
    trayBounds,
    windowSize: STATE_INFO,
    workArea,
  });

  assert.deepEqual(pos, { x: 1250, y: 25 });
  assertInsideWorkArea(pos, STATE_INFO, workArea);
});

// tray-stateinfo-position.POSITION.3
// tray-stateinfo-position.TESTS.1
test("tray-stateinfo-position.POSITION.3 second display does not jump to primary", () => {
  const workArea = { x: 1920, y: 25, width: 1920, height: 1055 };
  const trayBounds = { x: 3700, y: 0, width: 22, height: 22 };
  const pos = computeTrayPopupPosition({
    trayBounds,
    windowSize: STATE_INFO,
    workArea,
  });

  assert.deepEqual(pos, { x: 3616, y: 25 });
  assert.ok(pos.x >= 1920);
  assertInsideWorkArea(pos, STATE_INFO, workArea);
});

// tray-stateinfo-position.TOGGLE.2
test("tray-stateinfo-position.TOGGLE.2 reapplies bounds and shows existing window", () => {
  const calls = [];
  const win = {
    setBounds(bounds) {
      calls.push(["setBounds", bounds]);
    },
    show() {
      calls.push(["show"]);
    },
  };

  assert.equal(
    applyPositionToWindow(win, { x: 616, y: 25 }, STATE_INFO),
    true
  );
  assert.deepEqual(calls, [
    ["setBounds", { x: 616, y: 25, width: 190, height: 290 }],
    ["show"],
  ]);
});

// tray-stateinfo-position.TOGGLE.2
test("tray-stateinfo-position.TOGGLE.2 missing window is a no-op", () => {
  assert.equal(
    applyPositionToWindow(null, { x: 0, y: 0 }, STATE_INFO),
    false
  );
});

test("tray-stateinfo-position.TOGGLE.2 destroyed window is a no-op", () => {
  const win = {
    isDestroyed: () => true,
    setBounds() {
      throw new Error("destroyed window must not be moved");
    },
    show() {
      throw new Error("destroyed window must not be shown");
    },
  };
  assert.equal(
    applyPositionToWindow(win, { x: 616, y: 25 }, STATE_INFO),
    false
  );
});
