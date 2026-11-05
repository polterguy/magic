/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.mysql.helpers;
using magic.lambda.mysql.crud.builders;
using Help = magic.data.common.helpers;
using Build = magic.data.common.builders;

namespace magic.lambda.mysql.crud
{
    /// <summary>
    /// The [mysql.delete] slot class
    /// </summary>
    [Slot(
        Name = "mysql.delete",
        Description = "Deletes rows through the current MySQL connection; include a [where] child unless intentionally deleting every row in the table",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected",
        RequiresScope = "mysql.connection",
        ScopeDescription = "Requires an open MySQL connection created by [mysql.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DbDeleteSignature))]
    public class Delete : ISlotAsync
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
            var exe = Build.SqlBuilder.Parse(new SqlDeleteBuilder(input));
            if (exe == null)
                return;

            // Executing SQL, now parametrized.
            await Help.Executor.ExecuteAsync(
                exe,
                signaler.Peek<MySqlConnectionWrapper>("mysql.connect").Connection,
                signaler.Peek<Help.Transaction>("mysql.transaction"),
                async (cmd, _) =>
            {
                MySqlConnectionWrapper.EnsureLocalTimeZone(cmd);
                input.Value = await cmd.ExecuteNonQueryAsync(signaler.GetCancellationToken());
                input.Clear();
            }, signaler.GetCancellationToken());
        }
    }
}
