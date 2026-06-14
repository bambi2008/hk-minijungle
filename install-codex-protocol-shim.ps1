$ErrorActionPreference = "Stop"

$shimPath = Join-Path $PSScriptRoot "codex-protocol-shim.ps1"
if (-not (Test-Path -LiteralPath $shimPath)) {
  throw "Missing shim script: $shimPath"
}

$protocolKey = "HKCU:\Software\Classes\codex"
$commandKey = Join-Path $protocolKey "shell\open\command"
$command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$shimPath`" `"%1`""

New-Item -Path $protocolKey -Force | Out-Null
New-ItemProperty -Path $protocolKey -Name "(default)" -Value "URL:Codex Protocol" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $protocolKey -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-Item -Path $commandKey -Force | Out-Null
Set-ItemProperty -Path $commandKey -Name "(default)" -Value $command

Write-Host "Installed codex:// protocol shim."
Write-Host "Command: $command"
