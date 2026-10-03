@echo off
title IDM Fast Downloader - Uninstaller
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0uninstall.ps1"
echo.
pause
