/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading;
using System.Diagnostics;
using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.system.terminal
{
    /*
     * Internal helper class to encapsulate a process, with its relevant fields.
     */
    internal class ProcessWrapper
    {
        public Process Process { get; set; }

        public IServiceScope Scope { get; set; }

        public DateTime LastUsed { get; set; }
    }

    /// <summary>
    /// [system.terminal.create] slot that allows you to create a terminal on your server.
    /// </summary>
    [Slot(Name = "system.terminal.create")]
    public class TerminalCreate : ISlot
    {
        internal static readonly ConcurrentDictionary<string, ProcessWrapper> _processes = new ConcurrentDictionary<string, ProcessWrapper>();
        readonly static object _locker = new object();
        readonly IServiceProvider _services;
        readonly IRootResolver _rootResolver;
        static Timer _timer;

        /// <summary>
        /// Constructor needed to retrieve service provider to create ISignaler during callbacks.
        /// </summary>
        /// <param name="services">Needed to resolver services.</param>
        /// <param name="rootResolver">Needed to resolver root folder on server.</param>
        public TerminalCreate(IServiceProvider services, IRootResolver rootResolver)
        {
            _services = services;
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Creating and decorating our start info.
            var si = GetStartInfo(input);

            // Starting process.
            var process = Process.Start(si.StartInfo);

            // Explicitly stating we're interested in events for process, to capture STDOUT and STDERR.
            process.EnableRaisingEvents = true;

            // Creating scope making sure it's disposed if an exception occurs further down.
            var scope = _services.CreateScope();
            try
            {
                // Capturing STDOUT
                if (si.StdOut != null)
                    process.OutputDataReceived += (sender, args) => ExecuteCallback(scope, si.StdOut, args.Data);

                // Capturing STDERROR
                if (si.StdErr != null)
                    process.ErrorDataReceived += (sender, args) => ExecuteCallback(scope, si.StdErr, args.Data);

                // Capturing exit.
                process.Exited += (sender, args) =>
                {
                    ExecuteCallback(scope, si.StdOut, null, true);
                    _processes.TryRemove(si.Name, out var disposable);

                    // House cleaning.
                    disposable.Process.Dispose();
                    disposable.Scope.Dispose();
                };

                // Adding process to dictionary such that we can later reference it.
                if (!_processes.TryAdd(si.Name, new ProcessWrapper
                {
                    Process = process,
                    Scope = scope,
                    LastUsed = DateTime.UtcNow
                }))
                    throw new HyperlambdaException($"Process with name of '{si.Name}' already exists");

                // Making sure we subscribe to both read std output line and read std error line.
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();
            }
            catch
            {
                process.Kill(); // Notice, I am not 100% certain if we should use Close or Kill here ...
                process.Dispose();
                scope.Dispose();
                throw;
            }

            // Ensuring we create our "close all unreferenced terminal" timer.
            EnsureTimer();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Common callback for invoking callback given during initialisation
         * when output of some sort is available.
         */
        void ExecuteCallback(
            IServiceScope scope,
            Node lambda,
            string cmd,
            bool sendNull = false)
        {
            // Checking if we should send message at all, which we only do if message is not null, or caller explicitly wants null messages.
            if (sendNull || !string.IsNullOrEmpty(cmd))
            {
                // Creating and decorating our invocation/execution lambda.
                var exe = lambda.Clone();
                var argsToExe = new Node(".arguments");
                argsToExe.Add(new Node("cmd", cmd));
                exe.Insert(0, argsToExe);

                // Creating a signaler using our current scope for terminal.
                var sign = scope.ServiceProvider.GetService(typeof(ISignaler)) as ISignaler;

                // Making sure we dispose signaler once done with it.
                using (var disposer = sign as IDisposable)
                {
                    sign.Signal("eval", exe);
                }
            }
        }

        /*
         * Private method to help extract arguments and create our ProcessStartInfo object.
         */
        (ProcessStartInfo StartInfo, string Name, Node StdOut, Node StdErr) GetStartInfo(Node input)
        {
            // Retrieving name for terminal, which is needed later to reference it.
            var name = input.GetEx<string>() ?? 
                throw new HyperlambdaException("No name supplied to [system.terminal.create]");

            // Retrieving name of process that we can use later to reference it.
            if (_processes.ContainsKey(name))
                throw new HyperlambdaException($"Terminal with name of '{name}' already exists");

            // Checking if we have STDOUT/STDERR callbacks.
            var stdOut = input.Children.FirstOrDefault(x => x.Name == ".stdOut")?.Clone();
            var stdErr = input.Children.FirstOrDefault(x => x.Name == ".stdErr")?.Clone();

            // Retrieving working folder.
            var workingFolder = input.Children.FirstOrDefault(x => x.Name == "folder")?.GetEx<string>() ?? "/";
            workingFolder = _rootResolver.AbsolutePath(workingFolder.TrimStart('/'));

            // Configuring our process.
            var startInfo = new ProcessStartInfo();
            if (Environment.OSVersion.Platform == PlatformID.Unix || Environment.OSVersion.Platform == PlatformID.MacOSX)
            {
                // xNix operating system type.
                startInfo.FileName = "/bin/bash";
            }
            else
            {
                // Windows something.
                startInfo.FileName = "cmd.exe";
                startInfo.WindowStyle = ProcessWindowStyle.Hidden;
            }
            startInfo.CreateNoWindow = true;
            startInfo.RedirectStandardOutput = true;
            startInfo.RedirectStandardInput = true;
            startInfo.RedirectStandardError = true;
            startInfo.UseShellExecute = false;
            startInfo.WorkingDirectory = workingFolder;

            // Returning start info to caller.
            return (startInfo, name, stdOut, stdErr);
        }

        /*
         * Responsible for creating the timer that checks all terminal to see if they
         * had activity in the last 30 minutes, and if not, closing the process.
         *
         * This is important to avoid having hanging terminals on the server, in case
         * the client loose internet connection, experience browser crash, or something similar.
         */
        static void EnsureTimer()
        {
            if (_timer != null)
                return;
            lock (_locker)
            {
                if (_timer != null)
                    return;
                _timer = new Timer((state) =>
                {
                    foreach (var idx in _processes.Keys)
                    {
                        if (_processes.TryGetValue(idx, out var process) && process.LastUsed.AddMinutes(30) < DateTime.UtcNow)
                        {
                            // Process has not been used for 30 minutes, hence closing it and disposing objects.
                            _processes.TryRemove(idx, out var _);
                            process.Process.Close();
                            process.Process.Dispose();
                            process.Scope.Dispose();
                        }
                    }
                }, null, 600000, 600000);
            }
        }

        #endregion
    }
}
