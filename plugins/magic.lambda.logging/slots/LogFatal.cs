/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.logging.helpers;
using magic.lambda.logging.contracts;

namespace magic.lambda.logging.slots
{
    /// <summary>
    /// [log.error] slot for logging error log entries.
    /// </summary>
    [Slot(
        Name = "log.fatal",
        Description = "Writes a fatal-level log entry; reserve for unrecoverable failures that warrant immediate attention",
        ValueKind = "log-message,text",
        ValueDescription = "Log message to write",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "log-entry-id",
        ReturnsDescription = "Id of the log entry created, or null if the configured log level filtered it out",
        SignatureType = typeof(global::magic.lambda.logging.signatures.LogErrorWriteSignature))]
    public class LogFatal : ISlotAsync
    {
        readonly ILogger _logger;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="logger">Actual implementation.</param>
        public LogFatal(ILogger logger)
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
            // Retrieving exception, and making sure it's not retrieved as meta data.
            var errorNode = input.Children.FirstOrDefault(x => x.Name == "exception");
            var error = errorNode?.GetEx<string>();
            errorNode?.UnTie();

            // Retrieving log content and logging data.
            var args = Utilities.GetLogContent(input, signaler);
            var id = await _logger.FatalAsync(
                args.Content,
                args.Meta,
                error);

            // House cleaning, returning id of created log entry.
            input.Clear();
            input.Value = id;
        }
    }
}
