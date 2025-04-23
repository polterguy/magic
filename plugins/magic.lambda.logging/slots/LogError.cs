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
    [Slot(Name = "log.error")]
    public class LogError : ISlotAsync
    {
        readonly ILogger _logger;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="logger">Actual implementation.</param>
        public LogError(ILogger logger)
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
            await _logger.ErrorAsync(
                args.Content,
                args.Meta,
                error);

            // House cleaning.
            input.Clear();
            input.Value = null;
        }
    }
}
