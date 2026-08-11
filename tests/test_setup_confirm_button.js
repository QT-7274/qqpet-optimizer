const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// menu-settings-ux-fixes.TESTS.1

const setupDir = path.join(
  __dirname,
  "../qq-pet-macos/src/windows/popups/setup"
);

// menu-settings-ux-fixes.SETUP_CONFIRM.1
test("menu-settings-ux-fixes.SETUP_CONFIRM.1 buts row places submit beside label not under it", () => {
  const html = fs.readFileSync(path.join(setupDir, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(setupDir, "index.css"), "utf8");

  assert.match(html, /class="childrenIn fcb slider butsRow"/);
  assert.match(html, /class="label f1 sliderLabelText"/);
  assert.match(html, /class="sliderButs_submit focusPress not_drag"/);
  assert.doesNotMatch(html, /class="sliderButs f1 w100 fcc"/);
  assert.match(css, /\.sliderButs_submit\s*\{[^}]*opacity:\s*1/s);
  assert.doesNotMatch(css, /\.sliderButs\s*\{[^}]*opacity:\s*0\.15/s);
});
