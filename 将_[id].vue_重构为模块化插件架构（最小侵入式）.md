# 将 [id].vue 重构为模块化插件架构（最小侵入式）

## Core Features

- 单一职责插件（每文件 ≤ 300 行）

- 标准化插件接口：id/init/mount/unmount/onEvent

- 事件总线 + 注册中心

- 原功能与交互保持

- Form 子系统事件化（uiChanged/editTabChanged + form:update）

- Git 稳定标签迭代

- 旧数据兼容：stage.id 字符串与数字统一处理（页面层 Number(...) 修复）

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": "shadcn"
  }
}

## Design

页面作为壳组件，仅通过事件总线与注册中心装配插件；此次修复通过 stop 点击与本地更新 expandedId 以及关闭成员弹层，避免拖拽和遮罩拦截。

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
