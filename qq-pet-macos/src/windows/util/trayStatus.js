/**
 * Tray icon and tooltip show only the highest-priority pet status.
 * menu-bar-tray-priority.PRIORITY.1
 * menu-bar-tray-priority.PRIORITY.2
 * menu-bar-tray-priority.PRIORITY.3
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.trayStatus = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const HUNGRY_BELOW = 720;
  const DIRTY_BELOW = 1080;
  const LOW_MOOD_BELOW = 100;

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function hostLabel(petInfo) {
    const host = petInfo?.info?.host || "";
    const name = petInfo?.info?.name || "pet";
    return host ? host + "家的" + name : name;
  }

  function activityName(petInfo) {
    const active = petInfo?.activeOption || {};
    if (active.work) return "work";
    if (active.study) return "study";
    if (active.trip) return "trip";
    return null;
  }

  function resolveTrayStatus(petInfo, requestedName) {
    if (requestedName === "leave") {
      return { name: "leave", tip: "正在退出···" };
    }

    const info = petInfo?.info || {};
    const health = toNumber(info.health, 5);
    const hunger = toNumber(info.hunger, 2000);
    const clean = toNumber(info.clean, 2000);
    const mood = toNumber(info.mood, 1000);
    const ill = petInfo?.activeOption?.ill;
    const paused = !!(petInfo?.maxInfo && petInfo.maxInfo.stopGrowth);
    const activity = activityName(petInfo);
    const label = hostLabel(petInfo);

    if (health === 0 || (ill && ill.type === "dead")) {
      return { name: "dead", tip: "宠物已死亡" };
    }
    if (ill) {
      return { name: "ill", tip: "宠物生病了" };
    }
    if (hunger < HUNGRY_BELOW) {
      return { name: "hungry", tip: "宠物饿了" };
    }
    if (clean < DIRTY_BELOW) {
      return { name: "dirty", tip: "宠物该洗澡了" };
    }
    if (mood < LOW_MOOD_BELOW) {
      return { name: "event", tip: "宠物心情差" };
    }
    if (activity) {
      const tips = { work: "宠物打工中", study: "宠物学习中", trip: "宠物旅行中" };
      return { name: activity, tip: tips[activity] };
    }
    if (paused) {
      return { name: "pause", tip: "暂停成长" };
    }
    return { name: "normal", tip: label };
  }

  return { resolveTrayStatus };
});
