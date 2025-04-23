/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.signals.contracts;

namespace magic.lambda.comparison
{
    /// <summary>
    /// [eq] slot allowing you to compare two values for equality.
    /// </summary>
    [Slot(Name = "eq")]
    public class Eq : BaseComparison
    {
        #region [ -- Protected overridden methods -- ]

        /// <inheritdoc />
        protected override bool Compare(object lhs, object rhs)
        {
            if (lhs == null && rhs == null)
                return true; // Both are null
            else if (lhs != null && rhs == null)
                return false; // Only rhs == null
            else if (lhs == null)
                return false; // Only lhs == null
            else if (lhs.GetType() != rhs.GetType())
                return false; // Different types
            return ((IComparable)lhs).CompareTo(rhs) == 0; // Doing object comparison.
        }

        #endregion
    }
}
