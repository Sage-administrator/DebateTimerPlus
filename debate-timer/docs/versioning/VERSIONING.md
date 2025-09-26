# 版本策略与分支模型

- 主分支：main（受保护，所有稳定版本从此创建标签）
- 标签命名：vX.Y.Z-stable 或 vYYYY.MM.DD.HHMM-stable（日期语义）
- 提交规范：语义化（feat|fix|chore|refactor|docs|test|build|ci|perf|style）
- 粒度：以插件为单位提交与回滚（示例：feat(plugin/data): 支持缓存失效）

## 常用命令
- 自动提交推送：
  pwsh -File scripts/git/auto-commit.ps1 -Message "feat(plugin/...): ..." [-TagStable]
- 打稳定标签：
  pwsh -File scripts/git/tag-stable.ps1 -Version 1.0.0
- 快速回滚：
  pwsh -File scripts/git/rollback-to-stable.ps1 -Tag v1.0.0-stable
  pwsh -File scripts/git/rollback-to-stable.ps1 -DryRun

参见 ROLLBACK.md 了解回滚细则。