/**
 * Keep unsaved nickname drafts when pet info refresh arrives.
 * Saving one field must not wipe the other field's in-progress input.
 * menu-settings-ux-fixes.INFO_CARD.1
 * menu-settings-ux-fixes.INFO_CARD.2
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.infoCardDraft = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function applyPetInfoToDrafts(prevPetInfo, drafts, nextData) {
    const nextInfo = nextData?.info || {};
    const hadInfo = !!prevPetInfo?.info;
    const oldHost = prevPetInfo?.info?.host;
    const oldName = prevPetInfo?.info?.name;
    const hostDirty = hadInfo && drafts?.host !== oldHost;
    const nameDirty = hadInfo && drafts?.petName !== oldName;

    let host = drafts?.host;
    let petName = drafts?.petName;

    if (!hostDirty || nextInfo.host !== oldHost) {
      host = nextInfo.host;
    }
    if (!nameDirty || nextInfo.name !== oldName) {
      petName = nextInfo.name;
    }

    return { petInfo: nextData, host, petName };
  }

  return { applyPetInfoToDrafts };
});
