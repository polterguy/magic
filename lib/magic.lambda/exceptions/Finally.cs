/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    [Slot(Name = "finally")]
    public class Finally : ISlot
    {
        public void Signal(Node input)
        {
            var previous = input.Previous;
            if (previous?.Name != "try" && previous?.Name != "catch")
                throw new ApplicationException("A [finally] must have a [try] or a [catch] before it");

            // Notice, evaluation is not done here, but rather in [try]!
        }
    }
}
