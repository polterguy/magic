/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [types] slot returning all supported Hyperlambda types.
    /// </summary>
    [Slot(
        Name = "types",
        Description = "Lists every CLR type name recognized by Hyperlambda; useful when [convert] or [type] needs a valid target",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "type-name-list,string-list",
        ReturnsElementKind = "type-name,text",
        ReturnsDescription = "Resolves to one child node per known CLR type name",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class Types : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.AddRange(Converter.GetTypes().Select(x => new Node("", x)));
        }
    }
}
