/**
 * Glove cursor overlay, only over the pet sprite or feature windows.
 * pet-cursor.CURSOR.3
 * pet-cursor.CURSOR.3-2
 * pet-cursor.CURSOR.4
 * pet-cursor.CURSOR.4-1
 * pet-cursor.CURSOR.4-2
 * pet-cursor.CURSOR.4-3
 * pet-cursor.CURSOR.5
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.petCursorOverlay = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const fs = require("fs");
  const path = require("path");
  const { execFileSync, spawn } = require("child_process");
  const { BrowserWindow, screen, app, ipcMain } = require("electron");
  const host = require("./petCursorHost.js");
  const macCursorHide = require("./macCursorHide.js");

  let win = null;
  let timer = null;
  let hidePulse = null;
  let hideApi = null;
  let lastKind = "normal";
  let started = false;
  let quitting = false;
  let petHitRect = null;
  const penetrateHover = {};
  const penetrateClusters = {};
  const clusterRefreshing = {};
  const hoverHandlers = [];

  function spawnHideHelper() {
    if (process.platform !== "darwin") return null;
    try {
      const src = path.join(__dirname, "hidecursor.c");
      const dest = path.join(app.getPath("userData"), "hidecursor");
      macCursorHide.ensureBinary({
        src: src,
        dest: dest,
        execFileSync: execFileSync,
        fs: fs,
      });
      return spawn(dest, [], { stdio: ["pipe", "pipe", "pipe"] });
    } catch (err) {
      return spawn("osascript", ["-l", "JavaScript", "-e", macCursorHide.JXA], {
        stdio: ["pipe", "pipe", "pipe"],
      });
    }
  }

  function createHideApi() {
    if (process.platform !== "darwin") return null;
    try {
      const src = path.join(__dirname, "macCursorNative.c");
      const dest = path.join(app.getPath("userData"), "macCursorNative.node");
      macCursorHide.ensureNativeAddon({
        src: src,
        dest: dest,
        execFileSync: execFileSync,
        fs: fs,
      });
      const native = macCursorHide.loadNativeAddon(
        dest,
        process.dlopen.bind(process)
      );
      return macCursorHide.createNativeCursorHide(native);
    } catch (err) {
      return macCursorHide.createCursorHide(spawnHideHelper);
    }
  }

  function onPenetrateHover(name) {
    return function (event, payload) {
      penetrateHover[name] = !!(payload && payload.canDoType);
    };
  }

  function clearClusterState() {
    for (const name in penetrateHover) {
      if (Object.prototype.hasOwnProperty.call(penetrateHover, name)) {
        delete penetrateHover[name];
      }
    }
    for (const name in penetrateClusters) {
      if (Object.prototype.hasOwnProperty.call(penetrateClusters, name)) {
        delete penetrateClusters[name];
      }
    }
    for (const name in clusterRefreshing) {
      if (Object.prototype.hasOwnProperty.call(clusterRefreshing, name)) {
        delete clusterRefreshing[name];
      }
    }
  }

  function refreshCandoCluster(w) {
    // pet-cursor.CURSOR.4-1
    // pet-cursor.CURSOR.4-3
    const name = w && w.__qqpetName;
    if (!name || clusterRefreshing[name]) return;
    const contents = w.webContents;
    if (!contents || (typeof contents.isDestroyed === "function" && contents.isDestroyed())) {
      return;
    }
    clusterRefreshing[name] = true;
    contents
      .executeJavaScript(host.CANDO_UNION_SCRIPT)
      .then(function (clientRects) {
        clusterRefreshing[name] = false;
        if (!w || (typeof w.isDestroyed === "function" && w.isDestroyed())) {
          delete penetrateClusters[name];
          return;
        }
        const bounds = typeof w.getBounds === "function" ? w.getBounds() : null;
        const rects = host.screenCandoRects(clientRects, bounds, host.CANDO_CLUSTER_PAD);
        if (rects && rects.length) penetrateClusters[name] = rects;
        else delete penetrateClusters[name];
      })
      .catch(function () {
        clusterRefreshing[name] = false;
        delete penetrateClusters[name];
      });
  }

  function bindHoverIpc() {
    const channels = host.PENETRATE_IPC;
    for (const channel in channels) {
      if (!Object.prototype.hasOwnProperty.call(channels, channel)) continue;
      const handler = onPenetrateHover(channels[channel]);
      ipcMain.on(channel, handler);
      hoverHandlers.push([channel, handler]);
    }
  }

  function unbindHoverIpc() {
    for (let i = 0; i < hoverHandlers.length; i++) {
      ipcMain.removeListener(hoverHandlers[i][0], hoverHandlers[i][1]);
    }
    hoverHandlers.length = 0;
    clearClusterState();
  }

  function collectFeatureRects() {
    // pet-cursor.CURSOR.4-1
    // pet-cursor.CURSOR.4-3
    const rects = [];
    const windows = BrowserWindow.getAllWindows();
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      if (!w || (typeof w.isDestroyed === "function" && w.isDestroyed())) continue;
      if (typeof w.isVisible === "function" && !w.isVisible()) continue;
      if (win && w === win) continue;
      const name = w.__qqpetName;
      if (name === host.MAIN_WINDOW_NAME || name === host.OVERLAY_NAME) continue;
      if (host.isPenetrateWindowName(name)) {
        refreshCandoCluster(w);
        if (penetrateClusters[name] && penetrateClusters[name].length) {
          for (let j = 0; j < penetrateClusters[name].length; j++) {
            rects.push(penetrateClusters[name][j]);
          }
        } else if (penetrateHover[name] && typeof w.getBounds === "function") {
          rects.push(w.getBounds());
        }
        continue;
      }
      if (typeof w.getBounds === "function") rects.push(w.getBounds());
    }
    return rects;
  }

  function resolvePetHitRect() {
    if (petHitRect) return petHitRect;
    const windows = BrowserWindow.getAllWindows();
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      if (!w || w.__qqpetName !== host.MAIN_WINDOW_NAME) continue;
      if (typeof w.isDestroyed === "function" && w.isDestroyed()) continue;
      if (typeof w.getBounds === "function") {
        return host.tightenPetHitRect(w.getBounds());
      }
    }
    return null;
  }

  function tick() {
    if (!win || win.isDestroyed() || quitting) return;
    const point = screen.getCursorScreenPoint();
    const show = host.shouldShowPetCursor({
      point: point,
      petHitRect: resolvePetHitRect(),
      featureRects: collectFeatureRects(),
    });
    const pressed = hideApi ? hideApi.isPressed() : false;
    const kind = host.cursorKind(pressed);
    const bounds = host.overlayBounds(point, kind);

    if (show) {
      win.setBounds(bounds, false);
      if (!win.isVisible()) win.showInactive();
      win.setAlwaysOnTop(true, "screen-saver");
      if (hideApi) hideApi.hide();
    } else {
      if (win.isVisible()) win.hide();
      if (hideApi) hideApi.show();
    }

    if (kind !== lastKind) {
      lastKind = kind;
      try {
        win.webContents.executeJavaScript(
          "window.setPetCursor && window.setPetCursor(" + JSON.stringify(kind) + ")"
        );
      } catch (err) {}
    }
  }

  function setPetHitRect(rect) {
    petHitRect = rect ? host.tightenPetHitRect(rect) : null;
  }

  function stop() {
    quitting = true;
    unbindHoverIpc();
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (hidePulse) {
      clearInterval(hidePulse);
      hidePulse = null;
    }
    if (hideApi) {
      hideApi.show();
      hideApi.dispose();
      hideApi = null;
    }
    if (win && !win.isDestroyed()) {
      win.close();
    }
    win = null;
    started = false;
  }

  function ensureStarted() {
    if (started || quitting) return win;
    started = true;
    hideApi = createHideApi();
    bindHoverIpc();
    win = new BrowserWindow({
      width: host.OVERLAY_SIZE,
      height: host.OVERLAY_SIZE,
      frame: false,
      transparent: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      hasShadow: false,
      focusable: false,
      resizable: false,
      show: false,
      fullscreenable: false,
      minimizable: false,
      maximizable: false,
      backgroundColor: "#00000000",
      roundedCorners: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    win.__qqpetName = host.OVERLAY_NAME;
    win.setIgnoreMouseEvents(true);
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, "screen-saver");
    win.loadFile(path.join(__dirname, "petCursorOverlay.html"));
    win.on("closed", function () {
      win = null;
    });
    timer = setInterval(tick, 16);
    hidePulse = setInterval(function () {
      if (win && !win.isDestroyed() && win.isVisible() && hideApi) hideApi.hide();
    }, 4);
    if (app && typeof app.on === "function") {
      app.on("before-quit", stop);
      app.on("will-quit", stop);
    }
    return win;
  }

  return {
    ensureStarted,
    stop,
    setPetHitRect,
    OVERLAY_NAME: host.OVERLAY_NAME,
  };
});
