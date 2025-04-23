/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.mssql.helpers;
using magic.lambda.mssql.crud.builders;
using Help = magic.data.common.helpers;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud
{
    /// <summary>
    /// [mssql.create] slot for creating a new record in some table.
    /// </summary>
    [Slot(Name = "mssql.create")]
    public class Create : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            /*
             * Figuring out if we should return ID of newly created
             * record to caller.
             */
            var returnId = input.Children
                .FirstOrDefault(x => x.Name == "return-id")?.GetEx<bool>() ?? true;

            // Parsing and creating SQL.
            var exe = returnId ?
                Build.SqlBuilder.Parse(new SqlCreateBuilder(input)) :
                Build.SqlBuilder.Parse(new SqlCreateBuilderNoId(input));

            /*
             * If the parsing process doesn't return a node, we're not supposed
             * to actually execute the SQL, but only to generate it
             * and parametrize it.
             */
            if (exe == null)
                return;

            // Executing SQL, now parametrized.
            await Help.Executor.ExecuteAsync(
                exe,
                signaler.Peek<SqlConnectionWrapper>("mssql.connect").Connection,
                signaler.Peek<Help.Transaction>("mssql.transaction"),
                async (cmd, _) =>
            {
                /*
                 * Notice, create SQL returns last inserted ID, but only
                 * if caller told us he wanted it to do such.
                 */
                if (returnId)
                {
                    input.Value = await cmd.ExecuteScalarAsync();
                }
                else
                {
                    await cmd.ExecuteNonQueryAsync();
                    input.Value = null;
                }
                input.Clear();
            });
        }
    }
}
