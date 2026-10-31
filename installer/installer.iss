; =====================================================================
; IDM Fast Downloader - Inno Setup Script
; Author: Mahdi Heydarpour (mahdi-hp.ir)
; Description: Standalone Windows Installer for IDM Fast Downloader
; =====================================================================

#define MyAppName "IDM Fast Downloader"
#define MyAppVersion "1.8.16"
#define MyAppPublisher "mahdi-hp.ir"
#define MyAppURL "https://mahdi-hp.ir/"
#define MyAppExeName "Setup.exe"

[Setup]
AppId={{C6D2765A-A6F5-470E-9218-E7BE43DFBE7B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\IDMFastDownloader
DisableDirPage=no
DisableProgramGroupPage=yes
OutputBaseFilename=IDM-Fast-Downloader-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\extension\icons\app.ico
UninstallDisplayIcon={app}\extension\icons\app.ico
PrivilegesRequired=lowest
OutputDir=..\dist
CloseApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "task_chrome"; Description: "اتصال به Google Chrome"; GroupDescription: "مرورگرهای مدنظر جهت فعال‌سازی:"; Flags: checkablealone
Name: "task_edge"; Description: "اتصال به Microsoft Edge"; GroupDescription: "مرورگرهای مدنظر جهت فعال‌سازی:"; Flags: checkablealone
Name: "task_brave"; Description: "اتصال به Brave Browser"; GroupDescription: "مرورگرهای مدنظر جهت فعال‌سازی:"; Flags: checkablealone
Name: "task_firefox"; Description: "اتصال به Mozilla Firefox"; GroupDescription: "مرورگرهای مدنظر جهت فعال‌سازی:"; Flags: checkablealone
Name: "task_opera"; Description: "اتصال به Opera / Opera GX"; GroupDescription: "مرورگرهای مدنظر جهت فعال‌سازی:"; Flags: checkablealone
Name: "task_vivaldi"; Description: "اتصال به Vivaldi"; GroupDescription: "مرورگرهای مدنظر جهت فعال‌سازی:"; Flags: checkablealone

[Files]
; Extension files
Source: "..\extension\*"; DestDir: "{app}\extension"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\extension-firefox\*"; DestDir: "{app}\extension-firefox"; Flags: ignoreversion recursesubdirs createallsubdirs
; Native Host files
Source: "..\native-host\idm_bridge.exe"; DestDir: "{app}\native-host"; Flags: ignoreversion
Source: "..\native-host\IdmBridge.cs"; DestDir: "{app}\native-host"; Flags: ignoreversion
; Setup GUI assistant
Source: "..\Setup.exe"; DestDir: "{app}"; Flags: ignoreversion
; Archive
Source: "..\idm-fast-downloader-firefox.zip"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
; Chrome
Root: HKCU; Subkey: "Software\Google\Chrome\NativeMessagingHosts\com.idm.nativehost"; ValueType: string; ValueName: ""; ValueData: "{app}\native-host\com.idm.nativehost.chrome.json"; Flags: uninsdeletekey; Tasks: task_chrome
; Edge
Root: HKCU; Subkey: "Software\Microsoft\Edge\NativeMessagingHosts\com.idm.nativehost"; ValueType: string; ValueName: ""; ValueData: "{app}\native-host\com.idm.nativehost.chrome.json"; Flags: uninsdeletekey; Tasks: task_edge
; Brave
Root: HKCU; Subkey: "Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.idm.nativehost"; ValueType: string; ValueName: ""; ValueData: "{app}\native-host\com.idm.nativehost.chrome.json"; Flags: uninsdeletekey; Tasks: task_brave
; Firefox
Root: HKCU; Subkey: "Software\Mozilla\NativeMessagingHosts\com.idm.nativehost"; ValueType: string; ValueName: ""; ValueData: "{app}\native-host\com.idm.nativehost.firefox.json"; Flags: uninsdeletekey; Tasks: task_firefox
; Opera & Opera GX
Root: HKCU; Subkey: "Software\Opera Software\Opera Stable\NativeMessagingHosts\com.idm.nativehost"; ValueType: string; ValueName: ""; ValueData: "{app}\native-host\com.idm.nativehost.chrome.json"; Flags: uninsdeletekey; Tasks: task_opera
Root: HKCU; Subkey: "Software\Opera Software\Opera GX Stable\NativeMessagingHosts\com.idm.nativehost"; ValueType: string; ValueName: ""; ValueData: "{app}\native-host\com.idm.nativehost.chrome.json"; Flags: uninsdeletekey; Tasks: task_opera
; Vivaldi
Root: HKCU; Subkey: "Software\Vivaldi\NativeMessagingHosts\com.idm.nativehost"; ValueType: string; ValueName: ""; ValueData: "{app}\native-host\com.idm.nativehost.chrome.json"; Flags: uninsdeletekey; Tasks: task_vivaldi

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
var
  NativeDir: String;
  ChromeJsonFile: String;
  FirefoxJsonFile: String;
  ExeEscaped: String;
  JsonContent: String;
begin
  if CurStep = ssPostInstall then
  begin
    NativeDir := ExpandConstant('{app}\native-host');
    ChromeJsonFile := NativeDir + '\com.idm.nativehost.chrome.json';
    FirefoxJsonFile := NativeDir + '\com.idm.nativehost.firefox.json';
    
    ExeEscaped := ExpandConstant('{app}\native-host\idm_bridge.exe');
    StringChangeEx(ExeEscaped, '\', '\\', True);
    
    // Write Chrome manifest
    JsonContent := '{' + #13#10 +
      '  "name": "com.idm.nativehost",' + #13#10 +
      '  "description": "IDM Fast Downloader Bridge for Chromium Browsers",' + #13#10 +
      '  "path": "' + ExeEscaped + '",' + #13#10 +
      '  "type": "stdio",' + #13#10 +
      '  "allowed_origins": [' + #13#10 +
      '    "chrome-extension://opkdbjkgacccphgpjdhobgmcclmccnib/"' + #13#10 +
      '  ]' + #13#10 +
      '}';
    SaveStringToFile(ChromeJsonFile, JsonContent, False);

    // Write Firefox manifest
    JsonContent := '{' + #13#10 +
      '  "name": "com.idm.nativehost",' + #13#10 +
      '  "description": "IDM Fast Downloader Bridge for Mozilla Firefox",' + #13#10 +
      '  "path": "' + ExeEscaped + '",' + #13#10 +
      '  "type": "stdio",' + #13#10 +
      '  "allowed_extensions": [' + #13#10 +
      '    "idm-fast-downloader@mahdi-hp.ir"' + #13#10 +
      '  ]' + #13#10 +
      '}';
    SaveStringToFile(FirefoxJsonFile, JsonContent, False);
  end;
end;

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "اجرای دستیار هوشمند فعال‌سازی افزونه روی مرورگرها"; Flags: nowait postinstall skipifsilent
