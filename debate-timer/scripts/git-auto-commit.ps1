Param(
  [string]$Message = "chore: auto-commit",
  [string]$BackupBranch = "backup/stable",
  [switch]$DryRun
)

# 自动提交与备份分支推送（非破坏性）
if ($DryRun) {
  Write-Host "[DryRun] git status"
  Write-Host "[DryRun] git add -A"
  Write-Host "[DryRun] git commit -m `"$Message`""
  Write-Host "[DryRun] branch = (git rev-parse --abbrev-ref HEAD)"
  Write-Host "[DryRun] git branch $BackupBranch"
  Write-Host "[DryRun] git push -u origin (current branch)"
  Write-Host "[DryRun] git push -u origin $BackupBranch"
} else {
  git status
  git add -A
  git commit -m $Message

  # 确保备份分支存在并推送
  $branch = git rev-parse --abbrev-ref HEAD
  git branch $BackupBranch 2>$null
  git push -u origin $branch
  git push -u origin $BackupBranch
}