/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.hyperlambda
{
    /// <summary>
    /// [lambda] slot, allowing you to transform a piece of Hyperlambda to a lambda hierarchy.
    /// </summary>
    [Slot(Name = "hyper2lambda")]
    public class Hyper2Lambda : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var comments = input.Children.FirstOrDefault(x => x.Name == "comments")?.GetEx<bool>() ?? false;
            input.Clear();
            var parser = HyperlambdaParser.Parse(input.GetEx<string>(), comments);
            input.AddRange(parser.Children.ToList());
            input.Value = null;
        }
    }
}
