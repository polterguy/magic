/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.pgsql.helpers;
using magic.data.common.contracts;

namespace magic.lambda.pgsql
{
    /// <summary>
    /// [pgsql.connect] slot for connecting to a PostgreSQL server instance.
    /// </summary>
    [Slot(Name = "pgsql.connect")]
    public class Connect : ISlotAsync
    {
        readonly IDataSettings _settings;

        /// <summary>
        /// Creates a new instance of your class.
        /// </summary>
        /// <param name="settings">Configuration settings for your application.</param>
        public Connect(IDataSettings settings)
        {
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
            using (var connection = new PgSqlConnectionWrapper(
                Executor.GetConnectionString(
                    input,
                    "pgsql",
                    "postgres",
                    _settings)))
            {
                await signaler.ScopeAsync(
                    "pgsql.connect",
                    connection,
                    async () => await signaler.SignalAsync("eval", input));
                input.Value = null;
            }
        }
    }
}
