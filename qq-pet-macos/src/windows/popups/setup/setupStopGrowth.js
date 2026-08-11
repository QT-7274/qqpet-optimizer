/**
 * Keep setup "暂停成长" checkbox in sync with pet.maxInfo.stopGrowth.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.setupStopGrowth = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function mergeStopGrowth(sys, maxInfo) {
    return {
      ...(sys || {}),
      stopGrowth: !!(maxInfo && maxInfo.stopGrowth),
    };
  }

  /**
   * Radio click sends the *current* UI checked value as data.
   * Main then applies the opposite (same as other setup radios).
   */
  function resolveStopGrowthClick(currentUiChecked) {
    const checked = !!currentUiChecked;
    return {
      nextChecked: !checked,
      shouldPause: !checked,
    };
  }

  return { mergeStopGrowth, resolveStopGrowthClick };
});
