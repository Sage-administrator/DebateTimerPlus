# 版本策略与提交流程

## 稳定标签命名
- 采用 `vYYYY.MM.DD.N-stable`
  - YYYY.MM.DD：日期
  - N：同日递增序号（从 1 开始）
- 仅在通过回归与基本检查后创建稳定标签

## 提交约定（语义化）
- 前缀：`feat|fix|chore|refactor|docs|test|perf|build`
- 范围：
  - 插件：`plugin/data`、`plugin/form`、`plugin/members` 等
  - 页面：`admin/projects/[id]`
- 示例：
  - `feat(plugin/members): 支持侧全体与观众联动`
  - `fix(admin/projects/[id]): 修复旧环节展开交互`

## 自动化脚本
- `scripts/git/auto-commit.ps1`
  - 自动暂存 → 可选 lint/test → 语义化提交
  - 可选 `-StableTag` 立即创建稳定标签并推送
- `scripts/git/tag-stable.ps1`
  - 创建带注释的稳定标签并推送（自动生成当天序号）
- `scripts/git/rollback-to-stable.ps1`
  - 回滚到指定或最近稳定标签（默认 dry-run，需确认后执行）

## 推荐流程
1. 开发与本地验证
2. 运行 `auto-commit.ps1` 或手动提交
3. 通过回归后运行 `tag-stable.ps1` 创建稳定标签
4. 若线上异常，参考 `ROLLBACK.md` 使用回滚脚本