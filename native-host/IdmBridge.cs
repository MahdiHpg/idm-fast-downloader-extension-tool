using System;
using System.IO;
using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
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

            // Batch Download Support
            if (string.Equals(action, "batchDownload", StringComparison.OrdinalIgnoreCase))
            {
                var urls = ExtractJsonArray(json, "urls");
                if (urls.Count == 0)
                {
                    return "{\"status\":\"error\",\"message\":\"No URLs provided in batch list\"}";
                }

                bool toQueue = ExtractJsonBool(json, "toQueue", true);

                try
                {
                    foreach (var u in urls)
                    {
                        if (string.IsNullOrEmpty(u)) continue;

                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = idmPath;
                        psi.Arguments = toQueue ? ("/d \"" + u + "\" /a") : ("/d \"" + u + "\"");
                        psi.UseShellExecute = true;
                        Process.Start(psi);
                        System.Threading.Thread.Sleep(70);
                    }

                    if (toQueue)
                    {
                        // Bring IDM forward to view the queued batch
                        ProcessStartInfo showPsi = new ProcessStartInfo();
                        showPsi.FileName = idmPath;
                        showPsi.UseShellExecute = true;
                        Process.Start(showPsi);
                    }

                    return "{\"status\":\"ok\",\"action\":\"batchDownload\",\"count\":" + urls.Count + "}";
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

            try
            {
                // Launch IDMan.exe /d <url>
                // Without /n switch, IDM automatically opens its download file dialog modal
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = idmPath;
                psi.Arguments = "/d \"" + url + "\"";
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
