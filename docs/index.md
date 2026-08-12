# 项目文档索引

## 项目概览

- **类型：** 两部分 multi-part brownfield 仓库
- **主要语言：** JavaScript、Markdown
- **架构：** Electron 桌面端 + 本地 Store；`dataWatcher` 仍可接收外部文件改写
- **重点链路：** Ruffle/Flash 游戏加载；宠物状态更新和本地存储

先阅读 [项目总览](./project-overview.md) 和 [集成架构](./integration-architecture.md)，再进入具体部分。

## 分端速查

### Electron 桌面端（desktop-port）

- **根目录：** `qq-pet-macos/`
- **入口：** `qq-pet-macos/main.js`
- **技术：** Electron 28、Vue、Ruffle、electron-store、Express
- [架构](./architecture-desktop-port.md)
- [组件清单](./component-inventory-desktop-port.md)
- [数据模型](./data-models-desktop-port.md)
- [接口契约](./api-contracts-desktop-port.md)
- [开发指南](./development-guide-desktop-port.md)
- [资源清单](./asset-inventory-desktop-port.md)

### ASAR 参考（asar-reference）

- **根目录：** `qq_pet_asar/`
- **入口：** `qq_pet_asar/main.js`
- **用途：** 原始 v1.2.4 行为与实现对照
- [架构](./architecture-asar-reference.md)
- [组件清单](./component-inventory-asar-reference.md)
- [使用指南](./development-guide-asar-reference.md)

## 跨部分文档

- [项目总览](./project-overview.md)
- [集成架构](./integration-architecture.md)
- [源码树分析](./source-tree-analysis.md)
- [通用开发指南](./development-guide.md)
- [构建与发布指南](./deployment-guide.md)
- [贡献指南摘要](./contribution-guide.md)
- [项目部分元数据](./project-parts.json)

## 现有仓库文档

- [README](../README.md) - 项目介绍、使用方式和发布产物
- [CONTRIBUTING](../CONTRIBUTING.md) - 社区贡献流程
- [SECURITY](../SECURITY.md) - 安全问题报告
- [NOTICE](../NOTICE.md) - 项目说明和第三方信息
- [GitHub Actions 构建流程](../.github/workflows/build.yml) - Tag 驱动的多平台 Release
- [Ruffle Runtime README](../qq-pet-macos/src/windows/js/ruffle/README.md) - 自托管 Ruffle 说明

## 快速开始

### 运行桌面端

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22
cd qq-pet-macos
npm install
npm start
```

### 发布安装包

确认 `resources-v1` Release 存在后，推送 `v*` Tag。GitHub Actions 会下载固定资源包、构建各平台产物并创建 Release；GitHub 自动附带源码 ZIP 和 tar.gz。

## AI 辅助开发用法

- 修改 Ruffle、SWF 或窗口：提供本索引、桌面端架构和资源清单。
- 修改宠物属性、库存或外部同步：提供桌面端架构、数据模型和集成架构（含 `dataWatcher`）。
- 规划 brownfield 功能：将本文件作为主上下文入口，避免把 `qq_pet_asar/` 误当成当前实现。
