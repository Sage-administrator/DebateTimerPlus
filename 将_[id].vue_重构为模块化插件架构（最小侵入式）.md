# 将 [id].vue 重构为模块化插件架构（最小侵入式）

## Core Features

- 单一职责插件（每文件 ≤ 300 行）

- 标准化插件接口：id/init/mount/unmount/onEvent

- 插件注册中心与事件总线（集中错误与健康检查）

- 保留全部既有功能与交互（页面外观不变）

- Git 语义化自动提交与稳定标签（已提供纯命令操作）

- 基于标签的快速回滚脚本（含 dry-run）

- CHANGELOG 与 ROLLBACK 文档完善

- pre-commit 钩子：lint + test 守护（待定）

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": "shadcn"
  }
}

## Design

暂以纯 Git 命令验证推送与标签；确认无误后创建 core 与 plugins 骨架，保持页面逻辑暂不迁移，先接入标准接口。

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
