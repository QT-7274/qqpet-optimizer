# Electron 桌面端接口契约

## 共享文件接口

**介质：** Electron `userData` 下的 `config-macos.json`。

**写入方：** electron-store、Python `store_reader`。

**同步字段：** `pet.info`、`pet.maxInfo`、`pet.activeOption`。Python 应保留其他顶层和嵌套字段。

**一致性：** Python 采用临时文件加 `os.replace`；Electron 监听父目录并按文件名过滤。JSON 不合法时不得覆盖当前运行态。

## Renderer IPC

Renderer 通过 preload 暴露的接口请求主进程能力。已识别用途包括窗口关闭、标题修改和其他窗口操作。新增 IPC 时应保持最小暴露，不直接向 renderer 开放完整 Node.js API。

## 本地 HTTP

`src/ini/root.js` 启动 Express 本地服务，为窗口或资源提供本地地址。它是进程内基础设施，不是面向公网的稳定 REST API；不要依赖固定外部可访问性。

## WebSocket

`src/service/` 包含 WebSocket 支持，用于运行时消息能力。协议未形成独立公共版本契约，修改消息格式时需同步所有本地调用方。

## 兼容原则

- Store schema 是当前最稳定的跨语言契约。
- IPC channel 和 payload 变更必须同时修改主进程、preload 和 renderer。
- 本地服务默认只应用于本机，不应引入无鉴权的公网监听。
