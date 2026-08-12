# Electron Store 数据模型

## 存储文件

当前移植版使用 electron-store 明文文件 `config-macos.json`。文件位于 Electron `userData` 目录，由 `src/ini/store.js` 管理。

## 顶层结构

| 路径 | 含义 |
|---|---|
| `pet.info` | 姓名、成长、饥饿、清洁、健康、心情、位置等实时属性 |
| `pet.maxInfo` | 等级和属性上限 |
| `pet.activeOption` | 工作、学习、旅行、疾病、死亡等活动状态 |
| `pet.activeValue` | 学习等活动累计值 |
| `cache.store` | 食物、日用品、药品、背景等库存 |
| `sys` | 透明度、快捷键、LLM、专注提醒等设置 |

## 更新规则

- `pet.js` 负责运行态修改并回写 Store。
- `dataWatcher.js` 只从外部文件同步 `info`、`maxInfo`、`activeOption`。
- 外部写入后，Electron 会把规范化后的运行态再次写盘。
- 未知字段应保留，避免 schema 演进时丢失数据。

## 迁移策略

当前没有显式 schema version 或迁移框架。新增字段应提供默认值，并保证旧存档缺少字段时仍可启动。修改字段语义前需要同步 Python CLI 模型与测试。
