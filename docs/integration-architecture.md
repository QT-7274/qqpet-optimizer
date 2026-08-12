# 集成架构

## 部分关系

```mermaid
flowchart TD
    UI[桌宠 UI / 右键菜单] --> PetState[global.setPetInfo]
    PetState --> Store[electron-store]
    PetState --> Renderer[桌宠 Renderer]
    Renderer --> Ruffle[Ruffle Player]
    Ruffle --> Actions[Action SWF / Game SWF]
    External[可选外部写盘] --> File[(config-macos.json)]
    File --> Watcher[Electron dataWatcher]
    Watcher --> PetState
    ASAR[原始 ASAR] -. 行为参照 .-> PetState
    ASAR -. 差异参照 .-> Ruffle
```

## 外部文件 → Electron 状态同步

`dataWatcher` 仍保留：外部工具若原子替换 Store 文件，运行中的桌宠可热同步。Python CLI 已移除，该链路不再作为默认产品路径。

```mermaid
sequenceDiagram
    participant Ext as 外部写盘(可选)
    participant FS as config-macos.json
    participant DW as dataWatcher.js
    participant PS as pet.js
    participant UI as Electron Renderer

    Ext->>FS: 临时文件写入 + os.replace
    FS-->>DW: 父目录 fs.watch 事件
    DW->>DW: JSON 解析 + lastRaw 去重
    DW->>PS: setPetInfo(info/maxInfo/activeOption)
    PS->>FS: electron-store 回写规范化状态
    PS-->>UI: 状态监听/IPC 更新
```

### 为什么监听父目录

外部写入常使用临时文件加 `os.replace`。该操作会替换 inode，直接监听文件会在 macOS 上失效，因此 Electron 监听 `userData` 父目录并按 `config-macos.json` 文件名过滤。

### 防反馈循环

`setPetInfo` 会再次触发 electron-store 写盘。`dataWatcher.js` 使用三层保护：

1. `lastRaw` 忽略内容完全相同的事件。
2. 仅同步 `info`、`maxInfo`、`activeOption`，避开对象引用比较造成的误变更。
3. `setPetInfo` 后重新读取文件，吸收 Electron 自己的回写结果。

## Ruffle/Flash 加载链路

```mermaid
sequenceDiagram
    participant Main as Electron 主进程
    participant Shell as app.html
    participant WM as window.js
    participant View as Renderer 业务代码
    participant Ruffle as Ruffle Polyfill
    participant SWF as SWF 资源

    Main->>WM: windowsMain.open(...)
    WM->>Shell: BrowserWindow.loadFile(app.html)
    Shell->>Ruffle: 加载 ruffle.js + WASM
    WM->>View: 注入 index.html/CSS/JS
    View->>View: 创建或克隆 embed
    View->>SWF: 设置 embed.src
    Ruffle->>Ruffle: 将 embed 替换为 ruffle-player
    Ruffle->>SWF: 解析并执行 SWF
```

## 共享 Store Schema

主要顶层键：

- `pet.info`：姓名、成长、饥饿、清洁、健康、心情、坐标等。
- `pet.maxInfo`：等级和属性上限。
- `pet.activeOption`：工作、学习、旅行、疾病和死亡状态。
- `pet.activeValue`：学习等活动累计值。
- `cache.store`：食物、日用品、药品和背景库存。
- `sys`：透明度、快捷键、LLM、专注提醒等用户设置。

移植版使用明文 `config-macos.json`；原版 `config.json` 使用 AES-256-CBC。
