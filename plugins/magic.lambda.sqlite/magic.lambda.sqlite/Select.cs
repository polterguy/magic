/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.sqlite.helpers;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.select] slot for executing a select type of SQL command, that returns
    /// a row set.
    /// </summary>
    [Slot(
        Name = "sqlite.select",
        Description = "Executes a SELECT query on the current SQLite connection",
        ValueKind = "sql-select",
        ValueDescription = "SQL query to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsElementKind = "row-object,lambda-tree",
        ReturnsDescription = "Returns one child node per row returned by the SELECT query",
        RequiresScope = "sqlite.connection",
        ScopeDescription = "Requires an open SQLite connection created by [sqlite.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbSelectSignature))]
    public class Select : ISlotAsync
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Figuring out if caller wants to return multiple result sets or not.
            var multipleResultSets = Executor.HasMultipleResultSets(input);

            using (var shutdownLock = new ShutdownLock())
            {
                // Invoking execute helper.
                await Executor.ExecuteAsync(
                    input,
                    signaler.Peek<SqliteConnectionWrapper>("sqlite.connect").Connection,
                    signaler.Peek<Transaction>("sqlite.transaction"),
                    async (cmd, max) =>
                {
                    using (var reader = await cmd.ExecuteReaderAsync(signaler.GetCancellationToken()))
                    {
                        do
                        {
                            Node parentNode = input;
                            if (multipleResultSets)
                            {
                                parentNode = new Node();
                                input.Add(parentNode);
                            }
                            while (await reader.ReadAsync(signaler.GetCancellationToken()))
                            {
                                if (!Executor.BuildResultRow(reader, parentNode, ref max))
                                    break;
                            }
                        } while (multipleResultSets && await reader.NextResultAsync(signaler.GetCancellationToken()));
                    }
                }, signaler.GetCancellationToken());
            }
        }
    }
}
