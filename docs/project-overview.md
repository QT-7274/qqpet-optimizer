# QQPet Optimizer 项目总览

## 项目目的

该仓库把经典 QQ 宠物桌面体验移植到现代 Electron/Ruffle 环境。仓库同时保留原始 ASAR 解包代码，便于行为对照。Python CLI 与 OpenClaw Skill 已移除；养护与交互以桌宠内操作为主。

## 架构摘要

这是一个两部分 brownfield 仓库：Electron 桌面端负责用户体验和 SWF 执行，ASAR 快照提供历史实现参照。`dataWatcher` 仍监听 Store 文件变更，便于外部工具改写存档时热同步。

## 技术栈

| 部分 | 技术 | 入口 |
|---|---|---|
| Electron 桌面端 | Electron 28、JavaScript、Vue、Ruffle、electron-store | `qq-pet-macos/main.js` |
| ASAR 参考 | Electron/JavaScript 原始快照 | `qq_pet_asar/main.js` |

## 关键链路

### Ruffle/Flash 游戏加载

共享 `app.html` 加载自托管 Ruffle，窗口业务创建 `<embed>` 并设置 SWF 路径，Ruffle polyfill 将其替换为播放器。宠物动作由 `swfPet.js` 根据状态选择，小游戏由 `smallGame` 菜单切换。

### 宠物状态和本地存储

应用内通过 `pet.js` / electron-store 读写 `config-macos.json`。若外部进程原子替换该文件，`dataWatcher` 监听父目录并调用 `setPetInfo`，再同步到 renderer。

## 仓库结构

仓库采用 multi-part 组织，不是统一构建的 monorepo。Electron 安装包与参考源码各自有独立边界。

## 详细文档

- [文档索引](./index.md)
- [集成架构](./integration-architecture.md)
- [源码树分析](./source-tree-analysis.md)
- [构建与发布](./deployment-guide.md)
