/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    /*
     * Common helper class for conditional slots such as [if], [else-if] and [while].
     */
    internal static class Common
    {
        /*
         * Returns true if condition is true.
         */
        public static bool ConditionIsTrue(ISignaler signaler, Node input)
        {
            // Checking for value in condition node.
            if (input.Value != null)
                return input.GetEx<bool>();

            // Sanity checking invocation.
            if (input.Children.Count() != 2)
                throw new HyperlambdaException($"[{input.Name}] requires exactly two children nodes, a condition node and a [.lambda] node, or an expression and a lambda object");
            
            // Evaluating children nodes of condition node.
            signaler.Signal("eval", input);

            // Returning result of invocation to caller.
            return input.Children.First(x => x.Name != ".lambda").GetEx<bool>();
        }

        /*
         * Returns the lambda object to be executed if the condition yields true.
         */
        public static Node GetLambda(Node input)
        {
            // Checking for value in condition node, at which point the children collection itself is the lambda object.
            if (input.Value != null)
                return input;

            // Returning [.lambda] node to caller, sanity checking invocation at the same time.
            return input.Children.FirstOrDefault(x => x.Name == ".lambda") ?? 
                throw new HyperlambdaException($"No [.lambda] object associated with [{input.Name}] invocation");
        }

        /*
         * Helper method to sanity check that [else-if] and [else] are only followed by [if] and [else-if] invocations.
         */
        public static void SanityCheckElse(Node input)
        {
            var prevName = input.Previous?.Name;
            if (prevName != "if" && prevName != "else-if")
                throw new HyperlambdaException($"[{input.Name}] can only follow an [if] or an [else-if]");
        }

        /*
         * Helper method returning true if [else-if] of [else] invocations should be evaluated.
         */
        public static bool ShouldEvaluateElse(Node input)
        {
            /*
             * Iterating backwards to see if one of the previous [if] or [else-if]
             * invocations yielded true, at which point we return false.
             */
            var idx = input.Previous;
            while (idx?.Name == "if" || idx?.Name == "else-if")
            {
                if (idx.Get<bool>())
                    return false; // Previous node's condition evaluated to true.

                // Checking if this is first condition
                if (idx.Name == "if")
                    return true;

                // Moving to previous node.
                idx = idx.Previous;
            }

            // None of the previous conditional slots were executed.
            return true;
        }
    }
}
