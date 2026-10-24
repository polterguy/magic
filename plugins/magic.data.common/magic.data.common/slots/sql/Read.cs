/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.signals.contracts;
using magic.data.common.builders;

namespace magic.data.common.slots.sql
{
    /// <summary>
    /// [mssql.read] slot for selecting rows from some table.
    /// </summary>
    [Slot(
        Name = "sql.read",
        Description = "Builds a parameterized SELECT SQL statement",
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "",
        ReturnsDescription = "Resolves to the generated SQL string in value and the generated parameter nodes as children",
        SignatureType = typeof(global::magic.data.common.signatures.SqlReadSignature))]
    public class Read : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var builder = new SqlReadBuilder(input, "'");
            var result = builder.Build();
            input.Value = result.Value;
            input.Clear();
            input.MoveChildrenFrom(result);
        }
    }
}
