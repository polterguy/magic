/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Diagnostics;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.system.terminal
{
    /// <summary>
    /// [system.terminal.write-line] slot that allows you to write a line to a previously
    /// opened terminal process.
    /// </summary>
    [Slot(Name = "system.terminal.write-line")]
    public class TerminalWriteLine : ISlotAsync
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Extracting process to use and command to execute according to arguments given.
            var args = GetArguments(input);

            // Sending code to terminal process.
            await args.Process.StandardInput.WriteLineAsync(args.Command);
            await args.Process.StandardInput.WriteLineAsync("echo --waiting-for-input--");
        }

        #region [ -- Private helper methods -- ]

        /*
         * Private method to extract command and terminal instance according
         * to arguments given.
         */
        (Process Process, string Command) GetArguments(Node input)
        {
            // Retrieving name of terminal to write to.
            var name = input.GetEx<string>() ??
                throw new HyperlambdaException("No terminal name supplied to [system.terminal.write-line]");

            // Retrieving command to transmit to terminal.
            var cmd = input.Children.FirstOrDefault(x => x.Name == "cmd")?.GetEx<string>()?.Trim() ?? 
                throw new HyperlambdaException("No [cmd] passed into terminal");

            // Finding process.
            if (!TerminalCreate._processes.TryGetValue(name, out var process))
                throw new HyperlambdaException($"Terminal with name of '{name}' was not found");

            // Updating LastUsed value to make sure process stays alive.
            process.LastUsed = DateTime.UtcNow;

            // Returning results to caller.
            return (process.Process, cmd);
        }

        #endregion
    }
}
