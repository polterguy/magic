/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings
{
    [Slot(Name = "contains")]
    public class Contains : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Contains(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 1)
                throw new ApplicationException("[contains] must be given exactly one argument that contains value to look for");

            _signaler.Signal("eval", input);

            input.Value = input.GetEx<string>(_signaler).Contains(input.Children.First().GetEx<string>(_signaler));
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
