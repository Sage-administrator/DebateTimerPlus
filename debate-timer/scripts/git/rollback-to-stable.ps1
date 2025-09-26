param(
  [string]$Tag,          # 指定稳定标签名，如 v2025.09.26.1-stable；为空则自动选择最新稳定标签
  [bool]$DryRun = $true  # 默认 dry-run 安全模式；设为 $false 执行真实回滚
)

Write-Host "== Rollback to Stable =="

# 若未指定标签，选择最新的 *-stable 标签
if (-not $Tag) {
  $tags = git tag --list "*-stable" | Sort-Object
  if (-not $tags -or $tags.Count -eq 0) {
    Write-Host "未找到稳定标签（*-stable）。" -ForegroundColor Red
    exit 1
  }
  $Tag = $tags[$tags.Count - 1]
  Write-Host "使用最新稳定标签: $Tag"
}

# 显示标签信息与目标提交
git show $Tag --stat -n 1

# 安全检查：工作区是否干净
$porcelain = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($porcelain) -and -not $DryRun) {
  Write-Host "工作区存在未提交修改，阻止真实回滚。请先提交或清理后重试。" -ForegroundColor Yellow
  exit 1
}

if ($DryRun) {
  Write-Host "[Dry-Run] 将执行以下回滚步骤：" -ForegroundColor Yellow
  Write-Host "  1) git reset --hard $Tag"
  Write-Host "  2) 可选：git push --force-with-lease  # 请谨慎使用（影响协作）"
  Write-Host "如需执行真实回滚，请加入参数 -DryRun:\$false" -ForegroundColor Yellow
  exit 0
}

Write-Host "执行真实回滚到标签: $Tag" -ForegroundColor Red
git reset --hard $Tag
if ($LASTEXITCODE -ne 0) {
  Write-Host "回滚失败。" -ForegroundColor Red
  exit 1
}

Write-Host "已回滚到 $Tag，本地状态与该标签对应的提交一致。" -ForegroundColor Green
Write-Host "如需推送到远程，请人工确认并执行：git push --force-with-lease" -ForegroundColor Yellow