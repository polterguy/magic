/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.sqlite.helpers;
using magic.data.common.contracts;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.connect] slot for connecting to a PostgreSQL server instance.
    /// </summary>
    [Slot(Name = "sqlite.connect")]
    public class Connect : ISlotAsync
    {
        readonly IDataSettings _settings;
        readonly IInitializer _initializer;

        /// <summary>
        /// Creates a new instance of your class.
        /// </summary>
        /// <param name="settings">Configuration settings for your application.</param>
        /// <param name="initializer">Initialiser invoked as connections are created, allowing you to dynamically load extensions, etc.</param>
        public Connect(IDataSettings settings, IInitializer initializer)
        {
            _settings = settings;
            _initializer = initializer;
        }

        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            using (var shutdownLock = new ShutdownLock())
            {
                using (var connection = new SqliteConnectionWrapper(
                    Executor.GetConnectionString(
                        input,
                        "sqlite",
                        "sys",
                        _settings),
                        _initializer))
                {
                    await signaler.ScopeAsync(
                        "sqlite.connect",
                        connection,
                        async () => await signaler.SignalAsync("eval", input));
                    input.Value = null;
                }
            }
        }
    }
}
