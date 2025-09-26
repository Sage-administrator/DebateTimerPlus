# DebateTimerPlus 变更日志

所有重要变更均在此记录。稳定版本以 `vYYYY.MM.DD.N-stable` 命名。

## v2025.09.26.1-stable
- 修复：旧环节点击无法展开编辑
  - 卡片点击使用 `@click.stop` 防止与拖拽句柄冲突
  - `toggleExpand` 本地更新 `expandedId`，并在展开时主动关闭成员弹层
  - 新增 `watch(expandedId)`，展开变化自动关闭成员弹层
  - 兼容旧数据：统一以 `Number(s.id)` 比较与派发
- 架构：延续最小侵入式插件化重构（Form/Members 事件化，页面作为壳组件）
- 标签：创建稳定标签 `v2025.09.26.1-stable`（可作为回滚基线）

## 版本命名与提交约定
- 语义化提交前缀：`feat|fix|chore|refactor|docs|test|perf|build`
- 插件粒度：如 `feat(plugin/members): ...`
- 页面粒度：如 `fix(admin/projects/[id]): ...`