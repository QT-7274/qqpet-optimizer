const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  clampPetPosition,
  detectPetEdge,
} = require("../qq-pet-macos/src/windows/util/petScreenBounds.js");

const MAC_WORK = { x: 0, y: 25, width: 1440, height: 875 };
const SIZE = { width: 144, height: 144 };

// pet-edge-hide.EDGE.1
test("pet-edge-hide.EDGE.1 left edge is left and stays on-screen", () => {
  const pos = clampPetPosition({
    x: -40,
    y: 200,
    ...SIZE,
    workArea: MAC_WORK,
  });
  assert.deepEqual(pos, { x: 0, y: 200 });
  assert.equal(
    detectPetEdge({ ...pos, ...SIZE, workArea: MAC_WORK }),
    "left"
  );
});

// pet-edge-hide.EDGE.1
test("pet-edge-hide.EDGE.1 right edge is right and stays on-screen", () => {
  const pos = clampPetPosition({
    x: 2000,
    y: 200,
    ...SIZE,
    workArea: MAC_WORK,
  });
  assert.deepEqual(pos, { x: 1296, y: 200 });
  assert.equal(
    detectPetEdge({ ...pos, ...SIZE, workArea: MAC_WORK }),
    "right"
  );
});

test("pet-edge-hide.EDGE.2 leaving the edge restores center", () => {
  const pos = clampPetPosition({
    x: 400,
    y: 300,
    ...SIZE,
    workArea: MAC_WORK,
  });
  assert.equal(
    detectPetEdge({ ...pos, ...SIZE, workArea: MAC_WORK }),
    "center"
  );
});

test("pet-edge-hide.EDGE.3 cannot fall fully off-screen", () => {
  const pos = clampPetPosition({
    x: -400,
    y: 5000,
    ...SIZE,
    workArea: MAC_WORK,
  });
  assert.equal(pos.x, 0);
  assert.equal(pos.y, 756);
  assert.ok(pos.x >= MAC_WORK.x);
  assert.ok(pos.y >= MAC_WORK.y);
  assert.ok(pos.x + SIZE.width <= MAC_WORK.x + MAC_WORK.width);
  assert.ok(pos.y + SIZE.height <= MAC_WORK.y + MAC_WORK.height);
});

test("pet-edge-hide.EDGE.4 second display uses that workArea", () => {
  const workArea = { x: 1920, y: 25, width: 1920, height: 1055 };
  const pos = clampPetPosition({
    x: 4000,
    y: 40,
    ...SIZE,
    workArea,
  });
  assert.deepEqual(pos, { x: 3696, y: 40 });
  assert.equal(detectPetEdge({ ...pos, ...SIZE, workArea }), "right");
  assert.ok(pos.x >= 1920);
});

test("menu bar workArea keeps the pet below y=25", () => {
  const pos = clampPetPosition({
    x: 100,
    y: 0,
    ...SIZE,
    workArea: MAC_WORK,
  });
  assert.equal(pos.y, 25);
});

const mainJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/main/main.js"),
  "utf8"
);
const indexJs = fs.readFileSync(
  path.join(__dirname, "../qq-pet-macos/src/windows/main/index.js"),
  "utf8"
);

test("main move path clamps with petScreenBounds", () => {
  assert.match(mainJs, /petScreenBounds\.js/);
  assert.match(mainJs, /clampPetPosition/);
  assert.match(mainJs, /getDisplayNearestPoint/);
});

test("renderer maps edge to hideleft hideright via goNormal", () => {
  assert.match(indexJs, /detectPetEdge/);
  assert.match(
    indexJs,
    /goNormal\(\)\{return"left"==this\.position\?"hideleft":"right"==this\.position\?"hideright":"center"==this\.position\?"normal":void 0\}/
  );
});
