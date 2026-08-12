# 桌面端资源清单

## 总览

桌面端资源主要位于 `qq-pet-macos/src/assets/`。最大的两类是宠物动作 SWF 和小游戏 SWF，它们也是 Release 工作流下载 `qq-pet-resources.tar.gz` 的主要原因。

| 类别 | 约大小 | 文件数 | 用途 |
|---|---:|---:|---|
| `Action/` | 74 MB | 1,345 | 按性别、年龄、状态划分的桌宠动作 SWF |
| `game/` | 55 MB | 24 | 独立小游戏及冒险岛合集 SWF |
| `img_res/` | 5.7 MB | 1,036 | 原始界面图片资源 |
| `shop/` | 1.5 MB | 249 | 商店物品资源 |
| `Background/` | 1.2 MB | 17 | 背景资源 |
| 其他 UI 目录 | 约 5 MB | 600+ | 菜单、状态、设置、提示、登录和图标 |
| 字体 | 约 3 MB | 2 | `ysbth.TTF`、`qqfont.ttf` |

## Ruffle Runtime

`qq-pet-macos/src/windows/js/ruffle/` 为自托管版本：

| 文件类型 | 约大小 | 说明 |
|---|---:|---|
| 两个 WASM 文件 | 12 MB + 13 MB | Ruffle 核心执行引擎 |
| `ruffle.js` | 444 KB | Loader 与 Flash polyfill |
| core JS | 100 KB + 108 KB | WASM glue code |
| Source maps | 约 1 MB | 调试映射 |

## 运行时装载

1. `windows/app.html` 设置 `window.RufflePlayer.config`。
2. 同一页面加载 `./js/ruffle/ruffle.js`。
3. Ruffle 的 polyfill 自动识别页面中的 `<embed>`。
4. 主宠物和小游戏只需要设置 SWF 路径，无需直接调用 Ruffle API。

## 维护注意事项

- SWF 文件名包含中文和空格，重命名时必须同步更新路由表。
- Ruffle JS 与 WASM 文件必须保持同一构建版本。
- Electron Builder 的 `files: ["src/**/*"]` 会把这些资源打入安装包。
- GitHub Actions 在构建前解压 `qq-pet-resources.tar.gz`，资源版本与源码路由必须匹配。

