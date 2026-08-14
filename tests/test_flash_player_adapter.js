const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  installFlashPlayerApi,
  createPetEmbed,
  describePlayer,
  getRufflePetConfig,
  hideRuffleChrome,
  changePetSwf,
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
  assert.doesNotMatch(swfPet, /changePetSwf/);
});

test("main window loads the adapter before swfPet", () => {
  assert.match(
    mainJs,
    /jsFiles=\["\.\/util\/move\.js","\.\/util\/pet\/flashPlayerAdapter\.js","\.\/util\/pet\/swfPet\.js"/
  );
});

const appHtml = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/app.html"),
  "utf8"
);

// pet-ruffle-chrome.SPLASH.1
test("pet-ruffle-chrome.SPLASH.1 config skips splash play overlay and blue stage", () => {
  const cfg = getRufflePetConfig();
  assert.equal(cfg.autoplay, "on");
  assert.equal(cfg.unmuteOverlay, "hidden");
  assert.equal(cfg.splashScreen, false);
  assert.equal(cfg.preloader, false);
  assert.equal(cfg.wmode, "transparent");
  assert.equal(cfg.letterbox, "off");
  assert.equal(cfg.backgroundColor, null);
});

test("pet-ruffle-chrome.SPLASH.1 app.html applies that config before ruffle.js", () => {
  const splashAt = appHtml.indexOf("splashScreen");
  const preloaderAt = appHtml.indexOf("preloader");
  const ruffleAt = appHtml.indexOf('src="./js/ruffle/ruffle.js"');
  assert.match(appHtml, /splashScreen:\s*false/);
  assert.match(appHtml, /preloader:\s*false/);
  assert.ok(splashAt >= 0 && splashAt < ruffleAt);
  assert.ok(preloaderAt >= 0 && preloaderAt < ruffleAt);
});

test("pet-ruffle-chrome.SWAP.1 changePetSwf does not call load which destroys WebGL", () => {
  const loads = [];
  const el = {
    tagName: "RUFFLE-PLAYER",
    metadata: { numFrames: 12, frameRate: 12 },
    PercentLoaded() {
      return 100;
    },
    load(opts) {
      loads.push(opts);
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
  };
  const result = changePetSwf(el, { src: "Hide_left.swf", wmode: "transparent" });
  assert.equal(result.replaced, true);
  assert.equal(result.el.tagName, "EMBED");
  assert.equal(result.el.getAttribute("src"), "Hide_left.swf");
  assert.equal(loads.length, 0);
});

test("pet-ruffle-chrome.SWAP.1 missing load still builds a fresh embed", () => {
  const result = changePetSwf(
    { tagName: "EMBED" },
    { id: "pet", src: "Stand.swf" }
  );
  assert.equal(result.replaced, true);
  assert.equal(result.el.tagName, "EMBED");
  assert.equal(result.el.getAttribute("src"), "Stand.swf");
});

test("pet-ruffle-chrome.SPLASH.1 hideRuffleChrome hides play-button and splash in shadow DOM", () => {
  const appended = [];
  const player = {
    shadowRoot: {
      querySelector() {
        return null;
      },
      appendChild(node) {
        appended.push(node);
      },
    },
  };
  hideRuffleChrome(player);
  const css = appended.map((n) => n.textContent || "").join("\n");
  assert.match(css, /play-button/);
  assert.match(css, /splash-screen/);
  assert.match(css, /unmute-overlay/);
});
