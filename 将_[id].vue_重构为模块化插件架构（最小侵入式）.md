# 将 [id].vue 重构为模块化插件架构（最小侵入式）

## Core Features

- 单一职责插件（每文件 ≤ 300 行）

- 标准化插件接口：id/init/mount/unmount/onEvent

- 事件总线 + 注册中心

- 原功能与交互保持

- Git 语义化提交与稳定标签（v2025.09.26.1403-stable）

- 标签化快速回滚脚本与文档

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": "shadcn"
  }
}

## Design

DataPlugin 已接管数据加载/保存/导入导出与环节 CRUD；ActionsPlugin 已接管主题与预览（actions:update/preview:* 事件）。页面仅派发/订阅事件，最小侵入。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] step1

[/] step2

[ ] step3

[/] step4

[X] step5

[ ] step6

[ ] step7
