const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  resolveTrayStatus,
} = require("../qq-pet-macos/src/windows/util/trayStatus.js");

function pet(overrides = {}) {
  return {
    info: {
      host: "主人",
      name: "小Q",
      health: 5,
      hunger: 2000,
      clean: 2000,
      mood: 1000,
      ...(overrides.info || {}),
    },
    maxInfo: {
      stopGrowth: false,
      ...(overrides.maxInfo || {}),
    },
    activeOption: {
      ill: null,
      work: null,
      study: null,
      trip: null,
      ...(overrides.activeOption || {}),
    },
  };
}

// menu-bar-tray-priority.PRIORITY.1
test("menu-bar-tray-priority.PRIORITY.1 pause plus hungry shows hungry", () => {
  const status = resolveTrayStatus(
    pet({
      info: { hunger: 100 },
      maxInfo: { stopGrowth: true },
    })
  );
  assert.equal(status.name, "hungry");
  assert.match(status.tip, /饿/);
});

// menu-bar-tray-priority.PRIORITY.2
test("menu-bar-tray-priority.PRIORITY.2 ill plus hungry shows ill", () => {
  const status = resolveTrayStatus(
    pet({
      info: { hunger: 100 },
      activeOption: { ill: { type: "ill", name: "咳嗽" } },
    })
  );
  assert.equal(status.name, "ill");
  assert.match(status.tip, /病/);
});

// menu-bar-tray-priority.PRIORITY.3
test("menu-bar-tray-priority.PRIORITY.3 all-normal uses normal icon", () => {
  const status = resolveTrayStatus(pet());
  assert.equal(status.name, "normal");
  assert.equal(status.tip, "主人家的小Q");
});

test("menu-bar-tray-priority.PRIORITY.1 dead beats ill hungry and pause", () => {
  const status = resolveTrayStatus(
    pet({
      info: { health: 0, hunger: 0 },
      maxInfo: { stopGrowth: true },
      activeOption: { ill: { type: "dead", name: "死亡" } },
    })
  );
  assert.equal(status.name, "dead");
});

test("menu-bar-tray-priority.PRIORITY.1 dirty beats mood pause and activity", () => {
  const status = resolveTrayStatus(
    pet({
      info: { clean: 200, mood: 10 },
      maxInfo: { stopGrowth: true },
      activeOption: { work: { name: "打工" } },
    })
  );
  assert.equal(status.name, "dirty");
});

test("menu-bar-tray-priority.PRIORITY.1 low mood beats pause", () => {
  const status = resolveTrayStatus(
    pet({
      info: { mood: 80 },
      maxInfo: { stopGrowth: true },
    })
  );
  assert.equal(status.name, "event");
  assert.match(status.tip, /心情/);
});

test("menu-bar-tray-priority.PRIORITY.1 activity beats pause at the same bucket", () => {
  const status = resolveTrayStatus(
    pet({
      maxInfo: { stopGrowth: true },
      activeOption: { study: { name: "上课" } },
    })
  );
  assert.equal(status.name, "study");
});

test("menu-bar-tray-priority.PRIORITY.1 pause shows when nothing else is wrong", () => {
  const status = resolveTrayStatus(pet({ maxInfo: { stopGrowth: true } }));
  assert.equal(status.name, "pause");
  assert.match(status.tip, /暂停/);
});

test("leave override is not a pet status", () => {
  const status = resolveTrayStatus(pet({ info: { hunger: 0 } }), "leave");
  assert.equal(status.name, "leave");
});

test("forced pause name cannot cover hungry", () => {
  const status = resolveTrayStatus(
    pet({ info: { hunger: 10 }, maxInfo: { stopGrowth: true } }),
    "pause"
  );
  assert.equal(status.name, "hungry");
});

const mainJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/main/main.js"),
  "utf8"
);
test("changeTraysIcon resolves status instead of last-write-wins", () => {
  assert.match(mainJs, /trayStatus\.js/);
  assert.match(mainJs, /resolveTrayStatus/);
});

test("menu-bar-tray-priority.PRIORITY.3 status window still lists every required field", () => {
  const index = fs.readFileSync(
    path.join(__dirname, "../qq-pet-macos/src/windows/popups/stateInfo/index.js"),
    "utf8"
  );
  const html = fs.readFileSync(
    path.join(__dirname, "../qq-pet-macos/src/windows/popups/stateInfo/index.html"),
    "utf8"
  );
  assert.match(index, /hunger:\{label:"饥饿："/);
  assert.match(index, /clean:\{label:"清洁："/);
  assert.match(index, /health:\{label:"健康："/);
  assert.match(index, /mood:\{label:"心情："/);
  assert.match(html, /成长：/);
  assert.match(html, /状态：/);
});
