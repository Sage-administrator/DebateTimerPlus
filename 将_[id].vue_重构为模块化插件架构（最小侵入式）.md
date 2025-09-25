# 将 [id].vue 重构为模块化插件架构（最小侵入式）

## Core Features

- 拆分为单一职责插件，每个文件不超过300行

- 保留全部现有功能与交互

- 插件标准接口：id/init/mount/unmount/onEvent

- 插件注册中心与事件总线（集中错误输出）

- Git自动提交与稳定版本标签（脚本与文档已就绪）

- 基于标签的快速回滚方案（脚本与文档已就绪）

- GitHub 远程连接与环境安装（进行中）

- 清晰的目录结构与分层

## Tech Stack

{
  "Web": {
    "arch": "vue",
    "component": "shadcn"
  }
}

## Design

使用 winget 安装 Git 并自动配置远程与标签同步；若 winget 不可用，指导手动安装。

## Plan

Note: 

- [ ] is holding
- [/] is doing
- [X] is done

---

[X] step1

[ ] step2

[ ] step3

[ ] step4

[/] step5

[ ] step6

[ ] step7
