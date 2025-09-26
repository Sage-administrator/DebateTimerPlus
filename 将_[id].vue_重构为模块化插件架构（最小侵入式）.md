# 将 [id].vue 重构为模块化插件架构（最小侵入式）

## Core Features

- 单一职责插件（每文件 ≤ 300 行）

- 标准化插件接口：id/init/mount/unmount/onEvent

- 事件总线 + 注册中心

- 原功能与交互保持

- 主题修复：系统自适应 + 平滑过渡 + 对比度优化（theme-dark/theme-light）

- Git 稳定标签迭代

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": "shadcn"
  }
}

## Design

ActionsPlugin 扩展主题偏好（system/light/dark），监听 prefers-color-scheme，切换时为 documentElement 设置 theme-dark/theme-light 并注入过渡样式；页面根容器增加过渡与 bg/text 组合，减少黑白交替。

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
