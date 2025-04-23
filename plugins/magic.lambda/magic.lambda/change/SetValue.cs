/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.change
{
    /// <summary>
    /// [set-value] and [set-x] slots allowing you to change the values of nodes in your lambda graph object.
    /// If you use [set-x] any expresions in your source will not be evaluated, allowing you to set the values
    /// of nodes to become expressions.
    /// </summary>
    [Slot(Name = "set-x")]
    [Slot(Name = "set-value")]
    public class SetValue : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            SanityCheck(input);
            signaler.Signal("eval", input);
            SetValueToSource(input, input.Evaluate().ToList());
        }

        #region [ -- Private helper methods -- ]

        static void SetValueToSource(Node input, IEnumerable<Node> destinations)
        {
            var source = input.Name.EndsWith("set-value", StringComparison.InvariantCulture) ?
                input.Children.FirstOrDefault()?.GetEx<object>() :
                input.Children.FirstOrDefault()?.Get<object>();
            foreach (var idx in destinations)
            {
                idx.Value = source;
            }
        }

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() > 1)
                throw new HyperlambdaException("[set-xxx] can have maximum one child node");
        }

        #endregion
    }
}
