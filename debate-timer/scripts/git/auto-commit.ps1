Param(
  [string]$Message = "chore: auto commit",
  [switch]$TagStable
)

Write-Host "== Auto Commit Start =="

# Stage changes
git add -A

# Only commit if there are staged changes
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m $Message
  Write-Host "Committed with message: $Message"
} else {
  Write-Host "No staged changes. Skipping commit."
}

# Ensure main branch
$currentBranch = git symbolic-ref --short HEAD 2>$null
if (-not $currentBranch -or $currentBranch.Trim() -eq "") {
  git checkout -b main
} else {
  git branch -M main
}

# Push
git push -u origin main

# Optional tag stable
if ($TagStable) {
  & "$PSScriptRoot/tag-stable.ps1"
}

Write-Host "== Auto Commit Done =="