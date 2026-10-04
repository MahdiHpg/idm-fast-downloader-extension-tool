using System;
using System.IO;
using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using Microsoft.Win32;

namespace IdmNativeBridge
{
    class Program
    {
        static void Main(string[] args)
        {
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

            public static void StartDownloadJob(List<BatchItem> items)
            {
                Thread t = new Thread(() =>
                {
                    try
                    {
                        ServicePointManager.DefaultConnectionLimit = 32;
                        try
                        {
                            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | SecurityProtocolType.Tls;
                        }
                        catch { }

                        string saveDir = GetDefaultDownloadPath();

                        foreach (var item in items)
                        {
                            if (string.IsNullOrEmpty(item.Url)) continue;

                            try
                            {
                                string safeFn = SanitizeFilename(item.Filename);
                                if (string.IsNullOrEmpty(safeFn))
                                {
                                    safeFn = "stream_video_" + DateTime.Now.Ticks + ".ts";
                                }
                                if (!safeFn.EndsWith(".ts", StringComparison.OrdinalIgnoreCase) && !safeFn.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase))
                                {
                                    safeFn += ".ts";
                                }

                                string outputPath = Path.Combine(saveDir, safeFn);

                                string playlistText = "";
                                using (var client = new WebClient())
                                {
                                    client.Headers[HttpRequestHeader.UserAgent] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
                                    playlistText = client.DownloadString(item.Url);
                                }

                                var lines = playlistText.Split('\n');
                                var segUrls = new List<string>();
                                Uri baseUri = new Uri(item.Url);
                                foreach (var l in lines)
                                {
                                    string line = l.Trim();
                                    if (string.IsNullOrEmpty(line) || line.StartsWith("#")) continue;
                                    segUrls.Add(new Uri(baseUri, line).AbsoluteUri);
                                }

                                if (segUrls.Count == 0) continue;

                                using (FileStream fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.Read))
                                {
                                    for (int i = 0; i < segUrls.Count; i++)
                                    {
                                        int retries = 3;
                                        byte[] data = null;
                                        while (retries > 0 && data == null)
                                        {
                                            try
                                            {
                                                using (var client = new WebClient())
                                                {
                                                    client.Headers[HttpRequestHeader.UserAgent] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
                                                    data = client.DownloadData(segUrls[i]);
                                                }
                                            }
                                            catch
                                            {
                                                retries--;
                                                Thread.Sleep(300);
                                            }
                                        }

                                        if (data != null)
                                        {
                                            fs.Write(data, 0, data.Length);
                                        }
                                    }
                                }
                            }
                            catch { }
                        }
                    }
                    catch { }
                });
                t.IsBackground = true;
                t.Start();
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

            // Direct HLS Stream Download Support
            if (string.Equals(action, "batchHlsDownload", StringComparison.OrdinalIgnoreCase))
            {
                var hlsItems = ExtractBatchItems(json);
                if (hlsItems.Count == 0)
                {
                    return "{\"status\":\"error\",\"message\":\"No URLs provided in batch list\"}";
                }

                HlsDownloader.StartDownloadJob(hlsItems);
                return "{\"status\":\"ok\",\"action\":\"batchHlsDownload\",\"count\":" + hlsItems.Count + "}";
            }

            if (string.Equals(action, "downloadHls", StringComparison.OrdinalIgnoreCase))
            {
                string hlsUrl = ExtractJsonValue(json, "url");
                string hlsFn = ExtractJsonValue(json, "filename");
                if (string.IsNullOrEmpty(hlsUrl))
                {
                    return "{\"status\":\"error\",\"message\":\"No URL provided\"}";
                }

                var list = new List<BatchItem> { new BatchItem { Url = hlsUrl, Filename = hlsFn } };
                HlsDownloader.StartDownloadJob(list);
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
                        if (!string.IsNullOrEmpty(safeFn))
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
                if (!string.IsNullOrEmpty(safeFn))
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
