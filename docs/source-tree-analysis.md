# 源码树分析

## 仓库形态

这是一个多部分仓库。可运行产品由 Electron 桌面端和 Python 管理 CLI 组成；解包后的 ASAR 代码用于逆向参照；OpenClaw Skill 是面向 Agent 的操作说明层。

```text
qqpet-optimizer/
├── qq-pet-macos/                    # 当前跨平台 Electron 桌宠
│   ├── main.js                      # Electron 主进程入口
│   ├── package.json                 # electron-builder 构建目标
│   ├── resources/                   # 安装包图标
│   └── src/
│       ├── ini/                     # 全局初始化、Store、状态模型、启动编排
│       │   ├── init.js              # 按顺序装载全局模块
│       │   ├── store.js             # electron-store 明文 config-macos.json
│       │   ├── pet.js               # 内存态、setPetInfo、监听器、持久化
│       │   ├── doMain.js            # 从 Store 恢复状态并创建主窗口
│       │   ├── root.js              # Express 静态服务和本地地址
│       │   └── dataWatcher.js       # 外部文件修改回灌运行态
│       ├── service/                 # LLM、专注提醒、请求与 WebSocket
│       ├── assets/
│       │   ├── Action/              # 桌宠动作 SWF，约 74 MB
│       │   ├── game/                # 小游戏 SWF，约 55 MB
│       │   └── */                   # UI 图片、商店、状态、字体
│       └── windows/
│           ├── app.html             # 所有本地窗口共享的 Ruffle/Vue 壳
│           ├── window.js             # BrowserWindow 工厂与资源注入
│           ├── main/                 # 桌宠主窗口和托盘/快捷键
│           ├── util/pet/swfPet.js    # SWF 路由、动作状态机和帧轮询
│           ├── popups/smallGame/     # 小游戏选择窗口
│           └── js/ruffle/            # 自托管 Ruffle JS/WASM runtime
├── src/qq_pet/                       # Python 管理 CLI
│   ├── __main__.py                   # python -m 入口
│   ├── cli.py                        # 参数解析与命令分发
│   ├── actions.py                    # 喂食、洗澡、治疗、自动养护
│   ├── pet_client.py                 # 领域数据访问和状态变更
│   ├── store_reader.py               # 明文/AES Store 读写及原子替换
│   ├── models.py                     # PetStatus 等数据模型
│   └── game_data.py                  # 等级、疾病和物品常量
├── qq_pet_asar/                      # 原始 v1.2.4 解包参考代码
├── skills/qq-pet/SKILL.md            # OpenClaw 操作协议
├── tests/                             # Python Store 与 PetClient 测试
├── .github/workflows/build.yml       # Tag 驱动的跨平台 Release
├── config.yaml                       # Python CLI 数据路径和阈值
├── pyproject.toml                    # Python 包与 pytest 配置
└── README.md                         # 项目入口说明
```

## 关键入口

| 部分 | 入口 | 说明 |
|---|---|---|
| Electron 主进程 | `qq-pet-macos/main.js` | 获取单实例锁，加载初始化模块，创建桌宠并启动数据监听 |
| Electron 窗口壳 | `qq-pet-macos/src/windows/app.html` | 配置并加载 Ruffle，自定义窗口内容由 `window.js` 注入 |
| 桌宠运行逻辑 | `qq-pet-macos/src/windows/main/main.js` | 初始化宠物控制器、窗口、托盘、对话和状态事件 |
| SWF 动作控制 | `qq-pet-macos/src/windows/util/pet/swfPet.js` | 根据性别、年龄、情绪和活动选择 SWF |
| 小游戏 | `qq-pet-macos/src/windows/popups/smallGame/index.js` | 修改 `<embed>` 的 `src` 切换 SWF |
| Python CLI | `src/qq_pet/__main__.py` → `src/qq_pet/cli.py:main` | 加载配置、创建 `PetClient`、分发命令 |
| 发布 | `.github/workflows/build.yml` | 推送 `v*` Tag 后构建并上传 Release |

## 关键边界

- `qq-pet-macos/src/ini/pet.js` 是 Electron 内存状态与持久化的核心边界。
- `config-macos.json` 是 Electron 与 Python CLI 的共享集成面。
- `dataWatcher.js` 负责把 Python 的磁盘修改同步回已运行的 Electron 进程。
- Ruffle 通过浏览器兼容层接管已有 `<embed>` 元素，业务代码仍按 Flash API 调用。
- `qq_pet_asar/` 不应作为新功能实现位置；它用于比较原始行为。

