/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Diagnostics;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.system.terminal
{
    /// <summary>
    /// [system.execute] slot that allows you to execute a system process,
    /// passing in arguments, and returning the result of the execution.
    /// </summary>
    [Slot(
        Name = "system.execute",
        Description = "Spawns a shell process with the given command and arguments and returns its captured output",
        ValueKind = "terminal-command",
        ValueDescription = "Command to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "terminal-response,text",
        ReturnsDescription = "Resolves to the standard output from the executed command",
        SignatureType = typeof(global::magic.lambda.system.terminal.signatures.TerminalExecuteSignature))]
    public class TerminalExecute : ISlotAsync
    {
        readonly IRootResolver _rootResolver;

        public TerminalExecute(IRootResolver rootResolver)
        {
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);
            var cancellationToken = signaler.GetCancellationToken();

            var startInfo = new ProcessStartInfo(args.Command);
            foreach (var arg in args.Arguments)
                startInfo.ArgumentList.Add(arg);

            startInfo.RedirectStandardOutput = true;
            startInfo.RedirectStandardError = true;

            if (!string.IsNullOrWhiteSpace(args.WorkingDirectory))
                startInfo.WorkingDirectory = args.WorkingDirectory;

            using var process = new Process { StartInfo = startInfo };
            process.Start();
            using var registration = cancellationToken.Register(() =>
            {
                try
                {
                    if (!process.HasExited)
                        process.Kill(true);
                }
                catch
                {
                    // Best effort cancellation.
                }
            });

            var stdoutTask = process.StandardOutput.ReadToEndAsync();
            var stderrTask = process.StandardError.ReadToEndAsync();

            await Task.WhenAll(stdoutTask, stderrTask, process.WaitForExitAsync(cancellationToken));

            if (process.ExitCode != 0)
            {
                var error = string.IsNullOrWhiteSpace(stderrTask.Result)
                    ? stdoutTask.Result
                    : stderrTask.Result;
                throw new HyperlambdaException(error?.TrimEnd());
            }

            input.Value = stdoutTask.Result?.TrimEnd();
        }

        #region [ -- Private helper methods -- ]

        (string Command, IEnumerable<string> Arguments, string WorkingDirectory) GetArgs(Node input)
        {
            var command = input.GetEx<string>();
            if (string.IsNullOrWhiteSpace(command))
                throw new HyperlambdaException("Missing required argument value");

            var argsNode = input.Children.FirstOrDefault(x => x.Name == "args");
            var workingDirectory = input.Children
                .FirstOrDefault(x => x.Name == "working-directory")
                ?.GetEx<string>();

            input.Clear();
            input.Value = null;

            return (command, ExpandArgs(argsNode), ResolveWorkingDirectory(workingDirectory));
        }

        string ResolveWorkingDirectory(string workingDirectory)
        {
            if (string.IsNullOrWhiteSpace(workingDirectory))
                return null;

            return _rootResolver.AbsolutePath(workingDirectory);
        }

        static IEnumerable<string> ExpandArgs(Node argsNode)
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

        #endregion
    }
}
