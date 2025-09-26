param(
  [string]$Message = "chore: auto commit",
  [switch]$RunLint,
  [switch]$RunTest,
  [string]$StableTag # e.g. v2025.09.26.1-stable
)

Write-Host "== Auto Commit =="

# 检查是否有变更
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host "无变更，跳过提交。" -ForegroundColor Yellow
} else {
  git add -A

  if ($RunLint) {
    Write-Host "运行 lint..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
      Write-Host "lint 失败，终止提交。" -ForegroundColor Red
      exit 1
    }
  }

  if ($RunTest) {
    Write-Host "运行测试..."
    npm test
    if ($LASTEXITCODE -ne 0) {
      Write-Host "测试失败，终止提交。" -ForegroundColor Red
      exit 1
    }
  }

  git commit -m "$Message"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "提交失败。" -ForegroundColor Red
    exit 1
  } else {
    Write-Host "提交完成。" -ForegroundColor Green
  }
}

# 可选：打稳定标签并推送
if ($StableTag) {
  Write-Host "创建稳定标签 $StableTag ..."
  git tag -a $StableTag -m "Stable: $StableTag"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "创建标签失败。" -ForegroundColor Red
    exit 1
  }
  Write-Host "推送标签..."
  git push --tags
  if ($LASTEXITCODE -ne 0) {
    Write-Host "推送标签失败。" -ForegroundColor Red
    exit 1
  }
  Write-Host "稳定标签已推送。" -ForegroundColor Green
}

Write-Host "完成。" -ForegroundColor Green