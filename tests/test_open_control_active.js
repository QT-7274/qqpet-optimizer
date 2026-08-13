const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  openControlActive,
} = require("../qq-pet-macos/src/windows/popups/control/openControlActive.js");

const stateInfoMain = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/popups/stateInfo/main.js"),
  "utf8"
);
const stateInfoIndex = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/popups/stateInfo/index.js"),
  "utf8"
);
const stateInfoHtml = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/popups/stateInfo/index.html"),
  "utf8"
);
const rightMenuMain = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/popups/rightMenu/main.js"),
  "utf8"
);

function fakeControl({ show = false, hasWindow = true, destroyed = false } = {}) {
  const calls = [];
  const window = {
    isDestroyed() {
      return destroyed;
    },
  };
  return {
    calls,
    control: {
      show,
      window: hasWindow ? window : null,
      useInState(payload) {
        calls.push(["useInState", payload]);
      },
      cleate() {
        calls.push(["cleate"]);
      },
    },
  };
}

// menu-bar-status-control.SHOW.1
test("menu-bar-status-control.SHOW.1 hidden control still opens food clean cure", () => {
  for (const value of ["food", "clean", "cure"]) {
    const { control, calls } = fakeControl({ show: false });
    assert.equal(openControlActive(control, value), "opened");
    assert.deepEqual(calls, [
      ["useInState", { type: "active", opt: { value } }],
    ]);
  }
});

// menu-bar-status-control.SHOW.1
test("menu-bar-status-control.SHOW.1 visible control still opens the matching item", () => {
  const { control, calls } = fakeControl({ show: true });
  assert.equal(openControlActive(control, "food"), "opened");
  assert.deepEqual(calls[0], ["useInState", { type: "active", opt: { value: "food" } }]);
});

// menu-bar-status-control.SKIP.1
test("menu-bar-status-control.SKIP.1 mood and growth clicks do not open control", () => {
  const { control, calls } = fakeControl({ show: false });
  assert.equal(openControlActive(control, undefined), "ignore");
  assert.equal(openControlActive(control, ""), "ignore");
  assert.equal(openControlActive(control, "mood"), "ignore");
  assert.deepEqual(calls, []);
  assert.match(stateInfoIndex, /chooseOnce\(e\)\{e\.type\?window\.electronAPI\.stateInfo_ToMainOpenActive\(e\.type\)/);
  assert.match(stateInfoIndex, /hunger:\{label:"饥饿：",type:"food"/);
  assert.match(stateInfoIndex, /clean:\{label:"清洁：",type:"clean"/);
  assert.match(stateInfoIndex, /health:\{label:"健康：",type:"cure"/);
  assert.match(stateInfoIndex, /mood:\{label:"心情：",value:/);
  assert.doesNotMatch(stateInfoIndex, /mood:\{label:"心情：",type:/);
});

// menu-bar-status-control.BOUNDARY.1
test("menu-bar-status-control.BOUNDARY.1 status window does not embed an item list", () => {
  assert.doesNotMatch(stateInfoHtml, /getConsumablesPage|pageSize|doActiveMenu/);
  assert.doesNotMatch(stateInfoIndex, /getConsumablesPage|control_ToMain_getActiveData/);
});

test("stateInfo openActive no longer requires control.show", () => {
  assert.match(stateInfoMain, /openControlActive/);
  assert.doesNotMatch(
    stateInfoMain,
    /stateInfo_bus-openActive":\(e,t\)=>\{t&&control\.show&&control\.useInState/
  );
});

test("right-click feeding still uses the same open helper", () => {
  assert.match(rightMenuMain, /openControlActive/);
  assert.match(rightMenuMain, /"food"==o\.data\.value\|\|"clean"==o\.data\.value\|\|"cure"==o\.data\.value/);
});
