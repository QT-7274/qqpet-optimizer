# 贡献指南摘要

## 修改原则

- 仅修改与目标问题直接相关的文件。
- 不格式化或重写大型压缩 bundle。
- 原始 `qq_pet_asar/` 默认只用于比较，不在其中实现新功能。
- 新功能优先放在 `qq-pet-macos/` 或 `src/qq_pet/`。
- 保留隐私加固：不要恢复设备指纹、遥测或原远程更新逻辑。

## 提交前检查

```bash
source .venv/bin/activate
pytest
```

涉及 Electron 时：

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22
cd qq-pet-macos
npm start
```

至少手工验证：

- 桌宠能启动、拖动和退出。
- 透明窗口与托盘工作正常。
- 宠物动作 SWF 能切换。
- 小游戏 SWF 能加载。
- Python CLI 修改状态后，运行中的桌宠能收到更新。

## Pull Request

- 清楚描述行为变化和验证结果。
- 涉及平台兼容时注明操作系统和 CPU 架构。
- 涉及 SWF/Ruffle 时说明资源版本及受影响游戏。
- 涉及 Store schema 时说明明文和加密格式兼容性。

完整社区约定见仓库根目录 `CONTRIBUTING.md`、`SECURITY.md` 和 `NOTICE.md`。

