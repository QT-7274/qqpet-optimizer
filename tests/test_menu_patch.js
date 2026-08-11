const test = require("node:test");
const assert = require("node:assert/strict");
const {
  applyMenuPatch,
  hideMenuValue,
  growthMatch,
  muteMatch,
} = require("../qq-pet-macos/src/windows/popups/rightMenu/menuPatch.js");

function menuWithStore() {
  return [
    {
      label: "喂养宠物",
      value: "feeding",
      children: [
        { label: "喂养", value: "food" },
        { label: "清洗", value: "clean" },
        { label: "吃药", value: "cure" },
      ],
    },
    { label: "小游戏", value: "smallGame" },
    { label: "商城", value: "openStore" },
    {
      label: "设置及帮助",
      value: "settingsAndHelp",
      children: [
        { label: "开启免打扰", value: "openMute" },
        { label: "宠物资料", value: "petInfo" },
        { label: "系统设置", value: "openSetup" },
      ],
    },
    { label: "停止成长", value: "stopGrowth" },
    { label: "退出宠物", value: "quit" },
  ];
}

// menu-settings-ux-fixes.RIGHT_MENU.1
test("menu-settings-ux-fixes.RIGHT_MENU.1 legacy where [4] with 商城 clobbers 设置及帮助 (bug reproduction)", () => {
  const menu = menuWithStore();
  applyMenuPatch(menu, {
    data: { label: "停止成长", value: "stopGrowth" },
    where: [4],
  });

  assert.equal(menu[3].value, "stopGrowth");
  assert.equal(
    menu.filter((item) => item.value === "settingsAndHelp").length,
    0
  );
  assert.deepEqual(
    menu.map((item) => item.value),
    ["feeding", "smallGame", "openStore", "stopGrowth", "stopGrowth", "quit"]
  );
});

// menu-settings-ux-fixes.RIGHT_MENU.1
test("menu-settings-ux-fixes.RIGHT_MENU.1 value match updates growth without clobbering 设置及帮助", () => {
  const menu = menuWithStore();
  applyMenuPatch(menu, {
    data: { label: "开启成长", value: "openGrowth" },
    match: growthMatch(),
  });

  assert.equal(menu[3].value, "settingsAndHelp");
  assert.equal(menu[4].value, "openGrowth");
  assert.equal(menu[5].value, "quit");
  assert.deepEqual(
    menu.map((item) => item.label),
    ["喂养宠物", "小游戏", "商城", "设置及帮助", "开启成长", "退出宠物"]
  );
});

// menu-settings-ux-fixes.RIGHT_MENU.1
test("menu-settings-ux-fixes.RIGHT_MENU.1 value match updates mute under 设置及帮助 when 商城 present", () => {
  const menu = menuWithStore();
  applyMenuPatch(menu, {
    data: { label: "关闭免打扰", value: "closeMute", new: true },
    match: muteMatch(),
  });

  assert.equal(menu[3].value, "settingsAndHelp");
  assert.equal(menu[3].children[0].value, "closeMute");
  assert.equal(menu[3].children[1].value, "petInfo");
});

// menu-settings-ux-fixes.RIGHT_MENU.2
test("menu-settings-ux-fixes.RIGHT_MENU.2 hide quit by value keeps settings visible", () => {
  const menu = menuWithStore();
  hideMenuValue(menu, "quit");

  assert.equal(menu[3].value, "settingsAndHelp");
  assert.equal(menu[5].value, "quit");
  assert.equal(menu[5].unShow, true);
});
