# 插件架构说明

- 位置：pages/admin/projects/[id]/
- 核心模块：core/
  - plugin.types.ts：接口与类型
  - plugin.bus.ts：轻量事件总线
  - plugin.registry.ts：插件注册中心（集中错误输出/健康状态）
- 插件模块：plugins/
  - data.plugin.ts：数据获取/缓存
  - form.plugin.ts：表单状态/校验/提交
  - members.plugin.ts：成员/权限/角色面板
  - charts.plugin.ts：图表/统计
  - actions.plugin.ts：操作（预览切换、主题切换等）
  - layout.plugin.ts：页面布局与装配（薄层）

标准接口
- id: string
- init(ctx): 依赖注入（idParam/$fetch/事件总线等）
- mount(targetRefs): 绑定视图/交互
- unmount(): 清理订阅/计时器
- onEvent(e): 统一事件入口

迁移策略（最小侵入）
1. 不改动现有 [id].vue，先创建壳与接口。
2. 分阶段将数据/表单/成员/操作/布局逻辑迁入对应插件。
3. 每次迁移后使用 Git 提交并在验证通过后打稳定标签。
4. 若出现异常，按 docs/versioning/ROLLBACK.md 快速回退到最近稳定标签。