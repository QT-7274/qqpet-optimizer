const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mergeStopGrowth,
  resolveStopGrowthClick,
} = require("../qq-pet-macos/src/windows/popups/setup/setupStopGrowth.js");

test("merge seeds stopGrowth true from maxInfo", () => {
  const next = mergeStopGrowth({ opacity: 1, clip: false }, { stopGrowth: true });
  assert.equal(next.stopGrowth, true);
  assert.equal(next.opacity, 1);
});

test("merge seeds stopGrowth false when maxInfo paused off", () => {
  const next = mergeStopGrowth({ stopGrowth: true }, { stopGrowth: false });
  assert.equal(next.stopGrowth, false);
});

test("merge treats missing maxInfo as not paused", () => {
  assert.equal(mergeStopGrowth({}, null).stopGrowth, false);
  assert.equal(mergeStopGrowth({}, {}).stopGrowth, false);
});

test("click when unchecked pauses", () => {
  assert.deepEqual(resolveStopGrowthClick(false), {
    nextChecked: true,
    shouldPause: true,
  });
});

test("click when checked resumes", () => {
  assert.deepEqual(resolveStopGrowthClick(true), {
    nextChecked: false,
    shouldPause: false,
  });
});
