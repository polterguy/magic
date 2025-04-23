/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.mssql.helpers;
using magic.data.common.contracts;

namespace magic.lambda.mssql
{
    /// <summary>
    /// [mssql.connect] slot, for connecting to a MS SQL Server database instance.
    /// </summary>
    [Slot(Name = "mssql.connect")]
    public class Connect : ISlotAsync
    {
        readonly IDataSettings _settings;

        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="settings">Configuration object.</param>
        public Connect(IDataSettings settings)
        {
            _settings = settings;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            using (var connection = new SqlConnectionWrapper(
                Executor.GetConnectionString(
                    input,
                    "mssql",
                    "master",
                    _settings)))
            {
                await signaler.ScopeAsync(
                    "mssql.connect",
                    connection,
                    async () => await signaler.SignalAsync("eval", input));
                input.Value = null;
            }
        }
    }
}
