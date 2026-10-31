@echo off
title Build IDM Fast Downloader Setup
cd /d "%~dp0.."

echo ========================================================
echo   Compiling IDM Fast Downloader Setup.exe (Standalone)
echo ========================================================
echo.

set CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe

if not exist "%CSC%" (
    echo Error: C# compiler (csc.exe) not found on this system.
    pause
    exit /b 1
)

echo [1/2] Creating payload.zip archive...
powershell.exe -ExecutionPolicy Bypass -NoProfile -Command ^
  "$zip = 'installer\payload.zip'; if (Test-Path $zip) { Remove-Item $zip -Force };" ^
  "$tmp = Join-Path $env:TEMP ('idm_pl_' + [System.Guid]::NewGuid().ToString('N'));" ^
  "New-Item -ItemType Directory -Path $tmp | Out-Null;" ^
  "Copy-Item 'extension' (Join-Path $tmp 'extension') -Recurse;" ^
  "Copy-Item 'extension-firefox' (Join-Path $tmp 'extension-firefox') -Recurse;" ^
  "Copy-Item 'native-host' (Join-Path $tmp 'native-host') -Recurse;" ^
  "Add-Type -AssemblyName System.IO.Compression.FileSystem;" ^
  "[System.IO.Compression.ZipFile]::CreateFromDirectory($tmp, $zip, [System.IO.Compression.CompressionLevel]::Optimal, $false);" ^
  "Remove-Item $tmp -Recurse -Force;"

if not exist "installer\payload.zip" (
    echo Error: Failed to generate payload.zip archive!
    pause
    exit /b 1
)

echo [2/2] Compiling Setup.exe with embedded Payload & Vazirmatn font...
"%CSC%" /nologo /optimize+ /target:winexe /win32icon:"extension\icons\app.ico" /resource:"installer\payload.zip",PayloadZip /resource:"installer\fonts\Vazirmatn.ttf",VazirmatnFont /resource:"installer\fonts\Vazirmatn-Bold.ttf",VazirmatnBoldFont /r:System.Windows.Forms.dll,System.Drawing.dll,System.IO.Compression.dll,System.IO.Compression.FileSystem.dll /out:"Setup.exe" "installer\Setup.cs"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS: Standalone Setup.exe compiled successfully!
    echo ========================================================
) else (
    echo.
    echo Error: Failed to compile Setup.exe.
)

echo.
pause
