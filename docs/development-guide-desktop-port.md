# Electron 桌面端开发指南

## 环境

- Node.js 22、npm。
- 大型 SWF/Ruffle 资源已位于 `qq-pet-macos/src/assets/` 和 `src/windows/js/ruffle/`。

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22
cd qq-pet-macos
npm install
npm start
```

## 常见任务

- 启动与状态初始化：修改 `main.js`、`src/ini/`。
- 窗口行为：修改 `src/windows/`，避免格式化无关压缩 bundle。
- 宠物动作：修改 `src/windows/util/pet/swfPet.js` 和对应 `Action/` 资源。
- 小游戏：修改 `src/windows/popups/smallGame/` 和 `assets/game/`。
- 外部状态同步：同时检查 `pet.js`、`store.js`、`dataWatcher.js`。

## 构建

```bash
npm run build:dmg
npm run build:win:nsis
npm run build:win:portable
npm run build:linux:appimage
npm run build:linux:targz
```

输出在 `qq-pet-macos/dist/`。

## 验证

Electron 暂无自动化测试。手工检查启动、托盘、透明窗口、宠物动作、小程序、退出，以及 Python CLI 写入后的实时刷新。
