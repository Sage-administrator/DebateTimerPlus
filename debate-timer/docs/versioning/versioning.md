# 版本管理与标签规范

## 标签命名
- 稳定版本标签：`v{semver}-stable`，例如：`v1.2.3-stable`
- 预发行可选：`v{semver}-rc.{n}`

## 创建稳定标签
- 自动脚本（PowerShell 7）：
  ```
  pwsh -File ./scripts/git-tag-stable.ps1 -TagPrefix "v" -Suffix "stable" -Message "stable release"
  ```
- 前置条件：
  - 工作区干净（`git status` 无未提交）
  - 已推送到远程主分支（默认 origin）

## 自动提交与备份分支
- 自动脚本：
  ```
  pwsh -File ./scripts/git-auto-commit.ps1 -Message "feat(plugin): xxx" -BackupBranch "backup/stable"
  ```
- 目的：在主分支外维护同步备份分支，便于快速恢复

## 分支策略建议
- main：稳定发布
- develop：集成开发
- feature/*：插件或功能开发分支
- backup/stable：备份分支（由脚本维护）