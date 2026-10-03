[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "در حال حذف کلیدهای ریجستری پل بومی IDM..." -ForegroundColor Yellow

$regTargets = @(
    "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.idm.nativehost",
    "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.idm.nativehost",
    "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.idm.nativehost",
    "HKCU:\Software\Mozilla\NativeMessagingHosts\com.idm.nativehost"
)

foreach ($target in $regTargets) {
    if (Test-Path $target) {
        Remove-Item -Path $target -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "حذف شد: $target" -ForegroundColor Gray
    }
}

Write-Host "✅ پل ارتباطی با موفقیت از ریجستری حذف گردید." -ForegroundColor Green
