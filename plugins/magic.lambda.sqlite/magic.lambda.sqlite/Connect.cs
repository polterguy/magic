/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.sqlite.helpers;
using magic.data.common.contracts;
using magic.node.contracts;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.connect] slot for connecting to a PostgreSQL server instance.
    /// </summary>
    [Slot(
        Name = "sqlite.connect",
        Description = "Opens a SQLite connection",
        ValueKind = "database-name,connection-string",
        ValueDescription = "Optional DATABASE_NAME or [CONNECTION_STRING|DATABASE_NAME] override",
        ValueRequired = false,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        ProvidesScope = "sqlite.connection",
        ScopeDescription = "Creates an open SQLite connection scope for sqlite.* slots",
        SignatureType = typeof(global::magic.data.common.signatures.DbConnectSignature))]
    public class Connect : ISlotAsync
    {
        readonly IDataSettings _settings;
        readonly IRootResolver _resolver;

        /// <summary>
        /// Creates a new instance of your class.
        /// </summary>
        /// <param name="resolver">Required to find the absolute path.</param>
        /// <param name="settings">Configuration settings for your application.</param>
        public Connect(IRootResolver resolver, IDataSettings settings)
    {
            _resolver = resolver;
            _settings = settings;
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
                    _resolver,
                    Executor.GetConnectionString(
                        _resolver,
                        input,
                        "sqlite",
                        "sys",
                        _settings)))
                {
                    await signaler.ScopeAsync(
                        "sqlite.connect",
                        connection,
                        async () => await signaler.SignalAsync("eval", input, skipWhitelist: true));
                    input.Value = null;
                }
            }
        }
    }
}
