# 开发指南

## 环境要求

| 部分 | 要求 |
|---|---|
| Electron 桌面端 | Node.js 22（本仓库开发约定）、npm、目标平台系统依赖 |
| CI 构建 | GitHub Actions 当前固定 Node.js 20 |
| Python CLI | Python 3.10+ |
| Python 测试 | pytest 8+ |

## Electron 桌面端

所有 Node 命令必须先切换 Node 22：

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 22
cd qq-pet-macos
npm install
npm start
```

常用命令：

```bash
npm run dev
npm run build:dmg
npm run build:win:nsis
npm run build:win:portable
npm run build:linux:appimage
npm run build:linux:targz
```

构建输出位于 `qq-pet-macos/dist/`。

### 修改桌宠逻辑

- 启动编排：`qq-pet-macos/main.js`、`src/ini/doMain.js`
- 状态字段和持久化：`src/ini/pet.js`、`src/ini/store.js`
- 状态文件外部同步：`src/ini/dataWatcher.js`
- 主窗口行为：`src/windows/main/main.js`
- SWF 动作选择：`src/windows/util/pet/swfPet.js`
- 独立窗口：`src/windows/popups/`、`src/windows/tool/`

多数 renderer 文件是打包后的单行 JavaScript。应采用最小修改，避免对无关 bundle 做格式化。

### 修改 Ruffle 或 SWF

1. 保持 `windows/app.html` 中的 Ruffle 配置和 runtime 文件版本一致。
2. 主宠物动作路由由 `swfPet.js` 根据状态生成。
3. 小游戏路由在 `popups/smallGame/index.js` 的 `gameList` 中维护。
4. 新增 SWF 后检查 Electron Builder 是否包含对应资源。
5. 同时验证中文文件名、空格和嵌套目录路径。

## Python CLI

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e '.[dev]'
python -m src.qq_pet.cli status
```

常用开发入口：

- `cli.py`：增加命令和 JSON 输出适配。
- `actions.py`：增加面向用户的养护动作。
- `pet_client.py`：增加领域读取或更新操作。
- `store_reader.py`：仅处理存储格式、路径和原子写。
- `models.py`：状态结构和派生判断。
- `game_data.py`：等级、疾病、物品等静态规则。

## 测试

```bash
source .venv/bin/activate
pytest
```

当前测试覆盖：

- AES-256-CBC electron-store 格式读写。
- 明文 JSON 格式读写。
- 明文/密文格式自动识别并保持原格式。
- 状态解析、属性上限、背包消耗和药物匹配。
- 备份文件创建。

Electron 端暂无自动化测试。修改 Ruffle、窗口、托盘或 IPC 时需要手工启动验证。

## 调试建议

- 数据异常时先运行 `python -m src.qq_pet.cli raw` 查看 Store 原始结构。
- 修改数据前运行 `backup`，避免损坏存档。
- Electron 未响应外部修改时检查 `config-macos.json` 路径和 `dataWatcher.js`。
- SWF 不显示时依次检查文件路径、`<embed src>`、Ruffle JS/WASM 是否随安装包分发。

