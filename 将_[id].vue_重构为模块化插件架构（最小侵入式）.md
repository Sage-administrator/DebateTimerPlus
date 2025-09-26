# 将 [id].vue 重构为模块化插件架构（最小侵入式）

## Core Features

- 单一职责插件（每文件 ≤ 300 行）

- 标准化插件接口：id/init/mount/unmount/onEvent

- 插件注册中心与事件总线（集中错误与健康检查）

- 保留全部既有功能与交互（页面外观不变）

- Git 语义化自动提交与稳定标签

- 基于标签的快速回滚脚本（含 dry-run）

- CHANGELOG 与 ROLLBACK 文档完善

- pre-commit 钩子：lint + test 守护

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": "shadcn"
  },
  "iOS": "",
  "Android": ""
}

## Design

在 pages/admin/projects/[id]/ 下新增 core 与 plugins 目录；core 提供 types/registry/bus；index.vue 作为壳组件装配插件。Git 脚本使用 PowerShell（Windows 友好）与简单 Node 脚本可选；版本策略使用 vX.Y.Z-stable 标签；回滚脚本支持 dry-run 与确认提示。文档集中在 docs/versioning。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] step1

[/] step2

[ ] step3

[ ] step4

[/] step5

[ ] step6

[ ] step7
