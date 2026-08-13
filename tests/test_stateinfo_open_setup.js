const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const stateInfoDir = path.join(
  __dirname,
  "../qq-pet-macos/src/windows/popups/stateInfo"
);
const rightMenuMain = path.join(
  __dirname,
  "../qq-pet-macos/src/windows/popups/rightMenu/main.js"
);

function read(name) {
  return fs.readFileSync(path.join(stateInfoDir, name), "utf8");
}

function headMarkup(html) {
  const match = html.match(/<div class="head">([\s\S]*?)<div class="main">/);
  assert.ok(match, "stateInfo head markup is present");
  return match[1];
}

// menu-bar-status-settings.TESTS.1

// menu-bar-status-settings.GEAR.1
test("menu-bar-status-settings.GEAR.1 gear sits immediately left of close", () => {
  const html = read("index.html");
  const css = read("index.css");
  const head = headMarkup(html);

  assert.match(head, /class="openSetup focusPress"/);
  assert.match(head, /@click="openSetup"/);
  assert.match(head, /class="close focusPress"/);

  const gearAt = head.indexOf('class="openSetup');
  const closeAt = head.indexOf('class="close');
  assert.ok(gearAt >= 0 && closeAt > gearAt);

  const between = head.slice(gearAt, closeAt);
  assert.doesNotMatch(between, /petFile|pinkDiamond|onceInfo/);
  assert.match(css, /\.openSetup\s*\{/);
});

// menu-bar-status-settings.GEAR.2
test("menu-bar-status-settings.GEAR.2 close still closes the status window", () => {
  const html = read("index.html");
  const js = read("index.js");
  assert.match(html, /class="close focusPress"[^>]*@click="goClose"/);
  assert.match(js, /goClose\(\)\{/);
  assert.match(js, /stateInfo_ToMainClose/);
});

// menu-bar-status-settings.OPEN.1
test("menu-bar-status-settings.OPEN.1 gear click sends openSetup over the same helper as the menu", () => {
  const js = read("index.js");
  const preload = read("preload.js");
  const main = read("main.js");

  assert.match(js, /openSetup\(\)\{window\.electronAPI\.stateInfo_ToMainOpenSetup/);
  assert.match(preload, /stateInfo_ToMainOpenSetup:e=>ipcRenderer\.send\("stateInfo_bus-openSetup"/);
  assert.match(main, /openOrFocusSetup/);
  assert.match(main, /"stateInfo_bus-openSetup"/);
  assert.match(main, /setup\/openOrFocusSetup\.js/);
});

// menu-bar-status-settings.MENU.1
test("menu-bar-status-settings.MENU.1 right-click openSetup still opens settings", () => {
  const menu = fs.readFileSync(rightMenuMain, "utf8");
  const menuUi = fs.readFileSync(
    path.join(__dirname, "../qq-pet-macos/src/windows/popups/rightMenu/index.js"),
    "utf8"
  );
  assert.match(menuUi, /label:"系统设置",value:"openSetup"/);
  assert.match(menu, /"openSetup"==o\.data\.value/);
  assert.match(menu, /openOrFocusSetup/);
});

// menu-bar-status-settings.BOUNDARY.1
test("menu-bar-status-settings.BOUNDARY.1 status window does not embed the settings form", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /全局设置|leftMenu|sysData|keyboardShortcuts/);
  assert.doesNotMatch(html, /type="slider"|type="shortcutKeys"/);
});
