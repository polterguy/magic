/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [slot.description] slot allowing you to retrieve the description
    /// of a single compiled slot.
    /// </summary>
    [Slot(
        Name = "slot.description",
        Description = "Returns the description for a single compiled slot",
        ValueKind = "slot-name",
        ValueDescription = "Name of the compiled slot to inspect",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "slot-description,text",
        ReturnsDescription = "Resolves to the description of the requested slot")]
    public class SlotDescription : ISlot
    {
        readonly ISignalsProvider _signalProvider;

        /// <summary>
        /// Constructor creating an object requiring a signals provider to be able to fetch slot types.
        /// </summary>
        /// <param name="signalProvider">Slot provider, providing all slots that exists in the system.</param>
        public SlotDescription(ISignalsProvider signalProvider)
        {
            _signalProvider = signalProvider;
        }

        /// <summary>
        /// Implementation of signal.
        /// </summary>
        /// <param name="signaler">Signaler used to signal.</param>
        /// <param name="input">Parameters passed from signaler.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var name = input.GetEx<string>();
            if (string.IsNullOrWhiteSpace(name))
                throw new HyperlambdaException("No slot name supplied to [slot.description]");

            var whitelist = signaler.Peek<List<Node>>("whitelist");
            if (whitelist != null && !whitelist.Any(x => x.Name == name && (x.Value == null || x.Get<string>() == input.GetEx<string>())))
                throw new HyperlambdaException($"[{name}] slot does not exist");

            var type = _signalProvider.GetSlot(name) ??
                throw new HyperlambdaException($"[{name}] slot does not exist");

            var description = type
                .GetCustomAttributes(true)
                .OfType<SlotAttribute>()
                .FirstOrDefault(x => x.Name == name)?
                .Description;

            input.Clear();
            input.Value = description;
        }
    }
}
