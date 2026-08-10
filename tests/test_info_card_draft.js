const test = require("node:test");
const assert = require("node:assert/strict");
const {
  applyPetInfoToDrafts,
} = require("../qq-pet-macos/src/windows/popups/infoCard/infoCardDraft.js");

test("first load fills both drafts from store", () => {
  const next = applyPetInfoToDrafts(
    {},
    { host: "", petName: "" },
    { info: { host: "主", name: "爹" }, maxInfo: { level: 1 } }
  );
  assert.equal(next.host, "主");
  assert.equal(next.petName, "爹");
});

test("saving pet name keeps dirty host draft", () => {
  const prev = { info: { host: "主", name: "爹" }, maxInfo: { level: 1 } };
  const next = applyPetInfoToDrafts(
    prev,
    { host: "新主人", petName: "新名字" },
    { info: { host: "主", name: "新名字" }, maxInfo: { level: 1 } }
  );
  assert.equal(next.host, "新主人");
  assert.equal(next.petName, "新名字");
});

test("saving host keeps dirty pet name draft", () => {
  const prev = { info: { host: "主", name: "爹" }, maxInfo: { level: 1 } };
  const next = applyPetInfoToDrafts(
    prev,
    { host: "新主人", petName: "草稿名" },
    { info: { host: "新主人", name: "爹" }, maxInfo: { level: 1 } }
  );
  assert.equal(next.host, "新主人");
  assert.equal(next.petName, "草稿名");
});

test("external store change to dirty field wins", () => {
  const prev = { info: { host: "主", name: "爹" }, maxInfo: { level: 1 } };
  const next = applyPetInfoToDrafts(
    prev,
    { host: "草稿主人", petName: "爹" },
    { info: { host: "别人改的", name: "爹" }, maxInfo: { level: 1 } }
  );
  assert.equal(next.host, "别人改的");
  assert.equal(next.petName, "爹");
});
