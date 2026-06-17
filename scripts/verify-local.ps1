$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot\..")

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  $pnpm = "corepack pnpm"
} else {
  $pnpm = "pnpm"
}

Invoke-Expression "$pnpm build"
Invoke-Expression "$pnpm lint"
Invoke-Expression "$pnpm test"

