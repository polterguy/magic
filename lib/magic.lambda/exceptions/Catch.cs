/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    [Slot(Name = "catch")]
    public class Catch : ISlot
    {
        public void Signal(Node input)
        {
            if (input.Previous?.Name != "try")
                throw new ApplicationException("A [catch] must have a [try] before it");

            // Notice, evaluation is not done here, but rather in [try]!
        }
    }
}
