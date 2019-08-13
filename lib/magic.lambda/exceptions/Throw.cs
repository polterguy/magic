/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    [Slot(Name = "throw")]
    public class Throw : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            if (input.Value is string strVal)
                throw new ApplicationException(strVal);
            else if (input.Value is Expression expVal)
                throw new ApplicationException(expVal.Evaluate(new Node[] { input }).FirstOrDefault()?.Get<string>() ?? "[no-message]");
        }

        public IEnumerable<Node> GetArguments()
        {
            yield break;
        }
    }
}
