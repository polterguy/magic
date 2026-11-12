/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [slots.vocabulary] slot that will return the names of all dynamically created slots to caller.
    /// </summary>
    [Slot(
        Name = "slots.vocabulary",
        Description = "Lists dynamically created slots",
        ValueKind = "dynamic-slot-name",
        ValueDescription = "Optional filter for dynamic slot names",
        ValueRequired = false,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "dynamic-slot-name-list,string-list",
        ReturnsElementKind = "dynamic-slot-name,text",
        ReturnsDescription = "Resolves to available dynamic slot names as child nodes",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class Vocabulary : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var filter = input.GetEx<string>();
            input.Value = null;
            var w = Create._slots.Keys.Select(x => x);
            if (!string.IsNullOrEmpty(filter))
                w = w.Where(x => x.Contains(filter));
            var list = w.ToList();
            list.Sort((lhs, rhs) => string.Compare(lhs, rhs, System.StringComparison.InvariantCulture));
            var whitelist = signaler.Peek<List<Node>>("whitelist");
            input.AddRange(list
                .Where(x => whitelist == null || whitelist.Any(x2 => x2.Name == "signal" && x2.Get<string>() == x))
                .Select(x => new Node("", x)));
        }
    }
}
