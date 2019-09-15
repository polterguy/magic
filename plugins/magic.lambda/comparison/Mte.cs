/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.comparison
{
    [Slot(Name = "mte")]
    public class Mte : ISlot
    {
        readonly ISignaler _signaler;

        public Mte(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            Common.Compare(_signaler, input, (lhs, rhs) =>
            {
                if (lhs == null && rhs == null)
                    return true;
                else if (lhs != null && rhs == null)
                    return true;
                else if (lhs == null && rhs != null)
                    return false;
                else if (lhs.GetType() != rhs.GetType())
                    return false;
                return ((IComparable)lhs).CompareTo(rhs) >= 0;
            });
        }
    }
}
