/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    /// <summary>
    /// [switch] slot allowing you to do branching in your code.
    /// </summary>
    [Slot(Name = "switch")]
    public class Switch : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            var executionNode = GetExecutionNode(input);
            if (executionNode != null)
                signaler.Signal(executionNode.Name, executionNode);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns the node to execute, if any.
         */
        Node GetExecutionNode(Node input)
        {
            // Sanity checking invocation.
            SanityCheckInvocation(input);

            // Retrieving value to switch on.
            var result = input.GetEx<object>();

            // Finding our execution node, defaulting to [default] if none of our [case] nodes are matching the above value.
            var executionNode = 
                input.Children.FirstOrDefault(x => x.Name == "case" && x.GetEx<object>().Equals(result)) ??
                input.Children.FirstOrDefault(x => x.Name == "default");

            if (executionNode != null)
            {
                while (executionNode != null &&
                    !executionNode.Children.Any() &&
                    executionNode.Name != "default")
                {
                    executionNode = executionNode.Next;
                }
                if (executionNode != null && !executionNode.Children.Any())
                    throw new HyperlambdaException("No lambda object found for [case]");

                return executionNode;
            }
            return null;
        }

        /*
         * Sanity checks invocation.
         */
        void SanityCheckInvocation(Node input)
        {
            if (!input.Children.Any(x => x.Name == "case"))
                throw new HyperlambdaException("[switch] must have one at least one [case] child");

            if (input.Children.Any(x => 
                x.Name != "case" &&
                x.Name != "default"))
                throw new HyperlambdaException("[switch] can only handle [case] and [default] children");

            if (input.Children.Any(x => x.Name == "case" && x.Value == null))
                throw new HyperlambdaException("[case] with null value found");

            if (input.Children.Any(x => x.Name == "default" && x.Value != null))
                throw new HyperlambdaException("[default] with non-null value found");
        }

        #endregion
    }
}
