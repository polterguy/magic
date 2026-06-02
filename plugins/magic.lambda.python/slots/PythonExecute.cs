/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.python
{
    /// <summary>
    /// [python.execute] slot for executing Python code or a Python file.
    /// </summary>
    [Slot(
        Name = "python.execute",
        Description = "Runs a Python script or file in a subprocess and captures stdout, stderr, and exit code",
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "terminal-response,text",
        ReturnsDescription = "Returns stdout in value and stderr and exit code as child nodes",
        SignatureType = typeof(global::magic.lambda.python.signatures.PythonExecuteSignature))]
    public class PythonExecute : ISlotAsync
    {
        readonly IRootResolver _rootResolver;

        public PythonExecute(IRootResolver rootResolver)
        {
            _rootResolver = rootResolver;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var cancellationToken = signaler.GetCancellationToken();
            var code = input.Children.FirstOrDefault(x => x.Name == "code")?.GetEx<string>();
            var file = input.Children.FirstOrDefault(x => x.Name == "file")?.GetEx<string>();
            var argsNode = input.Children.FirstOrDefault(x => x.Name == "args");
            var stdin = input.Children.FirstOrDefault(x => x.Name == "stdin")?.GetEx<string>();
            var workingDirectory = input.Children.FirstOrDefault(x => x.Name == "working-directory")?.GetEx<string>();
            var timeoutSeconds = input.Children.FirstOrDefault(x => x.Name == "timeout")?.GetEx<int>() ?? 30;

            if (string.IsNullOrWhiteSpace(code) == string.IsNullOrWhiteSpace(file))
                throw new HyperlambdaException("Exactly one of [code] or [file] must be supplied to [python.execute]");

            if (timeoutSeconds <= 0)
                throw new HyperlambdaException("[timeout] must be a positive integer");

            var startInfo = new ProcessStartInfo("python3")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = !string.IsNullOrEmpty(stdin),
                UseShellExecute = false,
            };

            if (!string.IsNullOrWhiteSpace(workingDirectory))
                startInfo.WorkingDirectory = ResolvePath(workingDirectory);

            if (!string.IsNullOrWhiteSpace(code))
            {
                startInfo.ArgumentList.Add("-c");
                startInfo.ArgumentList.Add(code);
            }
            else
            {
                var resolvedFile = ResolvePath(file);
                startInfo.ArgumentList.Add(resolvedFile);
            }

            foreach (var arg in GetArgs(argsNode))
                startInfo.ArgumentList.Add(arg);

            using var process = new Process { StartInfo = startInfo };
            try
            {
                process.Start();
            }
            catch (Exception ex)
            {
                throw new HyperlambdaException("Failed to start python3 process", ex);
            }

            if (!string.IsNullOrEmpty(stdin))
            {
                await process.StandardInput.WriteAsync(stdin);
                process.StandardInput.Close();
            }

            var stdoutTask = process.StandardOutput.ReadToEndAsync();
            var stderrTask = process.StandardError.ReadToEndAsync();

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));
            try
            {
                await process.WaitForExitAsync(cts.Token);
            }
            catch (OperationCanceledException)
            {
                try
                {
                    process.Kill(true);
                }
                catch
                {
                    // Ignored - best effort kill.
                }
                if (cancellationToken.IsCancellationRequested)
                    throw;
                throw new HyperlambdaException($"Python execution timed out after {timeoutSeconds} seconds");
            }

            await Task.WhenAll(stdoutTask, stderrTask);

            if (process.ExitCode != 0)
            {
                var error = string.IsNullOrWhiteSpace(stderrTask.Result)
                    ? stdoutTask.Result
                    : stderrTask.Result;
                throw new HyperlambdaException(error?.TrimEnd());
            }

            input.Clear();
            input.Value = stdoutTask.Result?.TrimEnd();
            input.Add(new Node("stderr", stderrTask.Result?.TrimEnd()));
            input.Add(new Node("exit_code", process.ExitCode));
        }

        static IEnumerable<string> GetArgs(Node argsNode)
        {
            if (argsNode == null)
                yield break;

            if (argsNode.Children.Count() > 0)
            {
                foreach (var child in argsNode.Children)
                {
                    var value = child.GetEx<string>();
                    if (!string.IsNullOrWhiteSpace(value))
                        yield return value;
                }
                yield break;
            }

            var argsText = argsNode.GetEx<string>();
            if (string.IsNullOrWhiteSpace(argsText))
                yield break;

            foreach (var arg in SplitArgs(argsText))
                yield return arg;
        }

        static IEnumerable<string> SplitArgs(string input)
        {
            var args = new List<string>();
            var current = new StringBuilder();
            var inQuotes = false;
            var quoteChar = '\0';

            for (var i = 0; i < input.Length; i++)
            {
                var c = input[i];

                if (inQuotes)
                {
                    if (c == quoteChar)
                    {
                        inQuotes = false;
                    }
                    else if (c == '\\' && i + 1 < input.Length && input[i + 1] == quoteChar)
                    {
                        current.Append(quoteChar);
                        i++;
                    }
                    else
                    {
                        current.Append(c);
                    }
                    continue;
                }

                if (char.IsWhiteSpace(c))
                {
                    if (current.Length > 0)
                    {
                        args.Add(current.ToString());
                        current.Clear();
                    }
                    continue;
                }

                if (c == '"' || c == '\'')
                {
                    inQuotes = true;
                    quoteChar = c;
                    continue;
                }

                current.Append(c);
            }

            if (current.Length > 0)
                args.Add(current.ToString());

            return args;
        }

        string ResolvePath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                throw new HyperlambdaException("Path is missing");

            return _rootResolver.AbsolutePath(relativePath);
        }
    }
}
