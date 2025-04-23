/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
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
    /// The [mysql.read] slot class
    /// </summary>
    [Slot(Name = "mysql.read")]
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
                signaler.Peek<MySqlConnectionWrapper>("mysql.connect").Connection,
                signaler.Peek<Help.Transaction>("mysql.transaction"),
                async (cmd, _) =>
            {
                MySqlConnectionWrapper.EnsureLocalTimeZone(cmd);
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    input.Clear();
                    while (await reader.ReadAsync())
                    {
                        var rowNode = new Node(".");
                        for (var idxCol = 0; idxCol < reader.FieldCount; idxCol++)
                        {
                            var colNode = new Node(reader.GetName(idxCol), GetValue(reader[idxCol]));
                            rowNode.Add(colNode);
                        }
                        input.Add(rowNode);
                    }
                }
            });
        }

        #region [ -- Internal helper methods -- ]

        internal static object GetValue(object value)
        {
            /*
             * Unless explicitly overridden on a per connection basis, MySQL always returns DateTime objects
             * as local database server time - However, they also don't explicitly set the "kind" of date, hence this
             * is something we'll need to do to avoid weird time shifts as we return DateTime objects to caller.
             */
            if (value is DateTime valDate && valDate.Kind == DateTimeKind.Unspecified)
                return DateTime.SpecifyKind(valDate, DateTimeKind.Local);
            return Help.Converter.GetValue(value);
        }

        #endregion
    }
}
