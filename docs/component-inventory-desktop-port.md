# Electron 桌面端组件清单

## 可复用基础组件

| 组件 | 位置 | 复用价值 |
|---|---|---|
| 窗口工厂 | `src/windows/window.js` | 统一 BrowserWindow 创建、资源注入和生命周期 |
| 共享窗口壳 | `src/windows/app.html` | 统一 Vue、Ruffle 与基础样式加载 |
| 宠物状态边界 | `src/ini/pet.js` | 集中状态更新、监听与持久化 |
| 外部数据监听 | `src/ini/dataWatcher.js` | 接收原子替换文件并避免反馈循环 |
| SWF 宠物控制器 | `src/windows/util/pet/swfPet.js` | 动作路由、播放控制和帧轮询 |
| 本地服务 | `src/ini/root.js` | 静态资源与本地地址 |

## 业务窗口

- `src/windows/main/`：桌宠主体、托盘、拖动、状态和交互。
- `src/windows/popups/smallGame/`：小游戏菜单与 SWF 播放。
- `src/windows/popups/`：提示、状态、设置等弹窗。
- `src/windows/tool/`：工具型窗口。

## 资源组件

- `src/assets/Action/`：宠物动作 SWF。
- `src/assets/game/`：小游戏 SWF。
- `src/windows/js/ruffle/`：Ruffle JS/WASM runtime。
- `src/assets/img_res/`、`shop/`、`Background/`：UI 与业务资源。

## 专用组件

LLM、专注提醒、网络请求和 WebSocket 位于 `src/service/`，与特定功能绑定，不应当作通用 UI 组件无条件复用。

## 设计系统

项目没有独立组件库或 token 化设计系统。UI 主要复用原始图片、字体、页面 CSS 和窗口壳；修改时应保持原资源尺寸和透明窗口视觉约束。
