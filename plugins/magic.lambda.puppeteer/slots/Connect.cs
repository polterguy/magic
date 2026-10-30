/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using PuppeteerSharp;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.connect] slot for launching a Chromium browser instance and returning a session id.
    /// </summary>
    [Slot(
        Name = "puppeteer.connect",
        Description = "Creates or reuses a Puppeteer browser session",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "puppeteer-session",
        ReturnsDescription = "Resolves to the created Puppeteer session ID",
        ProvidesScope = "puppeteer-session",
        ScopeDescription = "Creates an open Puppeteer browser session scope for puppeteer.* slots",
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerConnectSignature))]
    public class Connect : ISlotAsync
    {
        readonly IRootResolver _rootResolver;

        /*
         * Caller-supplied browser flags that would defeat the file isolation the
         * browser sessions rely on, silently dropped from [args].
         */
        static readonly HashSet<string> DeniedBrowserArgs = new(StringComparer.OrdinalIgnoreCase)
        {
            "--allow-file-access",
            "--allow-file-access-from-files",
            "--disable-web-security",
        };

        public Connect(IRootResolver rootResolver)
        {
            _rootResolver = rootResolver;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var launchOptions = BuildLaunchOptions(input);
            var timeoutMinutes = PuppeteerHelpers.GetOptionalInt(input, "timeout-minutes");
            var maxLifetimeMinutes = PuppeteerHelpers.GetOptionalInt(input, "max-lifetime-minutes");
            IBrowser browser = null;
            IPage page = null;

            try
            {
                browser = await Puppeteer.LaunchAsync(launchOptions);
                page = (await browser.PagesAsync()).FirstOrDefault(x => !x.IsClosed) ?? await browser.NewPageAsync();

                /*
                 * JavaScript in the page can also steer navigation ([puppeteer.evaluate]
                 * assigning window.location), which bypasses the scheme check in
                 * [puppeteer.goto] - so any navigation landing on file:// is bounced
                 * straight back to a blank page before its content becomes readable.
                 */
                page.FrameNavigated += (sender, e) =>
                {
                    if (e.Frame == page.MainFrame &&
                        e.Frame.Url.StartsWith("file://", StringComparison.OrdinalIgnoreCase))
                        _ = page.GoToAsync("about:blank");
                };

                var session = PuppeteerSessions.Create(browser, page, timeoutMinutes, maxLifetimeMinutes);

                input.Clear();
                input.Value = session.Id;
            }
            catch
            {
                if (page != null && !page.IsClosed)
                {
                    try { await page.CloseAsync(); } catch { /* Best effort, the original exception is rethrown below. */ }
                }
                if (browser != null && !browser.IsClosed)
                {
                    try { await browser.CloseAsync(); } catch { /* Best effort, the original exception is rethrown below. */ }
                }
                throw;
            }
        }

        LaunchOptions BuildLaunchOptions(Node input)
        {
            var headless = PuppeteerHelpers.GetOptionalBool(input, "headless") ?? true;
            var executablePath = GetExecutablePath(input);
            var timeout = PuppeteerHelpers.GetOptionalInt(input, "timeout");
            var userDataDir = GetUserDataDir(input);
            var argsNode = input.Children.FirstOrDefault(x => x.Name == "args");

            var options = new LaunchOptions
            {
                Headless = headless,
                ExecutablePath = executablePath,
            };

            if (timeout.HasValue && timeout.Value > 0)
                options.Timeout = timeout.Value;

            if (!string.IsNullOrWhiteSpace(userDataDir))
                options.UserDataDir = userDataDir;

            var args = PuppeteerHelpers.GetArgs(argsNode)
                .Where(x => !DeniedBrowserArgs.Contains(x))
                .ToArray();
            if (args.Length > 0)
                options.Args = args;

            return options;
        }

        string GetUserDataDir(Node input)
        {
            var userDataDir = PuppeteerHelpers.GetOptionalString(input, "user-data-dir");
            return string.IsNullOrWhiteSpace(userDataDir) ? null : _rootResolver.AbsolutePath(userDataDir);
        }

        static string GetExecutablePath(Node input)
        {
            var explicitPath = PuppeteerHelpers.GetOptionalString(input, "executable")
                ?? PuppeteerHelpers.GetOptionalString(input, "executable-path");
            if (IsUsableExecutable(explicitPath))
                return explicitPath;

            var envPath = Environment.GetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH");
            if (IsUsableExecutable(envPath))
                return envPath;

            var found = GetDefaultCandidates().FirstOrDefault(IsUsableExecutable);
            if (found != null)
                return found;

            throw new HyperlambdaException(
                "Could not find a Chromium/Chrome executable. " +
                "Provide [executable] or [executable-path], or set PUPPETEER_EXECUTABLE_PATH.");
        }

        static IEnumerable<string> GetDefaultCandidates()
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                yield return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
                yield return "/Applications/Chromium.app/Contents/MacOS/Chromium";
                yield break;
            }

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                yield return @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                yield return @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
                yield break;
            }

            // Linux and everything else.
            yield return "/usr/bin/google-chrome";
            yield return "/usr/bin/chromium";
            yield return "/usr/bin/chromium-browser";
        }

        static bool IsUsableExecutable(string path)
        {
            return !string.IsNullOrWhiteSpace(path) && File.Exists(path);
        }
    }
}
