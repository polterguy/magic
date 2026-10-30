/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// [strings.capitalize] slot that returns the Capitalized value of its specified argument.
    /// </summary>
    [Slot(
        Name = "strings.capitalize",
        Description = "Returns the input with its first character upper-cased; remainder is left untouched",
        ValueKind = "text",
        ValueDescription = "Text to capitalize",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the capitalized string")]
    public class Capitalize : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var str = input.GetEx<string>();
            if (str.Length > 0)
                input.Value = 
                    string.Concat(char.ToUpperInvariant(str[0]).ToString(), str.AsSpan(1));
        }
    }
}
