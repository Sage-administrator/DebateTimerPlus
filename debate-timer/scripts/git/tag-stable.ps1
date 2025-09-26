param(
  [string]$Prefix = "v",
  [string]$Suffix = "-stable",
  [int]$Index = 1, # 若同日已有标签，可手动指定序号
  [string]$Message = "Stable tag"
)

# 生成标签名：vYYYY.MM.DD.N-stable
$now = Get-Date
$tag = "{0}{1}.{2}.{3}.{4}{5}" -f $Prefix, $now.Year, $now.ToString("MM"), $now.ToString("dd"), $Index, $Suffix

Write-Host "创建稳定标签: $tag"
git tag -a $tag -m "$Message: $tag"
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

Write-Host "完成: $tag" -ForegroundColor Green