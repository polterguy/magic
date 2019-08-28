/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.hyperlambda
{
    [Slot(Name = "hyper")]
    public class Hyper : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            if (input.Value != null && input.Children.Any())
                throw new ApplicationException("Provide either children or expression value to [hyper], not both");

            if (input.Children.Any())
                input.Value = Stringifier.GetHyper(input.Children);
            else
                input.Value = Stringifier.GetHyper(input.Evaluate());
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
        }
    }
}
