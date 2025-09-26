Param(
  [string]$Tag = "",
  [switch]$DryRun
)

function Get-LastStableTag {
  $tags = git tag --list | Where-Object { $_ -match "-stable$" } | Sort-Object
  if ($tags.Count -eq 0) { return $null }
  return $tags[-1]
}

if (-not $Tag -or $Tag.Trim() -eq "") {
  $Tag = Get-LastStableTag
}

if (-not $Tag) {
  Write-Host "No stable tag found." ; exit 1
}

Write-Host "Target stable tag: $Tag"
if ($DryRun) {
  Write-Host "[Dry Run] Would run: git reset --hard $Tag"
  Write-Host "[Dry Run] Would run: git push --force origin HEAD"
  exit 0
}

git reset --hard $Tag
git push --force origin HEAD
Write-Host "Rollback to $Tag complete."