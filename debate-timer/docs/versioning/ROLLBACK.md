# 快速回滚指南（基于稳定标签）

当插件或页面出现异常，可回退到最近的稳定标签版本。默认使用 dry-run 安全模式，需显式确认后才执行。

## 一、查找稳定标签
```sh
git tag --list "*-stable"
git show v2025.09.26.1-stable
```

## 二、推荐使用脚本（PowerShell）
脚本位置：`scripts/git/rollback-to-stable.ps1`

- 查看拟执行步骤（默认 dry-run）
```powershell
pwsh scripts/git/rollback-to-stable.ps1 -Tag v2025.09.26.1-stable
# 或不指定 Tag 时自动选择最新稳定标签
pwsh scripts/git/rollback-to-stable.ps1
```

- 执行真实回滚（慎用）
```powershell
pwsh scripts/git/rollback-to-stable.ps1 -Tag v2025.09.26.1-stable -DryRun:$false
```

说明：
- 若工作区存在未提交修改，真实回滚会被阻止（需自行提交或丢弃后重试）
- 真实回滚使用 `git reset --hard` 指向稳定标签对应的提交
- 回滚后如需推送到远程，请自行确认分支策略（例如强推会影响其他协作者）

## 三、常见问题
- 提示未配置远程：请先 `git remote -v` 检查并配置远程，然后再执行推送或回滚相关操作
- 找不到标签：确认标签名是否正确，或先运行 `scripts/git/tag-stable.ps1` 创建标签