# Sets ANDROID_HOME after Android Studio / SDK is installed.
# Run in PowerShell:  .\scripts\setup-android-env.ps1

$sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"

if (-not (Test-Path $sdk)) {
  Write-Host "Android SDK not found at: $sdk"
  Write-Host "1) Install Android Studio"
  Write-Host "2) Open Android Studio -> More Actions -> SDK Manager"
  Write-Host "3) Install Android SDK Platform-Tools + at least one system image"
  Write-Host "4) Create a Virtual Device (AVD) in Device Manager"
  Write-Host "5) Re-run this script"
  exit 1
}

setx ANDROID_HOME $sdk | Out-Null
setx ANDROID_SDK_ROOT $sdk | Out-Null

$platformTools = Join-Path $sdk "platform-tools"
$emulator = Join-Path $sdk "emulator"
$pathExtra = "$platformTools;$emulator"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$platformTools*") {
  setx Path "$userPath;$pathExtra" | Out-Null
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$platformTools;$emulator;$env:Path"

Write-Host "ANDROID_HOME = $sdk"
if (Get-Command adb -ErrorAction SilentlyContinue) {
  adb version
  Write-Host "OK: adb is available. Restart your terminal, then:"
  Write-Host "  npm run start"
  Write-Host "  press a  (Android emulator / device)"
} else {
  Write-Host "adb still not in THIS terminal. Close and reopen PowerShell, then retry."
}
