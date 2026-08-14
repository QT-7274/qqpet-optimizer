const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  computeTrayPopupPosition,
} = require("../qq-pet-macos/src/windows/util/trayPopupPosition.js");
const {
  resolveRightMenuPosition,
} = require("../qq-pet-macos/src/windows/popups/rightMenu/rightMenuPosition.js");

const RIGHT_MENU = { width: 340, height: 300 };
const STATE_INFO = { width: 190, height: 290 };
const MAC_WORK = { x: 0, y: 25, width: 1440, height: 875 };
const TRAY = { x: 700, y: 2, width: 22, height: 22 };

const rightMenuMain = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/popups/rightMenu/main.js"),
  "utf8"
);
const mainJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/main/main.js"),
  "utf8"
);

// tray-rightmenu-position.TRAY.1
test("tray-rightmenu-position.TRAY.1 tray right-click uses the same workArea rule as stateInfo", () => {
  const menuPos = resolveRightMenuPosition({
    nowPosition: [TRAY.x, TRAY.y],
    trayBounds: TRAY,
    windowSize: RIGHT_MENU,
    workArea: MAC_WORK,
  });
  const expected = computeTrayPopupPosition({
    trayBounds: TRAY,
    windowSize: RIGHT_MENU,
    workArea: MAC_WORK,
  });
  assert.deepEqual(menuPos, expected);
  assert.ok(menuPos.y >= MAC_WORK.y);
  assert.ok(menuPos.y >= TRAY.y + TRAY.height - 1);

  const statePos = computeTrayPopupPosition({
    trayBounds: TRAY,
    windowSize: STATE_INFO,
    workArea: MAC_WORK,
  });
  assert.equal(menuPos.y, statePos.y);
});

// tray-rightmenu-position.PET.1
test("tray-rightmenu-position.PET.1 pet right-click keeps followMain offset", () => {
  const pos = resolveRightMenuPosition({
    positionType: "followMain",
    nowPosition: [400, 300],
    windowSize: RIGHT_MENU,
    workArea: MAC_WORK,
  });
  assert.deepEqual(pos, { x: 315, y: 80 });
});

test("tray right-click passes trayBounds into rightMenu", () => {
  assert.match(
    mainJs,
    /on:"right-click"[\s\S]*rightMenu\.cleate\(\{nowPosition:\[e\.bounds\.x,e\.bounds\.y\],trayBounds:e\.bounds/
  );
});

test("rightMenu window uses resolveRightMenuPosition", () => {
  assert.match(rightMenuMain, /rightMenuPosition/);
  assert.match(rightMenuMain, /resolveRightMenuPosition/);
  assert.match(rightMenuMain, /applyPositionToWindow/);
});
