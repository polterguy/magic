/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.lambda.mssql.helpers;

namespace magic.lambda.mssql
{
    /// <summary>
    /// [mssql.select] slot, for executing a select type of SQL, returning
    /// data rows to the caller.
    /// </summary>
    [Slot(
        Name = "mssql.select",
        Description = "Executes a SELECT query on the current SQL Server connection",
        ValueKind = "sql-select",
        ValueDescription = "SQL query to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsElementKind = "row-object,lambda-tree",
        ReturnsDescription = "Returns one child node per row returned by the SELECT query",
        RequiresScope = "mssql.connection",
        ScopeDescription = "Requires an open SQL Server connection created by [mssql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbSelectSignature))]
    public class Select : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Figuring out if caller wants to return multiple result sets or not.
            var multipleResultSets = Executor.HasMultipleResultSets(input);

            // Invoking execute helper.
            await Executor.ExecuteAsync(
                input,
                signaler.Peek<SqlConnectionWrapper>("mssql.connect").Connection,
                signaler.Peek<Transaction>("mssql.transaction"),
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
