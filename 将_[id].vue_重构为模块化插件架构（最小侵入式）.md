# 将 [id].vue 重构为模块化插件架构（最小侵入式）

## Core Features

- Data 插件增强：记忆 lastExpandedId，精准上一/下一环节

- 导入校验与类型纠正（id/duration/roles）

- 删除后主动关闭详情，避免悬挂展开

- 稳定标签 v2025.09.26.2-stable（待用户确认）

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": "shadcn"
  }
}

## Design

保持最小侵入式：仅增强 DataPlugin 内部逻辑与事件响应，壳组件与其他插件无需改动。

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

[X] step6

[ ] step7
