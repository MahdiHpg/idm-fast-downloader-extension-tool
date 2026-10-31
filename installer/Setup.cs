using System;
using System.IO;
using System.Diagnostics;
using System.Text;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Text;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Reflection;
using System.Runtime.InteropServices;
using System.IO.Compression;
using Microsoft.Win32;

namespace IdmFastDownloaderInstaller
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                if (Environment.OSVersion.Version.Major >= 6)
                    SetProcessDPIAware();
            }
            catch { }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            FontManager.InitializeFonts();
            Application.Run(new MainForm());
        }

        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();
    }

    public static class FontManager
    {
        private static PrivateFontCollection pfc = new PrivateFontCollection();
        private static IntPtr regularFontPtr = IntPtr.Zero;
        private static IntPtr boldFontPtr = IntPtr.Zero;
        public static bool HasVazir = false;

        public static void InitializeFonts()
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();

                // 1. Load Regular / Medium
                using (Stream s = asm.GetManifestResourceStream("VazirmatnFont"))
                {
                    if (s != null)
                    {
                        byte[] data = new byte[s.Length];
                        s.Read(data, 0, data.Length);
                        regularFontPtr = Marshal.AllocCoTaskMem(data.Length);
                        Marshal.Copy(data, 0, regularFontPtr, data.Length);
                        pfc.AddMemoryFont(regularFontPtr, data.Length);
                        HasVazir = true;
                    }
                }

                // 2. Load Bold
                using (Stream s = asm.GetManifestResourceStream("VazirmatnBoldFont"))
                {
                    if (s != null)
                    {
                        byte[] data = new byte[s.Length];
                        s.Read(data, 0, data.Length);
                        boldFontPtr = Marshal.AllocCoTaskMem(data.Length);
                        Marshal.Copy(data, 0, boldFontPtr, data.Length);
                        pfc.AddMemoryFont(boldFontPtr, data.Length);
                        HasVazir = true;
                    }
                }

                // Fallback to local font file if stream wasn't found
                if (!HasVazir)
                {
                    string localFont = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer", "fonts", "Vazirmatn.ttf");
                    if (File.Exists(localFont))
                    {
                        pfc.AddFontFile(localFont);
                        HasVazir = true;
                    }
                }
            }
            catch { }
        }

        public static Font GetVazir(float size, FontStyle style = FontStyle.Regular)
        {
            try
            {
                if (HasVazir && pfc.Families.Length > 0)
                {
                    return new Font(pfc.Families[0], size, style);
                }
            }
            catch { }

            // Clean fallback
            return new Font("Segoe UI", size, style);
        }
    }

    public class BrowserInfo
    {
        public string Key { get; set; }
        public string Name { get; set; }
        public string ExeName { get; set; }
        public string ExtensionUrl { get; set; }
        public string ExePath { get; set; }
        public bool IsInstalled
        {
            get { return !string.IsNullOrEmpty(ExePath) && File.Exists(ExePath); }
        }
        public List<string> RegistryTargets { get; set; }
        public bool IsFirefox { get; set; }
    }

    public class MainForm : Form
    {
        private Panel headerPanel;
        private Label lblTitle;
        private Label lblSubtitle;
        private Panel idmBadgePanel;
        private Label lblIdmStatus;

        private Panel heroPanel;
        private Button btnOneClick;
        private Label lblOneClickHint;
        private Label lblDetectedBrowsersSummary;

        private Panel advancedTogglePanel;
        private LinkLabel lnkToggleAdvanced;

        private Panel advancedContainer;
        private GroupBox grpBrowsers;
        private FlowLayoutPanel flowBrowsers;
        private Dictionary<string, CheckBox> browserCheckboxes = new Dictionary<string, CheckBox>();
        private Button btnSelectAll;
        private Button btnDeselectAll;

        private GroupBox grpPath;
        private TextBox txtInstallPath;
        private Button btnBrowsePath;

        private Button btnCustomInstall;
        private Button btnUninstall;

        private GroupBox grpLog;
        private RichTextBox rtbLog;

        private Panel successPanel;
        private Label lblSuccessTitle;
        private Label lblSuccessDesc;
        private FlowLayoutPanel flowSuccessLaunchers;
        private Button btnBackToMain;

        private List<BrowserInfo> browsers;
        private string detectedIdmPath = null;
        private string appDir;
        private bool isAdvancedVisible = false;

        public MainForm()
        {
            appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
            if (!Directory.Exists(Path.Combine(appDir, "extension")) && Directory.Exists(Path.Combine(Directory.GetParent(appDir).FullName, "extension")))
            {
                appDir = Directory.GetParent(appDir).FullName;
            }

            InitBrowsersList();
            DetectIdm();
            InitializeComponent();
            CheckInstalledBrowsers();
        }

        private void InitBrowsersList()
        {
            browsers = new List<BrowserInfo>
            {
                new BrowserInfo
                {
                    Key = "chrome",
                    Name = "Google Chrome",
                    ExeName = "chrome.exe",
                    ExtensionUrl = "chrome://extensions",
                    IsFirefox = false,
                    RegistryTargets = new List<string> { @"Software\Google\Chrome\NativeMessagingHosts\com.idm.nativehost" }
                },
                new BrowserInfo
                {
                    Key = "edge",
                    Name = "Microsoft Edge",
                    ExeName = "msedge.exe",
                    ExtensionUrl = "edge://extensions",
                    IsFirefox = false,
                    RegistryTargets = new List<string> { @"Software\Microsoft\Edge\NativeMessagingHosts\com.idm.nativehost" }
                },
                new BrowserInfo
                {
                    Key = "brave",
                    Name = "Brave Browser",
                    ExeName = "brave.exe",
                    ExtensionUrl = "brave://extensions",
                    IsFirefox = false,
                    RegistryTargets = new List<string> { @"Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.idm.nativehost" }
                },
                new BrowserInfo
                {
                    Key = "firefox",
                    Name = "Mozilla Firefox",
                    ExeName = "firefox.exe",
                    ExtensionUrl = "about:debugging#/runtime/this-firefox",
                    IsFirefox = true,
                    RegistryTargets = new List<string> { @"Software\Mozilla\NativeMessagingHosts\com.idm.nativehost" }
                },
                new BrowserInfo
                {
                    Key = "opera",
                    Name = "Opera / Opera GX",
                    ExeName = "launcher.exe",
                    ExtensionUrl = "opera://extensions",
                    IsFirefox = false,
                    RegistryTargets = new List<string> {
                        @"Software\Opera Software\Opera Stable\NativeMessagingHosts\com.idm.nativehost",
                        @"Software\Opera Software\Opera GX Stable\NativeMessagingHosts\com.idm.nativehost"
                    }
                },
                new BrowserInfo
                {
                    Key = "vivaldi",
                    Name = "Vivaldi",
                    ExeName = "vivaldi.exe",
                    ExtensionUrl = "vivaldi://extensions",
                    IsFirefox = false,
                    RegistryTargets = new List<string> { @"Software\Vivaldi\NativeMessagingHosts\com.idm.nativehost" }
                }
            };
        }

        private void DetectIdm()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\DownloadManager"))
                {
                    if (key != null)
                    {
                        object p = key.GetValue("ExePath");
                        if (p != null && File.Exists(p.ToString())) { detectedIdmPath = p.ToString(); return; }
                    }
                }
                using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\DownloadManager"))
                {
                    if (key != null)
                    {
                        object p = key.GetValue("ExePath");
                        if (p != null && File.Exists(p.ToString())) { detectedIdmPath = p.ToString(); return; }
                    }
                }
                using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\WOW6432Node\DownloadManager"))
                {
                    if (key != null)
                    {
                        object p = key.GetValue("ExePath");
                        if (p != null && File.Exists(p.ToString())) { detectedIdmPath = p.ToString(); return; }
                    }
                }
                string p1 = @"C:\Program Files (x86)\Internet Download Manager\IDMan.exe";
                if (File.Exists(p1)) { detectedIdmPath = p1; return; }
                string p2 = @"C:\Program Files\Internet Download Manager\IDMan.exe";
                if (File.Exists(p2)) { detectedIdmPath = p2; return; }
            }
            catch { }
        }

        private void CheckInstalledBrowsers()
        {
            List<string> foundNames = new List<string>();

            foreach (var b in browsers)
            {
                b.ExePath = FindBrowserExe(b.ExeName);
                if (browserCheckboxes.ContainsKey(b.Key))
                {
                    var chk = browserCheckboxes[b.Key];
                    if (b.IsInstalled)
                    {
                        chk.Checked = true;
                        chk.Text = b.Name + "  [نصب‌شده]";
                        chk.ForeColor = Color.FromArgb(220, 252, 231);
                        foundNames.Add(b.Name);
                    }
                    else
                    {
                        chk.Checked = false;
                        chk.Text = b.Name + "  (یافت نشد)";
                        chk.ForeColor = Color.FromArgb(156, 163, 175);
                    }
                }
            }

            if (foundNames.Count > 0)
            {
                lblDetectedBrowsersSummary.Text = "🌐 مرورگرهای آماده فعال‌سازی: " + string.Join(" • ", foundNames.ToArray());
                lblDetectedBrowsersSummary.ForeColor = Color.FromArgb(167, 243, 208);
            }
            else
            {
                lblDetectedBrowsersSummary.Text = "مرورگری به صورت خودکار شناسایی نشد، اما می‌توانید از گزینه‌های پیشرفته مرورگرها را دستی انتخاب نمایید.";
                lblDetectedBrowsersSummary.ForeColor = Color.FromArgb(254, 202, 202);
            }
        }

        private string FindBrowserExe(string exeName)
        {
            try
            {
                using (RegistryKey k = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + exeName))
                {
                    if (k != null)
                    {
                        object p = k.GetValue("");
                        if (p != null && File.Exists(p.ToString())) return p.ToString();
                    }
                }
                using (RegistryKey k = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\" + exeName))
                {
                    if (k != null)
                    {
                        object p = k.GetValue("");
                        if (p != null && File.Exists(p.ToString())) return p.ToString();
                    }
                }
            }
            catch { }

            string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

            string[] candidates = new string[] {
                Path.Combine(pf, "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(pf86, "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(localApp, "Google", "Chrome", "Application", "chrome.exe"),

                Path.Combine(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(pf, "Microsoft", "Edge", "Application", "msedge.exe"),

                Path.Combine(pf, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
                Path.Combine(localApp, "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),

                Path.Combine(pf, "Mozilla Firefox", "firefox.exe"),
                Path.Combine(pf86, "Mozilla Firefox", "firefox.exe"),

                Path.Combine(localApp, "Programs", "Opera", "launcher.exe"),
                Path.Combine(localApp, "Programs", "Opera GX", "launcher.exe"),

                Path.Combine(localApp, "Vivaldi", "Application", "vivaldi.exe")
            };

            foreach (var cand in candidates)
            {
                if (Path.GetFileName(cand).Equals(exeName, StringComparison.OrdinalIgnoreCase) && File.Exists(cand))
                    return cand;
            }

            return null;
        }

        private void InitializeComponent()
        {
            this.Text = "نصب‌کننده خودکار IDM Fast Downloader";
            this.Size = new Size(720, 560);
            this.MinimumSize = new Size(700, 540);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate 900
            this.ForeColor = Color.FromArgb(248, 250, 252);
            this.RightToLeft = RightToLeft.Yes;
            this.RightToLeftLayout = true;
            this.Font = FontManager.GetVazir(9.5F);

            string iconPath = Path.Combine(appDir, "extension", "icons", "app.ico");
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            // --- Header Panel ---
            headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 115,
                BackColor = Color.FromArgb(30, 41, 59), // Slate 800
                Padding = new Padding(24, 14, 24, 14)
            };

            lblTitle = new Label
            {
                Text = "⚡ دانلود سریع با اینترنت دانلود منیجر (IDM Fast Downloader)",
                Font = FontManager.GetVazir(13.5F, FontStyle.Bold),
                ForeColor = Color.FromArgb(52, 211, 153), // Emerald
                AutoSize = true,
                Location = new Point(24, 12)
            };

            lblSubtitle = new Label
            {
                Text = "نصب خودکار، ثبت پل ارتباطی C# و اتصال هوشمند به تمام مرورگرها با یک کلیک • mahdi-hp.ir",
                Font = FontManager.GetVazir(9F),
                ForeColor = Color.FromArgb(148, 163, 184),
                AutoSize = true,
                Location = new Point(24, 44)
            };

            idmBadgePanel = new Panel
            {
                Height = 30,
                Width = 650,
                Location = new Point(24, 72),
                BackColor = detectedIdmPath != null ? Color.FromArgb(6, 78, 59) : Color.FromArgb(127, 29, 29)
            };

            lblIdmStatus = new Label
            {
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleLeft,
                Padding = new Padding(12, 0, 12, 0),
                Font = FontManager.GetVazir(8.5F, FontStyle.Bold),
                ForeColor = detectedIdmPath != null ? Color.FromArgb(167, 243, 208) : Color.FromArgb(254, 202, 202),
                Text = detectedIdmPath != null 
                    ? "✅ نرم‌افزار اینترنت دانلود منیجر (IDM) شناسایی شد: " + detectedIdmPath 
                    : "⚠️ نرم‌افزار IDM شناسایی نشد! لطفاً مطمئن شوید IDM روی سیستم نصب است."
            };
            idmBadgePanel.Controls.Add(lblIdmStatus);

            headerPanel.Controls.Add(lblTitle);
            headerPanel.Controls.Add(lblSubtitle);
            headerPanel.Controls.Add(idmBadgePanel);

            // --- Hero Section (One-Click Installer) ---
            heroPanel = new Panel
            {
                Location = new Point(24, 130),
                Size = new Size(655, 230),
                BackColor = Color.FromArgb(30, 41, 59),
                BorderStyle = BorderStyle.None
            };

            lblDetectedBrowsersSummary = new Label
            {
                Location = new Point(20, 20),
                Size = new Size(615, 30),
                TextAlign = ContentAlignment.MiddleCenter,
                Font = FontManager.GetVazir(10F, FontStyle.Bold),
                ForeColor = Color.FromArgb(167, 243, 208),
                Text = "در حال شناسایی مرورگرهای سیستم..."
            };

            btnOneClick = new Button
            {
                Text = "⚡ نصب و فعال‌سازی فوری (فقط با ۱ کلیک)",
                Location = new Point(60, 65),
                Size = new Size(535, 62),
                BackColor = Color.FromArgb(16, 185, 129), // Emerald 500
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = FontManager.GetVazir(13F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnOneClick.FlatAppearance.BorderSize = 0;
            btnOneClick.Click += async (s, e) => await ExecuteFullInstallationAsync(true);

            lblOneClickHint = new Label
            {
                Location = new Point(40, 140),
                Size = new Size(575, 45),
                TextAlign = ContentAlignment.MiddleCenter,
                Font = FontManager.GetVazir(8.8F),
                ForeColor = Color.FromArgb(148, 163, 184),
                Text = "با کلیک روی این دکمه، تمام فایل‌ها به صورت خودکار در مسیر امن سیستم نصب شده، پل ارتباطی C# ساخته می‌شود و کلیدهای ارتباطی تمام مرورگرها ثبت خواهند شد."
            };

            heroPanel.Controls.Add(lblDetectedBrowsersSummary);
            heroPanel.Controls.Add(btnOneClick);
            heroPanel.Controls.Add(lblOneClickHint);

            // --- Toggle Advanced Options ---
            advancedTogglePanel = new Panel
            {
                Location = new Point(24, 375),
                Size = new Size(655, 40),
                BackColor = Color.Transparent
            };

            lnkToggleAdvanced = new LinkLabel
            {
                Text = "⚙️ تنظیمات سفارشی، انتخاب اختصاصی مرورگرها و حذف نصب...",
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleCenter,
                Font = FontManager.GetVazir(9.2F, FontStyle.Bold),
                LinkColor = Color.FromArgb(96, 165, 250), // Blue 400
                ActiveLinkColor = Color.FromArgb(147, 197, 253),
                Cursor = Cursors.Hand
            };
            lnkToggleAdvanced.LinkClicked += (s, e) => ToggleAdvancedPanel();
            advancedTogglePanel.Controls.Add(lnkToggleAdvanced);

            // --- Success Celebration Panel (Hidden initially) ---
            successPanel = new Panel
            {
                Location = new Point(24, 130),
                Size = new Size(655, 360),
                BackColor = Color.FromArgb(30, 41, 59),
                Visible = false
            };

            lblSuccessTitle = new Label
            {
                Text = "🎉 تبریک! نصب و اتصال با موفقیت کامل انجام شد!",
                Font = FontManager.GetVazir(13F, FontStyle.Bold),
                ForeColor = Color.FromArgb(52, 211, 153),
                Location = new Point(20, 20),
                Size = new Size(615, 35),
                TextAlign = ContentAlignment.MiddleCenter
            };

            lblSuccessDesc = new Label
            {
                Text = "پل ارتباطی بومی و رجیستری روی تمام مرورگرها ثبت گردید.\nاکنون کافیست روی دکمه مرورگر مدنظرتان کلیک کنید تا وارد صفحه افزونه‌ها شوید؛ آدرس پوشه خودکار در حافظه کپی شده است (کافیست در پنجره Load Unpacked کلیدهای Ctrl + V را بزنید).",
                Font = FontManager.GetVazir(9.2F),
                ForeColor = Color.FromArgb(209, 213, 219),
                Location = new Point(30, 60),
                Size = new Size(595, 60),
                TextAlign = ContentAlignment.MiddleCenter
            };

            flowSuccessLaunchers = new FlowLayoutPanel
            {
                Location = new Point(30, 130),
                Size = new Size(595, 150),
                FlowDirection = FlowDirection.RightToLeft,
                AutoScroll = true
            };

            btnBackToMain = new Button
            {
                Text = "بازگشت به صفحه اصلی",
                Location = new Point(240, 295),
                Size = new Size(175, 38),
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = FontManager.GetVazir(9F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnBackToMain.FlatAppearance.BorderSize = 0;
            btnBackToMain.Click += (s, e) =>
            {
                successPanel.Visible = false;
                heroPanel.Visible = true;
                advancedTogglePanel.Visible = true;
                this.Size = new Size(720, 560);
            };

            successPanel.Controls.Add(lblSuccessTitle);
            successPanel.Controls.Add(lblSuccessDesc);
            successPanel.Controls.Add(flowSuccessLaunchers);
            successPanel.Controls.Add(btnBackToMain);

            // --- Advanced Container (Collapsible) ---
            advancedContainer = new Panel
            {
                Location = new Point(24, 420),
                Size = new Size(655, 380),
                Visible = false
            };

            // Browsers Group
            grpBrowsers = new GroupBox
            {
                Text = "مرورگرهای مدنظر جهت فعال‌سازی:",
                Location = new Point(0, 0),
                Size = new Size(655, 110),
                ForeColor = Color.FromArgb(167, 243, 208),
                Font = FontManager.GetVazir(9F, FontStyle.Bold)
            };

            flowBrowsers = new FlowLayoutPanel
            {
                Location = new Point(15, 22),
                Size = new Size(520, 80),
                FlowDirection = FlowDirection.RightToLeft,
                Font = FontManager.GetVazir(8.5F)
            };

            foreach (var b in browsers)
            {
                var chk = new CheckBox
                {
                    Text = b.Name,
                    Width = 165,
                    Height = 30,
                    ForeColor = Color.White,
                    Tag = b.Key
                };
                browserCheckboxes[b.Key] = chk;
                flowBrowsers.Controls.Add(chk);
            }

            btnSelectAll = new Button
            {
                Text = "انتخاب همه",
                Location = new Point(545, 24),
                Size = new Size(95, 28),
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = FontManager.GetVazir(8F)
            };
            btnSelectAll.FlatAppearance.BorderSize = 0;
            btnSelectAll.Click += (s, e) => { foreach (var c in browserCheckboxes.Values) c.Checked = true; };

            btnDeselectAll = new Button
            {
                Text = "لغو همه",
                Location = new Point(545, 58),
                Size = new Size(95, 28),
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = FontManager.GetVazir(8F)
            };
            btnDeselectAll.FlatAppearance.BorderSize = 0;
            btnDeselectAll.Click += (s, e) => { foreach (var c in browserCheckboxes.Values) c.Checked = false; };

            grpBrowsers.Controls.Add(flowBrowsers);
            grpBrowsers.Controls.Add(btnSelectAll);
            grpBrowsers.Controls.Add(btnDeselectAll);

            // Path Group
            grpPath = new GroupBox
            {
                Text = "مسیر نصب افزونه و پل اختصاصی:",
                Location = new Point(0, 115),
                Size = new Size(655, 65),
                ForeColor = Color.FromArgb(167, 243, 208),
                Font = FontManager.GetVazir(9F, FontStyle.Bold)
            };

            string defaultDest = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "IDMFastDownloader");

            txtInstallPath = new TextBox
            {
                Location = new Point(125, 24),
                Size = new Size(515, 25),
                Text = defaultDest,
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                Font = FontManager.GetVazir(8.5F),
                RightToLeft = RightToLeft.No
            };

            btnBrowsePath = new Button
            {
                Text = "تغییر مسیر...",
                Location = new Point(15, 22),
                Size = new Size(95, 28),
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = FontManager.GetVazir(8F)
            };
            btnBrowsePath.FlatAppearance.BorderSize = 0;
            btnBrowsePath.Click += (s, e) =>
            {
                using (var fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtInstallPath.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtInstallPath.Text = fbd.SelectedPath;
                    }
                }
            };

            grpPath.Controls.Add(txtInstallPath);
            grpPath.Controls.Add(btnBrowsePath);

            // Custom Install & Uninstall
            btnCustomInstall = new Button
            {
                Text = "🚀 نصب روی موارد انتخابی",
                Location = new Point(210, 188),
                Size = new Size(445, 40),
                BackColor = Color.FromArgb(16, 185, 129),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = FontManager.GetVazir(10F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnCustomInstall.FlatAppearance.BorderSize = 0;
            btnCustomInstall.Click += async (s, e) => await ExecuteFullInstallationAsync(false);

            btnUninstall = new Button
            {
                Text = "🗑️ حذف کامل (Uninstall)",
                Location = new Point(0, 188),
                Size = new Size(195, 40),
                BackColor = Color.FromArgb(220, 38, 38),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = FontManager.GetVazir(9F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnUninstall.FlatAppearance.BorderSize = 0;
            btnUninstall.Click += async (s, e) => await ExecuteUninstallAsync();

            // Log
            grpLog = new GroupBox
            {
                Text = "📋 لاگ و گزارش سیستمی:",
                Location = new Point(0, 235),
                Size = new Size(655, 140),
                ForeColor = Color.FromArgb(167, 243, 208),
                Font = FontManager.GetVazir(8.5F, FontStyle.Bold)
            };

            rtbLog = new RichTextBox
            {
                Location = new Point(10, 20),
                Size = new Size(635, 110),
                BackColor = Color.FromArgb(10, 15, 26),
                ForeColor = Color.FromArgb(209, 213, 219),
                BorderStyle = BorderStyle.None,
                Font = new Font("Consolas", 8.5F),
                ReadOnly = true,
                RightToLeft = RightToLeft.No
            };
            grpLog.Controls.Add(rtbLog);

            advancedContainer.Controls.Add(grpBrowsers);
            advancedContainer.Controls.Add(grpPath);
            advancedContainer.Controls.Add(btnCustomInstall);
            advancedContainer.Controls.Add(btnUninstall);
            advancedContainer.Controls.Add(grpLog);

            // Add controls to main form
            this.Controls.Add(headerPanel);
            this.Controls.Add(heroPanel);
            this.Controls.Add(successPanel);
            this.Controls.Add(advancedTogglePanel);
            this.Controls.Add(advancedContainer);
        }

        private void ToggleAdvancedPanel()
        {
            isAdvancedVisible = !isAdvancedVisible;
            advancedContainer.Visible = isAdvancedVisible;

            if (isAdvancedVisible)
            {
                lnkToggleAdvanced.Text = "🔼 بستن بخش تنظیمات پیشرفته";
                this.Size = new Size(720, 860);
            }
            else
            {
                lnkToggleAdvanced.Text = "⚙️ تنظیمات سفارشی، انتخاب اختصاصی مرورگرها و حذف نصب...";
                this.Size = new Size(720, 560);
            }
        }

        private void Log(string message, Color? color = null)
        {
            if (rtbLog.InvokeRequired)
            {
                rtbLog.Invoke(new Action(() => Log(message, color)));
                return;
            }

            rtbLog.SelectionStart = rtbLog.TextLength;
            rtbLog.SelectionLength = 0;
            rtbLog.SelectionColor = color ?? Color.FromArgb(209, 213, 219);
            rtbLog.AppendText(string.Format("[{0:HH:mm:ss}] {1}\n", DateTime.Now, message));
            rtbLog.ScrollToCaret();
        }

        private async Task ExecuteFullInstallationAsync(bool autoAll)
        {
            btnOneClick.Enabled = false;
            btnCustomInstall.Enabled = false;
            btnOneClick.Text = "⏳ در حال نصب خودکار... لطفاً شکیبا باشید";

            try
            {
                string destDir = txtInstallPath.Text.Trim();
                if (string.IsNullOrEmpty(destDir))
                    destDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "IDMFastDownloader");

                Log("--- آغاز نصب و فعال‌سازی خودکار ---", Color.Yellow);

                string destExt = Path.Combine(destDir, "extension");
                string destFirefoxExt = Path.Combine(destDir, "extension-firefox");
                string destNative = Path.Combine(destDir, "native-host");

                Directory.CreateDirectory(destDir);
                Directory.CreateDirectory(destExt);
                Directory.CreateDirectory(destFirefoxExt);
                Directory.CreateDirectory(destNative);

                // 1. Copy files or extract embedded payload
                string srcExt = Path.Combine(appDir, "extension");
                string srcFirefoxExt = Path.Combine(appDir, "extension-firefox");

                if (Directory.Exists(srcExt))
                {
                    CopyDirectory(srcExt, destExt);
                    CopyDirectory(Directory.Exists(srcFirefoxExt) ? srcFirefoxExt : srcExt, destFirefoxExt);
                    Log("[1/4] کپی فایل‌های افزونه از پوشه محلی انجام شد.", Color.LightGreen);
                }
                else
                {
                    Log("[1/4] در حال استخراج خودکار پکیج کامل از منابع داخلی برنامه...", Color.White);
                    ExtractEmbeddedPayload(destDir);
                    Log("[1/4] پکیج کامل افزونه با موفقیت استخراج و مستقر شد.", Color.LightGreen);
                }

                // 2. Prepare idm_bridge.exe
                string destExe = Path.Combine(destNative, "idm_bridge.exe");
                string srcExe = Path.Combine(appDir, "native-host", "idm_bridge.exe");
                string srcCs = Path.Combine(appDir, "native-host", "IdmBridge.cs");

                bool compiled = false;
                if (File.Exists(srcCs))
                {
                    compiled = await Task.Run(() => CompileNativeBridge(srcCs, destExe));
                }

                if (!compiled && File.Exists(srcExe) && !File.Exists(destExe))
                {
                    File.Copy(srcExe, destExe, true);
                }

                if (!File.Exists(destExe))
                {
                    Log("خطا: فایل پل بومی idm_bridge.exe آماده نشد!", Color.Red);
                    return;
                }
                Log("[2/4] پل بومی C# آماده شد.", Color.LightGreen);

                // 3. Manifests
                string chromeJsonPath = Path.Combine(destNative, "com.idm.nativehost.chrome.json");
                string firefoxJsonPath = Path.Combine(destNative, "com.idm.nativehost.firefox.json");
                string escapedExePath = destExe.Replace("\\", "\\\\");

                string chromeJson = string.Format(
                    "{{\n  \"name\": \"com.idm.nativehost\",\n  \"description\": \"IDM Fast Downloader Bridge for Chromium Browsers\",\n  \"path\": \"{0}\",\n  \"type\": \"stdio\",\n  \"allowed_origins\": [\n    \"chrome-extension://opkdbjkgacccphgpjdhobgmcclmccnib/\"\n  ]\n}}",
                    escapedExePath
                );
                File.WriteAllText(chromeJsonPath, chromeJson, Encoding.UTF8);

                string firefoxJson = string.Format(
                    "{{\n  \"name\": \"com.idm.nativehost\",\n  \"description\": \"IDM Fast Downloader Bridge for Mozilla Firefox\",\n  \"path\": \"{0}\",\n  \"type\": \"stdio\",\n  \"allowed_extensions\": [\n    \"idm-fast-downloader@mahdi-hp.ir\"\n  ]\n}}",
                    escapedExePath
                );
                File.WriteAllText(firefoxJsonPath, firefoxJson, Encoding.UTF8);
                Log("[3/4] مانیفست‌های ارتباطی بومی تولید شدند.", Color.LightGreen);

                // Copy CRX if available
                string srcCrx = Path.Combine(appDir, "extension.crx");
                string destCrx = Path.Combine(destDir, "extension.crx");
                if (File.Exists(srcCrx))
                {
                    File.Copy(srcCrx, destCrx, true);
                }

                // 4. Register in Registry
                int count = 0;
                foreach (var b in browsers)
                {
                    bool shouldInstall = autoAll ? b.IsInstalled : (browserCheckboxes.ContainsKey(b.Key) && browserCheckboxes[b.Key].Checked);
                    if (shouldInstall)
                    {
                        // Native Messaging
                        string jsonFile = b.IsFirefox ? firefoxJsonPath : chromeJsonPath;
                        foreach (var regKey in b.RegistryTargets)
                        {
                            try
                            {
                                using (var key = Registry.CurrentUser.CreateSubKey(regKey))
                                {
                                    if (key != null) key.SetValue("", jsonFile);
                                }
                            }
                            catch { }
                        }

                        // Register Extension deployment in registry
                        RegisterBrowserExtensionDeployment(b, destDir, destCrx, destExt, destFirefoxExt);
                        count++;
                    }
                }

                RegisterUninstallEntry(destDir);
                Log(string.Format("[4/4] ثبت کامل ریجستری برای {0} مرورگر انجام شد.", count), Color.LightGreen);

                // Populate Success Panel
                PopulateSuccessPanel(destExt, destFirefoxExt, autoAll);

                heroPanel.Visible = false;
                advancedTogglePanel.Visible = false;
                advancedContainer.Visible = false;
                successPanel.Visible = true;
                this.Size = new Size(720, 560);
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, "خطا در نصب: " + ex.Message, "خطا", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                btnOneClick.Enabled = true;
                btnCustomInstall.Enabled = true;
                btnOneClick.Text = "⚡ نصب و فعال‌سازی فوری (فقط با ۱ کلیک)";
            }
        }

        private void RegisterBrowserExtensionDeployment(BrowserInfo b, string destDir, string destCrx, string destExt, string destFirefoxExt)
        {
            try
            {
                string extId = "opkdbjkgacccphgpjdhobgmcclmccnib";
                string version = "1.8.16";

                if (b.Key == "chrome")
                {
                    using (var key = Registry.CurrentUser.CreateSubKey(@"Software\Google\Chrome\Extensions\" + extId))
                    {
                        if (key != null && File.Exists(destCrx))
                        {
                            key.SetValue("path", destCrx);
                            key.SetValue("version", version);
                        }
                    }
                }
                else if (b.Key == "edge")
                {
                    using (var key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Edge\Extensions\" + extId))
                    {
                        if (key != null && File.Exists(destCrx))
                        {
                            key.SetValue("path", destCrx);
                            key.SetValue("version", version);
                        }
                    }
                }
                else if (b.Key == "brave")
                {
                    using (var key = Registry.CurrentUser.CreateSubKey(@"Software\BraveSoftware\Brave-Browser\Extensions\" + extId))
                    {
                        if (key != null && File.Exists(destCrx))
                        {
                            key.SetValue("path", destCrx);
                            key.SetValue("version", version);
                        }
                    }
                }
                else if (b.Key == "opera")
                {
                    using (var key = Registry.CurrentUser.CreateSubKey(@"Software\Opera Software\Opera Stable\Extensions\" + extId))
                    {
                        if (key != null && File.Exists(destCrx))
                        {
                            key.SetValue("path", destCrx);
                            key.SetValue("version", version);
                        }
                    }
                }
                else if (b.Key == "firefox")
                {
                    using (var key = Registry.CurrentUser.CreateSubKey(@"Software\Mozilla\Firefox\Extensions"))
                    {
                        if (key != null)
                        {
                            key.SetValue("idm-fast-downloader@mahdi-hp.ir", destFirefoxExt);
                        }
                    }
                }
            }
            catch { }
        }

        private void PopulateSuccessPanel(string chromeExtDir, string firefoxExtDir, bool autoAll)
        {
            flowSuccessLaunchers.Controls.Clear();

            foreach (var b in browsers)
            {
                bool eligible = autoAll ? b.IsInstalled : (browserCheckboxes.ContainsKey(b.Key) && browserCheckboxes[b.Key].Checked);
                if (eligible)
                {
                    var btn = new Button
                    {
                        Text = string.Format("🚀 باز کردن {0}", b.Name),
                        Width = 180,
                        Height = 44,
                        BackColor = Color.FromArgb(16, 185, 129),
                        ForeColor = Color.White,
                        FlatStyle = FlatStyle.Flat,
                        Font = FontManager.GetVazir(9F, FontStyle.Bold),
                        Margin = new Padding(6),
                        Cursor = Cursors.Hand
                    };
                    btn.FlatAppearance.BorderSize = 0;

                    btn.Click += (s, e) =>
                    {
                        string targetFolder = b.IsFirefox ? firefoxExtDir : chromeExtDir;
                        try
                        {
                            Clipboard.SetText(targetFolder);
                        }
                        catch { }

                        if (!string.IsNullOrEmpty(b.ExePath) && File.Exists(b.ExePath))
                        {
                            Process.Start(b.ExePath, b.ExtensionUrl);
                        }
                        else
                        {
                            Process.Start(b.ExtensionUrl);
                        }

                        string msg = b.IsFirefox
                            ? "آدرس افزونه در حافظه کپی شد!\nروی دکمه «Load Temporary Add-on...» بزنید و کلیدهای Ctrl + V را فشار دهید."
                            : "آدرس افزونه در حافظه کپی شد!\nDeveloper mode را روشن کرده، روی Load unpacked بزنید و کلیدهای Ctrl + V را بزنید.";

                        MessageBox.Show(this, msg, b.Name, MessageBoxButtons.OK, MessageBoxIcon.Information);
                    };

                    flowSuccessLaunchers.Controls.Add(btn);
                }
            }
        }

        private async Task ExecuteUninstallAsync()
        {
            var confirm = MessageBox.Show(
                this,
                "آیا مطمئن هستید که می‌خواهید تمام کلیدهای ریجستری و پل بومی IDM را حذف کنید؟",
                "تایید حذف کامل",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (confirm != DialogResult.Yes) return;

            btnOneClick.Enabled = false;
            btnCustomInstall.Enabled = false;
            btnUninstall.Enabled = false;

            try
            {
                Log("--- در حال حذف پل ارتباطی و پاک‌سازی ریجستری ---", Color.OrangeRed);

                await Task.Run(() =>
                {
                    foreach (var b in browsers)
                    {
                        foreach (var regKey in b.RegistryTargets)
                        {
                            try
                            {
                                Registry.CurrentUser.DeleteSubKeyTree(regKey, false);
                            }
                            catch { }
                        }
                    }

                    // Remove extensions registry entries
                    try { Registry.CurrentUser.DeleteSubKeyTree(@"Software\Google\Chrome\Extensions\opkdbjkgacccphgpjdhobgmcclmccnib", false); } catch { }
                    try { Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Edge\Extensions\opkdbjkgacccphgpjdhobgmcclmccnib", false); } catch { }
                    try { Registry.CurrentUser.DeleteSubKeyTree(@"Software\BraveSoftware\Brave-Browser\Extensions\opkdbjkgacccphgpjdhobgmcclmccnib", false); } catch { }
                    try { Registry.CurrentUser.DeleteSubKeyTree(@"Software\Opera Software\Opera Stable\Extensions\opkdbjkgacccphgpjdhobgmcclmccnib", false); } catch { }
                    try
                    {
                        using (var k = Registry.CurrentUser.OpenSubKey(@"Software\Mozilla\Firefox\Extensions", true))
                        {
                            if (k != null) k.DeleteValue("idm-fast-downloader@mahdi-hp.ir", false);
                        }
                    }
                    catch { }

                    try { Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\IDMFastDownloader", false); } catch { }
                });

                Log("✅ تمامی کلیدهای ریجستری پاک‌سازی شدند.", Color.LightGreen);
                MessageBox.Show(this, "ارتباط پل بومی و افزونه با موفقیت از ریجستری حذف گردید.", "حذف موفقیت‌آمیز", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                Log("خطا در حذف: " + ex.Message, Color.Red);
            }
            finally
            {
                btnOneClick.Enabled = true;
                btnCustomInstall.Enabled = true;
                btnUninstall.Enabled = true;
            }
        }

        private bool CompileNativeBridge(string csPath, string outExePath)
        {
            try
            {
                string[] cscPaths = new string[] {
                    @"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
                    @"C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
                };

                string csc = null;
                foreach (var p in cscPaths)
                {
                    if (File.Exists(p)) { csc = p; break; }
                }

                if (csc == null) return false;

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = csc,
                    Arguments = string.Format("/nologo /optimize+ /target:winexe /r:System.Windows.Forms.dll,System.Drawing.dll /out:\"{0}\" \"{1}\"", outExePath, csPath),
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using (var proc = Process.Start(psi))
                {
                    proc.WaitForExit(10000);
                    if (proc.ExitCode == 0 && File.Exists(outExePath))
                        return true;
                }
            }
            catch { }
            return false;
        }

        private void ExtractEmbeddedPayload(string destinationDir)
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                using (Stream s = asm.GetManifestResourceStream("PayloadZip"))
                {
                    if (s != null)
                    {
                        using (var archive = new ZipArchive(s, ZipArchiveMode.Read))
                        {
                            foreach (var entry in archive.Entries)
                            {
                                if (string.IsNullOrEmpty(entry.Name))
                                {
                                    Directory.CreateDirectory(Path.Combine(destinationDir, entry.FullName));
                                    continue;
                                }

                                string targetPath = Path.Combine(destinationDir, entry.FullName);
                                Directory.CreateDirectory(Path.GetDirectoryName(targetPath));
                                entry.ExtractToFile(targetPath, true);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log("خطا در استخراج پکیج داخلی: " + ex.Message, Color.Red);
            }
        }

        private void CopyDirectory(string sourceDir, string destinationDir)
        {
            var dir = new DirectoryInfo(sourceDir);
            if (!dir.Exists) return;

            Directory.CreateDirectory(destinationDir);

            foreach (FileInfo file in dir.GetFiles())
            {
                string targetFilePath = Path.Combine(destinationDir, file.Name);
                file.CopyTo(targetFilePath, true);
            }

            foreach (DirectoryInfo subDir in dir.GetDirectories())
            {
                string newDestinationDir = Path.Combine(destinationDir, subDir.Name);
                CopyDirectory(subDir.FullName, newDestinationDir);
            }
        }

        private void RegisterUninstallEntry(string destDir)
        {
            try
            {
                string uninstallKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\IDMFastDownloader";
                using (var key = Registry.CurrentUser.CreateSubKey(uninstallKey))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "IDM Fast Downloader - Bridge & Extension");
                        key.SetValue("DisplayVersion", "1.8.16");
                        key.SetValue("Publisher", "mahdi-hp.ir");
                        key.SetValue("URLInfoAbout", "https://mahdi-hp.ir/");
                        key.SetValue("InstallLocation", destDir);
                        key.SetValue("UninstallString", Path.Combine(destDir, "Setup.exe"));
                        string ico = Path.Combine(destDir, "extension", "icons", "app.ico");
                        if (File.Exists(ico)) key.SetValue("DisplayIcon", ico);
                    }
                }
            }
            catch { }
        }
    }
}
