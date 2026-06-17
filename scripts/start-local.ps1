$ErrorActionPreference = "Stop"

Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot\..")

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  $pnpm = "corepack pnpm"
} else {
  $pnpm = "pnpm"
}

docker compose up -d
Invoke-Expression "$pnpm --filter api prisma migrate dev"
Invoke-Expression "$pnpm --filter api prisma db seed"
Invoke-Expression "$pnpm dev"

