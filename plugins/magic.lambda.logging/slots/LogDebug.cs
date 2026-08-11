/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.logging.helpers;
using magic.lambda.logging.contracts;

namespace magic.lambda.logging.slots
{
    /// <summary>
    /// [log.debug] slot for logging debug log entries.
    /// </summary>
    [Slot(
        Name = "log.debug",
        Description = "Writes a debug-level log entry; useful during development for high-volume diagnostic detail",
        ValueKind = "log-message,text",
        ValueDescription = "Log message to write",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "log-entry-id",
        ReturnsDescription = "Id of the log entry created, or null if the configured log level filtered it out",
        SignatureType = typeof(global::magic.lambda.logging.signatures.LogWriteSignature))]
    public class LogDebug : ISlotAsync
    {
        readonly ILogger _logger;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="logger">Actual implementation.</param>
        public LogDebug(ILogger logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Retrieving log content and logging data.
            var args = Utilities.GetLogContent(input, signaler);
            var id = await _logger.DebugAsync(args.Content, args.Meta);

            // House cleaning, returning id of created log entry.
            input.Clear();
            input.Value = id;
        }
    }
}
