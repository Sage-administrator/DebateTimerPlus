Param(
  [string]$Version = "",
  [string]$Prefix = "v",
  [switch]$Push = $true
)

# Determine version: if not provided, use date-based patch
if (-not $Version -or $Version.Trim() -eq "") {
  $date = Get-Date -Format "yyyy.MM.dd.HHmm"
  $Version = "$date"
}
$tag = "$Prefix$Version-stable"

Write-Host "Tagging current commit as: $tag"
git tag -f $tag

if ($Push) {
  git push -f origin $tag
  Write-Host "Pushed tag $tag to origin"
}