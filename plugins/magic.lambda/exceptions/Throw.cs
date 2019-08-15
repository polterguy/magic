/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.exceptions
{
    [Slot(Name = "throw")]
    public class Throw : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            throw new ApplicationException(input.Get<string>() ?? "[no-message]");
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
