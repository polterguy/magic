/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.mysql.crud;
using magic.data.common.helpers;
using magic.lambda.mysql.helpers;

namespace magic.lambda.mysql
{
    /// <summary>
    /// [mysql.select] slot for executing a select type of SQL command, that returns
    /// a row set.
    /// </summary>
    [Slot(Name = "mysql.select")]
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

            // Invoking execute helper.
            await Executor.ExecuteAsync(
                input,
                signaler.Peek<MySqlConnectionWrapper>("mysql.connect").Connection,
                signaler.Peek<Transaction>("mysql.transaction"),
                async (cmd, max) =>
            {
                MySqlConnectionWrapper.EnsureLocalTimeZone(cmd);
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    do
                    {
                        Node parentNode = input;
                        if (multipleResultSets)
                        {
                            parentNode = new Node();
                            input.Add(parentNode);
                        }
                        while (await reader.ReadAsync())
                        {
                            if (!Executor.BuildResultRow(reader, parentNode, ref max, Read.GetValue))
                                break;
                        }
                    } while (multipleResultSets && await reader.NextResultAsync());
                }
            });
        }
    }
}
