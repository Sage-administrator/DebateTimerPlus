Param(
  [string]$TagPrefix = "v",
  [string]$Suffix = "stable",
  [string]$Message = "stable release",
  [switch]$DryRun
)

# 基于 package.json 版本号创建稳定标签
$pkgPath = Join-Path (Get-Location) "package.json"
if (Test-Path $pkgPath) {
  $pkg = Get-Content $pkgPath | ConvertFrom-Json
  $version = $pkg.version
} else {
  $version = (git describe --tags --abbrev=0) 2>$null
  if (-not $version) { $version = "0.0.0" }
}

$tag = "$TagPrefix$version-$Suffix"
Write-Host "Creating tag: $tag"

if ($DryRun) {
  Write-Host "[DryRun] git tag -a $tag -m `"$Message`""
  Write-Host "[DryRun] git push origin $tag"
} else {
  git tag -a $tag -m $Message
  git push origin $tag
}