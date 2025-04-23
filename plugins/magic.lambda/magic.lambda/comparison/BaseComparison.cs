/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.comparison
{
    /// <summary>
    /// Base class for all comparison operators.
    /// </summary>
    public abstract class BaseComparison : ISlot
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
            input.Value = Compare(input);
        }

        #region [ -- Protected abstract methods -- ]

        /// <summary>
        /// Implementation of comparison operator which is expected to be implemented
        /// in sub class.
        /// </summary>
        /// <param name="lhs">Left hand side of comparison.</param>
        /// <param name="rhs">Right hand side of comparison.</param>
        /// <returns>True if comparison yields true.</returns>
        protected abstract bool Compare(object lhs, object rhs);

        #endregion

        #region [ -- Private helper methods -- ]

        /*
         * Implementation of comparison.
         */
        bool Compare(Node input)
        {
            var count = input.Children.Count();
            var lhs = count == 1 ? input.GetEx<object>() : input.Children.First().GetEx<object>();
            var rhs = count == 1 ? input.Children.First().GetEx<object>() : input.Children.Skip(1).First().GetEx<object>();
            return Compare(lhs, rhs);
        }

        /*
         * Sanity chrecks input arguments verifying there's exactly two arguments somehow.
         */
        static void SanityCheck(Node input)
        {
            var count = input.Children.Count();
            if (count == 1 && input.Value != null)
                return;
            if (count == 2 && input.Value == null)
                return;
            throw new HyperlambdaException($"Comparison operation [{input.Name}] requires exactly two operands");
        }

        #endregion
    }
}
