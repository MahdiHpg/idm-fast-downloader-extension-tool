[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nativeDir = Join-Path $scriptDir "native-host"
$csFile = Join-Path $nativeDir "IdmBridge.cs"
$exeFile = Join-Path $nativeDir "idm_bridge.exe"
$chromeJson = Join-Path $nativeDir "com.idm.nativehost.chrome.json"
$firefoxJson = Join-Path $nativeDir "com.idm.nativehost.firefox.json"
$extDir = Join-Path $scriptDir "extension"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  IDM Fast Downloader - Installer & Host Registration     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Compile C# Native Bridge using Windows built-in csc.exe
Write-Host "[1/4] Compiling native host (idm_bridge.exe)..." -ForegroundColor Yellow

$cscPaths = @(
    "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

$cscExe = $null
foreach ($p in $cscPaths) {
    if (Test-Path $p) {
        $cscExe = $p
        break
    }
}

if (-not $cscExe) {
    Write-Host "Error: .NET compiler (csc.exe) not found on this system." -ForegroundColor Red
    exit 1
}

# Compile
& $cscExe /nologo /optimize+ /target:exe /out:$exeFile $csFile

if (-not (Test-Path $exeFile)) {
    Write-Host "Error: Failed to compile idm_bridge.exe" -ForegroundColor Red
    exit 1
}
Write-Host "Success: idm_bridge.exe compiled successfully." -ForegroundColor Green

# 2. Update JSON manifests
Write-Host "[2/4] Generating Native Messaging manifest files..." -ForegroundColor Yellow

$chromeManifest = @{
    name = "com.idm.nativehost"
    description = "IDM Fast Downloader Bridge for Chromium Browsers"
    path = $exeFile
    type = "stdio"
    allowed_origins = @(
        "chrome-extension://opkdbjkgacccphgpjdhobgmcclmccnib/"
    )
}
$chromeManifest | ConvertTo-Json -Depth 5 | Set-Content -Path $chromeJson -Encoding UTF8

$firefoxManifest = @{
    name = "com.idm.nativehost"
    description = "IDM Fast Downloader Bridge for Mozilla Firefox"
    path = $exeFile
    type = "stdio"
    allowed_extensions = @(
        "idm-fast-downloader@mahdi-hp.ir"
    )
}
$firefoxManifest | ConvertTo-Json -Depth 5 | Set-Content -Path $firefoxJson -Encoding UTF8

Write-Host "Success: Manifest files configured with absolute paths." -ForegroundColor Green

# 3. Register Native Messaging Hosts in Windows Registry
Write-Host "[3/4] Registering in Windows Registry (HKCU)..." -ForegroundColor Yellow

$regTargets = @(
    @{ Path = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.idm.nativehost"; File = $chromeJson },
    @{ Path = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.idm.nativehost"; File = $chromeJson },
    @{ Path = "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.idm.nativehost"; File = $chromeJson },
    @{ Path = "HKCU:\Software\Mozilla\NativeMessagingHosts\com.idm.nativehost"; File = $firefoxJson }
)

foreach ($target in $regTargets) {
    try {
        if (-not (Test-Path $target.Path)) {
            New-Item -Path $target.Path -Force | Out-Null
        }
        Set-ItemProperty -Path $target.Path -Name "(default)" -Value $target.File -Force
        Write-Host "Registered: $($target.Path)" -ForegroundColor Gray
    } catch {
        Write-Host "Warning: Failed to register $($target.Path)" -ForegroundColor DarkYellow
    }
}

Write-Host "Success: Native messaging host registered for Chrome, Edge, Brave, and Firefox." -ForegroundColor Green

# 4. Instructions
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Installation Complete!                                  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step - Load the extension into your browser:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Chrome / Brave / Opera / Arc:" -ForegroundColor White
Write-Host "   - Open chrome://extensions" -ForegroundColor Gray
Write-Host "   - Enable 'Developer mode' (top right)" -ForegroundColor Gray
Write-Host "   - Click 'Load unpacked' and select:" -ForegroundColor Gray
Write-Host "     $extDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Microsoft Edge:" -ForegroundColor White
Write-Host "   - Open edge://extensions" -ForegroundColor Gray
Write-Host "   - Enable 'Developer mode'" -ForegroundColor Gray
Write-Host "   - Click 'Load unpacked' and select the extension folder above." -ForegroundColor Gray
Write-Host ""
Write-Host "3. Mozilla Firefox:" -ForegroundColor White
Write-Host "   - Open about:debugging#/runtime/this-firefox" -ForegroundColor Gray
Write-Host "   - Click 'Load Temporary Add-on'" -ForegroundColor Gray
Write-Host "   - Select the manifest.json inside the extension folder." -ForegroundColor Gray
Write-Host ""
