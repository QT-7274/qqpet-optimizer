/**
 * Map Electron-style shortcut tokens to platform display labels,
 * and normalize captured keys / accelerator strings.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.shortcutLabels = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DARWIN_MODIFIER_LABELS = {
    CONTROL: "Control(⌃)",
    CTRL: "Control(⌃)",
    ALT: "Option(⌥)",
    OPTION: "Option(⌥)",
    SHIFT: "Shift(⇧)",
    META: "Command(⌘)",
    COMMAND: "Command(⌘)",
    CMD: "Command(⌘)",
  };

  const DEFAULT_MODIFIER_LABELS = {
    CONTROL: "Ctrl",
    CTRL: "Ctrl",
    ALT: "Alt",
    OPTION: "Alt",
    SHIFT: "Shift",
    META: "Win",
    COMMAND: "Win",
    CMD: "Win",
  };

  const ACCELERATOR_TOKENS = {
    CONTROL: "Control",
    CTRL: "Control",
    ALT: "Alt",
    OPTION: "Alt",
    SHIFT: "Shift",
    META: "Command",
    COMMAND: "Command",
    CMD: "Command",
    ENTER: "Enter",
  };

  function detectPlatform(platform) {
    if (platform) return platform;
    if (typeof process !== "undefined" && process.platform) {
      return process.platform;
    }
    if (typeof navigator !== "undefined" && navigator.platform) {
      return /Mac|iPhone|iPad/i.test(navigator.platform) ? "darwin" : "other";
    }
    return "other";
  }

  function isDarwin(platform) {
    return detectPlatform(platform) === "darwin";
  }

  function formatToken(token, platform) {
    if (token === undefined || token === null || token === "") {
      return "''";
    }
    const key = String(token).toUpperCase();
    const map = isDarwin(platform)
      ? DARWIN_MODIFIER_LABELS
      : DEFAULT_MODIFIER_LABELS;
    return map[key] || String(token);
  }

  function formatParts(parts, platform) {
    return (parts || []).map((part) => formatToken(part, platform));
  }

  function formatChoiceList(choices, platform) {
    return (choices || [])
      .map((choice) => formatToken(choice, platform))
      .join(",");
  }

  function modifierTokens(platform) {
    // Stored tokens stay Electron-friendly uppercase; Mac also offers Command.
    if (isDarwin(platform)) {
      return ["ALT", "SHIFT", "CONTROL", "META"];
    }
    return ["ALT", "SHIFT", "CONTROL"];
  }

  function normalizeCapturedKey(key) {
    const upper = String(key || "").toUpperCase();
    if (upper === "META" || upper === "COMMAND" || upper === "OS") {
      return "META";
    }
    if (upper === "CONTROL" || upper === "CTRL") {
      return "CONTROL";
    }
    if (upper === "ALT" || upper === "OPTION") {
      return "ALT";
    }
    if (upper === "SHIFT") {
      return "SHIFT";
    }
    return upper;
  }

  function toAcceleratorToken(token) {
    const key = String(token || "").toUpperCase();
    return ACCELERATOR_TOKENS[key] || String(token || "");
  }

  function toAccelerator(parts) {
    return (parts || [])
      .filter((part) => part !== undefined && part !== null && part !== "")
      .map((part) => toAcceleratorToken(part))
      .join("+");
  }

  return {
    formatToken,
    formatParts,
    formatChoiceList,
    modifierTokens,
    normalizeCapturedKey,
    toAcceleratorToken,
    toAccelerator,
    detectPlatform,
  };
});
