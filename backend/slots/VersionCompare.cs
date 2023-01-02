/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [version.compare] slot comparing two versions, returning which comes before the other.
    /// </summary>
    [Slot(Name = "version.compare")]
    public class VersionCompare : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler.Signal("eval", input);
            var lhs = input.Children.FirstOrDefault()?.GetEx<string>() ??
                throw new HyperlambdaException("No arguments supplied to [version.compare]");
            var rhs = input.Children.Skip(1).FirstOrDefault()?.GetEx<string>() ??
                throw new HyperlambdaException("No secondary or rhs arguments supplied to [version.compare]");

            // Sanity checking arguments
            if (!lhs.StartsWith("v") || !rhs.StartsWith("v"))
                throw new HyperlambdaException("A version string needs to start with a 'v'");

            // Removing redundant 'v' parts.
            lhs = lhs.Substring(1);
            rhs = rhs.Substring(1);

            // Splitting entities, and making sure there are 3 entities in both version strings.
            var lhsEntities = lhs.Split(".");
            var rhsEntities = rhs.Split(".");
            if (lhsEntities.Length != 3 || rhsEntities.Length != 3)
                throw new HyperlambdaException("A version string needs to contain 3 numbers divided by '.'");

            // House cleaning.
            input.Clear();

            // Iterating through each entity, converting to integers, and doing a comparison to find the lowest value.
            for (var idx = 0; idx < 3; idx ++)
            {
                var idxLhs = int.Parse(lhsEntities[idx]);
                var idxRhs = int.Parse(rhsEntities[idx]);
                var compareValue = idxLhs.CompareTo(idxRhs);
                if (compareValue != 0)
                {
                    input.Value = compareValue;
                    return;
                }
            }
            input.Value = 0;
        }
    }
}
