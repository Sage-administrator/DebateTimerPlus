Param(
  [string]$Suffix = "stable",
  [switch]$Hard, # 是否使用 reset --hard
  [switch]$DryRun
)

# 查找最近的稳定标签
$lastStable = git tag --list "*-$Suffix" --sort=-creatordate | Select-Object -First 1
if (-not $lastStable) {
  Write-Error "No stable tag found."; exit 1
}

Write-Host "Rolling back to: $lastStable"

if ($DryRun) {
  if ($Hard) {
    Write-Host "[DryRun] git reset --hard $lastStable"
  } else {
    Write-Host "[DryRun] git checkout $lastStable"
    Write-Host "[DryRun] Detached HEAD at $lastStable (建议创建 hotfix 分支)"
  }
} else {
  if ($Hard) {
    git reset --hard $lastStable
  } else {
    git checkout $lastStable
    Write-Host "You are now in detached HEAD at $lastStable. Consider creating a hotfix branch."
  }
}