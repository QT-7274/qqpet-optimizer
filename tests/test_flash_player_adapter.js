const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  installFlashPlayerApi,
  createPetEmbed,
  describePlayer,
} = require("../qq-pet-macos/src/windows/util/pet/flashPlayerAdapter.js");

function fakeRuffle({ numFrames = 24, frameRate = 12, src = "Stand.swf" } = {}) {
  const calls = [];
  const el = {
    tagName: "RUFFLE-PLAYER",
    metadata: { numFrames, frameRate },
    isPlaying: true,
    _readyState: 4,
    src,
    getAttribute(name) {
      return name === "src" ? src : null;
    },
    PercentLoaded() {
      return 100;
    },
    play() {
      this.isPlaying = true;
      calls.push("play");
    },
    pause() {
      this.isPlaying = false;
      calls.push("pause");
    },
  };
  return { el, calls };
}

// pet-swf-runtime.FLASH_API.1
test("pet-swf-runtime.FLASH_API.1 Ruffle player gets CurrentFrame TotalFrames IsPlaying", () => {
  const { el } = fakeRuffle();
  let now = 0;
  installFlashPlayerApi(el, { now: () => now });

  assert.equal(el.TotalFrames(), 24);
  assert.equal(el.CurrentFrame(), 0);
  assert.equal(el.IsPlaying(), true);
  assert.equal(el.PercentLoaded(), 100);

  now = 1000;
  assert.equal(el.CurrentFrame(), 12);

  now = 10_000;
  assert.equal(el.CurrentFrame(), 23);
  assert.equal(el.IsPlaying(), false);
});

// pet-swf-runtime.FLASH_API.2
test("pet-swf-runtime.FLASH_API.2 last frame unblocks the next queued SWF", () => {
  const { el } = fakeRuffle({ numFrames: 10, frameRate: 10 });
  let now = 0;
  installFlashPlayerApi(el, { now: () => now });
  now = 900;
  const current = el.CurrentFrame();
  const total = el.TotalFrames();
  const lastTimeCut = 1;
  assert.equal(total === current + lastTimeCut, true);
});

test("pet-swf-runtime.FLASH_API.1 Play StopPlay GotoFrame work on Ruffle", () => {
  const { el, calls } = fakeRuffle({ numFrames: 30, frameRate: 10 });
  let now = 0;
  installFlashPlayerApi(el, { now: () => now });
  now = 500;
  assert.equal(el.CurrentFrame(), 5);
  el.GotoFrame(20);
  assert.equal(el.CurrentFrame(), 20);
  el.StopPlay();
  assert.equal(el.IsPlaying(), false);
  assert.ok(calls.includes("pause"));
  el.Play();
  assert.equal(el.IsPlaying(), true);
});

test("unloaded ruffle reports CurrentFrame -1 like Flash", () => {
  const el = {
    tagName: "RUFFLE-PLAYER",
    metadata: null,
    PercentLoaded() {
      return 0;
    },
  };
  installFlashPlayerApi(el, { now: () => 0 });
  assert.equal(el.CurrentFrame(), -1);
  assert.equal(el.TotalFrames(), 0);
});

test("native Flash methods are left in place", () => {
  const el = {
    CurrentFrame: () => 7,
    TotalFrames: () => 12,
    IsPlaying: () => true,
    PercentLoaded: () => 100,
  };
  installFlashPlayerApi(el);
  assert.equal(el.CurrentFrame(), 7);
  assert.equal(el.TotalFrames(), 12);
});

test("createPetEmbed builds a fresh embed instead of cloning ruffle-player", () => {
  const el = createPetEmbed({
    id: "pet",
    src: "../assets/Action/GG/Adult/Stand.swf",
    wmode: "transparent",
  });
  assert.equal(el.tagName, "EMBED");
  assert.equal(el.getAttribute("id"), "pet");
  assert.equal(el.getAttribute("src"), "../assets/Action/GG/Adult/Stand.swf");
  assert.equal(el.getAttribute("type"), "application/x-shockwave-flash");
});

test("describePlayer records src and ruffle frame state", () => {
  const { el } = fakeRuffle({ src: "Eat1.swf", numFrames: 8, frameRate: 8 });
  let now = 0;
  installFlashPlayerApi(el, { now: () => now });
  now = 1000;
  const snap = describePlayer(el);
  assert.equal(snap.src, "Eat1.swf");
  assert.equal(snap.currentFrame, 7);
  assert.equal(snap.totalFrames, 8);
  assert.equal(snap.percentLoaded, 100);
});

const swfPet = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/util/pet/swfPet.js"),
  "utf8"
);
const mainJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/main/main.js"),
  "utf8"
);

test("swfPet polls through the Flash API adapter", () => {
  assert.match(swfPet, /flashPlayerAdapter/);
  assert.match(swfPet, /installFlashPlayerApi/);
  assert.match(swfPet, /createPetEmbed/);
});

test("main window loads the adapter before swfPet", () => {
  assert.match(
    mainJs,
    /jsFiles=\["\.\/util\/move\.js","\.\/util\/pet\/flashPlayerAdapter\.js","\.\/util\/pet\/swfPet\.js"/
  );
});
