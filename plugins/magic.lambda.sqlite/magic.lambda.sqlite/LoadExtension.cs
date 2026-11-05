/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.sqlite.helpers;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.load-extension] slot for loading SQLite extensions.
    /// </summary>
    [Slot(
        Name = "sqlite.load-extension",
        Description = "Loads a SQLite extension into the current connection from child-node arguments",
        ReturnsMode = SlotReturnsMode.None,
        RequiresScope = "sqlite.connection",
        ScopeDescription = "Requires an open SQLite connection created by [sqlite.connect]",
        SignatureType = typeof(global::magic.lambda.sqlite.signatures.LoadExtensionSignature))]
    public class LoadExtension : ISlotAsync
    {
        // Ensuring synchronized access.
        readonly static SemaphoreSlim _semaphore = new (1,1);

        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await _semaphore.WaitAsync();
            try
            {
                var connection = signaler.Peek<SqliteConnectionWrapper>("sqlite.connect").Connection;

                var file = input.Children.FirstOrDefault(x => x.Name == "file")?.GetEx<string>() ?? 
                    throw new HyperlambdaException("No [file] argument provided to [sqlite.load-extension]");
                var proc = input.Children.FirstOrDefault(x => x.Name == "proc")?.GetEx<string>();

                // Checking if we should automatically determine platform and append.
                if (input.Children.FirstOrDefault(x => x.Name == "append-platform")?.GetEx<bool>() ?? true)
                {
                    if (RuntimeInformation.ProcessArchitecture == Architecture.Arm64)
                        file += "-arm64";
                    else if (RuntimeInformation.ProcessArchitecture == Architecture.Arm)
                        file += "-arm";
                }

                if (proc != null)
                    connection.LoadExtension(file, proc);
                else
                    connection.LoadExtension(file);
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }
}
