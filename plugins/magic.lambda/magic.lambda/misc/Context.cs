/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [context] slot allowing you to create a dynamic stack object context,
    /// that you can retrieve in children scopes of your lambda using [get-context].
    /// </summary>
    [Slot(Name = "context")]
    public class Context : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaiatble task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            var arguments = GetArguments(input);
            signaler.Scope(arguments.Name, arguments.Value, () =>
            {
                signaler.Signal("eval", arguments.Lambda);
            });
        }

        #region [ -- Private helper methods -- ]

        /*
         * Retrieves areguments from input, and returns to caller.
         */
        static (string Name, object Value, Node Lambda) GetArguments(Node input)
        {
            var name = input.GetEx<string>() ??
                throw new HyperlambdaException("[context] requires a [value] argument, being whatever object you want to push unto your stack");
            name = "dynamic." + name;

            var value = input.Children.FirstOrDefault(x => x.Name == "value")?.GetEx<object>() ??
                throw new HyperlambdaException("[context] requires a [value] argument, being whatever object you want to push unto your stack");
            if (value is Node valueNode)
                value = valueNode.Clone();

            var lambda = input.Children.FirstOrDefault(x => x.Name == ".lambda") ??
                throw new HyperlambdaException("[context] requires a [.lambda] object to evaluate");

            return (name, value, lambda);
        }

        #endregion
    }
}
