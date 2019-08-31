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
    [Slot(Name = "starts-with")]
    public class StartsWith : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public StartsWith(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 1)
                throw new ApplicationException("[starts-with] must be given exactly one argument that contains value to look for");

            _signaler.Signal("eval", input);

            input.Value = input.GetEx<string>(_signaler)
                .StartsWith(input.Children.First().GetEx<string>(_signaler), StringComparison.InvariantCulture);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
