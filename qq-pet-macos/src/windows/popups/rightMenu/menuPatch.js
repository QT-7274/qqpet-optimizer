/**
 * Value-based right-menu patches.
 * Avoids fragile 1-based index updates that break when items like 商城 are inserted.
 * menu-settings-ux-fixes.RIGHT_MENU.1
 * menu-settings-ux-fixes.RIGHT_MENU.2
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.rightMenuPatch = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const GROWTH_VALUES = ["stopGrowth", "openGrowth", "stopState"];
  const MUTE_VALUES = ["openMute", "closeMute"];

  function findTopIndexByValues(menu, values) {
    const set = new Set(values);
    return menu.findIndex((item) => set.has(item?.value));
  }

  function findChildIndexByValues(parent, values) {
    if (!parent?.children) return -1;
    const set = new Set(values);
    return parent.children.findIndex((item) => set.has(item?.value));
  }

  /**
   * Apply a changeMenu message to a menu array (mutates and returns menu).
   *
   * Supported shapes:
   * - { data, match: { values: string[] } }                 // top-level by value
   * - { data, match: { parent, values: string[] } }         // child by parent+value
   * - { data, where: number[] }                             // legacy 1-based indices
   */
  function applyMenuPatch(menu, message) {
    if (!menu || !message?.data) return menu;

    if (message.match?.values?.length) {
      if (message.match.parent) {
        const parentIndex = menu.findIndex(
          (item) => item?.value === message.match.parent
        );
        if (parentIndex < 0) return menu;
        const childIndex = findChildIndexByValues(
          menu[parentIndex],
          message.match.values
        );
        if (childIndex < 0) return menu;
        menu[parentIndex].children[childIndex] = message.data;
        return menu;
      }

      const index = findTopIndexByValues(menu, message.match.values);
      if (index < 0) return menu;
      menu[index] = message.data;
      return menu;
    }

    if (message.where?.length > 0) {
      const getWhere = (n) => n - 1;
      if (message.where.length === 1) {
        const index = getWhere(message.where[0]);
        if (menu[index]) menu[index] = message.data;
      } else if (message.where.length === 2) {
        const parentIndex = getWhere(message.where[0]);
        const childIndex = getWhere(message.where[1]);
        if (menu[parentIndex]?.children?.[childIndex] !== undefined) {
          menu[parentIndex].children[childIndex] = message.data;
        }
      }
    }

    return menu;
  }

  function hideMenuValue(menu, value) {
    const item = menu?.find((entry) => entry?.value === value);
    if (item) item.unShow = true;
    return menu;
  }

  function growthMatch() {
    return { values: GROWTH_VALUES.slice() };
  }

  function muteMatch() {
    return { parent: "settingsAndHelp", values: MUTE_VALUES.slice() };
  }

  return {
    GROWTH_VALUES,
    MUTE_VALUES,
    applyMenuPatch,
    hideMenuValue,
    growthMatch,
    muteMatch,
    findTopIndexByValues,
    findChildIndexByValues,
  };
});
