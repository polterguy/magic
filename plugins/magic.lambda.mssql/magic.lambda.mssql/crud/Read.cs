/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.mssql.helpers;
using magic.lambda.mssql.crud.builders;
using Help = magic.data.common.helpers;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud
{
    /// <summary>
    /// [mssql.read] slot for selecting rows from some table.
    /// </summary>
    [Slot(
        Name = "mssql.read",
        Description = "Reads rows through the current SQL Server connection",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsElementKind = "row-object,lambda-tree",
        ReturnsDescription = "Returns one child node per row read from the current SQL Server connection",
        RequiresScope = "mssql.connection",
        ScopeDescription = "Requires an open SQL Server connection created by [mssql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbReadSignature))]
    public class Read : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Parsing and creating SQL.
            var exe = Build.SqlBuilder.Parse(new SqlReadBuilder(input));
            if (exe == null)
                return;

            // Executing SQL, now parametrized.
            await Help.Executor.ExecuteAsync(
                exe,
                signaler.Peek<SqlConnectionWrapper>("mssql.connect").Connection,
                signaler.Peek<Help.Transaction>("mssql.transaction"),
                async (cmd, _) =>
            {
                using (var reader = await cmd.ExecuteReaderAsync(signaler.GetCancellationToken()))
                {
                    input.Clear();
                    while (await reader.ReadAsync(signaler.GetCancellationToken()))
                    {
                        var rowNode = new Node(".");
                        for (var idxCol = 0; idxCol < reader.FieldCount; idxCol++)
                        {
                            var colNode = new Node(reader.GetName(idxCol), Help.Converter.GetValue(reader[idxCol]));
                            rowNode.Add(colNode);
                        }
                        input.Add(rowNode);
                    }
                }
            }, signaler.GetCancellationToken());
        }
    }
}
