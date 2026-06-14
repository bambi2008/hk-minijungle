$ErrorActionPreference = "Stop"

$packageFamily = "OpenAI.Codex_2p2nqsd0c76g0"
$manifest = "C:\Program Files\WindowsApps\OpenAI.Codex_26.527.3686.0_x64__2p2nqsd0c76g0\AppxManifest.xml"

if (-not (Test-Path -LiteralPath $manifest)) {
  $manifest = Get-ChildItem "C:\Program Files\WindowsApps" -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "OpenAI.Codex_*_x64__2p2nqsd0c76g0" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 |
    ForEach-Object { Join-Path $_.FullName "AppxManifest.xml" }
}

if (-not $manifest -or -not (Test-Path -LiteralPath $manifest)) {
  throw "Could not find the Codex AppxManifest.xml under C:\Program Files\WindowsApps."
}

Write-Host "Repairing Codex OAuth callback registration..."
Write-Host "Manifest: $manifest"
Write-Host ""

$codexProcesses = Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessName -match "^(Codex|codex)$" -or $_.Path -like "*\OpenAI.Codex_*" }

if ($codexProcesses) {
  Write-Host "Closing running Codex processes..."
  $codexProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 3
}

Add-AppxPackage -DisableDevelopmentMode -Register $manifest -ForceApplicationShutdown

Write-Host ""
Write-Host "Codex protocol registration has been rebuilt."
Write-Host "Reopening Codex..."
Start-Process explorer.exe "shell:AppsFolder\$packageFamily!App"

Write-Host ""
Write-Host "Done. Try the OpenAI Platform connection again after Codex opens."
