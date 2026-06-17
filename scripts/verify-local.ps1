$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot\..")

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  $pnpm = "corepack pnpm"
} else {
  $pnpm = "pnpm"
}

function Invoke-Checked {
  param([string]$Command)

  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $Command"
  }
}

Invoke-Checked "$pnpm build"
Invoke-Checked "$pnpm lint"
Invoke-Checked "$pnpm test"
Invoke-Checked "$pnpm e2e"
