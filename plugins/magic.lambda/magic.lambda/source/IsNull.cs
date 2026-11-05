/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.source
{
    /// <summary>
    /// [null] slot returning true if whatever expression it's given actually yields a result.
    /// </summary>
    [Slot(
        Name = "null",
        Description = "Returns true if the specified node or expression is null",
        ValueKind = "node-list,single-object",
        ValueDescription = "Expression selecting the value to test for null",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true if the expression resolves to a null value")]
    [Slot(
        Name = "not-null",
        Description = "Returns true if the specified node or expression is not null",
        ValueKind = "node-list,single-object",
        ValueDescription = "Expression selecting the value to test for null",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true if the expression resolves to a non-null value")]
    public class IsNull : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var result = input.Evaluate().FirstOrDefault(x => x.Value != null);
            input.Value = input.Name == "null" ? result == null : result != null;
        }
    }
}
