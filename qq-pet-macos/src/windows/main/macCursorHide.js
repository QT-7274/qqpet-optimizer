/**
 * Hide/show the macOS system cursor.
 * CSS cursor:none is ignored on transparent BrowserWindows.
 * NSCursor.hide must run in the Electron process (not a helper).
 * JXA must not treat empty stdin as EOF (that killed the helper).
 * pet-cursor.CURSOR.3
 * pet-cursor.CURSOR.3-2
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.macCursorHide = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const JXA = [
    "ObjC.import('CoreGraphics');",
    "ObjC.import('AppKit');",
    "ObjC.import('Foundation');",
    "function send(s) {",
    "  const d = $.NSString.alloc.initWithUTF8String(s).dataUsingEncoding($.NSUTF8StringEncoding);",
    "  $.NSFileHandle.fileHandleWithStandardOutput.writeData(d);",
    "}",
    "function hide() { $.CGDisplayHideCursor($.CGMainDisplayID()); $.NSCursor.hide(); }",
    "function show() { $.NSCursor.unhide(); $.CGDisplayShowCursor($.CGMainDisplayID()); }",
    "function pressed() { return $.CGEventSourceButtonState(1, 0); }",
    "const fh = $.NSFileHandle.fileHandleWithStandardInput;",
    "while (true) {",
    "  const data = fh.availableData;",
    "  if (!data || data.length == 0) { delay(0.02); continue; }",
    "  const raw = ObjC.unwrap($.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding)) || '';",
    "  const parts = String(raw).split('\\n');",
    "  let stop = false;",
    "  for (let i = 0; i < parts.length; i++) {",
    "    const cmd = parts[i].trim();",
    "    if (cmd === 'h') hide();",
    "    else if (cmd === 's') show();",
    "    else if (cmd === 'b') send(pressed() ? '1\\n' : '0\\n');",
    "    else if (cmd === 'q') { show(); stop = true; }",
    "  }",
    "  if (stop) break;",
    "}",
  ].join("\n");

  const NATIVE_CLANG_ARGS = [
    "-O2",
    "-shared",
    "-fPIC",
    "-undefined",
    "dynamic_lookup",
    "-framework",
    "ApplicationServices",
    "-framework",
    "AppKit",
    "-framework",
    "CoreGraphics",
  ];

  function ensureBinary({ src, dest, execFileSync, fs, clang }) {
    const run = execFileSync;
    const exists = fs && typeof fs.existsSync === "function" ? fs.existsSync : null;
    if (exists && exists(dest) && exists(src)) {
      try {
        if (fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) return dest;
      } catch (err) {}
    }
    run(
      clang || "clang",
      [
        "-O2",
        "-framework",
        "ApplicationServices",
        "-framework",
        "AppKit",
        "-o",
        dest,
        src,
      ],
      { timeout: 30000 }
    );
    return dest;
  }

  function ensureNativeAddon({ src, dest, execFileSync, fs, clang }) {
    const run = execFileSync;
    const exists = fs && typeof fs.existsSync === "function" ? fs.existsSync : null;
    if (exists && exists(dest) && exists(src)) {
      try {
        if (fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) return dest;
      } catch (err) {}
    }
    run(
      clang || "clang",
      NATIVE_CLANG_ARGS.concat(["-o", dest, src]),
      { timeout: 30000 }
    );
    return dest;
  }

  function loadNativeAddon(dest, dlopen) {
    const mod = { exports: {} };
    dlopen(mod, dest);
    return mod.exports;
  }

  function createNativeCursorHide(native) {
    let hidden = false;
    const api = native || {};
    return {
      hide() {
        if (typeof api.hideIfVisible === "function") api.hideIfVisible();
        hidden = true;
      },
      show() {
        if (!hidden) return;
        if (typeof api.show === "function") api.show();
        hidden = false;
      },
      isPressed() {
        if (typeof api.isPressed === "function") return !!api.isPressed();
        return false;
      },
      isHidden() {
        return hidden;
      },
      alive() {
        return typeof api.hideIfVisible === "function";
      },
      dispose() {
        if (hidden && typeof api.show === "function") api.show();
        hidden = false;
      },
    };
  }

  function createCursorHide(spawnFn) {
    let hidden = false;
    let pressed = false;
    let proc = null;
    let buf = "";

    function write(cmd) {
      if (!proc || !proc.stdin || typeof proc.stdin.write !== "function") return;
      try {
        proc.stdin.write(cmd);
      } catch (err) {}
    }

    function attach(child) {
      proc = child;
      if (child && child.stdout && typeof child.stdout.on === "function") {
        child.stdout.on("data", function (chunk) {
          buf += String(chunk);
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "1") pressed = true;
            if (line === "0") pressed = false;
          }
        });
      }
      if (child && typeof child.on === "function") {
        child.on("exit", function () {
          proc = null;
          hidden = false;
          pressed = false;
        });
      }
    }

    if (typeof spawnFn === "function") {
      try {
        attach(spawnFn());
      } catch (err) {
        proc = null;
      }
    }

    return {
      hide() {
        if (!hidden) {
          write("h\n");
          hidden = true;
        }
      },
      show() {
        if (hidden) {
          write("s\n");
          hidden = false;
        }
      },
      isPressed() {
        write("b\n");
        return pressed;
      },
      isHidden() {
        return hidden;
      },
      alive() {
        return !!proc;
      },
      dispose() {
        write("q\n");
        hidden = false;
        pressed = false;
        if (proc && typeof proc.kill === "function") {
          try {
            proc.kill();
          } catch (err) {}
        }
        proc = null;
      },
    };
  }

  return {
    JXA,
    NATIVE_CLANG_ARGS,
    createCursorHide,
    createNativeCursorHide,
    ensureBinary,
    ensureNativeAddon,
    loadNativeAddon,
  };
});
