/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.system.terminal
{
    /// <summary>
    /// [system.terminal.destroy] slot that allows you to destroy a previously created terminal on your server.
    /// </summary>
    [Slot(Name = "system.terminal.destroy")]
    public class TerminalDestroy : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving name of terminal to destroy.
            var name = input.GetEx<string>() ??
                throw new HyperlambdaException("No name supplied to [system.terminal.destroy]");

            // Finding process and doing basic sanity check.
            if (!TerminalCreate._processes.TryRemove(name, out var process))
                return; // Notice, we might come here if terminal was already destroyed using e.g. "exit" command in terminal itself.

            // Closing process.
            process.Process.Kill(); // Notice, I am not 100% certain if we should use Close or Kill here ...
            process.Process.Dispose();
            process.Scope.Dispose();
        }
    }
}
