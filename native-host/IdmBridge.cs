using System;
using System.IO;
using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using System.Drawing;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Media;
using Microsoft.Win32;

namespace IdmNativeBridge
{
    class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            if (args != null && args.Length >= 2 && string.Equals(args[0], "--hls-worker", StringComparison.OrdinalIgnoreCase))
            {
                string jobPath = args[1];
                HlsWorker.Run(jobPath);
                return;
            }

            try
            {
                using (Stream stdin = Console.OpenStandardInput())
                using (Stream stdout = Console.OpenStandardOutput())
                {
                    while (true)
                    {
                        byte[] lenBytes = new byte[4];
                        int bytesRead = 0;
                        while (bytesRead < 4)
                        {
                            int r = stdin.Read(lenBytes, bytesRead, 4 - bytesRead);
                            if (r <= 0) return;
                            bytesRead += r;
                        }

                        int length = BitConverter.ToInt32(lenBytes, 0);
                        if (length <= 0 || length > 10 * 1024 * 1024) return;

                        byte[] buffer = new byte[length];
                        int totalRead = 0;
                        while (totalRead < length)
                        {
                            int r = stdin.Read(buffer, totalRead, length - totalRead);
                            if (r <= 0) return;
                            totalRead += r;
                        }

                        string json = Encoding.UTF8.GetString(buffer, 0, totalRead);
                        string response = HandleMessage(json);

                        byte[] respBytes = Encoding.UTF8.GetBytes(response);
                        byte[] respLen = BitConverter.GetBytes(respBytes.Length);
                        stdout.Write(respLen, 0, 4);
                        stdout.Write(respBytes, 0, respBytes.Length);
                        stdout.Flush();
                    }
                }
            }
            catch
            {
                // Graceful exit
            }
        }

        static string GetIdmPath()
        {
            try
            {
                // 1. Check HKCU
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\DownloadManager"))
                {
                    if (key != null)
                    {
                        object val = key.GetValue("ExePath");
                        if (val != null && File.Exists(val.ToString()))
                            return val.ToString();
                    }
                }

                // 2. Check HKLM
                string[] regPaths = new string[] {
                    @"SOFTWARE\Internet Download Manager",
                    @"SOFTWARE\WOW6432Node\Internet Download Manager"
                };

                foreach (var rPath in regPaths)
                {
                    using (RegistryKey key = Registry.LocalMachine.OpenSubKey(rPath))
                    {
                        if (key != null)
                        {
                            object val = key.GetValue("ExePath");
                            if (val != null && File.Exists(val.ToString()))
                                return val.ToString();
                        }
                    }
                }
            }
            catch { }

            // 3. Check Default File System Paths
            string[] defaultPaths = new string[] {
                @"C:\Program Files (x86)\Internet Download Manager\IDMan.exe",
                @"C:\Program Files\Internet Download Manager\IDMan.exe"
            };

            foreach (var p in defaultPaths)
            {
                if (File.Exists(p)) return p;
            }

            return null;
        }

        static string ExtractJsonValue(string json, string key)
        {
            try
            {
                var match = Regex.Match(json, "\"" + Regex.Escape(key) + "\"\\s*:\\s*\"([^\"]*)\"");
                if (match.Success)
                {
                    return Regex.Unescape(match.Groups[1].Value);
                }
            }
            catch { }
            return null;
        }

        static bool ExtractJsonBool(string json, string key, bool defaultValue)
        {
            try
            {
                var match = Regex.Match(json, "\"" + Regex.Escape(key) + "\"\\s*:\\s*(true|false)", RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    return bool.Parse(match.Groups[1].Value);
                }
            }
            catch { }
            return defaultValue;
        }

        static List<string> ExtractJsonArray(string json, string key)
        {
            var list = new List<string>();
            try
            {
                var match = Regex.Match(json, "\"" + Regex.Escape(key) + "\"\\s*:\\s*\\[([^\\]]*)\\]");
                if (match.Success)
                {
                    var content = match.Groups[1].Value;
                    var itemMatches = Regex.Matches(content, "\"([^\"]*)\"");
                    foreach (Match m in itemMatches)
                    {
                        string val = Regex.Unescape(m.Groups[1].Value);
                        if (!string.IsNullOrEmpty(val))
                        {
                            list.Add(val);
                        }
                    }
                }
            }
            catch { }
            return list;
        }

        class BatchItem
        {
            public string Url { get; set; }
            public string Filename { get; set; }
        }

        static List<BatchItem> ExtractBatchItems(string json)
        {
            var list = new List<BatchItem>();
            try
            {
                // 1. Try to extract structured "items": [ { "url": "...", "filename": "..." } ]
                var itemsMatch = Regex.Match(json, "\"items\"\\s*:\\s*\\[([^\\]]*)\\]", RegexOptions.Singleline);
                if (itemsMatch.Success)
                {
                    var content = itemsMatch.Groups[1].Value;
                    var objMatches = Regex.Matches(content, "\\{([^\\}]*)\\}");
                    foreach (Match om in objMatches)
                    {
                        string objStr = om.Groups[1].Value;
                        string u = ExtractJsonValue(objStr, "url");
                        string f = ExtractJsonValue(objStr, "filename");
                        if (!string.IsNullOrEmpty(u))
                        {
                            list.Add(new BatchItem { Url = u, Filename = f });
                        }
                    }
                }

                // 2. Fallback to simple "urls": [ "..." ]
                if (list.Count == 0)
                {
                    var simpleUrls = ExtractJsonArray(json, "urls");
                    foreach (var u in simpleUrls)
                    {
                        if (!string.IsNullOrEmpty(u))
                        {
                            list.Add(new BatchItem { Url = u, Filename = null });
                        }
                    }
                }
            }
            catch { }
            return list;
        }

        static string SanitizeFilename(string name)
        {
            if (string.IsNullOrEmpty(name)) return null;
            // Remove invalid file path characters and quotes
            char[] invalidChars = Path.GetInvalidFileNameChars();
            StringBuilder sb = new StringBuilder();
            foreach (char c in name)
            {
                if (Array.IndexOf(invalidChars, c) < 0 && c != '"' && c != '\'' && c != ';' && c != '&' && c != '|')
                {
                    sb.Append(c);
                }
            }
            string cleaned = sb.ToString().Trim();
            return string.IsNullOrEmpty(cleaned) ? null : cleaned;
        }

        static bool HasValidExtension(string name)
        {
            if (string.IsNullOrEmpty(name)) return false;
            try
            {
                string ext = Path.GetExtension(name);
                if (string.IsNullOrEmpty(ext) || ext.Length < 2 || ext.Length > 6) return false;
                for (int i = 1; i < ext.Length; i++)
                {
                    if (!char.IsLetterOrDigit(ext[i])) return false;
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        class HlsDownloader
        {
            public static string GetDefaultDownloadPath()
            {
                try
                {
                    string userDownloads = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
                    if (Directory.Exists(userDownloads)) return userDownloads;
                }
                catch { }
                return Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            }

            public static void StartDownloadJob(List<BatchItem> items, string saveDir = null)
            {
                try
                {
                    string targetDir = saveDir;
                    if (string.IsNullOrEmpty(targetDir) || !Directory.Exists(targetDir))
                    {
                        targetDir = GetDefaultDownloadPath();
                    }

                    string tempFile = Path.Combine(Path.GetTempPath(), "hls_job_" + Guid.NewGuid().ToString("N") + ".json");
                    StringBuilder sb = new StringBuilder();
                    sb.Append("{\"saveDir\":\"").Append(targetDir.Replace("\\", "\\\\").Replace("\"", "\\\"")).Append("\",");
                    sb.Append("\"items\":[");
                    for (int i = 0; i < items.Count; i++)
                    {
                        if (i > 0) sb.Append(",");
                        string u = items[i].Url ?? "";
                        string f = items[i].Filename ?? "";
                        sb.Append("{\"url\":\"").Append(u.Replace("\\", "\\\\").Replace("\"", "\\\"")).Append("\",");
                        sb.Append("\"filename\":\"").Append(f.Replace("\\", "\\\\").Replace("\"", "\\\"")).Append("\"}");
                    }
                    sb.Append("]}");
                    File.WriteAllText(tempFile, sb.ToString(), Encoding.UTF8);

                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = Process.GetCurrentProcess().MainModule.FileName;
                    psi.Arguments = "--hls-worker \"" + tempFile + "\"";
                    psi.UseShellExecute = true;
                    Process.Start(psi);
                }
                catch { }
            }
        }

        class HlsWorker
        {
            public static void Run(string jobPath)
            {
                try
                {
                    if (!File.Exists(jobPath)) return;
                    string json = File.ReadAllText(jobPath, Encoding.UTF8);
                    var items = Program.ExtractBatchItems(json);
                    if (items == null || items.Count == 0) return;

                    string saveDir = Program.ExtractJsonValue(json, "saveDir");
                    if (string.IsNullOrEmpty(saveDir) || !Directory.Exists(saveDir))
                    {
                        saveDir = HlsDownloader.GetDefaultDownloadPath();
                    }

                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    Application.Run(new HlsProgressForm(items, jobPath, saveDir));
                }
                catch { }
            }
        }

        class HlsProgressForm : Form
        {
            private List<BatchItem> items;
            private string jobFile;
            private string saveDir;
            private Label lblTitle;
            private Label lblStatus;
            private Label lblSpeed;
            private Label lblFolder;
            private ProgressBar progressBar;
            private Button btnCancel;
            private CancellationTokenSource cts;

            public HlsProgressForm(List<BatchItem> items, string jobFile, string customSaveDir = null)
            {
                this.items = items;
                this.jobFile = jobFile;
                this.cts = new CancellationTokenSource();
                try
                {
                    if (!string.IsNullOrEmpty(customSaveDir) && Directory.Exists(customSaveDir))
                    {
                        this.saveDir = customSaveDir;
                    }
                    else
                    {
                        this.saveDir = HlsDownloader.GetDefaultDownloadPath();
                    }
                }
                catch
                {
                    this.saveDir = HlsDownloader.GetDefaultDownloadPath();
                }

                InitializeUi();
            }

            private void InitializeUi()
            {
                this.Text = "دریافت استریم ویدیویی - IDM Fast Downloader";
                this.Size = new Size(540, 245);
                this.StartPosition = FormStartPosition.CenterScreen;
                this.FormBorderStyle = FormBorderStyle.FixedDialog;
                this.MaximizeBox = false;
                this.MinimizeBox = true;
                this.TopMost = true;
                this.BackColor = Color.FromArgb(15, 23, 42); // slate-900
                this.ForeColor = Color.White;
                this.RightToLeft = RightToLeft.Yes;
                this.RightToLeftLayout = true;
                this.Font = new Font("Tahoma", 9f, FontStyle.Regular);

                lblTitle = new Label
                {
                    Text = "در حال اتصال و آماده‌سازی قطعات استریم...",
                    Location = new Point(20, 14),
                    Size = new Size(485, 24),
                    Font = new Font("Tahoma", 9.5f, FontStyle.Bold),
                    ForeColor = Color.FromArgb(56, 189, 248), // sky-400
                    AutoEllipsis = true
                };
                this.Controls.Add(lblTitle);

                lblStatus = new Label
                {
                    Text = "در حال تحلیل پلی‌لیست M3U8...",
                    Location = new Point(20, 42),
                    Size = new Size(485, 20),
                    Font = new Font("Tahoma", 8.5f, FontStyle.Regular),
                    ForeColor = Color.FromArgb(203, 213, 225) // slate-300
                };
                this.Controls.Add(lblStatus);

                progressBar = new ProgressBar
                {
                    Location = new Point(20, 68),
                    Size = new Size(485, 24),
                    Minimum = 0,
                    Maximum = 100,
                    Value = 0
                };
                this.Controls.Add(progressBar);

                lblSpeed = new Label
                {
                    Text = "⚡ خط لوله ۶ اتصال همزمان چندنخی فعال است",
                    Location = new Point(20, 100),
                    Size = new Size(360, 20),
                    Font = new Font("Tahoma", 8.5f, FontStyle.Regular),
                    ForeColor = Color.FromArgb(52, 211, 153) // emerald-400
                };
                this.Controls.Add(lblSpeed);

                lblFolder = new Label
                {
                    Text = "📁 پوشه ذخیره: " + saveDir,
                    Location = new Point(20, 126),
                    Size = new Size(485, 20),
                    Font = new Font("Tahoma", 8.25f, FontStyle.Regular),
                    ForeColor = Color.FromArgb(148, 163, 184), // slate-400
                    AutoEllipsis = true
                };
                this.Controls.Add(lblFolder);

                btnCancel = new Button
                {
                    Text = "انصراف",
                    Location = new Point(415, 158),
                    Size = new Size(90, 34),
                    BackColor = Color.FromArgb(30, 41, 59),
                    ForeColor = Color.FromArgb(248, 113, 113),
                    FlatStyle = FlatStyle.Flat,
                    Cursor = Cursors.Hand
                };
                btnCancel.FlatAppearance.BorderColor = Color.FromArgb(71, 85, 105);
                btnCancel.Click += (s, e) =>
                {
                    cts.Cancel();
                    this.Close();
                };
                this.Controls.Add(btnCancel);

                this.FormClosing += (s, e) =>
                {
                    cts.Cancel();
                };

                this.Shown += (s, e) =>
                {
                    Task.Factory.StartNew(ProcessDownloads, TaskCreationOptions.LongRunning);
                };
            }

            private void ProcessDownloads()
            {
                ServicePointManager.DefaultConnectionLimit = 64;
                try
                {
                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | SecurityProtocolType.Tls;
                }
                catch { }

                string saveDir = HlsDownloader.GetDefaultDownloadPath();
                if (!string.IsNullOrEmpty(this.saveDir))
                {
                    try
                    {
                        if (!Directory.Exists(this.saveDir))
                        {
                            Directory.CreateDirectory(this.saveDir);
                        }
                        if (Directory.Exists(this.saveDir))
                        {
                            saveDir = this.saveDir;
                        }
                    }
                    catch { }
                }
                string lastFinished = null;

                for (int fileIndex = 0; fileIndex < items.Count; fileIndex++)
                {
                    if (cts.IsCancellationRequested) break;

                    var item = items[fileIndex];
                    if (string.IsNullOrEmpty(item.Url)) continue;

                    string safeFn = Program.SanitizeFilename(item.Filename);
                    if (string.IsNullOrEmpty(safeFn)) safeFn = "stream_video_" + DateTime.Now.Ticks + ".ts";
                    if (!safeFn.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) && !safeFn.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase))
                    {
                        safeFn += ".ts";
                    }

                    string outputPath = Path.Combine(saveDir, safeFn);

                    this.Invoke((MethodInvoker)(() =>
                    {
                        lblTitle.Text = string.Format("({0}/{1}) {2}", fileIndex + 1, items.Count, safeFn);
                        lblStatus.Text = "در حال دریافت و تحلیل پلی‌لیست M3U8...";
                        progressBar.Value = 0;
                    }));

                    try
                    {
                        string playlistText = "";
                        Uri finalUri = null;

                        HttpWebRequest req = (HttpWebRequest)WebRequest.Create(item.Url);
                        req.AllowAutoRedirect = true;
                        req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
                        using (var resp = (HttpWebResponse)req.GetResponse())
                        {
                            finalUri = resp.ResponseUri;
                            using (var reader = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                            {
                                playlistText = reader.ReadToEnd();
                            }
                        }

                        var lines = playlistText.Split('\n');
                        var segUrls = new List<string>();
                        foreach (var l in lines)
                        {
                            string line = l.Trim();
                            if (string.IsNullOrEmpty(line) || line.StartsWith("#")) continue;
                            segUrls.Add(new Uri(finalUri, line).AbsoluteUri);
                        }

                        if (segUrls.Count == 0) continue;

                        int totalSegs = segUrls.Count;
                        int downloadedSegs = 0;
                        int batchSize = 6;

                        using (FileStream fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.Read))
                        {
                            for (int i = 0; i < totalSegs; i += batchSize)
                            {
                                if (cts.IsCancellationRequested) break;

                                int curBatch = Math.Min(batchSize, totalSegs - i);
                                byte[][] buffers = new byte[curBatch][];

                                Parallel.For(0, curBatch, new ParallelOptions { MaxDegreeOfParallelism = batchSize }, b =>
                                {
                                    if (cts.IsCancellationRequested) return;
                                    int segIndex = i + b;
                                    int retries = 3;
                                    while (retries > 0 && buffers[b] == null && !cts.IsCancellationRequested)
                                    {
                                        try
                                        {
                                            using (var client = new WebClient())
                                            {
                                                client.Headers[HttpRequestHeader.UserAgent] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
                                                if (finalUri != null)
                                                {
                                                    client.Headers[HttpRequestHeader.Referer] = finalUri.AbsoluteUri;
                                                }
                                                buffers[b] = client.DownloadData(segUrls[segIndex]);
                                            }
                                        }
                                        catch
                                        {
                                            retries--;
                                            Thread.Sleep(250);
                                        }
                                    }
                                });

                                if (cts.IsCancellationRequested) break;

                                for (int b = 0; b < curBatch; b++)
                                {
                                    if (buffers[b] != null)
                                    {
                                        fs.Write(buffers[b], 0, buffers[b].Length);
                                        downloadedSegs++;
                                    }
                                }

                                int pct = (int)((downloadedSegs * 100.0) / totalSegs);
                                this.Invoke((MethodInvoker)(() =>
                                {
                                    progressBar.Value = Math.Min(100, pct);
                                    lblStatus.Text = string.Format("دریافت قطعه {0} از {1} ({2}٪) • فایل {3} از {4}",
                                        downloadedSegs, totalSegs, pct, fileIndex + 1, items.Count);
                                }));
                            }
                        }

                        if (!cts.IsCancellationRequested && downloadedSegs > 0)
                        {
                            lastFinished = outputPath;
                        }
                        else if (!cts.IsCancellationRequested && downloadedSegs == 0)
                        {
                            this.Invoke((MethodInvoker)(() =>
                            {
                                lblStatus.Text = "⚠️ خطا: سرور استریم قطعات این قسمت را ارائه نداد.";
                            }));
                            Thread.Sleep(2000);
                        }
                    }
                    catch (Exception ex)
                    {
                        this.Invoke((MethodInvoker)(() =>
                        {
                            lblStatus.Text = "خطا در دریافت این قسمت: " + ex.Message;
                        }));
                        Thread.Sleep(1000);
                    }
                }

                if (!cts.IsCancellationRequested)
                {
                    this.Invoke((MethodInvoker)(() =>
                    {
                        progressBar.Value = 100;
                        lblTitle.Text = "✅ تمام دانلودها با موفقیت پایان یافت!";
                        lblStatus.Text = "ویدیوها در پوشه انتخابی با موفقیت ذخیره شدند.";
                        btnCancel.Text = "بستن";
                        btnCancel.ForeColor = Color.FromArgb(52, 211, 153);
                    }));

                    try
                    {
                        SystemSounds.Asterisk.Play();
                    }
                    catch { }

                    if (!string.IsNullOrEmpty(lastFinished) && File.Exists(lastFinished))
                    {
                        try
                        {
                            ProcessStartInfo psi = new ProcessStartInfo();
                            psi.FileName = "explorer.exe";
                            psi.Arguments = "/select,\"" + lastFinished + "\"";
                            psi.UseShellExecute = true;
                            Process.Start(psi);
                        }
                        catch { }
                    }

                    Thread.Sleep(2000);
                    this.Invoke((MethodInvoker)(() => this.Close()));
                }

                if (!string.IsNullOrEmpty(jobFile) && File.Exists(jobFile))
                {
                    try { File.Delete(jobFile); } catch { }
                }
            }
        }

        static string HandleMessage(string json)
        {
            string idmPath = GetIdmPath();
            if (string.IsNullOrEmpty(idmPath) || !File.Exists(idmPath))
            {
                return "{\"status\":\"error\",\"message\":\"Internet Download Manager (IDMan.exe) not found\"}";
            }

            string action = ExtractJsonValue(json, "action");
            if (string.Equals(action, "ping", StringComparison.OrdinalIgnoreCase))
            {
                return "{\"status\":\"ok\",\"action\":\"pong\",\"idmPath\":\"" + idmPath.Replace("\\", "\\\\") + "\"}";
            }

            // Folder Browser Picker Dialog (STA Thread)
            if (string.Equals(action, "pickFolder", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(action, "selectFolder", StringComparison.OrdinalIgnoreCase))
            {
                string selectedPath = null;
                Thread t = new Thread(() =>
                {
                    using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                    {
                        fbd.Description = "پوشه مورد نظر برای ذخیره استریم‌ها و ویدیوها را انتخاب کنید:";
                        fbd.ShowNewFolderButton = true;
                        string initial = ExtractJsonValue(json, "initialPath");
                        if (!string.IsNullOrEmpty(initial) && Directory.Exists(initial))
                        {
                            fbd.SelectedPath = initial;
                        }
                        else
                        {
                            fbd.SelectedPath = HlsDownloader.GetDefaultDownloadPath();
                        }

                        Form dummy = new Form
                        {
                            TopMost = true,
                            Size = new Size(1, 1),
                            StartPosition = FormStartPosition.CenterScreen,
                            ShowInTaskbar = false,
                            Opacity = 0
                        };
                        dummy.Show();
                        dummy.BringToFront();
                        if (fbd.ShowDialog(dummy) == DialogResult.OK)
                        {
                            selectedPath = fbd.SelectedPath;
                        }
                        dummy.Dispose();
                    }
                });
                t.SetApartmentState(ApartmentState.STA);
                t.Start();
                t.Join();

                if (!string.IsNullOrEmpty(selectedPath))
                {
                    return "{\"status\":\"ok\",\"path\":\"" + selectedPath.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}";
                }
                else
                {
                    return "{\"status\":\"cancel\"}";
                }
            }

            // Direct HLS Stream Download Support
            if (string.Equals(action, "batchHlsDownload", StringComparison.OrdinalIgnoreCase))
            {
                var hlsItems = ExtractBatchItems(json);
                if (hlsItems.Count == 0)
                {
                    return "{\"status\":\"error\",\"message\":\"No URLs provided in batch list\"}";
                }

                string saveDir = ExtractJsonValue(json, "saveDir");
                if (string.IsNullOrEmpty(saveDir)) saveDir = ExtractJsonValue(json, "downloadPath");

                HlsDownloader.StartDownloadJob(hlsItems, saveDir);
                return "{\"status\":\"ok\",\"action\":\"batchHlsDownload\",\"count\":" + hlsItems.Count + "}";
            }

            if (string.Equals(action, "downloadHls", StringComparison.OrdinalIgnoreCase))
            {
                string hlsUrl = ExtractJsonValue(json, "url");
                string hlsFn = ExtractJsonValue(json, "filename");
                string saveDir = ExtractJsonValue(json, "saveDir");
                if (string.IsNullOrEmpty(saveDir)) saveDir = ExtractJsonValue(json, "downloadPath");

                if (string.IsNullOrEmpty(hlsUrl))
                {
                    return "{\"status\":\"error\",\"message\":\"No URL provided\"}";
                }

                var list = new List<BatchItem> { new BatchItem { Url = hlsUrl, Filename = hlsFn } };
                HlsDownloader.StartDownloadJob(list, saveDir);
                return "{\"status\":\"ok\",\"action\":\"downloadHls\",\"url\":\"" + hlsUrl.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}";
            }

            // Batch Download Support
            if (string.Equals(action, "batchDownload", StringComparison.OrdinalIgnoreCase))
            {
                var items = ExtractBatchItems(json);
                if (items.Count == 0)
                {
                    return "{\"status\":\"error\",\"message\":\"No URLs provided in batch list\"}";
                }

                bool toQueue = ExtractJsonBool(json, "toQueue", true);
                bool startScheduler = ExtractJsonBool(json, "startScheduler", false);

                try
                {
                    foreach (var item in items)
                    {
                        if (string.IsNullOrEmpty(item.Url)) continue;

                        StringBuilder args = new StringBuilder();
                        args.Append("/d \"").Append(item.Url).Append("\"");

                        string safeFn = SanitizeFilename(item.Filename);
                        if (!string.IsNullOrEmpty(safeFn) && HasValidExtension(safeFn))
                        {
                            args.Append(" /f \"").Append(safeFn).Append("\"");
                        }

                        if (toQueue)
                        {
                            args.Append(" /a");
                        }

                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = idmPath;
                        psi.Arguments = args.ToString();
                        psi.UseShellExecute = true;
                        Process.Start(psi);
                        System.Threading.Thread.Sleep(70);
                    }

                    if (startScheduler)
                    {
                        // Start queue in IDM scheduler
                        ProcessStartInfo schedPsi = new ProcessStartInfo();
                        schedPsi.FileName = idmPath;
                        schedPsi.Arguments = "/s";
                        schedPsi.UseShellExecute = true;
                        Process.Start(schedPsi);
                    }
                    else if (toQueue)
                    {
                        // Bring IDM forward to view the queued batch
                        ProcessStartInfo showPsi = new ProcessStartInfo();
                        showPsi.FileName = idmPath;
                        showPsi.UseShellExecute = true;
                        Process.Start(showPsi);
                    }

                    return "{\"status\":\"ok\",\"action\":\"batchDownload\",\"count\":" + items.Count + "}";
                }
                catch (Exception ex)
                {
                    return "{\"status\":\"error\",\"message\":\"" + ex.Message.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}";
                }
            }

            // Single Download
            string url = ExtractJsonValue(json, "url");
            if (string.IsNullOrEmpty(url))
            {
                return "{\"status\":\"error\",\"message\":\"No URL provided\"}";
            }

            string filename = ExtractJsonValue(json, "filename");
            bool singleToQueue = ExtractJsonBool(json, "toQueue", false);
            bool silent = ExtractJsonBool(json, "silent", false);

            try
            {
                StringBuilder args = new StringBuilder();
                args.Append("/d \"").Append(url).Append("\"");

                string safeFn = SanitizeFilename(filename);
                if (!string.IsNullOrEmpty(safeFn) && HasValidExtension(safeFn))
                {
                    args.Append(" /f \"").Append(safeFn).Append("\"");
                }

                if (singleToQueue)
                {
                    args.Append(" /a");
                }

                if (silent)
                {
                    args.Append(" /n");
                }

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = idmPath;
                psi.Arguments = args.ToString();
                psi.UseShellExecute = true;
                Process.Start(psi);

                return "{\"status\":\"ok\",\"action\":\"download\",\"url\":\"" + url.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}";
            }
            catch (Exception ex)
            {
                return "{\"status\":\"error\",\"message\":\"" + ex.Message.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"}";
            }
        }
    }
}
